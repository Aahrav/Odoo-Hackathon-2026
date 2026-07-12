import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ROLES, ROLE_DESCRIPTIONS } from '../constants/roles'

export default function LoginPage() {
  const { login } = useAuth()
  const [form, setForm] = useState({
    email: 'Raven.k@transitops.in',
    password: '',
    role: 'Fleet Manager',
    remember: true,
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login({
        email: form.email,
        password: form.password,
        role: form.role,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-center">
        <section className="text-white">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-teal-300">
            Phase 0 · Authentication (RBAC)
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            TransitOps
          </h1>
          <p className="mt-4 max-w-lg text-lg text-slate-300">
            Smart Transport Operations Platform
          </p>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm font-medium text-teal-200">One login, four roles:</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              {ROLES.map((role) => (
                <li key={role} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-teal-400" />
                  <span>
                    <strong>{role}</strong>
                    <span className="text-slate-400"> → {ROLE_DESCRIPTIONS[role]}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-slate-400">
              Access is scoped by role after login.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-transit-border bg-transit-card p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-xl font-bold text-white">
              T
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">Sign in to your account</h2>
            <p className="mt-2 text-sm text-transit-muted">
              TRANSITOPS © 2026 · RBAC ENABLED
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-transit-border px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="name@transitops.in"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Password
              </span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-transit-border px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="Enter your password"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Role (RBAC)
              </span>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-xl border border-transit-border bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                  className="rounded border-transit-border text-teal-700 focus:ring-teal-500"
                />
                Remember me
              </label>
              <button
                type="button"
                className="font-medium text-teal-700 hover:text-teal-800"
              >
                Forgot password?
              </button>
            </div>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Demo credentials</p>
            <p className="mt-2">Raven.k@transitops.in / TransitOps@2026 (Fleet Manager)</p>
            <p>driver@transitops.in / password123 (Driver)</p>
          </div>
        </section>
      </div>
    </div>
  )
}
