export interface CareerExperience {
  id: string
  role: string
  company: string
  period: string
  description: string
}

export interface CareerProject {
  id: string
  name: string
  description: string
  technologies: string[]
}

export interface CareerProfile {
  currentRole: string
  status: string
  skills: string[]
  technologies: string[]
  experience: CareerExperience[]
  projects: CareerProject[]
  education: string[]
  certifications: string[]
  achievements: string[]
}

export interface CareerTarget {
  targetRole: string
  targetIndustry: string
  targetDomain: string
  targetSeniority: string
  targetSkills: string[]
  targetTechnologies: string[]
  targetResponsibilities: string[]
  targetLocation: string
  naturalLanguageInput: string
  normalizedRole: string
  coreSkills: string[]
  technologies: string[]
  domain: string
  progress: number
}

export interface ResumeExperience {
  id: string
  role: string
  company: string
  period: string
  bullets: string[]
}

export interface ResumeProject {
  id: string
  name: string
  description: string
  technologies: string[]
}

export interface ResumeSnapshot {
  fileName: string
  updatedAt: string
  score: number
  skills: string[]
  experience: ResumeExperience[]
  projects: ResumeProject[]
  education: string[]
  certifications: string[]
  strengths: string[]
  weaknesses: string[]
  missingEvidence: string[]
}

export interface CareerService {
  getProfile(): Promise<CareerProfile>
  getTarget(): Promise<CareerTarget>
  updateTarget(target: CareerTarget): Promise<CareerTarget>
  normalizeTarget(input: string): Promise<Pick<CareerTarget, 'normalizedRole' | 'coreSkills' | 'technologies' | 'domain'>>
  getResume(): Promise<ResumeSnapshot>
  analyzeResume(): Promise<void>
  improveResume(): Promise<void>
}
