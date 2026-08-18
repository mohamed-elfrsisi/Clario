import { type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/context'
import { ToastProvider } from './hooks/useToast'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { DashboardPage } from './pages/Dashboard'
import { DocumentsPage } from './pages/Documents'
import { OpportunitiesPage } from './pages/Opportunities'
import { AnalysisPage } from './pages/Analysis'
import { BulletsPage } from './pages/Bullets'
import { ProfilePage } from './pages/Profile'
import { SettingsPage } from './pages/Settings'
import { CareerProfilePage } from './pages/CareerProfile'
import { CareerTargetPage } from './pages/CareerTarget'
import { MyResumePage } from './pages/MyResume'
import { ComingSoonPage } from './pages/ComingSoon'
import { useAuth } from './auth/context'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } />

            {/* Protected routes with layout */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/documents" element={
              <ProtectedRoute>
                <Layout>
                  <DocumentsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/opportunities" element={
              <ProtectedRoute>
                <Layout>
                  <OpportunitiesPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/analysis" element={
              <ProtectedRoute>
                <Layout>
                  <AnalysisPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/bullets" element={
              <ProtectedRoute>
                <Layout>
                  <BulletsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Career intelligence routes */}
            <Route path="/resume" element={
              <ProtectedRoute>
                <Layout>
                  <MyResumePage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/career-profile" element={
              <ProtectedRoute>
                <Layout>
                  <CareerProfilePage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/career-target" element={
              <ProtectedRoute>
                <Layout>
                  <CareerTargetPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Reserved product modules */}
            {['/applications', '/mock-interviews', '/career-analytics'].map((path) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ComingSoonPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
            ))}

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
