import type {
  InterviewCategory,
  InterviewDifficulty,
  InterviewQuestion,
  InterviewResults,
  InterviewService,
  InterviewSetup,
  InterviewSummary,
  SubmittedAnswer,
} from '../api/interviewTypes'

interface MockInterviewState {
  id: string
  setup: InterviewSetup
  currentIndex: number
  questions: InterviewQuestion[]
  answers: SubmittedAnswer[]
}

const questionBank: Record<InterviewCategory, string[]> = {
  Technical: [
    'Explain how you would evaluate a classification model beyond accuracy.',
    'How would you prevent data leakage when preparing a machine learning dataset?',
    'Walk through how you would debug a model whose validation performance suddenly drops.',
  ],
  'Role-specific': [
    'Describe a machine learning system you would be comfortable owning end to end.',
    'How would you choose a model for a new machine learning product when requirements are still changing?',
    'What would you monitor after deploying a machine learning model?',
  ],
  'Resume-based': [
    'Tell me about the most technically challenging project on your resume.',
    'Pick one project from your resume and explain the engineering trade-offs you made.',
    'What did you personally learn from your recent technical work?',
  ],
  Behavioral: [
    'Tell me about a time you had to learn a difficult technical concept quickly.',
    'Describe a time you received feedback that changed how you worked.',
    'Tell me about a project where you had to work through ambiguity.',
  ],
  'Skill-gap': [
    'Your target path includes MLOps. What would you learn first to become effective in production ML?',
    'How would you approach gaining production experience when your current projects are mostly academic?',
    'What evidence would you add to your profile to demonstrate stronger deployment skills?',
  ],
  Situational: [
    'A model performs well offline but poorly in production. What would you investigate first?',
    'A stakeholder asks for a model before the data quality is understood. How would you respond?',
    'You have one week to improve a model and limited compute. How would you prioritize your work?',
  ],
}

const demoSummaries: InterviewSummary[] = []
const activeInterviews = new Map<string, MockInterviewState>()

const clone = <T,>(value: T): T => structuredClone(value)

function buildQuestions(setup: InterviewSetup): InterviewQuestion[] {
  const categories: InterviewCategory[] = setup.categories.length > 0 ? setup.categories : ['Role-specific']
  const questions: InterviewQuestion[] = []

  // This is intentionally a deterministic mock adapter. The real backend can return
  // an entirely different next question after each answer without changing the UI.
  for (let i = 0; i < setup.questionCount; i += 1) {
    const category = categories[i % categories.length]
    const prompts = questionBank[category]
    const prompt = prompts[i % prompts.length]
    questions.push({
      id: `q-${i + 1}-${category.toLowerCase().replace(/[^a-z]+/g, '-')}`,
      number: i + 1,
      total: setup.questionCount,
      category,
      prompt,
    })
  }

  return questions
}

const createInterviewId = () => `interview-${Date.now()}`

export const interviewService: InterviewService = {
  async listInterviews() {
    return clone(demoSummaries)
  },

  async createInterview(setup) {
    const id = createInterviewId()
    const questions = buildQuestions(setup)
    const state: MockInterviewState = {
      id,
      setup,
      currentIndex: 0,
      questions,
      answers: [],
    }
    activeInterviews.set(id, state)
    return { interviewId: id, firstQuestion: clone(questions[0]) }
  },

  async getQuestion(interviewId) {
    const state = activeInterviews.get(interviewId)
    if (!state || state.currentIndex >= state.questions.length) return null
    return clone(state.questions[state.currentIndex])
  },

  async submitAnswer(interviewId, answer) {
    const state = activeInterviews.get(interviewId)
    if (!state) throw new Error('Interview session not found')

    if (!answer.answer.trim()) {
      return { accepted: false, nextQuestion: null, completed: false, message: 'Write an answer before continuing.' }
    }

    state.answers.push({ ...answer, answer: answer.answer.trim() })
    state.currentIndex += 1

    if (state.currentIndex >= state.questions.length) {
      return { accepted: true, nextQuestion: null, completed: true }
    }

    return {
      accepted: true,
      nextQuestion: clone(state.questions[state.currentIndex]),
      completed: false,
    }
  },

  async getResults(interviewId) {
    const state = activeInterviews.get(interviewId)
    if (!state) throw new Error('Interview session not found')

    const answered = state.answers.length
    const scoreBase = Math.min(96, 68 + answered * 3)
    const results: InterviewResults = {
      interviewId,
      role: state.setup.role,
      company: state.setup.company,
      completedAt: new Date().toISOString(),
      score: {
        overall: scoreBase,
        technicalKnowledge: Math.min(96, scoreBase + 3),
        problemSolving: Math.min(94, scoreBase - 1),
        communication: Math.min(95, scoreBase + 1),
        roleRelevance: Math.min(97, scoreBase + 2),
        answerDepth: Math.max(60, scoreBase - 3),
        completeness: Math.min(96, scoreBase + 2),
      },
      strengths: [
        'Strong relevance to the target role',
        'Clear understanding of core technical concepts',
        'Good connection between project experience and the opportunity',
      ],
      weaknesses: [
        'Some answers could include deeper trade-off reasoning',
        'Production and operational examples could be more concrete',
      ],
      preparationPriorities: [
        'Practice explaining production ML decisions end to end',
        'Prepare concise evidence from your strongest projects',
        'Strengthen examples around deployment and monitoring',
      ],
    }

    const existing = demoSummaries.find((item) => item.interviewId === interviewId)
    if (!existing) {
      demoSummaries.unshift({
        interviewId,
        role: state.setup.role,
        company: state.setup.company,
        completedAt: results.completedAt,
        overallScore: results.score.overall,
        questionCount: state.setup.questionCount,
        difficulty: state.setup.difficulty,
        categories: state.setup.categories,
      })
    }

    return clone(results)
  },
}

export const interviewDefaults: {
  difficulty: InterviewDifficulty
  categories: InterviewCategory[]
} = {
  difficulty: 'Intermediate',
  categories: ['Technical', 'Role-specific', 'Resume-based', 'Behavioral', 'Skill-gap', 'Situational'],
}
