import { useEffect, useState, useRef, useCallback } from 'react'
import { useI18n } from '../i18n/hooks'
import { FileText, Upload, Trash2, X, CheckCircle2 } from 'lucide-react'
import { api } from '../api/client'
import type { Document } from '../api/types'
import { useToast } from '../hooks/useToast'
import { pageDescriptions } from '../config/navigation'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'

export function DocumentsPage() {
  const { t } = useI18n()
  const { add } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [uploadedDoc, setUploadedDoc] = useState<Document | null>(null)
  const [showUploaded, setShowUploaded] = useState(false)

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.listDocuments(0, 50)
      setDocuments(res.data)
    } catch {
      add('error', t('Failed to load documents'))
    } finally {
      setLoading(false)
    }
  }, [add, t])

  useEffect(() => { loadDocuments() }, [loadDocuments])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await api.uploadDocument(file)
      setUploadedDoc(res.data)
      setShowUploaded(true)
      add('success', t('Document uploaded successfully'))
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
      add('success', t('Document deleted'))
      loadDocuments()
    } catch {
      add('error', t('Failed to delete document'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-placeholder)]">{t("Workspace")}</p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--color-text)]">{t("Documents")}</h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{pageDescriptions['/documents']}</p>
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
        <div className="border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-4 py-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-success-text)]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)]">{uploadedDoc.filename || 'Uploaded document'}</p>
              {uploadedDoc.parse_ability_score != null && (
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {t("Parse score:")} {(uploadedDoc.parse_ability_score * 100).toFixed(0)}%
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
            <button onClick={() => setShowUploaded(false)} className="text-[var(--color-text-placeholder)] hover:text-[var(--color-text)]">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] py-16">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-accent)]" />
        </div>
      ) : documents.length === 0 ? (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
          <EmptyState
            icon={FileText}
            title={t("No documents yet")}
            description={t("Upload your first resume document to get started.")}
            action={
              <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary text-xs">
                {t("Upload document")}
              </button>
            }
          />
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableHeaderCell>{t("File")}</TableHeaderCell>
            <TableHeaderCell>{t("Type")}</TableHeaderCell>
            <TableHeaderCell>{t("Parse Score")}</TableHeaderCell>
            <TableHeaderCell>{t("Status")}</TableHeaderCell>
            <TableHeaderCell className="text-right">{t("Actions")}</TableHeaderCell>
          </TableHead>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.document_id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 flex-shrink-0 text-[var(--color-text-placeholder)]" />
                    <span className="font-medium text-[var(--color-text)]">{doc.filename || 'Untitled'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[var(--color-text-muted)]">{doc.doc_type || '—'}</TableCell>
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
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-error-text)] disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("Delete")}
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
