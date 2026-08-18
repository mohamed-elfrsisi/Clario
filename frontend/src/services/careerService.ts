import type {
  CareerProfile,
  CareerService,
  CareerTarget,
  ResumeSnapshot,
} from '../api/careerTypes'

/**
 * Demo adapter for career modules.
 *
 * Keep product demo data in this service layer only. Replace these adapter
 * methods with backend calls when the career APIs are available; page
 * components should not need to change.
 */
const demoProfile: CareerProfile = {
  currentRole: 'Computer Science Student',
  status: 'Student · Early Career',
  skills: ['Python', 'Machine Learning', 'SQL', 'Data Structures', 'Problem Solving'],
  technologies: ['PyTorch', 'TensorFlow', 'React', 'Git', 'Docker'],
  experience: [
    {
      id: 'exp-1',
      role: 'AI / ML Trainee',
      company: 'Training Program',
      period: '2026',
      description: 'Built applied machine learning exercises and web integrations while developing production-oriented engineering skills.',
    },
  ],
  projects: [
    {
      id: 'project-1',
      name: 'Clario',
      description: 'Career intelligence platform for resume analysis, opportunity fit, and career guidance.',
      technologies: ['React', 'TypeScript', 'Python', 'Machine Learning'],
    },
    {
      id: 'project-2',
      name: 'SAVEX Wallet',
      description: 'Student budgeting application focused on expense tracking and financial awareness.',
      technologies: ['Flutter', 'Firebase', 'SQLite'],
    },
  ],
  education: ['B.Sc. Computer Science · Tanta University · Expected 2028'],
  certifications: ['HP Life — AI for Beginners', 'McKinsey Forward Program', 'Microsoft Learning'],
  achievements: ['NASA Space Apps Challenge participant', 'Selected for technical development programs'],
}

const demoTarget: CareerTarget = {
  targetRole: 'Machine Learning Engineer',
  targetIndustry: 'Technology',
  targetDomain: 'Artificial Intelligence',
  targetSeniority: 'Entry Level',
  targetSkills: ['Python', 'Machine Learning', 'Deep Learning', 'SQL', 'PyTorch'],
  targetTechnologies: ['PyTorch', 'TensorFlow', 'Docker'],
  targetResponsibilities: [
    'Build and evaluate machine learning models',
    'Prepare and analyze training data',
    'Deploy and monitor ML solutions',
  ],
  targetLocation: 'Remote / Egypt',
  naturalLanguageInput: 'I want to become a Machine Learning Engineer.',
  normalizedRole: 'Machine Learning Engineer',
  coreSkills: ['Python', 'Machine Learning', 'Deep Learning', 'SQL', 'PyTorch'],
  technologies: ['PyTorch', 'TensorFlow', 'Docker'],
  domain: 'Artificial Intelligence',
  progress: 76,
}

const demoResume: ResumeSnapshot = {
  fileName: 'Mohamed_Elfarsisi_Resume.pdf',
  updatedAt: 'Updated 2 days ago',
  score: 88,
  skills: ['Python', 'Machine Learning', 'SQL', 'C++', 'React', 'Git', 'Docker'],
  experience: [
    {
      id: 'resume-exp-1',
      role: 'AI / ML Trainee',
      company: 'Training Program',
      period: '2026',
      bullets: [
        'Built machine learning exercises and applied data preparation techniques.',
        'Developed web interfaces and integrated technical workflows across projects.',
      ],
    },
  ],
  projects: [
    {
      id: 'resume-project-1',
      name: 'Clario',
      description: 'Career intelligence platform focused on resume and opportunity analysis.',
      technologies: ['React', 'TypeScript', 'Python', 'Machine Learning'],
    },
  ],
  education: ['B.Sc. Computer Science · Tanta University'],
  certifications: ['HP Life — AI for Beginners', 'McKinsey Forward Program'],
  strengths: [
    'Clear technical project evidence',
    'Strong alignment with machine learning fundamentals',
    'Good technology coverage for an early-career profile',
  ],
  weaknesses: [
    'Limited quantified professional impact',
    'More production ML experience would strengthen the profile',
  ],
  missingEvidence: [
    'Add measurable outcomes to project bullets',
    'Document model evaluation results',
    'Add deployment or production-scale evidence',
  ],
}

const clone = <T,>(value: T): T => structuredClone(value)

async function backendUnavailable<T>(demo: T): Promise<T> {
  return clone(demo)
}

export const careerService: CareerService = {
  getProfile: () => backendUnavailable(demoProfile),
  getTarget: () => backendUnavailable(demoTarget),
  updateTarget: async (target) => clone(target),
  getResume: () => backendUnavailable(demoResume),

  async normalizeTarget(input) {
    const normalized = input.trim().toLowerCase().includes('machine learning engineer')
      ? demoTarget
      : {
          normalizedRole: input.trim() || 'Machine Learning Engineer',
          coreSkills: demoTarget.coreSkills,
          technologies: demoTarget.technologies,
          domain: demoTarget.domain,
        }

    return clone({
      normalizedRole: normalized.normalizedRole,
      coreSkills: normalized.coreSkills,
      technologies: normalized.technologies,
      domain: normalized.domain,
    })
  },

  async analyzeResume() {
    // UI-only action until the analysis endpoint is available.
  },

  async improveResume() {
    // UI-only action until the improvement endpoint is available.
  },
}
