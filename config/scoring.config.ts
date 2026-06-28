export interface ScoringConfig {
  businessQuality: {
    maxPoints: number
    roicThreshold: number
    revenueCAGRThreshold: number
    grossMarginVarianceMax: number
    guidanceScoreMin: number
  }
  financialStrength: {
    maxPoints: number
    netDebtEbitdaMax: number
    interestCoverageMin: number
    dilutionAnnualMax: number
  }
  valuation: {
    maxPoints: number
    mosSuperior: number
    mosGood: number
    evEbitSectorMedians: Record<string, number>
  }
  longTermVisibility: {
    maxPoints: number
    nonCyclicalSectors: string[]
    roicStabilityMaxVariance: number
    moatRoicThreshold: number
    moatConsecutiveYears: number
  }
}

export const SCORING_CONFIG: ScoringConfig = {
  businessQuality: {
    maxPoints: 30,
    roicThreshold: 15,
    revenueCAGRThreshold: 5,
    grossMarginVarianceMax: 3,
    guidanceScoreMin: 4,
  },
  financialStrength: {
    maxPoints: 25,
    netDebtEbitdaMax: 2,
    interestCoverageMin: 5,
    dilutionAnnualMax: 2,
  },
  valuation: {
    maxPoints: 30,
    mosSuperior: 30,
    mosGood: 15,
    evEbitSectorMedians: {
      'Technology': 25,
      'Healthcare': 20,
      'Consumer Cyclical': 15,
      'Consumer Defensive': 18,
      'Financial Services': 12,
      'Industrials': 16,
      'Energy': 10,
      'Basic Materials': 12,
      'Real Estate': 18,
      'Utilities': 14,
      'Communication Services': 16,
    },
  },
  longTermVisibility: {
    maxPoints: 15,
    nonCyclicalSectors: [
      'Consumer Defensive', 'Healthcare', 'Utilities', 'Technology',
    ],
    roicStabilityMaxVariance: 5,
    moatRoicThreshold: 20,
    moatConsecutiveYears: 3,
  },
}
