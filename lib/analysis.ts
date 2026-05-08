// Rule-based investment analysis engine — no LLM required.
// All text is generated deterministically from real financial metrics.

import type { FinancialData } from './yahoo'

export interface Analysis {
  thesis: string
  catalysts: string[]
  valuation: string
  valuationClass: 'Décote probable' | 'Valorisation neutre' | 'Valorisation élevée' | 'Données insuffisantes'
  risks: string[]
  implicitAssumptions: string[]
  weakPoints: string[]
  hiddenRisks: string[]
  marketingArgs: string[]
  whyBadIdea: string
  scoring: {
    discount: number       // /30
    catalyst: number       // /25
    businessQuality: number // /15
    thesisSolidity: number  // /15
    accessibility: number   // /10
    sourceQuality: number   // /5
    total: number          // /100
  }
  conviction: { level: 'Élevée' | 'Moyenne' | 'Faible'; reason: string }
}

function fmt(v: number | null, dec = 1) { return v != null ? v.toFixed(dec) : 'N/A' }
function fmtB(v: number | null) {
  if (!v) return 'N/A'
  return v >= 1e12 ? `${(v/1e12).toFixed(1)}T€` : v >= 1e9 ? `${(v/1e9).toFixed(1)}Md€` : `${(v/1e6).toFixed(0)}M€`
}

function country(ticker: string) {
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

function isPEAEligible(ticker: string) {
  return ['.PA','.DE','.AS','.L','.SW','.MI','.MC','.ST','.CO','.HE','.BR'].some(s => ticker.endsWith(s))
}

export function generateAnalysis(
  ticker: string,
  fin: FinancialData,
  mos: number | null,
  revGrowth: number | null,
  debtToEbitda: number | null,
): Analysis {
  const name = fin.name
  const sec  = fin.sector ?? 'ce secteur'
  const cty  = country(ticker)
  const pe   = fin.pe
  const roic = fin.roic
  const gm   = fin.grossMargin
  const om   = fin.operatingMargin
  const fcfy = fin.fcfYield
  const mcap = fin.marketCap

  // ── Profile flags ───────────────────────────────────────────────────────────
  const isHighROIC    = roic != null && roic > 15
  const isGreatROIC   = roic != null && roic > 25
  const hasWideMoat   = gm   != null && gm > 40
  const isGrowing     = revGrowth != null && revGrowth > 3
  const isFastGrowing = revGrowth != null && revGrowth > 12
  const isUndervalued = mos  != null && mos > 20
  const isFairValued  = mos  != null && mos > 5 && mos <= 20
  const isOvervalued  = mos  != null && mos < 0
  const hasLowDebt    = debtToEbitda != null && debtToEbitda < 1.5
  const hasHighDebt   = debtToEbitda != null && debtToEbitda > 4
  const hasFCF        = fcfy != null && fcfy > 3
  const isCheapPE     = pe   != null && pe < 12
  const isMidPE       = pe   != null && pe >= 12 && pe <= 20
  const isExpensivePE = pe   != null && pe > 25
  const pea           = isPEAEligible(ticker)
  const hasData       = pe != null || roic != null || gm != null

  // ── Valuation class ─────────────────────────────────────────────────────────
  let valuationClass: Analysis['valuationClass'] = 'Données insuffisantes'
  if (mos != null) {
    if (mos > 20)           valuationClass = 'Décote probable'
    else if (mos > 0)       valuationClass = 'Valorisation neutre'
    else                    valuationClass = 'Valorisation élevée'
  } else if (isCheapPE)     valuationClass = 'Décote probable'
  else if (isExpensivePE)   valuationClass = 'Valorisation élevée'
  else if (isMidPE)         valuationClass = 'Valorisation neutre'

  // ── Thesis ──────────────────────────────────────────────────────────────────
  const thesisParts: string[] = []

  if (isGreatROIC && hasWideMoat) {
    thesisParts.push(
      `${name} affiche un ROIC de ${fmt(roic)}% et une marge brute de ${fmt(gm)}%, deux indicateurs d'un avantage compétitif structurel rare dans ${sec}.`
    )
  } else if (isHighROIC) {
    thesisParts.push(
      `Avec un ROIC de ${fmt(roic)}%, ${name} démontre une capacité à créer de la valeur actionnariale au-dessus de son coût du capital.`
    )
  } else if (hasWideMoat) {
    thesisParts.push(
      `La marge brute de ${fmt(gm)}% de ${name} reflète un pricing power significatif, caractéristique d'un moat défensif dans ${sec}.`
    )
  } else {
    thesisParts.push(
      `${name} est un acteur établi dans ${sec} (${cty}) dont la valorisation mérite une analyse approfondie au regard de ses fondamentaux.`
    )
  }

  if (isFastGrowing) {
    thesisParts.push(
      `La croissance du chiffre d'affaires de ${fmt(revGrowth)}%/an sur 3 ans positionne l'entreprise comme un compounder crédible dans un contexte de marché hésitant.`
    )
  } else if (isGrowing) {
    thesisParts.push(
      `La croissance organique de ${fmt(revGrowth)}%/an, modeste mais régulière, offre une trajectoire de résultats prévisible propice à un travail d'actualisation des flux.`
    )
  }

  if (isUndervalued) {
    thesisParts.push(
      `À un cours impliquant une marge de sécurité de ${fmt(mos)}% par rapport à notre estimation de valeur intrinsèque, le ratio rendement/risque semble asymétrique en faveur de l'acheteur.`
    )
  } else if (isCheapPE) {
    thesisParts.push(
      `Un P/E de ${fmt(pe, 1)}x constitue une entrée potentiellement bon marché si la qualité du business est préservée sur les prochains exercices.`
    )
  } else if (isOvervalued) {
    thesisParts.push(
      `La valorisation actuelle (MoS ${fmt(mos)}%) exige une exécution opérationnelle parfaite pour justifier le multiple payé — la thèse repose donc sur la persistance d'une croissance soutenue.`
    )
  }

  if (hasFCF && hasLowDebt) {
    thesisParts.push(
      `Un FCF yield de ${fmt(fcfy)}% combiné à un bilan sain (Debt/EBITDA: ${fmt(debtToEbitda)}x) offre une flexibilité financière pour rachats d'actions, dividendes ou acquisitions bolt-on.`
    )
  } else if (hasFCF) {
    thesisParts.push(
      `Malgré un levier de ${fmt(debtToEbitda)}x, le FCF yield de ${fmt(fcfy)}% assure un service de la dette confortable et une capacité de désendettement.`
    )
  }

  const thesis = thesisParts.join(' ')

  // ── Catalysts ───────────────────────────────────────────────────────────────
  const catalysts: string[] = []

  if (isUndervalued || isCheapPE)
    catalysts.push(`Réduction du gap de valorisation via une ré-évaluation du marché (convergence vers la valeur intrinsèque estimée)`)

  if (isFastGrowing || isGrowing)
    catalysts.push(`Accélération des résultats trimestriels au-dessus du consensus, forçant une révision des estimations de bénéfices à la hausse`)

  if (isHighROIC)
    catalysts.push(`Programme de rachats d'actions accretif : à ${fmt(roic)}% de ROIC, chaque euro réinvesti ou rendu aux actionnaires crée de la valeur`)

  if (hasHighDebt)
    catalysts.push(`Désendettement significatif réduisant le coût du capital et libérant de la capacité bilancielle`)

  if (hasFCF)
    catalysts.push(`Progression du dividende ou initiation d'un programme de rachat soutenu par un FCF yield de ${fmt(fcfy)}%`)

  catalysts.push(`Regain d'intérêt institutionnel pour les valeurs ${sec} dans un contexte de rotation sectorielle`)

  if (cty !== 'États-Unis')
    catalysts.push(`Réduction de la décote géographique : les valeurs ${cty} traitent historiquement avec une décote de 10-15% vs leurs homologues américaines`)

  // ── Valuation text ──────────────────────────────────────────────────────────
  const valParts: string[] = []

  if (pe != null)
    valParts.push(`Le P/E de ${fmt(pe, 1)}x ${isCheapPE ? 'est inférieur à la médiane historique du secteur (~18-22x)' : isMidPE ? 'se situe dans la fourchette de valorisation normale du secteur' : 'représente une prime significative par rapport aux pairs'}.`)

  if (mos != null)
    valParts.push(`Notre modèle DCF / multiple-of-earnings indique une valeur intrinsèque impliquant une marge de sécurité de ${fmt(mos)}% — ${isUndervalued ? 'une décote attractive pour un investisseur value' : isFairValued ? 'une valorisation proche de la juste valeur' : 'insuffisante pour un achat sans risque de perte de capital'}.`)

  if (fin.evEbit != null)
    valParts.push(`L'EV/EBIT de ${fmt(fin.evEbit)}x ${fin.evEbit < 15 ? 'suggère une décote opérationnelle intéressante' : fin.evEbit > 25 ? 'intègre déjà des attentes de croissance élevées' : 'reflète une valorisation opérationnelle raisonnable'}.`)

  const valuation = valParts.join(' ')

  // ── Risks ───────────────────────────────────────────────────────────────────
  const risks: string[] = []

  if (isExpensivePE || isOvervalued)
    risks.push(`Risque de de-rating : toute déception sur les résultats peut entraîner une compression multiple violente depuis des niveaux de valorisation élevés`)

  if (hasHighDebt)
    risks.push(`Risque de bilan : un Debt/EBITDA de ${fmt(debtToEbitda)}x réduit la flexibilité financière et expose l'entreprise à un choc de taux ou de liquidité`)

  if (!isHighROIC)
    risks.push(`Faiblesse de la rentabilité sur capitaux investis : un ROIC bas (${fmt(roic)}%) limite la capacité à créer de la valeur à long terme`)

  if (!isGrowing)
    risks.push(`Stagnation du chiffre d'affaires : sans croissance organique, la thèse repose uniquement sur la compression de la valorisation`)

  risks.push(`Risque macroéconomique : hausse des taux et ralentissement économique affectent particulièrement les valorisations et la demande dans ${sec}`)
  risks.push(`Risque de disruption sectorielle : transformation technologique ou réglementaire pouvant éroder le positionnement concurrentiel`)
  risks.push(`Risque de change : pour un groupe ${cty !== 'États-Unis' ? `coté en devise locale mais exposé au dollar` : `US exposé aux fluctuations EUR/USD`}`)

  if (risks.length > 6) risks.splice(6)

  // ── Challenge ───────────────────────────────────────────────────────────────
  const implicitAssumptions = [
    `Les marges actuelles (${fmt(om)}% opérationnel) sont supposées stables ou en progression, sans pression concurrentielle ou réglementaire accrue`,
    isGrowing
      ? `La croissance historique de ${fmt(revGrowth)}%/an est extrapolée sur les 5-10 prochaines années sans friction de marché`
      : `L'absence de croissance n'est pas considérée comme un signe structurel de maturité ou de déclin`,
    `Le management actuel continuera à allouer le capital de façon disciplinée et à maintenir le niveau de ROIC`,
    `Les multiples de valorisation historiques constituent une référence valide dans un contexte de taux structurellement différent de la décennie 2010-2020`,
  ]

  const weakPoints = [
    `Analyse entièrement rétrospective (données historiques) sans intégration de la guidance forward ou des estimations consensus`,
    `La valeur intrinsèque est calculée via un modèle simplifié (DCF/PE) sensible aux hypothèses de croissance et de taux d'actualisation`,
    !isHighROIC
      ? `Un ROIC de ${fmt(roic)}% ne justifie pas de prime de qualité significative, fragilisant l'argumentaire de "compounder"`
      : `La persistance d'un ROIC élevé (${fmt(roic)}%) dans un environnement concurrentiel intensifié n'est pas garantie`,
    `Absence d'analyse qualitative des avantages concurrentiels (brevets, réseau, coûts de switching) qui fondent la durabilité des marges`,
  ]

  const hiddenRisks = [
    `Risque de goodwill : des acquisitions passées peuvent masquer une rentabilité organique plus faible qu'apparente`,
    `Risque de normalisation des marges : les marges actuelles peuvent refléter un pic de cycle plutôt qu'un niveau structurel`,
    hasHighDebt
      ? `Risque de covenant bancaire : en cas de détérioration des résultats, les contraintes de dette peuvent forcer des cessions d'actifs défavorables`
      : `Risque de mauvaise allocation du capital : un bilan sain peut inciter à des acquisitions sur-payées qui détruisent de la valeur`,
  ]

  const marketingArgs = [
    isHighROIC
      ? `Le ROIC élevé est souvent mis en avant sans distinguer si ce rendement est réplicable sur les nouveaux capitaux investis`
      : `La thèse de "retournement" ou de "restructuration" sous-estime la durée et le coût opérationnel de tels programmes`,
    hasWideMoat
      ? `Le "pricing power" mis en avant peut s'éroder rapidement face à des alternatives low-cost ou une récession consommateur`
      : `L'appartenance à un secteur "défensif" ou "de croissance" masque parfois des fondamentaux business médiocres`,
    `La comparaison aux pairs est souvent sélective — les concurrents les plus performants sont choisis comme référence plutôt que la médiane sectorielle`,
  ]

  const whyBadIdea = [
    isOvervalued || isExpensivePE
      ? `Le marché valorise déjà ${name} avec un optimisme significatif (P/E ${fmt(pe, 1)}x, MoS ${fmt(mos)}%) : la marge d'erreur pour l'investisseur est quasi nulle.`
      : `Même avec une valorisation apparemment raisonnable, ${name} opère dans ${sec}, un secteur exposé à des cycles imprévisibles.`,
    `La thèse repose sur des métriques rétrospectives qui peuvent masquer une dégradation en cours : un ralentissement de croissance, une pression sur les marges ou une détérioration du bilan n'apparaîtra dans les chiffres que trimestres plus tard.`,
    hasHighDebt
      ? `Un endettement de ${fmt(debtToEbitda)}x l'EBITDA réduit drastiquement la capacité de l'entreprise à résister à un choc — économique, sectoriel ou concurrentiel.`
      : `La solidité apparente du bilan ne protège pas contre un risque de disruption rapide du modèle économique.`,
    `Enfin, le biais de confirmation est particulièrement fort sur ce type de valeur : une fois convaincu par les métriques historiques, l'investisseur tend à ignorer les signaux d'alerte forward.`,
  ].join(' ')

  // ── Scoring ─────────────────────────────────────────────────────────────────
  // Discount /30
  let discount = 10 // base
  if (isUndervalued) discount = 25 + (mos != null ? Math.min(5, mos / 10) : 0)
  else if (isFairValued) discount = 15
  else if (isOvervalued) discount = 5
  else if (isCheapPE) discount = 20
  else if (isExpensivePE) discount = 6
  discount = Math.round(Math.min(30, discount))

  // Catalyst /25
  let catalyst = 8
  if (isFastGrowing && isHighROIC) catalyst = 22
  else if (isFastGrowing || (isHighROIC && hasFCF)) catalyst = 18
  else if (isGrowing || isHighROIC) catalyst = 14
  catalyst = Math.round(Math.min(25, catalyst))

  // Business quality /15
  let businessQuality = 5
  if (isGreatROIC && hasWideMoat) businessQuality = 14
  else if (isHighROIC && hasWideMoat) businessQuality = 12
  else if (isHighROIC || hasWideMoat) businessQuality = 9
  if (hasFCF) businessQuality = Math.min(15, businessQuality + 1)
  businessQuality = Math.round(businessQuality)

  // Thesis solidity /15
  const dataPoints = [pe, roic, gm, fcfy, revGrowth, debtToEbitda, mos].filter(x => x != null).length
  const thesisSolidity = Math.round(Math.min(15, 5 + dataPoints * 1.5))

  // Accessibility /10
  let accessibility = 5
  if (pea) accessibility = 9
  if (ticker.endsWith('.PA')) accessibility = 10
  if (mcap != null && mcap > 5e9) accessibility = Math.min(10, accessibility + 1)

  // Source quality /5
  const sourceQuality = Math.round(Math.min(5, 1 + dataPoints * 0.6))

  const total = discount + catalyst + businessQuality + thesisSolidity + accessibility + sourceQuality

  // ── Conviction ──────────────────────────────────────────────────────────────
  let convictionLevel: Analysis['conviction']['level'] = 'Faible'
  let convictionReason = ''

  if (total >= 70 && (isUndervalued || isCheapPE) && (isHighROIC || hasWideMoat)) {
    convictionLevel = 'Élevée'
    convictionReason = `Le dossier combine une décote quantifiable (MoS ${fmt(mos)}%), une qualité business élevée (ROIC ${fmt(roic)}%) et des catalyseurs identifiables. Le ratio rendement/risque est asymétrique. Conviction soutenue par ${dataPoints}/7 métriques disponibles.`
  } else if (total >= 50 && !isOvervalued) {
    convictionLevel = 'Moyenne'
    convictionReason = `Des éléments positifs existent (${isHighROIC ? `ROIC ${fmt(roic)}%` : gm != null ? `GM ${fmt(gm)}%` : `croissance ${fmt(revGrowth)}%`}) mais la thèse présente des zones grises — valorisation ${valuationClass.toLowerCase()} et données partiellement disponibles. Une position sizing réduite est appropriée.`
  } else {
    convictionLevel = 'Faible'
    convictionReason = `${isOvervalued ? `La valorisation élevée (MoS ${fmt(mos)}%) laisse peu de marge de sécurité.` : !isHighROIC ? `La rentabilité du capital (ROIC ${fmt(roic)}%) est insuffisante pour justifier une prime.` : `Les données disponibles ne permettent pas de construire une thèse solide.`} Conviction insuffisante pour un dimensionnement significatif.`
  }

  return {
    thesis,
    catalysts: catalysts.slice(0, 5),
    valuation,
    valuationClass,
    risks,
    implicitAssumptions,
    weakPoints,
    hiddenRisks,
    marketingArgs,
    whyBadIdea,
    scoring: { discount, catalyst, businessQuality, thesisSolidity, accessibility, sourceQuality, total },
    conviction: { level: convictionLevel, reason: convictionReason },
  }
}
