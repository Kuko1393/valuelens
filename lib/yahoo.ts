// Direct Yahoo Finance fetch — no yahoo-finance2 library dependency.
// The library's crumb/consent flow is unreliable on Vercel serverless.

const YF_QUERY = 'https://query2.finance.yahoo.com'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const BASE_HEADERS = { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9', accept: '*/*' }

// Yahoo Finance often returns {raw, fmt} objects even with formatted=false.
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
  divYield: number | null       // annual dividend yield %
  guidanceScore: number | null  // 1-5 from EPS beat rate

  // P&L history (3 fiscal years, oldest → newest)
  revenue3Y: number[] | null
  ebitda3Y: number[] | null       // EBITDA: operatingIncome + D&A
  netIncome3Y: number[] | null
  freeCashFlow3Y: number[] | null

  // Snapshot — most recent fiscal year
  totalDebt: number | null        // short + long term
  totalCash: number | null
  ebitda: number | null           // from financialData (most reliable)
  interestExpense: number | null   // most recent year (used for interest coverage)
  sharesOutstanding: number | null
  grossMargin: number | null
  operatingMargin: number | null
  roic: number | null

  // Balance sheet (most recent year)
  equity: number | null           // totalStockholderEquity (capitaux propres)
  shortTermDebt: number | null    // dette à moins d'un an
  longTermDebt: number | null     // dette à plus d'un an
  ppe: number | null              // immobilisations corporelles (PP&E net)
  receivables: number | null      // créances clients
  inventory: number | null        // stocks
  accountsPayable: number | null  // dettes fournisseurs

  earningsHistory: { period: string; epsEstimate: number | null; epsActual: number | null; surprisePercent: number | null }[] | null
  priceHistory1Y: { date: string; close: number }[] | null
  high52w: number | null
  low52w: number | null
}

interface Session { cookies: string; crumb: string }
let _session: Session | null = null

async function getSession(): Promise<Session | null> {
  if (_session) return _session
  try {
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
    if (res.status === 401 || res.status === 403) _session = null
    return null
  }
  return res.json()
}

export async function getFinancials(ticker: string): Promise<FinancialData | null> {
  try {
    const session = await getSession()
    if (!session) { console.error('[yahoo] could not obtain session/crumb'); return null }

    // assetProfile: sector/industry (was missing, causing sector:null everywhere)
    const modules = [
      'summaryDetail', 'defaultKeyStatistics', 'financialData',
      'incomeStatementHistory', 'cashflowStatementHistory',
      'balanceSheetHistory', 'earningsHistory', 'assetProfile',
    ].join(',')

    const [quoteData, summaryData, chartData] = await Promise.all([
      yfFetch(`/v7/finance/quote?symbols=${ticker}`, session),
      yfFetch(`/v10/finance/quoteSummary/${ticker}?modules=${modules}&formatted=false`, session),
      yfFetch(`/v8/finance/chart/${ticker}?range=1y&interval=1d`, session),
    ])

    const q = quoteData?.quoteResponse?.result?.[0]
    if (!q || !q.regularMarketPrice) return null

    const summary  = summaryData?.quoteSummary?.result?.[0] ?? {}
    const fd       = summary.financialData ?? {}
    const dks      = summary.defaultKeyStatistics ?? {}
    const sd       = summary.summaryDetail ?? {}
    const ap       = summary.assetProfile ?? {}
    const ish: any[] = summary.incomeStatementHistory?.incomeStatementHistory ?? []
    const cfh: any[] = summary.cashflowStatementHistory?.cashflowStatements ?? []
    const eh:  any[] = summary.earningsHistory?.history ?? []

    // ── GBX / GBp currency fix ──────────────────────────────────────────────
    // Yahoo Finance returns UK stocks (ULVR.L, SHEL.L…) in pence, not pounds.
    // Yahoo uses 'GBp' (pence) or 'GBX' — both must be detected and divided by 100.
    const rawPrice = q.regularMarketPrice
    const isPence  = q.currency === 'GBX' || q.currency === 'GBp'
    const price    = isPence ? rawPrice / 100 : rawPrice

    // Yahoo Finance's balanceSheetHistory no longer returns full data in their free API.
    // We derive balance sheet metrics from financialData and defaultKeyStatistics instead.

    // ── P&L history ─────────────────────────────────────────────────────────
    const revenue3Y = ish.length > 0
      ? ish.slice(0, 3).map((s: any) => n(s.totalRevenue) ?? 0).reverse() : null

    const netIncome3Y = ish.length > 0
      ? ish.slice(0, 3).map((s: any) => n(s.netIncome) ?? 0).reverse() : null

    // EBITDA (snapshot) — needed for 3Y fallback below
    const ebitdaSnap: number | null = n(fd.ebitda)

    // EBITDA 3Y: try EBIT+DA first, then approximate via EBITDA margin × revenue
    let ebitda3Y: number[] | null = null
    if (ish.length > 0 && cfh.length > 0) {
      const direct = ish.slice(0, 3).map((s: any, i: number) => {
        const ebit = n(s.ebit) ?? n(s.operatingIncome) ?? n(s.ebitda) ?? 0
        const da   = n(cfh[i]?.depreciation) ?? n(cfh[i]?.depreciationAndAmortization) ?? 0
        return ebit + Math.abs(da)
      }).reverse()
      ebitda3Y = direct.some(v => v !== 0) ? direct : null
    }
    // Fallback: apply current EBITDA margin to historical revenues
    if (!ebitda3Y && ebitdaSnap && revenue3Y) {
      const latestRevenue = n(fd.totalRevenue) ?? n(ish[0]?.totalRevenue)
      if (latestRevenue && latestRevenue > 0) {
        const ebitdaMargin = ebitdaSnap / latestRevenue
        ebitda3Y = revenue3Y.map(rev => rev * ebitdaMargin)
      }
    }

    // FCF 3Y = operating cash flow - capex
    const cfhFcf = cfh.length > 0
      ? cfh.slice(0, 3).map((s: any) => {
          const ops   = n(s.totalCashFromOperatingActivities) ?? n(s.operatingActivities)
            ?? n(s.operatingCashflow) ?? 0
          const capex = n(s.capitalExpenditures) ?? n(s.capitalExpenditure)
            ?? n(s.purchaseOfPpe) ?? 0
          return ops - Math.abs(capex)
        }).reverse()
      : null
    // Try multiple sources for FCF snapshot
    const fcfLatest = n(fd.freeCashflow)
      ?? n(q.freeCashflow)
      ?? (n(fd.operatingCashflow) && n(fd.capitalExpenditures)
          ? (n(fd.operatingCashflow)! - Math.abs(n(fd.capitalExpenditures)!))
          : null)
    let freeCashFlow3Y = cfhFcf?.some(v => v !== 0) ? cfhFcf : null

    // FCF fallback: apply FCF margin to historical revenues when statement data unavailable
    if (!freeCashFlow3Y && fcfLatest && revenue3Y) {
      const latestRevenue = n(fd.totalRevenue) ?? n(ish[0]?.totalRevenue)
      if (latestRevenue && latestRevenue > 0) {
        const fcfMargin = fcfLatest / latestRevenue
        freeCashFlow3Y = revenue3Y.map(rev => rev * fcfMargin)
      }
    }

    // Interest expense — most recent year for interest coverage ratio
    const interestExpense = n(ish[0]?.interestExpense)

    // ── Single-period metrics ────────────────────────────────────────────────
    const marketCap       = n(q.marketCap)
    const enterpriseValue = n(dks.enterpriseValue)
    const ebitda          = ebitdaSnap
    const evEbit          = enterpriseValue && ebitda && ebitda > 0 ? enterpriseValue / ebitda : null

    const fcf = freeCashFlow3Y ? freeCashFlow3Y[freeCashFlow3Y.length - 1] : fcfLatest
    const fcfYield  = fcf && marketCap && marketCap > 0 ? (fcf / marketCap) * 100 : null
    const pFcf      = fcf && marketCap && fcf > 0 ? marketCap / fcf : null

    const gm  = n(fd.grossMargins)
    const om  = n(fd.operatingMargins)
    const roe = n(fd.returnOnEquity)

    // ── Balance sheet — derived from available modules ───────────────────────
    // Yahoo Finance's balanceSheetHistory is restricted; derive from what's available.

    // Equity: bookValue/share × sharesOutstanding (bookValue from dks or quote)
    const bookValue       = n(dks.bookValue) ?? n(q.bookValue)
    const sharesOut       = n(dks.sharesOutstanding) ?? n(q.sharesOutstanding)
    const equity          = bookValue && sharesOut && bookValue > 0 ? bookValue * sharesOut : null

    // Debt split: Yahoo sometimes gives longTermDebt in financialData or from quote
    const longTermDebt    = n(fd.longTermDebt) ?? n(q.longTermDebt) ?? null
    const totalDebtVal    = n(fd.totalDebt)
    // Short-term = totalDebt - longTermDebt (approximation)
    const shortTermDebt   = totalDebtVal && longTermDebt
      ? Math.max(0, totalDebtVal - longTermDebt) : null

    // PP&E and working capital items — not available without balance sheet module
    const ppe             = null
    const receivables     = null
    const inventory       = null
    const accountsPayable = null

    // earningsHistory mapped earlier (used for guidanceScore above)

    // PEG validation: negative PEG (from negative growth) or suspiciously identical
    // values across very different companies are meaningless → null
    const rawPeg = n(dks.pegRatio) ?? n(q.trailingPegRatio)
    const peg    = rawPeg != null && rawPeg > 0 && rawPeg < 50 ? rawPeg : null

    // Dividend yield from summaryDetail (percentage form)
    const rawDivYield = n(sd.trailingAnnualDividendYield) ?? n(q.trailingAnnualDividendYield)
    const divYield    = rawDivYield != null ? rawDivYield * 100 : null

    // Sector: from assetProfile (was missing — q.sector works only for US stocks)
    const sector = ap.sector ?? q.sector ?? null

    // Guidance score from EPS beat rate
    const { calculateGuidanceScore } = await import('./scoring')
    const mappedEarnings2 = eh.length > 0
      ? eh.map((e: any) => ({
          period: String(e.period ?? ''),
          epsEstimate: n(e.epsEstimate),
          epsActual: n(e.epsActual),
          surprisePercent: n(e.surprisePercent) != null ? (n(e.surprisePercent)! * 100) : null,
        }))
      : null
    const guidanceScore = calculateGuidanceScore(mappedEarnings2)

    return {
      ticker,
      name: q.longName ?? q.shortName ?? ticker,
      price,
      marketCap,
      sector,
      exchange: q.fullExchangeName ?? q.exchange ?? null,
      pe: n(sd.trailingPE) ?? n(q.trailingPE),
      peg,
      divYield,
      guidanceScore,
      evEbit,
      pFcf,
      fcfYield,
      revenue3Y,
      ebitda3Y: ebitda3Y?.some(v => v !== 0) ? ebitda3Y : null,
      netIncome3Y,
      freeCashFlow3Y,
      totalDebt: n(fd.totalDebt),
      totalCash: n(fd.totalCash),
      ebitda,
      interestExpense,
      sharesOutstanding: n(dks.sharesOutstanding) ?? n(q.sharesOutstanding),
      grossMargin: gm != null ? gm * 100 : null,
      operatingMargin: om != null ? om * 100 : null,
      roic: roe != null ? roe * 100 : null,
      equity,
      shortTermDebt,
      longTermDebt,
      ppe,
      receivables,
      inventory,
      accountsPayable,
      earningsHistory: mappedEarnings2,
      priceHistory1Y: (() => {
        try {
          const result = chartData?.chart?.result?.[0]
          const timestamps: number[] = result?.timestamp ?? []
          const closes: number[]    = result?.indicators?.quote?.[0]?.close ?? []
          const isPenceChart = q.currency === 'GBX' || q.currency === 'GBp'
          const pts = timestamps
            .map((ts: number, i: number) => {
              const c = closes[i]
              if (c == null) return null
              const close = isPenceChart ? c / 100 : c
              return { date: new Date(ts * 1000).toISOString().slice(0, 10), close }
            })
            .filter(Boolean) as { date: string; close: number }[]
          return pts.length > 0 ? pts : null
        } catch { return null }
      })(),
      high52w: n(q.fiftyTwoWeekHigh) ? (isPence ? n(q.fiftyTwoWeekHigh)! / 100 : n(q.fiftyTwoWeekHigh)) : null,
      low52w:  n(q.fiftyTwoWeekLow)  ? (isPence ? n(q.fiftyTwoWeekLow)!  / 100 : n(q.fiftyTwoWeekLow))  : null,
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
