import type { CareerAnalyticsData, CareerAnalyticsService } from '../api/analyticsTypes'

// Demo-only adapter. Replace this implementation with a backend API adapter when
// historical user data becomes available. Pages/components should never depend on this data directly.
const demoAnalytics: CareerAnalyticsData = {
  isDemo: true,
  generatedAt: '2026-08-19T00:00:00.000Z',
  careerTarget: {
    role: 'Machine Learning Engineer',
    progress: 76,
  },
  careerAlignmentHistory: [
    { label: 'Apr', value: 72 },
    { label: 'May', value: 77 },
    { label: 'Jun', value: 81 },
    { label: 'Jul', value: 85 },
    { label: 'Aug', value: 88 },
  ],
  opportunityComparison: [
    { label: 'ML Intern', opportunityFit: 84, careerAlignment: 91 },
    { label: 'Data Science Intern', opportunityFit: 79, careerAlignment: 82 },
    { label: 'AI Research Intern', opportunityFit: 71, careerAlignment: 94 },
    { label: 'Backend Intern', opportunityFit: 68, careerAlignment: 61 },
  ],
  interviewReadiness: [
    { label: 'Jun', value: 61 },
    { label: 'Jul', value: 68 },
    { label: 'Aug', value: 76 },
  ],
  skillGrowth: [
    { skill: 'Python', previousLevel: 72, currentLevel: 88 },
    { skill: 'Machine Learning', previousLevel: 58, currentLevel: 81 },
    { skill: 'SQL', previousLevel: 64, currentLevel: 76 },
    { skill: 'Docker', previousLevel: 34, currentLevel: 52 },
  ],
  topSkillGaps: [
    {
      skill: 'Kubernetes',
      priority: 'Critical',
      currentEvidence: 'Not detected in current profile',
      requiredLevel: 'Working knowledge',
      gap: 'No confirmed evidence of container orchestration experience',
    },
    {
      skill: 'MLOps',
      priority: 'Important',
      currentEvidence: 'Limited project evidence',
      requiredLevel: 'Intermediate',
      gap: 'Limited evidence of production ML lifecycle practices',
    },
    {
      skill: 'Cloud ML',
      priority: 'Important',
      currentEvidence: 'Course-level exposure',
      requiredLevel: 'Working knowledge',
      gap: 'Limited hands-on evidence with managed ML platforms',
    },
  ],
}

const clone = <T,>(value: T): T => structuredClone(value)

export const analyticsService: CareerAnalyticsService = {
  async getAnalytics() {
    return clone(demoAnalytics)
  },
}
