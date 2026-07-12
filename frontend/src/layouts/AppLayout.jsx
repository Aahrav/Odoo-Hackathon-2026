import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiMock } from '../api/apiMock'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('transitops_theme') || 'light'
  })

  // Alerts state
  const [alertsCount, setAlertsCount] = useState(0)

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('transitops_theme', theme)
  }, [theme])

  useEffect(() => {
    // Check drivers expiring soon for compliance alerts count
    const drivers = apiMock.getDrivers()
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const expiringCount = drivers.filter(d => d.licenseExpiryDate <= thirtyDaysLater).length
    setAlertsCount(expiringCount)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="min-h-screen bg-transit-surface dark:bg-slate-950 transition-colors duration-200">
      <header className="border-b border-transit-border dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-bold text-teal-850 dark:text-teal-400">TransitOps</p>
            <p className="text-xs text-transit-muted">Smart Transport Operations Platform</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-transit-border text-slate-700 hover:bg-slate-50 dark:text-slate-200"
              title="Toggle Theme"
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>

            {/* Compliance Alert Indicator */}
            {alertsCount > 0 && (
              <div 
                onClick={() => navigate('/drivers')} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 cursor-pointer text-xs font-semibold animate-pulse"
                title={`${alertsCount} Compliance Warnings`}
              >
                <span>⚠️</span>
                <span>{alertsCount} Alert{alertsCount > 1 ? 's' : ''}</span>
              </div>
            )}

            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-teal-700 dark:text-teal-400">{user?.role}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-transit-border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-transit-border dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors duration-200">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Navigation
          </p>
          <nav className="space-y-1">
            {(user?.navigation || []).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  [
                    'block rounded-lg px-3 py-2 text-sm transition',
                    isActive
                      ? 'bg-teal-50 dark:bg-teal-900/20 font-semibold text-teal-800 dark:text-teal-400'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="rounded-2xl border border-transit-border dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
