export function calculateDCF(fcf: number, growthRate=0.07, discountRate=0.10, terminalGrowthRate=0.025, years=10): number {
  let totalPV=0, currentFCF=fcf
  for (let i=1;i<=years;i++) { currentFCF*=(1+growthRate); totalPV+=currentFCF/Math.pow(1+discountRate,i) }
  const tv=currentFCF*(1+terminalGrowthRate)/(discountRate-terminalGrowthRate)
  return totalPV+tv/Math.pow(1+discountRate,years)
}
export function estimateIntrinsicValue(fcfPerShare: number|null, pe: number|null): number|null {
  if (fcfPerShare && fcfPerShare>0) return calculateDCF(fcfPerShare)
  if (pe && pe>0) return pe * Math.min(pe, 25) * 0.8
  return null
}
