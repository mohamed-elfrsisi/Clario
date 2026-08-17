import {
  type LucideIcon,
  Home,
  FileText,
  Briefcase,
  Search,
  Pencil,
  LayoutDashboard,
  User,
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
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/opportunities', label: 'Opportunities', icon: Briefcase },
  { to: '/analysis', label: 'Analysis', icon: Search },
  { to: '/bullets', label: 'Bullet Writer', icon: Pencil },
]

export const secondaryNavGroups: NavGroup[] = [
  {
    title: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/documents', label: 'Documents', icon: FileText },
      { to: '/opportunities', label: 'Opportunities', icon: Briefcase },
    ],
  },
  {
    title: 'Career Intelligence',
    items: [
      { to: '/analysis', label: 'Resume Analysis', icon: Search },
      { to: '/bullets', label: 'Bullet Writer', icon: Pencil },
      { to: '/profile', label: 'Profile', icon: User },
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
  '/documents': 'Documents',
  '/opportunities': 'Opportunities',
  '/analysis': 'Resume Analysis',
  '/bullets': 'Bullet Writer',
  '/profile': 'Profile',
  '/settings': 'Settings',
}

export const pageDescriptions: Record<string, string> = {
  '/dashboard': 'Your career workspace overview',
  '/documents': 'Manage your resumes and career documents',
  '/opportunities': 'Track and manage job opportunities',
  '/analysis': 'Analyze resume-to-opportunity match',
  '/bullets': 'Improve resume bullet points',
  '/profile': 'Your master career profile',
  '/settings': 'Account and preferences',
}
