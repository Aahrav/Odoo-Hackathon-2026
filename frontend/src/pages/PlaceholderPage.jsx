export default function PlaceholderPage({ title, description }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 max-w-2xl text-transit-muted">{description}</p>
      <div className="mt-6 rounded-2xl border border-dashed border-transit-border bg-slate-50 p-8 text-sm text-slate-500">
        This module will be implemented in the next development phase.
      </div>
    </div>
  )
}
