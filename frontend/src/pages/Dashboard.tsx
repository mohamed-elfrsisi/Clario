import { Link } from 'react-router-dom'
import { Sparkles, FileText, Briefcase, Users, ArrowRight, Zap } from 'lucide-react'
import { useDashboardData } from '../hooks/useDashboardData'

export function DashboardPage() {
  const data = useDashboardData()

  const stats = [
    {
      label: 'Documents',
      value: data.documentsCount,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      description: 'Uploaded resumes and documents',
    },
    {
      label: 'Opportunities',
      value: data.opportunitiesCount,
      icon: Briefcase,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      description: 'Jobs and opportunities saved',
    },
    {
      label: 'Analyses',
      value: data.analysesCount,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      description: 'Resume match analyses completed',
    },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back. Here is what is happening with your account.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-md">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">{stat.label}</p>
            <p className="text-xs text-slate-400">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Upload document', href: '/documents', icon: FileText },
            { label: 'Add opportunity', href: '/opportunities', icon: Briefcase },
            { label: 'New analysis', href: '/analysis', icon: Zap },
            { label: 'Rewrite bullets', href: '/bullets', icon: ArrowRight },
          ].map((action) => (
            <Link
              key={action.href}
              to={action.href}
              className="card-hover p-4 flex items-center gap-3 text-slate-700 hover:text-slate-900"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <action.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent documents */}
      {data.recentDocuments.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent documents</h2>
            <Link to="/documents" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View all
            </Link>
          </div>
          <div className="card p-5">
            <div className="space-y-3">
              {data.recentDocuments.map((doc) => (
                <div key={doc.document_id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{doc.filename || 'Untitled document'}</p>
                      <p className="text-xs text-slate-400">{doc.doc_type || 'Pending analysis'}</p>
                    </div>
                  </div>
                  {doc.parse_ability_score !== null && (
                    <span className="text-xs font-medium text-slate-500">
                      Parse: {(doc.parse_ability_score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent opportunities */}
      {data.recentOpportunities.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent opportunities</h2>
            <Link to="/opportunities" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View all
            </Link>
          </div>
          <div className="card p-5">
            <div className="space-y-3">
              {data.recentOpportunities.map((opp) => (
                <div key={opp.opportunity_id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{opp.title || 'Untitled opportunity'}</p>
                      <p className="text-xs text-slate-400">{opp.role_type || 'No role type'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {data.recentDocuments.length === 0 && data.recentOpportunities.length === 0 && (
        <div className="card p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mx-auto mb-4">
            <Sparkles className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Get started</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
            Upload your first resume and add an opportunity to start analyzing your match.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/documents" className="btn btn-primary">
              Upload document
            </Link>
            <Link to="/opportunities" className="btn btn-secondary">
              Add opportunity
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
