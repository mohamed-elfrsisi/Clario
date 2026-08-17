import { useEffect, useState } from 'react'
import { FileText, Upload, Trash2, Eye, X, CheckCircle2 } from 'lucide-react'
import { api } from '../api/client'
import { useToast } from '../hooks/useToast'

export function DocumentsPage() {
  const { add } = useToast()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [uploadedDoc, setUploadedDoc] = useState<any>(null)
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
    setLoading(true)
    try {
      const res = await api.uploadDocument(file)
      setUploadedDoc(res.data)
      setShowUploaded(true)
      add('success', 'Document uploaded successfully')
      loadDocuments()
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Upload failed'
      add('error', detail)
    } finally {
      setLoading(false)
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
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="mt-1 text-sm text-slate-500">Upload and manage your resume documents</p>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <div
          className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl px-6 py-10 hover:border-indigo-400 transition-colors cursor-pointer"
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <Upload className="h-8 w-8 text-slate-400 mb-3" />
          <p className="text-sm font-medium text-slate-700 mb-1">Drop a file here or click to upload</p>
          <p className="text-xs text-slate-400">PDF, DOCX, or TXT up to 10MB</p>
          <input
            id="fileInput"
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleUpload}
            disabled={loading}
          />
        </div>
        {loading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            Uploading...
          </div>
        )}
      </div>

      {showUploaded && uploadedDoc && (
        <div className="card p-5 mb-6 border-l-4 border-l-emerald-500">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">{uploadedDoc.filename || 'Uploaded document'}</h3>
              <p className="text-sm text-slate-500 mt-1">Document ID: {uploadedDoc.document_id}</p>
              {uploadedDoc.parse_ability_score !== null && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Parse ability:</span>
                  <span className="font-medium text-slate-900">{(uploadedDoc.parse_ability_score * 100).toFixed(0)}%</span>
                </div>
              )}
              {uploadedDoc.parse_risk_flags && uploadedDoc.parse_risk_flags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {uploadedDoc.parse_risk_flags.map((flag: string, i: number) => (
                    <span key={i} className="badge badge-warning">{flag}</span>
                  ))}
                </div>
              )}
              {uploadedDoc.extracted_text && (
                <details className="mt-3">
                  <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                    View extracted text
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 overflow-auto max-h-40 whitespace-pre-wrap">
                    {uploadedDoc.extracted_text}
                  </pre>
                </details>
              )}
            </div>
            <button onClick={() => setShowUploaded(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center">
          <span className="h-6 w-6 animate-spin mx-auto rounded-full border-2 border-slate-300 border-t-indigo-500" />
          <p className="mt-3 text-sm text-slate-500">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mx-auto mb-4">
            <FileText className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No documents yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">Upload your first resume document to get started.</p>
        </div>
      ) : (
        <div className="card p-5">
          <div className="space-y-2">
            {documents.map((doc: any) => (
              <div key={doc.document_id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{doc.filename || 'Untitled'}</p>
                    <p className="text-xs text-slate-400">
                      {doc.doc_type || 'Unanalyzed'} · ID: {doc.document_id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors" title="View details">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.document_id)}
                    disabled={deletingId === doc.document_id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
