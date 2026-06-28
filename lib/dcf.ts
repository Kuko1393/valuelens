export function calculateDCF(
  fcf: number,
  growthRate = 0.07,
  discountRate = 0.10,
  terminalGrowthRate = 0.025,
  years = 10
): number {
  if (fcf <= 0 || fcf > 10000) return 0

  let totalPV = 0
  let currentFCF = fcf
  for (let i = 1; i <= years; i++) {
    currentFCF *= 1 + growthRate
    totalPV += currentFCF / Math.pow(1 + discountRate, i)
  }
  const tv = (currentFCF * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate)
  return totalPV + tv / Math.pow(1 + discountRate, years)
}

export function estimateIntrinsicValue(
  fcfPerShare: number | null,
  pe: number | null
): number | null {
  if (fcfPerShare && fcfPerShare > 0.01 && fcfPerShare < 500) {
    return calculateDCF(fcfPerShare)
  }
  return null
}
