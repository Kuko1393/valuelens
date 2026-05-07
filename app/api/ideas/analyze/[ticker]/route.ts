import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getFinancials } from '@/lib/yahoo'
import { prisma } from '@/lib/db'
import { calculateScore, classifyCompany, computeMarginOfSafety } from '@/lib/scoring'
import { estimateIntrinsicValue } from '@/lib/dcf'

export const runtime = 'nodejs'
export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function detectCountry(ticker: string): string {
  if (ticker.endsWith('.PA')) return 'France'
  if (ticker.endsWith('.DE')) return 'Allemagne'
  if (ticker.endsWith('.AS')) return 'Pays-Bas'
  if (ticker.endsWith('.L'))  return 'Royaume-Uni'
  if (ticker.endsWith('.TO')) return 'Canada'
  if (ticker.endsWith('.SW')) return 'Suisse'
  if (ticker.endsWith('.MI')) return 'Italie'
  if (ticker.endsWith('.MC')) return 'Espagne'
  if (ticker.endsWith('.ST')) return 'Suède'
  if (ticker.endsWith('.CO')) return 'Danemark'
  if (ticker.endsWith('.HE')) return 'Finlande'
  return 'États-Unis'
}

function computeCagr(arr: number[] | null): number | null {
  if (!arr || arr.length < 2) return null
  const first = arr[0], last = arr[arr.length - 1]
  if (!first || first <= 0) return null
  return ((last / first) ** (1 / (arr.length - 1)) - 1) * 100
}

function fmt(v: number | null, dec = 1) { return v != null ? v.toFixed(dec) : 'N/A' }

async function callClaude(ticker: string, fin: any, mos: number | null, revGrowth: number | null, debtToEbitda: number | null) {
  const prompt = `Tu es un analyste value investing senior. Analyse cette entreprise et réponds en JSON uniquement (aucun markdown, aucun bloc de code).

ENTREPRISE : ${fin.name} (${ticker})
PAYS : ${detectCountry(ticker)}
SECTEUR : ${fin.sector ?? 'Inconnu'}

DONNÉES FINANCIÈRES :
- Prix actuel : ${fmt(fin.price, 2)}
- Market Cap : ${fin.marketCap ? (fin.marketCap / 1e9).toFixed(1) + 'B' : 'N/A'}
- P/E ratio : ${fmt(fin.pe)}
- EV/EBIT : ${fmt(fin.evEbit)}
- FCF Yield : ${fmt(fin.fcfYield)}%
- Revenue Growth 3Y CAGR : ${fmt(revGrowth)}%
- ROIC : ${fmt(fin.roic)}%
- Gross Margin : ${fmt(fin.grossMargin)}%
- Operating Margin : ${fmt(fin.operatingMargin)}%
- Debt/EBITDA : ${fmt(debtToEbitda)}
- Marge de sécurité estimée : ${fmt(mos)}%
- Total Cash : ${fin.totalCash ? (fin.totalCash / 1e9).toFixed(1) + 'B' : 'N/A'}
- Total Debt : ${fin.totalDebt ? (fin.totalDebt / 1e9).toFixed(1) + 'B' : 'N/A'}
- EBITDA : ${fin.ebitda ? (fin.ebitda / 1e9).toFixed(1) + 'B' : 'N/A'}

INSTRUCTIONS D'ANALYSE :

1. THÈSE (3-4 phrases) : pourquoi c'est potentiellement sous-évalué, quel est le potentiel de ré-évaluation.

2. CATALYSEURS : 3-5 éléments concrets qui pourraient déclencher une ré-évaluation.

3. VALORISATION : analyse la décote vs historique et pairs. Classe : "Décote probable" | "Valorisation neutre" | "Valorisation élevée" | "Données insuffisantes"

4. RISQUES : 4-6 risques principaux qui pourraient invalider la thèse.

5. CHALLENGE (analyse critique) :
   - implicitAssumptions : 3-4 hypothèses non dites dans la thèse
   - weakPoints : 3-4 faiblesses analytiques
   - hiddenRisks : 2-3 risques que la thèse ignore
   - marketingArgs : 2-3 éléments potentiellement survendus
   - whyBadIdea : paragraphe de 4-5 phrases sur pourquoi cette idée pourrait être mauvaise

6. SCORING /100 :
   - discount /30 : force de la décote identifiée
   - catalyst /25 : clarté et probabilité des catalyseurs
   - businessQuality /15 : ROIC, moat, récurrence
   - thesisSolidity /15 : logique de l'argumentation
   - accessibility /10 : PEA-éligible, liquidité, accessibilité investisseur français
   - sourceQuality /5 : fiabilité et complétude des données disponibles
   - total : somme des 6 critères

7. CONVICTION : "Élevée" | "Moyenne" | "Faible" + 2-3 phrases de justification.

JSON de réponse (strictement ce format, aucun texte en dehors) :
{
  "thesis": "...",
  "catalysts": ["...", "...", "..."],
  "valuation": "...",
  "valuationClass": "Décote probable",
  "risks": ["...", "...", "..."],
  "implicitAssumptions": ["...", "..."],
  "weakPoints": ["...", "..."],
  "hiddenRisks": ["...", "..."],
  "marketingArgs": ["...", "..."],
  "whyBadIdea": "...",
  "scoring": {
    "discount": 20,
    "catalyst": 18,
    "businessQuality": 12,
    "thesisSolidity": 11,
    "accessibility": 7,
    "sourceQuality": 4,
    "total": 72
  },
  "conviction": {
    "level": "Moyenne",
    "reason": "..."
  }
}`

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
  // Strip any accidental markdown fences
  const clean = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
  const match = clean.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`Claude returned non-JSON: ${raw.slice(0, 200)}`)
  return JSON.parse(match[0])
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  try {
    const fin = await getFinancials(ticker)
    if (!fin) return NextResponse.json({ error: 'Could not fetch financial data' }, { status: 404 })

    const iv = estimateIntrinsicValue(
      fin.freeCashFlow3Y?.[0] && fin.sharesOutstanding ? fin.freeCashFlow3Y[0] / fin.sharesOutstanding : null,
      fin.pe
    )
    const mos = computeMarginOfSafety(iv, fin.price)
    const revGrowth = computeCagr(fin.revenue3Y)
    const debtToEbitda = fin.totalDebt && fin.ebitda && fin.ebitda > 0
      ? (fin.totalDebt - (fin.totalCash ?? 0)) / fin.ebitda
      : null

    const analysis = await callClaude(ticker, fin, mos, revGrowth, debtToEbitda)

    // Replace previous analysis for this ticker (re-analyze = fresh record)
    await prisma.investmentIdea.deleteMany({ where: { ticker } })

    const idea = await prisma.investmentIdea.create({
      data: {
        ticker,
        company: fin.name,
        country: detectCountry(ticker),
        sector: fin.sector ?? 'Unknown',
        thesis: analysis.thesis,
        catalysts: analysis.catalysts,
        valuation: analysis.valuation ?? '',
        risks: analysis.risks,
        per: fin.pe,
        evEbit: fin.evEbit,
        fcfYield: fin.fcfYield,
        revGrowth3Y: revGrowth,
        debtToEbitda,
        marginOfSafety: mos,
        valuationClass: analysis.valuationClass,
        implicitAssumptions: analysis.implicitAssumptions,
        weakPoints: analysis.weakPoints,
        hiddenRisks: analysis.hiddenRisks,
        marketingArgs: analysis.marketingArgs,
        whyBadIdea: analysis.whyBadIdea,
        discountScore: analysis.scoring.discount,
        catalystScore: analysis.scoring.catalyst,
        businessQualityScore: analysis.scoring.businessQuality,
        thesisSolidityScore: analysis.scoring.thesisSolidity,
        accessibilityScore: analysis.scoring.accessibility,
        sourceQualityScore: analysis.scoring.sourceQuality,
        totalScore: analysis.scoring.total,
        convictionLevel: analysis.conviction.level,
        convictionReason: analysis.conviction.reason,
      }
    })

    return NextResponse.json({ idea })
  } catch (err) {
    console.error('[analyze]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
