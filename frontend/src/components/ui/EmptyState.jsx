export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--line-200)] bg-[var(--surface-0)] p-6 text-center">
      <p className="text-base font-bold text-[var(--ink-900)]">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm text-[var(--ink-500)]">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
