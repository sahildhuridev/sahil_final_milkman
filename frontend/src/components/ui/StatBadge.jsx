const toneClasses = {
  neutral: 'border-slate-200 bg-white text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
}

export default function StatBadge({ label, value, tone = 'neutral' }) {
  return (
    <div
      className={`inline-flex min-w-28 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs font-semibold ${toneClasses[tone] || toneClasses.neutral}`}
    >
      <span>{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  )
}
