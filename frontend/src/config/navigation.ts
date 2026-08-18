import {
  type LucideIcon,
  LayoutDashboard,
  FileText,
  UserRound,
  Target,
  BriefcaseBusiness,
  ClipboardCheck,
  Mic2,
  BarChart3,
  Settings,
} from 'lucide-react'

export interface NavLinkItem {
  to: string
  label: string
  icon: LucideIcon
}

export interface NavGroup {
  title: string
  items: NavLinkItem[]
}

export const primaryNav: NavLinkItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/resume', label: 'My Resume', icon: FileText },
  { to: '/career-profile', label: 'Career Profile', icon: UserRound },
  { to: '/career-target', label: 'Career Target', icon: Target },
  { to: '/opportunities', label: 'Opportunities', icon: BriefcaseBusiness },
]

export const secondaryNavGroups: NavGroup[] = [
  {
    title: 'Career Workspace',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/resume', label: 'My Resume', icon: FileText },
      { to: '/career-profile', label: 'Career Profile', icon: UserRound },
      { to: '/career-target', label: 'Career Target', icon: Target },
      { to: '/opportunities', label: 'Opportunities', icon: BriefcaseBusiness },
      { to: '/applications', label: 'Applications', icon: ClipboardCheck },
      { to: '/mock-interviews', label: 'Mock Interviews', icon: Mic2 },
      { to: '/career-analytics', label: 'Career Analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Account',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/resume': 'My Resume',
  '/career-profile': 'Career Profile',
  '/career-target': 'Career Target',
  '/opportunities': 'Opportunities',
  '/applications': 'Applications',
  '/mock-interviews': 'Mock Interviews',
  '/career-analytics': 'Career Analytics',
  '/documents': 'Documents',
  '/analysis': 'Resume Analysis',
  '/bullets': 'Bullet Writer',
  '/profile': 'Profile',
  '/settings': 'Settings',
}

export const pageDescriptions: Record<string, string> = {
  '/dashboard': 'Your career intelligence overview',
  '/resume': 'Manage and improve your resume',
  '/career-profile': 'Your master career profile',
  '/career-target': 'Define and track your target career',
  '/opportunities': 'Track and manage job opportunities',
  '/applications': 'Track your job applications',
  '/mock-interviews': 'Practice for your next interview',
  '/career-analytics': 'Understand your career progress',
  '/documents': 'Manage your resumes and career documents',
  '/analysis': 'Analyze resume-to-opportunity match',
  '/bullets': 'Improve resume bullet points',
  '/profile': 'Your master career profile',
  '/settings': 'Account and preferences',
}
