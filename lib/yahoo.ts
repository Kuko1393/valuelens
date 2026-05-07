// Direct Yahoo Finance fetch — no yahoo-finance2 library dependency.
// The library's crumb/consent flow is unreliable on Vercel serverless.

const YF_QUERY = 'https://query2.finance.yahoo.com'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const BASE_HEADERS = { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9', accept: '*/*' }

// Yahoo Finance often returns {raw, fmt} objects even with formatted=false.
// This helper safely extracts the numeric value from either format.
function n(v: any): number | null {
  if (v == null) return null
  if (typeof v === 'number') return v
  if (typeof v?.raw === 'number') return v.raw
  return null
}

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

interface Session { cookies: string; crumb: string }

// Module-level cache survives warm invocations (re-used within the same Lambda instance).
let _session: Session | null = null

async function getSession(): Promise<Session | null> {
  if (_session) return _session
  try {
    // Yahoo Finance sets the A1 auth cookie on the first request.
    // redirect:'follow' is fine for US-region servers (no GDPR redirect).
    const home = await fetch('https://finance.yahoo.com/', {
      headers: { ...BASE_HEADERS, accept: 'text/html,application/xhtml+xml' },
    })
    const rawCookies = home.headers.getSetCookie?.() ?? []
    const cookieStr = rawCookies.map(c => c.split(';')[0]).join('; ')

    const crumbRes = await fetch(`${YF_QUERY}/v1/test/getcrumb`, {
      headers: { ...BASE_HEADERS, cookie: cookieStr },
    })
    if (!crumbRes.ok) return null
    const crumb = (await crumbRes.text()).trim()
    // Sanity check: crumb is a short alphanumeric string, not an HTML page
    if (!crumb || crumb.length > 32 || crumb.includes('<')) return null

    _session = { cookies: cookieStr, crumb }
    return _session
  } catch (e) {
    console.error('[yahoo] session error:', e instanceof Error ? e.message : e)
    return null
  }
}

async function yfFetch(path: string, session: Session): Promise<any> {
  const sep = path.includes('?') ? '&' : '?'
  const url = `${YF_QUERY}${path}${sep}crumb=${encodeURIComponent(session.crumb)}`
  const res = await fetch(url, { headers: { ...BASE_HEADERS, cookie: session.cookies } })
  if (!res.ok) {
    // Crumb may have expired — clear session so next call re-fetches
    if (res.status === 401 || res.status === 403) _session = null
    return null
  }
  return res.json()
}

export async function getFinancials(ticker: string): Promise<FinancialData | null> {
  try {
    const session = await getSession()
    if (!session) {
      console.error('[yahoo] could not obtain session/crumb')
      return null
    }

    const modules = 'summaryDetail,defaultKeyStatistics,financialData,incomeStatementHistory,cashflowStatementHistory,earningsHistory'
    const [quoteData, summaryData] = await Promise.all([
      yfFetch(`/v7/finance/quote?symbols=${ticker}`, session),
      yfFetch(`/v10/finance/quoteSummary/${ticker}?modules=${modules}&formatted=false`, session),
    ])

    const q = quoteData?.quoteResponse?.result?.[0]
    if (!q || !q.regularMarketPrice) return null

    const summary = summaryData?.quoteSummary?.result?.[0] ?? {}
    const fd = summary.financialData ?? {}
    const dks = summary.defaultKeyStatistics ?? {}
    const sd = summary.summaryDetail ?? {}
    const ish: any[] = summary.incomeStatementHistory?.incomeStatementHistory ?? []
    const cfh: any[] = summary.cashflowStatementHistory?.cashflowStatements ?? []
    const eh: any[] = summary.earningsHistory?.history ?? []

    const revenue3Y = ish.length > 0
      ? ish.slice(0, 3).map((s: any) => n(s.totalRevenue) ?? 0).reverse()
      : null
    const netIncome3Y = ish.length > 0
      ? ish.slice(0, 3).map((s: any) => n(s.netIncome) ?? 0).reverse()
      : null

    // Try cashflow statements first; fall back to operating cash - capex names vary by API version
    const cfhFcf = cfh.length > 0
      ? cfh.slice(0, 3).map((s: any) => {
          const ops = n(s.totalCashFromOperatingActivities) ?? n(s.operatingActivities) ?? 0
          const capex = n(s.capitalExpenditures) ?? n(s.capitalExpenditure) ?? 0
          return ops - Math.abs(capex)
        }).reverse()
      : null
    // freeCashflow from financialData is always reliable (most recent year)
    const fcfLatest = n(fd.freeCashflow)
    const freeCashFlow3Y = cfhFcf?.some(v => v !== 0) ? cfhFcf : null

    const marketCap: number | null = n(q.marketCap)
    const enterpriseValue: number | null = n(dks.enterpriseValue)
    const ebitda: number | null = n(fd.ebitda)
    const evEbit = enterpriseValue && ebitda && ebitda > 0 ? enterpriseValue / ebitda : null

    // Use latest FCF from financialData when cashflow history unavailable
    const fcf = freeCashFlow3Y ? freeCashFlow3Y[freeCashFlow3Y.length - 1] : fcfLatest
    const fcfYield = fcf && marketCap && marketCap > 0 ? (fcf / marketCap) * 100 : null
    const pFcf = fcf && marketCap && fcf > 0 ? marketCap / fcf : null

    const gm = n(fd.grossMargins)
    const om = n(fd.operatingMargins)
    const roe = n(fd.returnOnEquity)

    const mappedEarnings = eh.length > 0
      ? eh.map((e: any) => ({
          period: String(e.period ?? ''),
          epsEstimate: n(e.epsEstimate),
          epsActual: n(e.epsActual),
          surprisePercent: n(e.surprisePercent) != null ? (n(e.surprisePercent)! * 100) : null,
        }))
      : null

    return {
      ticker,
      name: q.longName ?? q.shortName ?? ticker,
      price: q.regularMarketPrice,
      marketCap,
      sector: q.sector ?? null,
      exchange: q.fullExchangeName ?? q.exchange ?? null,
      pe: n(sd.trailingPE) ?? n(q.trailingPE),
      peg: n(dks.pegRatio) ?? n(q.trailingPegRatio),
      evEbit,
      pFcf,
      fcfYield,
      revenue3Y,
      netIncome3Y,
      freeCashFlow3Y,
      totalDebt: n(fd.totalDebt),
      totalCash: n(fd.totalCash),
      ebitda,
      interestExpense: n(ish[0]?.interestExpense),
      sharesOutstanding: n(dks.sharesOutstanding) ?? n(q.sharesOutstanding),
      grossMargin: gm != null ? gm * 100 : null,
      operatingMargin: om != null ? om * 100 : null,
      roic: roe != null ? roe * 100 : null,
      earningsHistory: mappedEarnings,
      priceHistory3M: null,
    }
  } catch (error) {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    console.error(`[yahoo] ${ticker} error: ${msg}`)
    return null
  }
}

export async function getBatchFinancials(tickers: string[]): Promise<FinancialData[]> {
  const { default: pLimit } = await import('p-limit')
  const limit = pLimit(3)
  const results = await Promise.all(tickers.map(t => limit(() => getFinancials(t))))
  return results.filter(Boolean) as FinancialData[]
}
