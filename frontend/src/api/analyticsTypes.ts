export interface AnalyticsPoint {
  label: string
  value: number
}

export interface OpportunityComparisonPoint {
  label: string
  opportunityFit: number
  careerAlignment: number
}

export interface SkillGrowthPoint {
  skill: string
  currentLevel: number
  previousLevel: number
}

export interface SkillGapItem {
  skill: string
  priority: 'Critical' | 'Important' | 'Optional'
  currentEvidence: string
  requiredLevel: string
  gap: string
}

export interface CareerAnalyticsData {
  isDemo: boolean
  generatedAt: string
  careerTarget: {
    role: string
    progress: number
  }
  careerAlignmentHistory: AnalyticsPoint[]
  opportunityComparison: OpportunityComparisonPoint[]
  interviewReadiness: AnalyticsPoint[]
  skillGrowth: SkillGrowthPoint[]
  topSkillGaps: SkillGapItem[]
}

export interface CareerAnalyticsService {
  getAnalytics(): Promise<CareerAnalyticsData>
}
