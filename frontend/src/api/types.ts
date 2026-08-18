export interface Document {
  document_id: string
  filename: string | null
  doc_type: string | null
  extracted_text: string
  parse_ability_score: number | null
  parse_risk_flags: string[]
}

export interface Opportunity {
  opportunity_id: string
  title: string | null
  region: string | null
  role_type: string | null
}

export interface Analysis {
  analysis_id: string
  matched: string[]
  missing: string[]
  match_pct: number | null
  parse_ability_score: number | null
  report_text: string | null
}

export interface Profile {
  profile_id: string
  master_skills: string[]
  master_experience: any[]
}

export interface TailorResult {
  tailored_skills: string[]
  tailored_experience: any[]
}

export interface BulletRewriteResult {
  original: string
  rewritten: string
  placeholders_added: number
  needs_review: boolean
}

export interface DraftResult {
  sections: Record<string, any[]>
  all_skills_detected: string[]
  is_thin: boolean
  note: string | null
  status: string | null
}


export interface DashboardMetric {
  label: string
  value: number
  suffix?: string
  description: string
  trend?: string
}

export interface DashboardTarget {
  role: string
  progress: number
}

export interface DashboardOpportunity {
  role: string
  company: string
  opportunityFit: number
  careerAlignment: number
}

export interface CareerIntelligenceSignal {
  label: string
  value: number
  description: string
}

export interface DashboardOverview {
  metrics: DashboardMetric[]
  target: DashboardTarget
  currentOpportunity: DashboardOpportunity
  intelligence: CareerIntelligenceSignal[]
}
