let _yf: any = null
async function getYF(): Promise<any> {
  if (!_yf) {
    const mod: any = await import('yahoo-finance2')
    const YF = mod.default ?? mod
    _yf = typeof YF === 'function' ? new (YF as any)() : YF
  }
  return _yf
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (e) {
      if (i === retries) return null
      await new Promise(r => setTimeout(r, i === 0 ? 1000 : 3000))
    }
  }
  return null
}

export interface FinancialData {
  ticker: string
  name: string
  price: number | null
  marketCap: number | null
  sector: string | null
  exchange: string | null
  currency: string | null
  pe: number | null
  peg: number | null
  evEbit: number | null
  pFcf: number | null
  fcfYield: number | null
  revenue3Y: number[] | null
  netIncome3Y: number[] | null
  freeCashFlow3Y: number[] | null
  totalDebt: number | null
  totalCash: number | null
  ebitda: number | null
  interestExpense: number | null
  sharesOutstanding: number | null
  grossMargin: number | null
  operatingMargin: number | null
  roic: number | null
  revenueGrowthYoY: number | null
  currentRatio: number | null
  quickRatio: number | null
  interestCoverage: number | null
  dso: number | null
  dpo: number | null
  cashConversionCycle: number | null
  high52w: number | null
  distanceFromATH: number | null
  performance6M: number | null
  capexIntensity: number | null
  accrualsRatio: number | null
  roiic: number | null
  earningsHistory: {
    period: string
    epsEstimate: number | null
    epsActual: number | null
    surprisePercent: number | null
  }[] | null
  priceHistory3M: { date: string; close: number }[] | null
}

function n(v: any): number | null {
  if (v == null) return null
  const raw = v?.raw ?? v
  return typeof raw === 'number' && isFinite(raw) ? raw : null
}

function normalizePrice(price: number, ticker: string): number {
  return ticker.endsWith('.L') ? price / 100 : price
}

export async function getFinancials(ticker: string): Promise<FinancialData | null> {
  try {
    const yf = await getYF()

    const [quote, summary] = await Promise.all([
      withRetry(() => yf.quote(ticker, {}, { validateResult: false })),
      withRetry(() => yf.quoteSummary(ticker, {
        modules: [
          'summaryDetail',
          'defaultKeyStatistics',
          'financialData',
          'incomeStatementHistory',
          'cashflowStatementHistory',
          'balanceSheetHistory',
          'assetProfile',
          'earningsHistory',
        ],
      }, { validateResult: false })),
    ])

    if (!quote && !summary) return null

    const q = quote as any
    const s = summary as any
    const sd = s?.summaryDetail ?? {}
    const ks = s?.defaultKeyStatistics ?? {}
    const fd = s?.financialData ?? {}
    const ap = s?.assetProfile ?? {}

    const rawPrice = n(q?.regularMarketPrice) ?? n(fd?.currentPrice)
    const price = rawPrice != null ? normalizePrice(rawPrice, ticker) : null

    const rawHigh52w = n(q?.fiftyTwoWeekHigh)
    const high52w = rawHigh52w != null ? normalizePrice(rawHigh52w, ticker) : null
    const distanceFromATH = price != null && high52w != null && high52w > 0
      ? ((price - high52w) / high52w) * 100
      : null

    // Income statement (annual)
    const ish: any[] = s?.incomeStatementHistory?.incomeStatementHistory ?? []
    // Cashflow statement (annual)
    const cfs: any[] = s?.cashflowStatementHistory?.cashflowStatements ?? []
    // Balance sheet (annual, most recent first)
    const bsh: any[] = s?.balanceSheetHistory?.balanceSheetStatements ?? []
    const bs = bsh[0] ?? {}
    const bsPrev = bsh[1] ?? {}

    // Revenue 3Y (most recent first)
    const revenue3Y = ish.length >= 2
      ? ish.slice(0, 3).map((s: any) => n(s?.totalRevenue)).filter((v): v is number => v != null)
      : null

    // Net income 3Y
    const netIncome3Y = ish.length >= 2
      ? ish.slice(0, 3).map((s: any) => n(s?.netIncome)).filter((v): v is number => v != null)
      : null

    // FCF 3Y (most recent first)
    const freeCashFlow3Y = cfs.length >= 2
      ? cfs.slice(0, 3).map((s: any) => {
          const opCF = n(s?.totalCashFromOperatingActivities)
          const capex = n(s?.capitalExpenditures)
          if (opCF == null) return null
          return opCF + (capex ?? 0)
        }).filter((v): v is number => v != null)
      : null

    // Revenue growth YoY (annual only)
    const revenueGrowthYoY = (() => {
      if (!ish || ish.length < 2) return null
      const recent = n(ish[0]?.totalRevenue)
      const prior = n(ish[1]?.totalRevenue)
      if (!recent || !prior || prior === 0) return null
      const g = ((recent - prior) / Math.abs(prior)) * 100
      if (g < -80 || g > 500) return null
      return g
    })()

    // ROIC
    const ebit = n(ish[0]?.ebit) ?? n(ish[0]?.operatingIncome)
    const totalDebt = n(fd?.totalDebt) ?? n(bs?.longTermDebt)
    const totalCash = n(fd?.totalCash) ?? n(bs?.cash)
    const totalEquity = n(bs?.totalStockholderEquity)
    const investedCapital = (totalEquity ?? 0) + (totalDebt ?? 0) - (totalCash ?? 0)
    const roic = ebit != null && investedCapital > 0
      ? (ebit / investedCapital) * 100
      : null
    const sanitizedRoic = roic != null ? (roic < -200 || roic > 1000 ? null : roic) : null

    // Balance sheet metrics
    const currentAssets = n(bs?.totalCurrentAssets)
    const currentLiabilities = n(bs?.totalCurrentLiabilities)
    const currentRatio = currentAssets != null && currentLiabilities != null && currentLiabilities > 0
      ? currentAssets / currentLiabilities : null
    const inventory = n(bs?.inventory)
    const quickRatio = currentAssets != null && currentLiabilities != null && currentLiabilities > 0
      ? (currentAssets - (inventory ?? 0)) / currentLiabilities : null

    // Interest coverage
    const interestExpenseVal = n(ish[0]?.interestExpense)
    let interestCoverage: number | null = null
    if (ebit != null && interestExpenseVal != null && interestExpenseVal < 0) {
      interestCoverage = ebit / Math.abs(interestExpenseVal)
    } else if (interestExpenseVal != null && interestExpenseVal === 0) {
      interestCoverage = 999 // no debt convention
    }

    // DSO, DPO, CCC — null-safe, no silent zeros
    const receivables = n(bs?.netReceivables)
    const revenueAnnual = n(ish[0]?.totalRevenue)
    const dso = receivables != null && revenueAnnual != null && revenueAnnual > 0
      ? (receivables / revenueAnnual) * 365 : null

    const payables = n(bs?.accountsPayable)
    const cogs = n(ish[0]?.costOfRevenue)
    const dpo = payables != null && cogs != null && cogs > 0
      ? (payables / cogs) * 365 : null

    const dio = inventory != null && cogs != null && cogs > 0
      ? (inventory / cogs) * 365 : null

    const cashConversionCycle = dso != null && dpo != null
      ? dso + (dio ?? 0) - dpo : null

    // CapEx intensity
    const capexRaw = n(cfs[0]?.capitalExpenditures)
    const capexIntensity = capexRaw != null && revenueAnnual != null && revenueAnnual > 0
      ? Math.abs(capexRaw) / revenueAnnual : null

    // Accruals ratio
    const netIncomeRecent = n(ish[0]?.netIncome)
    const opCashFlowRecent = n(cfs[0]?.totalCashFromOperatingActivities)
    const totalAssetsRecent = n(bs?.totalAssets)
    const totalAssetsPrev = n(bsPrev?.totalAssets)
    const accrualsRatio = (() => {
      if (netIncomeRecent == null || opCashFlowRecent == null) return null
      if (totalAssetsRecent == null || totalAssetsPrev == null) return null
      const avg = (totalAssetsRecent + totalAssetsPrev) / 2
      if (avg === 0) return null
      return (netIncomeRecent - opCashFlowRecent) / avg
    })()

    // ROIIC
    const roiic = (() => {
      if (ish.length < 2 || bsh.length < 2) return null
      const ebitN = n(ish[0]?.ebit) ?? n(ish[0]?.operatingIncome)
      const ebitN1 = n(ish[1]?.ebit) ?? n(ish[1]?.operatingIncome)
      if (ebitN == null || ebitN1 == null) return null
      const taxRate = 0.25
      const nopatN = ebitN * (1 - taxRate)
      const nopatN1 = ebitN1 * (1 - taxRate)
      const deltaNopat = nopatN - nopatN1

      const equityN = n(bs?.totalStockholderEquity) ?? 0
      const debtN = n(fd?.totalDebt) ?? n(bs?.longTermDebt) ?? 0
      const cashN = n(fd?.totalCash) ?? n(bs?.cash) ?? 0
      const icN = equityN + debtN - cashN

      const equityN1 = n(bsPrev?.totalStockholderEquity) ?? 0
      const debtN1 = n(bsPrev?.longTermDebt) ?? 0
      const cashN1 = n(bsPrev?.cash) ?? 0
      const icN1 = equityN1 + debtN1 - cashN1

      const deltaIC = icN - icN1
      if (deltaIC <= 0) return null
      return (deltaNopat / deltaIC) * 100
    })()

    // FCF yield & P/FCF
    const sharesOutstanding = n(ks?.sharesOutstanding) ?? n(q?.sharesOutstanding)
    const latestFCF = freeCashFlow3Y?.[0] ?? null
    const fcfPerShare = latestFCF != null && sharesOutstanding != null && sharesOutstanding > 0
      ? normalizePrice(latestFCF / sharesOutstanding, ticker)
      : null
    const pFcf = price != null && fcfPerShare != null && fcfPerShare > 0
      ? price / fcfPerShare : null
    const rawFcfYield = fcfPerShare != null && price != null && price > 0
      ? (fcfPerShare / price) * 100 : null
    const fcfYield = rawFcfYield != null ? (rawFcfYield < -100 || rawFcfYield > 100 ? null : rawFcfYield) : null

    // Earnings history
    const eh = s?.earningsHistory as any
    const earningsHistory = eh?.history?.map((e: any) => ({
      period: e?.period ?? '',
      epsEstimate: n(e?.epsEstimate),
      epsActual: n(e?.epsActual),
      surprisePercent: n(e?.surprisePercent),
    })) ?? null

    // 6M performance
    let performance6M: number | null = null
    try {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const chart = await yf.chart(ticker, {
        period1: sixMonthsAgo,
        interval: '1mo',
      })
      const closes = chart?.quotes?.map((cq: any) => cq.close).filter(Boolean) ?? []
      if (closes.length >= 2) {
        const first = normalizePrice(closes[0], ticker)
        const last = normalizePrice(closes[closes.length - 1], ticker)
        if (first > 0) performance6M = ((last - first) / first) * 100
      }
    } catch {}

    const ebitda = n(fd?.ebitda)
    const marketCap = n(q?.marketCap)

    const evEbit = (() => {
      if (!marketCap || !ebit || ebit <= 0) return null
      const ev = marketCap + (totalDebt ?? 0) - (totalCash ?? 0)
      return ev / ebit
    })()

    return {
      ticker,
      name: q?.shortName ?? q?.longName ?? ap?.companyName ?? ticker,
      price,
      marketCap,
      sector: ap?.sector ?? q?.sector ?? null,
      exchange: q?.exchange ?? null,
      currency: q?.currency ?? null,
      pe: n(sd?.trailingPE) ?? n(q?.trailingPE),
      peg: n(ks?.pegRatio),
      evEbit,
      pFcf,
      fcfYield,
      revenue3Y: revenue3Y && revenue3Y.length >= 2 ? revenue3Y : null,
      netIncome3Y: netIncome3Y && netIncome3Y.length >= 2 ? netIncome3Y : null,
      freeCashFlow3Y: freeCashFlow3Y && freeCashFlow3Y.length >= 2 ? freeCashFlow3Y : null,
      totalDebt,
      totalCash,
      ebitda,
      interestExpense: interestExpenseVal,
      sharesOutstanding,
      grossMargin: n(fd?.grossMargins) != null ? n(fd?.grossMargins)! * 100 : null,
      operatingMargin: n(fd?.operatingMargins) != null ? n(fd?.operatingMargins)! * 100 : null,
      roic: sanitizedRoic,
      revenueGrowthYoY,
      currentRatio,
      quickRatio,
      interestCoverage,
      dso,
      dpo,
      cashConversionCycle,
      high52w,
      distanceFromATH,
      performance6M,
      capexIntensity,
      accrualsRatio,
      roiic,
      earningsHistory,
      priceHistory3M: null,
    }
  } catch (e) {
    console.error(`[yahoo] ${ticker} failed:`, e)
    return null
  }
}
