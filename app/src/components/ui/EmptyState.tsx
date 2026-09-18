import type { ReactNode } from 'react'

export default function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="rounded-card border border-dashed border-border-strong bg-surface-subtle p-8 text-center"><h3 className="font-bold text-neutral-900">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm text-content-muted">{description}</p>{action && <div className="mt-4">{action}</div>}</div>
}
