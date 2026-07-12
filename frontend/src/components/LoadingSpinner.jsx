export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex h-64 items-center justify-center space-x-3 text-slate-500 dark:text-slate-400 dark:text-slate-500">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-500"></div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
