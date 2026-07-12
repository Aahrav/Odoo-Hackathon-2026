import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transit-surface">
        <p className="text-transit-muted">Loading...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
