import axios from 'axios'
import { removeToken, getToken } from '../auth/storage'
import type { ExperienceEntry } from './types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const api = {
  // Health
  health: () => client.get('/health'),

  // Auth
  register: (data: { email: string; password: string; region?: string; field_of_study?: string }) =>
    client.post('/auth/register', data),
  login: (data: { email: string; password: string }) => client.post('/auth/login', data),

  // Documents
  uploadDocument: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  listDocuments: (skip = 0, limit = 50) => client.get('/documents', { params: { skip, limit } }),
  getDocument: (id: string) => client.get(`/documents/${id}`),
  deleteDocument: (id: string) => client.delete(`/documents/${id}`),

  // Opportunities
  createOpportunity: (data: { text: string; title?: string; region?: string; role_type?: string }) =>
    client.post('/opportunities', data),
  listOpportunities: (skip = 0, limit = 50) => client.get('/opportunities', { params: { skip, limit } }),
  getOpportunity: (id: string) => client.get(`/opportunities/${id}`),
  deleteOpportunity: (id: string) => client.delete(`/opportunities/${id}`),

  // Analysis
  runAnalysis: (data: { document_id: string; opportunity_id: string }) => client.post('/analysis', data),
  getAnalysis: (id: string) => client.get(`/analysis/${id}`),

  // Bullets
  rewriteBullets: (bullets: string[]) => client.post('/bullets/rewrite', { bullets }),

  // Draft
  buildDraft: (activities: string[]) => client.post('/draft/build', { activities }),

  // Profile
  getProfile: () => client.get('/profile'),
  saveProfile: (data: { master_skills: string[]; master_experience: ExperienceEntry[] }) =>
    client.post('/profile', data),
  tailorProfile: (opportunityId: string) => client.post('/profile/tailor', { opportunity_id: opportunityId }),
}

export default client
