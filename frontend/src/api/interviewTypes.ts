export type InterviewDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'
export type InterviewCategory = 'Technical' | 'Role-specific' | 'Resume-based' | 'Behavioral' | 'Skill-gap' | 'Situational'
export type InterviewPhase = 'setup' | 'session' | 'completed'

export interface InterviewSetup {
  role: string
  company: string
  opportunityId: string
  questionCount: number
  difficulty: InterviewDifficulty
  categories: InterviewCategory[]
}

export interface InterviewContext {
  candidateProfile: string
  opportunity: string
  careerTarget: string
  skillGaps: string[]
}

export interface InterviewQuestion {
  id: string
  number: number
  total: number
  category: InterviewCategory
  prompt: string
}

export interface SubmittedAnswer {
  questionId: string
  answer: string
}

export interface AnswerSubmissionResult {
  accepted: boolean
  nextQuestion: InterviewQuestion | null
  completed: boolean
  message?: string
}

export interface InterviewScore {
  overall: number
  technicalKnowledge: number
  problemSolving: number
  communication: number
  roleRelevance: number
  answerDepth: number
  completeness: number
}

export interface InterviewResults {
  interviewId: string
  role: string
  company: string
  completedAt: string
  score: InterviewScore
  strengths: string[]
  weaknesses: string[]
  preparationPriorities: string[]
}

export interface InterviewSummary {
  interviewId: string
  role: string
  company: string
  completedAt: string
  overallScore: number
  questionCount: number
  difficulty: InterviewDifficulty
  categories: InterviewCategory[]
}

export interface InterviewService {
  listInterviews(): Promise<InterviewSummary[]>
  createInterview(setup: InterviewSetup): Promise<{ interviewId: string; firstQuestion: InterviewQuestion }>
  getQuestion(interviewId: string): Promise<InterviewQuestion | null>
  submitAnswer(interviewId: string, answer: SubmittedAnswer): Promise<AnswerSubmissionResult>
  getResults(interviewId: string): Promise<InterviewResults>
}
