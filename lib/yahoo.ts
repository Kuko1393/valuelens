// eslint-disable-next-line @typescript-eslint/no-var-requires
const yahooFinance = require('yahoo-finance2').default as any
import pLimit from 'p-limit'
import { getCache, setCache, TTL } from './cache'

const limit = pLimit(5)

export interface FinancialData {
  ticker: string; name: string; price: number; marketCap: number | null
  sector: string | null; exchange: string | null; description: string | null
  pe: number | null; peg: number | null
  evEbit: number | null; pFcf: number | null; fcfYield: number | null
  revenue3Y: number[] | null; netIncome3Y: number[] | null; freeCashFlow3Y: number[] | null
  totalDebt: number | null; totalCash: number | null; ebitda: number | null
  interestExpense: number | null; sharesOutstanding: number | null
  grossMargin: number | null; operatingMargin: number | null; roic: number | null
  earningsHistory: { period: string; epsEstimate: number | null; epsActual: number | null; surprisePercent: number | null }[] | null
  priceHistory3M: { date: string; close: number }[] | null
}

export async function getFinancials(ticker: string): Promise<FinancialData | null> {
  const cacheKey = `financials:${ticker}`
  const cached = await getCache<FinancialData>(cacheKey)
  if (cached) return cached
  try {
    const [quote, income, balance, cashflow, earnings, history] = await Promise.all([
      limit(() => yahooFinance.quoteSummary(ticker, { modules: ['price','summaryDetail','defaultKeyStatistics','financialData','assetProfile'] })),
      limit(() => yahooFinance.quoteSummary(ticker, { modules: ['incomeStatementHistory'] })),
      limit(() => yahooFinance.quoteSummary(ticker, { modules: ['balanceSheetHistory'] })),
      limit(() => yahooFinance.quoteSummary(ticker, { modules: ['cashflowStatementHistory'] })),
      limit(() => yahooFinance.quoteSummary(ticker, { modules: ['earningsHistory'] })),
      limit(() => yahooFinance.historical(ticker, { period1: new Date(Date.now() - 90*24*60*60*1000), period2: new Date(), interval: '1d' })),
    ])
    const price = quote.price; const fd = quote.financialData; const ks = quote.defaultKeyStatistics
    const profile = quote.assetProfile
    const incomeStmts = income.incomeStatementHistory?.incomeStatementHistory || []
    const balanceSheets = balance.balanceSheetHistory?.balanceSheetHistory || []
    const cashflowStmts = cashflow.cashflowStatementHistory?.cashflowStatementHistory || []
    const eh = earnings.earningsHistory?.history || []
    const revenues = incomeStmts.slice(0,3).map((s: any) => s.totalRevenue || 0)
    const netIncomes = incomeStmts.slice(0,3).map((s: any) => s.netIncome || 0)
    const fcfs = cashflowStmts.slice(0,3).map((s: any) => (s.operatingCashflow||0)-(s.capitalExpenditures||0))
    const latestBalance = balanceSheets[0] || {}; const latestIncome = incomeStmts[0] || {}
    const nopat = ((latestIncome as any).ebit||0)*0.75
    const investedCapital = ((latestBalance as any).totalStockholderEquity||1)+((latestBalance as any).longTermDebt||0)
    const roic = investedCapital > 0 ? (nopat/investedCapital)*100 : null
    const mktCap = price?.marketCap || null; const latestFcf = fcfs[0] || 0
    const fcfYield = mktCap && mktCap > 0 ? (latestFcf/mktCap)*100 : null
    const data: FinancialData = {
      ticker, name: price?.longName || price?.shortName || ticker,
      price: price?.regularMarketPrice || 0, marketCap: mktCap,
      sector: (profile as any)?.sector || null, exchange: price?.exchangeName || null,
      description: (profile as any)?.longBusinessSummary || null,
      pe: (price?.regularMarketPrice && fd?.epsTrailingTwelveMonths) ? price.regularMarketPrice/fd.epsTrailingTwelveMonths : null,
      peg: ks?.pegRatio || null, evEbit: ks?.enterpriseToEbitda || null,
      pFcf: latestFcf > 0 && mktCap ? mktCap/latestFcf : null, fcfYield,
      revenue3Y: revenues, netIncome3Y: netIncomes, freeCashFlow3Y: fcfs,
      totalDebt: (latestBalance as any).longTermDebt || null, totalCash: (latestBalance as any).cash || null,
      ebitda: fd?.ebitda || null, interestExpense: (latestIncome as any).interestExpense || null,
      sharesOutstanding: ks?.sharesOutstanding || null,
      grossMargin: fd?.grossMargins ? fd.grossMargins*100 : null,
      operatingMargin: fd?.operatingMargins ? fd.operatingMargins*100 : null, roic,
      earningsHistory: eh.slice(0,8).map((e: any) => ({ period: e.quarter?.toString()||'', epsEstimate: e.epsEstimate||null, epsActual: e.epsActual||null, surprisePercent: e.surprisePercent||null })),
      priceHistory3M: (history||[]).map((h: any) => ({ date: h.date?.toString().split('T')[0]||'', close: h.close||0 })),
    }
    await setCache(cacheKey, data, TTL.METRICS); return data
  } catch (err) { console.error(`Yahoo error ${ticker}:`, err); return null }
}

export async function getBatchFinancials(tickers: string[]): Promise<FinancialData[]> {
  const results = await Promise.allSettled(tickers.map(t => limit(() => getFinancials(t))))
  return results
    .filter((r): r is PromiseFulfilledResult<FinancialData|null> => r.status==='fulfilled')
    .map(r => r.value)
    .filter((d): d is FinancialData => d !== null)
}
