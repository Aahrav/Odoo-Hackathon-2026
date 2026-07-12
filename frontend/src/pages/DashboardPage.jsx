import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        Phase 1 · Dashboard
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">
        Welcome back, {user?.name}
      </h1>
      <p className="mt-2 text-transit-muted">
        You are signed in as <strong>{user?.role}</strong>. Navigation and data access
        are scoped by RBAC.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-transit-border bg-slate-50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Your permissions
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {(user?.permissions || []).map((permission) => (
              <li
                key={permission}
                className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800"
              >
                {permission}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-transit-border bg-slate-50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Next phases
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>2. Vehicle Registry</li>
            <li>3. Drivers & Safety Profiles</li>
            <li>4. Trip Dispatcher</li>
            <li>5. Maintenance</li>
            <li>6. Fuel & Expense Management</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
