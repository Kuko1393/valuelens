export interface DCFScenario {
  growthRate: number
  terminalGrowthRate: number
  discountRate: number
  intrinsicValue: number | null
  marginOfSafety: number | null
}

export interface DCFResult {
  bear: DCFScenario
  base: DCFScenario
  bull: DCFScenario
}

export function calculateDCF(
  fcf: number,
  growthRate = 0.07,
  discountRate = 0.10,
  terminalGrowthRate = 0.025,
  years = 10
): number {
  if (fcf <= 0 || fcf > 10000) return 0
  const clampedGrowth = Math.max(-0.05, growthRate)
  const clampedTerminal = Math.max(0, terminalGrowthRate)

  if (discountRate <= clampedTerminal) return 0

  let totalPV = 0
  let currentFCF = fcf
  for (let i = 1; i <= years; i++) {
    currentFCF *= 1 + clampedGrowth
    totalPV += currentFCF / Math.pow(1 + discountRate, i)
  }
  const tv = (currentFCF * (1 + clampedTerminal)) / (discountRate - clampedTerminal)
  return totalPV + tv / Math.pow(1 + discountRate, years)
}

function computeMoS(iv: number | null, price: number | null): number | null {
  if (!iv || iv <= 0 || !price || price <= 0) return null
  const mos = ((iv - price) / iv) * 100
  if (mos < -200 || mos > 95) return null
  return mos
}

export function estimateIntrinsicValue(
  fcfPerShare: number | null,
  pe: number | null
): number | null {
  if (fcfPerShare != null && fcfPerShare > 0.01 && fcfPerShare < 500) {
    const iv = calculateDCF(fcfPerShare)
    if (iv <= 0) return null
    return iv
  }
  return null
}

export function estimateDCFScenarios(
  fcfPerShare: number | null,
  price: number | null
): DCFResult | null {
  if (fcfPerShare == null || fcfPerShare <= 0.01 || fcfPerShare >= 500) return null

  const scenarios = {
    bear:  { growth: 0.03, terminal: 0.01, discount: 0.12 },
    base:  { growth: 0.07, terminal: 0.025, discount: 0.10 },
    bull:  { growth: 0.12, terminal: 0.03, discount: 0.09 },
  }

  function buildScenario(s: typeof scenarios.base): DCFScenario {
    const rawIV = calculateDCF(fcfPerShare!, s.growth, s.discount, s.terminal)
    const iv = rawIV <= 0 ? null : (price && rawIV > price * 30 ? null : rawIV)
    return {
      growthRate: s.growth,
      terminalGrowthRate: s.terminal,
      discountRate: s.discount,
      intrinsicValue: iv,
      marginOfSafety: computeMoS(iv, price),
    }
  }

  return {
    bear: buildScenario(scenarios.bear),
    base: buildScenario(scenarios.base),
    bull: buildScenario(scenarios.bull),
  }
}
