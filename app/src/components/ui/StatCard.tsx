import type { ReactNode } from 'react'

export default function StatCard({ label, value, detail, icon }: { label: string; value: ReactNode; detail?: ReactNode; icon?: ReactNode }) {
  return <article className="rounded-card border border-border-subtle bg-surface p-card shadow-card"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-content-muted">{label}</p>{icon && <span className="text-brand-primary">{icon}</span>}</div><p className="mt-3 text-2xl font-extrabold text-neutral-900">{value}</p>{detail && <p className="mt-1 text-xs text-content-muted">{detail}</p>}</article>
}
