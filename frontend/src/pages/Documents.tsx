import { useEffect, useState, useRef } from 'react'
import { FileText, Upload, Trash2, X, CheckCircle2 } from 'lucide-react'
import { api } from '../api/client'
import type { Document } from '../api/types'
import { useToast } from '../hooks/useToast'
import { pageDescriptions } from '../config/navigation'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'

export function DocumentsPage() {
  const { add } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [uploadedDoc, setUploadedDoc] = useState<Document | null>(null)
  const [showUploaded, setShowUploaded] = useState(false)

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const res = await api.listDocuments(0, 50)
      setDocuments(res.data)
    } catch {
      add('error', 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDocuments() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await api.uploadDocument(file)
      setUploadedDoc(res.data)
      setShowUploaded(true)
      add('success', 'Document uploaded successfully')
      loadDocuments()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Upload failed'
      add('error', detail)
    } finally {
      setUploading(false)
    }
    e.target.value = ''
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document?')) return
    setDeletingId(id)
    try {
      await api.deleteDocument(id)
      add('success', 'Document deleted')
      loadDocuments()
    } catch {
      add('error', 'Failed to delete document')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Workspace</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Documents</h2>
          <p className="mt-0.5 text-sm text-slate-500">{pageDescriptions['/documents']}</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn btn-primary text-xs"
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Uploading...' : 'Upload document'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {showUploaded && uploadedDoc && (
        <div className="border border-emerald-200 bg-emerald-50/50 px-4 py-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">{uploadedDoc.filename || 'Uploaded document'}</p>
              {uploadedDoc.parse_ability_score != null && (
                <p className="mt-0.5 text-xs text-slate-500">
                  Parse score: {(uploadedDoc.parse_ability_score * 100).toFixed(0)}%
                </p>
              )}
              {uploadedDoc.parse_risk_flags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {uploadedDoc.parse_risk_flags.map((flag, i) => (
                    <Badge key={i} variant="warning">{flag}</Badge>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setShowUploaded(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center border border-slate-200 bg-white py-16">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
        </div>
      ) : documents.length === 0 ? (
        <div className="border border-slate-200 bg-white">
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Upload your first resume document to get started."
            action={
              <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary text-xs">
                Upload document
              </button>
            }
          />
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableHeaderCell>File</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Parse Score</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableHead>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.document_id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 flex-shrink-0 text-slate-400" />
                    <span className="font-medium text-slate-900">{doc.filename || 'Untitled'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-500">{doc.doc_type || '—'}</TableCell>
                <TableCell className="tabular-nums">
                  {doc.parse_ability_score != null
                    ? `${(doc.parse_ability_score * 100).toFixed(0)}%`
                    : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={doc.parse_risk_flags.length > 0 ? 'warning' : 'success'}>
                    {doc.parse_risk_flags.length > 0 ? 'Review' : 'Ready'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => handleDelete(doc.document_id)}
                    disabled={deletingId === doc.document_id}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
