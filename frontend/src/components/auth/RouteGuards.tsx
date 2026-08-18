import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (loading) {
    return null
  }

  if (!isAuthenticated) {
    navigate('/login', { state: { from: location } })
    return null
  }

  return <>{children}</>
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return null
  }

  if (isAuthenticated) {
    navigate('/dashboard')
    return null
  }

  return <>{children}</>
}
