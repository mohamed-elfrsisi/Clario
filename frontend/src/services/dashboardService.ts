import type { DashboardOverview } from '../api/types'

/**
 * Demo adapter for the dashboard.
 *
 * Keep all fallback/demo values here, never inside React components.
 * When the backend dashboard endpoint is available, replace the API
 * implementation without changing DashboardPage.
 */
const demoDashboardOverview: DashboardOverview = {
  metrics: [
    {
      label: 'Career Score',
      value: 82,
      suffix: '/100',
      description: 'Overall career readiness',
      trend: '+6 this month',
    },
    {
      label: 'Resume Score',
      value: 88,
      suffix: '/100',
      description: 'ATS and content quality',
      trend: '+4 this month',
    },
    {
      label: 'Average Opportunity Fit',
      value: 79,
      suffix: '/100',
      description: 'Across analyzed opportunities',
      trend: '+8 this month',
    },
    {
      label: 'Interview Readiness',
      value: 73,
      suffix: '/100',
      description: 'Skills and interview preparation',
      trend: '+5 this month',
    },
  ],
  target: {
    role: 'Machine Learning Engineer',
    progress: 76,
  },
  currentOpportunity: {
    role: 'Machine Learning Intern',
    company: 'NVIDIA',
    opportunityFit: 84,
    careerAlignment: 91,
  },
  intelligence: [
    {
      label: 'Technical Skills',
      value: 84,
      description: 'Strong foundation for your target role',
    },
    {
      label: 'Experience',
      value: 68,
      description: 'More applied ML experience would strengthen your profile',
    },
    {
      label: 'Resume Quality',
      value: 88,
      description: 'Clear structure with good ATS coverage',
    },
    {
      label: 'Opportunity Fit',
      value: 84,
      description: 'Current opportunity matches most of your profile',
    },
    {
      label: 'Interview Readiness',
      value: 73,
      description: 'Technical interview practice is the next priority',
    },
  ],
}

export interface DashboardService {
  getOverview(): Promise<DashboardOverview>
}

async function getBackendOverview(): Promise<DashboardOverview> {
  const response = await fetch('/api/dashboard/overview', {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Dashboard API unavailable: ${response.status}`)
  }

  return response.json() as Promise<DashboardOverview>
}

export const dashboardService: DashboardService = {
  async getOverview() {
    try {
      return await getBackendOverview()
    } catch {
      return demoDashboardOverview
    }
  },
}
