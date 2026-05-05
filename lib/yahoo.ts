import yahooFinance from 'yahoo-finance2'

export interface FinancialData {
  ticker: string; name: string; price: number; marketCap: number | null
  sector: string | null; exchange: string | null; pe: number | null; peg: number | null
  evEbit: number | null; pFcf: number | null; fcfYield: number | null
  revenue3Y: number[] | null; netIncome3Y: number[] | null; freeCashFlow3Y: number[] | null
  totalDebt: number | null; totalCash: number | null; ebitda: number | null
  interestExpense: number | null; sharesOutstanding: number | null
  grossMargin: number | null; operatingMargin: number | null; roic: number | null
  earningsHistory: { period: string; epsEstimate: number | null; epsActual: number | null; surprisePercent: number | null }[] | null
  priceHistory3M: { date: string; close: number }[] | null
}

export async function getFinancials(ticker: string): Promise<FinancialData | null> {
  try {
    // Cast to any to avoid yahoo-finance2's strict `this`-context TypeScript constraints
    const yf = yahooFinance as any
    const [quote, summary] = await Promise.all([
      yf.quote(ticker),
      yf.quoteSummary(ticker, {
        modules: [
          'summaryDetail', 'defaultKeyStatistics', 'financialData',
          'incomeStatementHistory', 'cashflowStatementHistory', 'earningsHistory',
        ],
      }).catch(() => ({})),
    ])

    if (!quote || !quote.regularMarketPrice) return null

    const fd = summary?.financialData ?? {}
    const dks = summary?.defaultKeyStatistics ?? {}
    const sd = summary?.summaryDetail ?? {}
    const ish: any[] = summary?.incomeStatementHistory?.incomeStatementHistory ?? []
    const cfh: any[] = summary?.cashflowStatementHistory?.cashflowStatements ?? []
    const eh: any[] = summary?.earningsHistory?.history ?? []

    const revenue3Y = ish.length > 0
      ? ish.slice(0, 3).map((s: any) => s.totalRevenue ?? 0).reverse()
      : null
    const netIncome3Y = ish.length > 0
      ? ish.slice(0, 3).map((s: any) => s.netIncome ?? 0).reverse()
      : null
    const freeCashFlow3Y = cfh.length > 0
      ? cfh.slice(0, 3).map((s: any) => {
          const ops = s.totalCashFromOperatingActivities ?? 0
          const capex = s.capitalExpenditures ?? 0
          return ops + capex
        }).reverse()
      : null

    const marketCap: number | null = quote.marketCap ?? null
    const enterpriseValue: number | null = dks.enterpriseValue ?? null
    const ebitda: number | null = fd.ebitda ?? null
    const evEbit = enterpriseValue && ebitda && ebitda > 0 ? enterpriseValue / ebitda : null

    const fcf = freeCashFlow3Y ? freeCashFlow3Y[freeCashFlow3Y.length - 1] : null
    const fcfYield = fcf && marketCap && marketCap > 0 ? (fcf / marketCap) * 100 : null
    const pFcf = fcf && marketCap && fcf > 0 ? marketCap / fcf : null

    const grossMargin = fd.grossMargins != null ? fd.grossMargins * 100 : null
    const operatingMargin = fd.operatingMargins != null ? fd.operatingMargins * 100 : null
    const roic = fd.returnOnEquity != null ? fd.returnOnEquity * 100 : null

    const mappedEarnings = eh.length > 0
      ? eh.map((e: any) => ({
          period: String(e.period ?? ''),
          epsEstimate: e.epsEstimate ?? null,
          epsActual: e.epsActual ?? null,
          surprisePercent: e.surprisePercent != null ? e.surprisePercent * 100 : null,
        }))
      : null

    return {
      ticker,
      name: quote.longName ?? quote.shortName ?? ticker,
      price: quote.regularMarketPrice,
      marketCap,
      sector: quote.sector ?? null,
      exchange: quote.fullExchangeName ?? quote.exchange ?? null,
      pe: sd.trailingPE ?? null,
      peg: dks.pegRatio ?? null,
      evEbit,
      pFcf,
      fcfYield,
      revenue3Y,
      netIncome3Y,
      freeCashFlow3Y,
      totalDebt: fd.totalDebt ?? null,
      totalCash: fd.totalCash ?? null,
      ebitda,
      interestExpense: ish[0]?.interestExpense ?? null,
      sharesOutstanding: dks.sharesOutstanding ?? null,
      grossMargin,
      operatingMargin,
      roic,
      earningsHistory: mappedEarnings,
      priceHistory3M: null,
    }
  } catch (error) {
    console.error(`Failed to fetch financials for ${ticker}:`, error)
    return null
  }
}

export async function getBatchFinancials(tickers: string[]): Promise<FinancialData[]> {
  const { default: pLimit } = await import('p-limit')
  const limit = pLimit(3)
  const results = await Promise.all(tickers.map(t => limit(() => getFinancials(t))))
  return results.filter(Boolean) as FinancialData[]
}
