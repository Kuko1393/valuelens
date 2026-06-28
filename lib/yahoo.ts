let _yf: any = null
async function getYF(): Promise<any> {
  if (!_yf) {
    const mod: any = await import('yahoo-finance2')
    const YF = mod.default ?? mod
    const instance = typeof YF === 'function'
      ? new (YF as any)({ suppressNotices: ['yahooSurvey'] })
      : YF
    _yf = instance
  }
  return _yf
}

async function withRetry<T>(fn: () => Promise<T>, label = '', retries = 2): Promise<T | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (e: any) {
      console.error(`[yahoo] ${label} attempt ${i+1}/${retries+1}:`, e?.message?.slice(0, 200))
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

function v(x: any): number | null {
  if (x == null) return null
  const raw = x?.raw ?? x
  return typeof raw === 'number' && isFinite(raw) ? raw : null
}

function normalizePrice(price: number, ticker: string): number {
  return ticker.endsWith('.L') ? price / 100 : price
}

export async function getFinancials(ticker: string): Promise<FinancialData | null> {
  try {
    const yf = await getYF()

    const fiveYearsAgo = new Date()
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)

    const [quote, summaryRaw, ftsRaw] = await Promise.all([
      withRetry(() => yf.quote(ticker, {}, { validateResult: false }), `quote:${ticker}`),
      withRetry(() => yf.quoteSummary(ticker, {
        modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData', 'assetProfile', 'earningsHistory'],
      }, { validateResult: false }), `summary:${ticker}`),
      withRetry(() => yf.fundamentalsTimeSeries(ticker, {
        period1: fiveYearsAgo,
        type: 'annual',
        module: 'all',
      }, { validateResult: false }), `fts:${ticker}`),
    ])

    if (!quote) return null

    const q = quote as any
    const s = summaryRaw as any
    const sd = s?.summaryDetail ?? {}
    const ks = s?.defaultKeyStatistics ?? {}
    const fd = s?.financialData ?? {}
    const ap = s?.assetProfile ?? {}

    // FTS data — sorted most recent first, skip periods with no revenue
    const fts: any[] = ((ftsRaw as any[]) ?? [])
      .filter((p: any) => p.totalRevenue != null)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const f0 = fts[0] ?? {} // most recent year
    const f1 = fts[1] ?? {} // prior year
    const f2 = fts[2] ?? {} // 2 years ago

    const rawPrice = v(q?.regularMarketPrice) ?? v(fd?.currentPrice)
    const price = rawPrice != null ? normalizePrice(rawPrice, ticker) : null

    const rawHigh52w = v(q?.fiftyTwoWeekHigh)
    const high52w = rawHigh52w != null ? normalizePrice(rawHigh52w, ticker) : null
    const distanceFromATH = price != null && high52w != null && high52w > 0
      ? ((price - high52w) / high52w) * 100 : null

    // Revenue 3Y (most recent first)
    const revenue3Y = fts.length >= 2
      ? fts.slice(0, 3).map((p: any) => v(p.totalRevenue)).filter((x): x is number => x != null)
      : null

    // Net income 3Y
    const netIncome3Y = fts.length >= 2
      ? fts.slice(0, 3).map((p: any) => v(p.netIncome) ?? v(p.dilutedNIAvailtoComStockholders)).filter((x): x is number => x != null)
      : null

    // FCF 3Y
    const freeCashFlow3Y = fts.length >= 2
      ? fts.slice(0, 3).map((p: any) => v(p.freeCashFlow)).filter((x): x is number => x != null)
      : null

    // Revenue growth YoY
    const rev0 = v(f0.totalRevenue)
    const rev1 = v(f1.totalRevenue)
    const revenueGrowthYoY = rev0 != null && rev1 != null && rev1 !== 0
      ? ((rev0 - rev1) / Math.abs(rev1)) * 100
      : null

    // Key financials from FTS
    const ebit = v(f0.EBIT) ?? v(f0.operatingIncome)
    const ebitda = v(f0.EBITDA) ?? v(fd?.ebitda)
    const totalDebt = v(f0.totalDebt) ?? v(fd?.totalDebt)
    const totalCash = v(f0.cashAndCashEquivalents) ?? v(fd?.totalCash)
    const totalEquity = v(f0.commonStockEquity) ?? v(f0.stockholdersEquity)
    const interestExpenseVal = v(f0.interestExpense)
    const costOfRevenue = v(f0.costOfRevenue)
    const sharesOutstanding = v(f0.ordinarySharesNumber) ?? v(ks?.sharesOutstanding) ?? v(q?.sharesOutstanding)

    // ROIC
    const investedCapital = v(f0.investedCapital) ?? ((totalEquity ?? 0) + (totalDebt ?? 0) - (totalCash ?? 0))
    const roic = ebit != null && investedCapital > 0 ? (ebit / investedCapital) * 100 : null
    const sanitizedRoic = roic != null ? (roic < -200 || roic > 1000 ? null : roic) : null

    // Balance sheet metrics
    const currentAssets = v(f0.currentAssets)
    const currentLiabilities = v(f0.currentLiabilities)
    const currentRatio = currentAssets != null && currentLiabilities != null && currentLiabilities > 0
      ? currentAssets / currentLiabilities : null
    const inventory = v(f0.inventory)
    const quickRatio = currentAssets != null && currentLiabilities != null && currentLiabilities > 0
      ? (currentAssets - (inventory ?? 0)) / currentLiabilities : null

    // Interest coverage
    let interestCoverage: number | null = null
    if (ebit != null && interestExpenseVal != null && interestExpenseVal < 0) {
      interestCoverage = ebit / Math.abs(interestExpenseVal)
    } else if (interestExpenseVal != null && interestExpenseVal === 0) {
      interestCoverage = 999
    } else if (totalDebt == null || totalDebt === 0) {
      interestCoverage = 999
    }

    // Working capital metrics
    const receivables = v(f0.receivables) ?? v(f0.accountsReceivable)
    const dso = receivables != null && rev0 != null && rev0 > 0
      ? (receivables / rev0) * 365 : null
    const payables = v(f0.accountsPayable)
    const dpo = payables != null && costOfRevenue != null && costOfRevenue > 0
      ? (payables / costOfRevenue) * 365 : null
    const dio = inventory != null && costOfRevenue != null && costOfRevenue > 0
      ? (inventory / costOfRevenue) * 365 : null
    const cashConversionCycle = dso != null && dpo != null
      ? dso + (dio ?? 0) - dpo : null

    // CapEx intensity
    const capex = v(f0.capitalExpenditure)
    const capexIntensity = capex != null && rev0 != null && rev0 > 0
      ? Math.abs(capex) / rev0 : null

    // Accruals ratio
    const netIncome0 = v(f0.netIncome)
    const opCashFlow0 = v(f0.operatingCashFlow)
    const totalAssets0 = v(f0.totalAssets)
    const totalAssets1 = v(f1.totalAssets)
    const accrualsRatio = (() => {
      if (netIncome0 == null || opCashFlow0 == null) return null
      if (totalAssets0 == null || totalAssets1 == null) return null
      const avg = (totalAssets0 + totalAssets1) / 2
      if (avg === 0) return null
      return (netIncome0 - opCashFlow0) / avg
    })()

    // ROIIC
    const roiic = (() => {
      const ebitN = v(f0.EBIT) ?? v(f0.operatingIncome)
      const ebitN1 = v(f1.EBIT) ?? v(f1.operatingIncome)
      if (ebitN == null || ebitN1 == null) return null
      const taxRate = 0.25
      const deltaNopat = ebitN * (1 - taxRate) - ebitN1 * (1 - taxRate)
      const icN = v(f0.investedCapital) ?? ((v(f0.commonStockEquity) ?? 0) + (v(f0.totalDebt) ?? 0) - (v(f0.cashAndCashEquivalents) ?? 0))
      const icN1 = v(f1.investedCapital) ?? ((v(f1.commonStockEquity) ?? 0) + (v(f1.totalDebt) ?? 0) - (v(f1.cashAndCashEquivalents) ?? 0))
      const deltaIC = icN - icN1
      if (deltaIC <= 0) return null
      return (deltaNopat / deltaIC) * 100
    })()

    // Margins
    const grossMargin = v(fd?.grossMargins) != null ? v(fd?.grossMargins)! * 100 : null
    const operatingMargin = v(fd?.operatingMargins) != null ? v(fd?.operatingMargins)! * 100 : null

    // FCF yield & P/FCF
    const latestFCF = freeCashFlow3Y?.[0] ?? null
    const fcfPerShare = latestFCF != null && sharesOutstanding != null && sharesOutstanding > 0
      ? normalizePrice(latestFCF / sharesOutstanding, ticker) : null
    const pFcf = price != null && fcfPerShare != null && fcfPerShare > 0
      ? price / fcfPerShare : null
    const rawFcfYield = fcfPerShare != null && price != null && price > 0
      ? (fcfPerShare / price) * 100 : null
    const fcfYield = rawFcfYield != null ? (rawFcfYield < -100 || rawFcfYield > 100 ? null : rawFcfYield) : null

    // EV/EBIT
    const marketCap = v(q?.marketCap)
    const evEbit = (() => {
      if (!marketCap || !ebit || ebit <= 0) return null
      const ev = marketCap + (totalDebt ?? 0) - (totalCash ?? 0)
      return ev / ebit
    })()

    // Earnings history
    const eh = s?.earningsHistory as any
    const earningsHistory = eh?.history?.map((e: any) => ({
      period: e?.period ?? '',
      epsEstimate: v(e?.epsEstimate),
      epsActual: v(e?.epsActual),
      surprisePercent: v(e?.surprisePercent),
    })) ?? null

    // 6M performance
    let performance6M: number | null = null
    try {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const chart = await yf.chart(ticker, { period1: sixMonthsAgo, interval: '1mo' })
      const closes = chart?.quotes?.map((cq: any) => cq.close).filter(Boolean) ?? []
      if (closes.length >= 2) {
        const first = normalizePrice(closes[0], ticker)
        const last = normalizePrice(closes[closes.length - 1], ticker)
        if (first > 0) performance6M = ((last - first) / first) * 100
      }
    } catch {}

    return {
      ticker,
      name: q?.shortName ?? q?.longName ?? ap?.companyName ?? ticker,
      price, marketCap,
      sector: ap?.sector ?? q?.sector ?? null,
      exchange: q?.exchange ?? null,
      currency: q?.currency ?? null,
      pe: v(sd?.trailingPE) ?? v(q?.trailingPE),
      peg: v(ks?.pegRatio),
      evEbit, pFcf, fcfYield,
      revenue3Y: revenue3Y && revenue3Y.length >= 2 ? revenue3Y : null,
      netIncome3Y: netIncome3Y && netIncome3Y.length >= 2 ? netIncome3Y : null,
      freeCashFlow3Y: freeCashFlow3Y && freeCashFlow3Y.length >= 2 ? freeCashFlow3Y : null,
      totalDebt, totalCash, ebitda,
      interestExpense: interestExpenseVal,
      sharesOutstanding,
      grossMargin, operatingMargin,
      roic: sanitizedRoic,
      revenueGrowthYoY,
      currentRatio, quickRatio, interestCoverage,
      dso, dpo, cashConversionCycle,
      high52w, distanceFromATH, performance6M,
      capexIntensity, accrualsRatio, roiic,
      earningsHistory,
      priceHistory3M: null,
    }
  } catch (e) {
    console.error(`[yahoo] ${ticker} failed:`, e)
    return null
  }
}
