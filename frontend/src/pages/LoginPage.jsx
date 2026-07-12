import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ROLES, ROLE_DESCRIPTIONS } from '../constants/roles'
import CustomSelect from '../components/CustomSelect'

export default function LoginPage() {
  const { login, signup } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Fleet Manager',
    remember: true,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
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
    setSuccess('')
    setSubmitting(true)

    try {
      if (isRegister) {
        if (!form.name.trim()) {
          throw new Error('Name is required')
        }
        await signup(form.name, form.email, form.password, form.role)
        setSuccess('Account created successfully! Logging you in...')
      } else {
        await login({
          email: form.email,
          password: form.password,
          role: form.role,
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 px-4 py-10 flex items-center justify-center">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-center w-full">
        <section className="text-white">
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            TransitOps
          </h1>
          <p className="mt-4 max-w-lg text-lg text-slate-300">
            Smart Transport Operations Platform
          </p>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm font-medium text-teal-200">Role-Based Access Control (RBAC):</p>
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
              Your access, navigation, and features are customized according to your role.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-xl font-bold text-white">
              T
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {isRegister ? 'Create your account' : 'Sign in to your account'}
            </h2>
            <p className="mt-2 text-sm text-transit-muted">
              SECURE PORTAL · RBAC ENABLED
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isRegister && (
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Full Name
                </span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  placeholder="John Doe"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email Address
              </span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
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
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="••••••••"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Role (RBAC)
              </span>
              <div className="mt-1 z-30">
                <CustomSelect
                  value={form.role}
                  onChange={(e) => handleChange({ target: { name: 'role', value: e.target.value, type: 'text' } })}
                  options={ROLES.map((role) => ({
                    value: role,
                    label: role
                  }))}
                />
              </div>
            </label>

            {!isRegister && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={form.remember}
                    onChange={handleChange}
                    className="rounded border-slate-200 text-teal-700 focus:ring-teal-500"
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
            )}

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-slate-600">
            {isRegister ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="font-semibold text-teal-700 hover:underline"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                New to TransitOps?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="font-semibold text-teal-700 hover:underline"
                >
                  Create Account
                </button>
              </p>
            )}
          </div>

        </section>
      </div>
    </div>
  )
}
