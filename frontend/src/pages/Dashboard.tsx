import { Link } from 'react-router-dom'
import { FileText, Briefcase, Upload, Plus, Search, Pencil } from 'lucide-react'
import { useAuth } from '../auth/context'
import { useDashboardData } from '../hooks/useDashboardData'
import { pageDescriptions } from '../config/navigation'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'

export function DashboardPage() {
  const { user } = useAuth()
  const data = useDashboardData()
  const firstName = user?.email?.split('@')[0] ?? 'there'

  const metrics = [
    { label: 'Documents', value: data.documentsCount },
    { label: 'Opportunities', value: data.opportunitiesCount },
    { label: 'Analyses', value: data.analysesCount },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Overview</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">
          Welcome back, {firstName}
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">{pageDescriptions['/dashboard']}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 divide-x divide-slate-200 border border-slate-200 bg-white">
        {metrics.map((m) => (
          <div key={m.label} className="px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{m.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
              {data.loading ? '—' : m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent documents */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Recent Documents</h3>
          <Link to="/documents" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            View all
          </Link>
        </div>
        {data.recentDocuments.length > 0 ? (
          <Table>
            <TableHead>
              <TableHeaderCell>Document</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Parse Score</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableHead>
            <TableBody>
              {data.recentDocuments.map((doc) => (
                <TableRow key={doc.document_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-900">{doc.filename || 'Untitled'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={doc.doc_type ? 'success' : 'neutral'}>
                      {doc.doc_type || 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {doc.parse_ability_score != null
                      ? `${(doc.parse_ability_score * 100).toFixed(0)}%`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to="/documents" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          !data.loading && (
            <div className="border border-slate-200 bg-white">
              <EmptyState
                icon={FileText}
                title="No documents yet"
                description="Upload your first resume to get started."
                action={
                  <Link to="/documents" className="btn btn-primary text-xs">
                    Upload document
                  </Link>
                }
              />
            </div>
          )
        )}
      </section>

      {/* Recent opportunities */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Recent Opportunities</h3>
          <Link to="/opportunities" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            View all
          </Link>
        </div>
        {data.recentOpportunities.length > 0 ? (
          <Table>
            <TableHead>
              <TableHeaderCell>Opportunity</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Region</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableHead>
            <TableBody>
              {data.recentOpportunities.map((opp) => (
                <TableRow key={opp.opportunity_id}>
                  <TableCell className="font-medium text-slate-900">
                    {opp.title || 'Untitled'}
                  </TableCell>
                  <TableCell>{opp.role_type || '—'}</TableCell>
                  <TableCell>{opp.region || '—'}</TableCell>
                  <TableCell><Badge variant="info">Active</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          !data.loading && (
            <div className="border border-slate-200 bg-white">
              <EmptyState
                icon={Briefcase}
                title="No opportunities yet"
                description="Add a job description to analyze your match."
                action={
                  <Link to="/opportunities" className="btn btn-secondary text-xs">
                    Add opportunity
                  </Link>
                }
              />
            </div>
          )
        )}
      </section>

      {/* Quick actions */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Upload Resume', to: '/documents', icon: Upload },
            { label: 'Add Opportunity', to: '/opportunities', icon: Plus },
            { label: 'Analyze Resume', to: '/analysis', icon: Search },
            { label: 'Rewrite Bullet', to: '/bullets', icon: Pencil },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <action.icon className="h-3.5 w-3.5 text-slate-400" />
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
