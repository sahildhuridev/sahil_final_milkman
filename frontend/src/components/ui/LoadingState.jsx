export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center gap-3 text-sm text-[var(--ink-700)]">
          <span className="h-3 w-3 animate-pulse rounded-full bg-[var(--brand-500)]" />
          <span>{label}</span>
        </div>
      </div>
    </div>
  )
}
