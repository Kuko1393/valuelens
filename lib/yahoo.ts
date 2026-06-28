let _yf: any = null
async function getYF() {
  if (!_yf) {
    const mod = await import('yahoo-finance2')
    const YF = mod.default ?? mod
    _yf = typeof YF === 'function' ? new YF() : YF
  }
  return _yf
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

export async function getFinancials(ticker: string): Promise<FinancialData | null> {
  try {
    const yf = await getYF()
    const [quote, summary] = await Promise.all([
      yf.quote(ticker).catch(() => null),
      yf.quoteSummary(ticker, {
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
      }).catch(() => null),
    ])

    if (!quote && !summary) return null

    const q = quote as any
    const sd = summary?.summaryDetail as any ?? {}
    const ks = summary?.defaultKeyStatistics as any ?? {}
    const fd = summary?.financialData as any ?? {}
    const ap = summary?.assetProfile as any ?? {}

    const isPence = q?.currency === 'GBX' || q?.currency === 'GBp'
    const divisor = isPence ? 100 : 1

    const rawPrice = n(q?.regularMarketPrice) ?? n(fd?.currentPrice)
    const price = rawPrice != null ? rawPrice / divisor : null

    const high52w = n(q?.fiftyTwoWeekHigh) != null ? n(q?.fiftyTwoWeekHigh)! / divisor : null
    const distanceFromATH = price != null && high52w != null && high52w > 0
      ? ((price - high52w) / high52w) * 100
      : null

    // Income statement (annual)
    const ish: any[] = summary?.incomeStatementHistory?.incomeStatementHistory ?? []
    // Cashflow statement (annual)
    const cfs: any[] = summary?.cashflowStatementHistory?.cashflowStatements ?? []
    // Balance sheet (annual)
    const bsh: any[] = summary?.balanceSheetHistory?.balanceSheetStatements ?? []
    const bs = bsh[0] ?? {}

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
          return opCF + (capex ?? 0) // capex is negative in Yahoo
        }).filter((v): v is number => v != null)
      : null

    // Revenue growth YoY (annual)
    const revenueGrowthYoY = (() => {
      if (!ish || ish.length < 2) return null
      const recent = n(ish[0]?.totalRevenue)
      const prior = n(ish[1]?.totalRevenue)
      if (!recent || !prior || prior <= 0) return null
      const g = ((recent - prior) / prior) * 100
      if (g < -80 || g > 500) return null
      return g
    })()

    // ROIC
    const ebit = n(ish[0]?.ebit) ?? n(ish[0]?.operatingIncome) ?? n(fd?.operatingMargins != null && n(ish[0]?.totalRevenue) != null ? (fd.operatingMargins * n(ish[0]?.totalRevenue)!) : null)
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
    const currentRatio = currentAssets && currentLiabilities && currentLiabilities > 0
      ? currentAssets / currentLiabilities : null
    const inventory = n(bs?.inventory) ?? 0
    const quickRatio = currentAssets && currentLiabilities && currentLiabilities > 0
      ? (currentAssets - inventory) / currentLiabilities : null

    const interestExpenseVal = n(ish[0]?.interestExpense)
    const interestCoverage = ebit != null && interestExpenseVal != null && interestExpenseVal < 0
      ? ebit / Math.abs(interestExpenseVal) : null

    // DSO, DPO, CCC
    const receivables = n(bs?.netReceivables)
    const revenueAnnual = n(ish[0]?.totalRevenue)
    const dso = receivables && revenueAnnual && revenueAnnual > 0
      ? (receivables / revenueAnnual) * 365 : null
    const payables = n(bs?.accountsPayable)
    const cogs = n(ish[0]?.costOfRevenue)
    const dpo = payables && cogs && cogs > 0
      ? (payables / cogs) * 365 : null
    const dio = inventory && cogs && cogs > 0 ? (inventory / cogs) * 365 : null
    const cashConversionCycle = dso != null && dpo != null
      ? dso + (dio ?? 0) - dpo : null

    // FCF yield
    const sharesOutstanding = n(ks?.sharesOutstanding) ?? n(q?.sharesOutstanding)
    const latestFCF = freeCashFlow3Y?.[0] ?? null
    const fcfPerShare = latestFCF != null && sharesOutstanding && sharesOutstanding > 0
      ? latestFCF / sharesOutstanding / divisor
      : null
    const pFcf = price != null && fcfPerShare != null && fcfPerShare > 0
      ? price / fcfPerShare : null
    const rawFcfYield = fcfPerShare != null && price != null && price > 0
      ? (fcfPerShare / price) * 100 : null
    const fcfYield = rawFcfYield != null ? (rawFcfYield < -100 || rawFcfYield > 100 ? null : rawFcfYield) : null

    // Earnings history
    const eh = summary?.earningsHistory as any
    const earningsHistory = eh?.history?.map((e: any) => ({
      period: e?.period ?? '',
      epsEstimate: n(e?.epsEstimate),
      epsActual: n(e?.epsActual),
      surprisePercent: n(e?.surprisePercent),
    })) ?? null

    // 6M performance via chart
    let performance6M: number | null = null
    try {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const chart = await yf.chart(ticker, {
        period1: sixMonthsAgo,
        interval: '1mo',
      })
      const closes = chart?.quotes?.map((q: any) => q.close).filter(Boolean) ?? []
      if (closes.length >= 2) {
        const first = closes[0] / divisor
        const last = closes[closes.length - 1] / divisor
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
      earningsHistory,
      priceHistory3M: null,
    }
  } catch (e) {
    console.error(`[yahoo] ${ticker} failed:`, e)
    return null
  }
}
