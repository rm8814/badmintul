import type { ReactNode } from 'react'

export default function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-neutral-900">{title}</h2>{description && <p className="mt-1 text-sm text-content-muted">{description}</p>}</div>{action && <div className="shrink-0">{action}</div>}</div>
}
