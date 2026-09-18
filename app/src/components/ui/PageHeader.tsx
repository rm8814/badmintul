import type { ReactNode } from 'react'

export default function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-accent">{eyebrow}</p>}<h1 className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-900">{title}</h1>{description && <p className="mt-2 max-w-2xl text-neutral-600">{description}</p>}</div>{actions && <div className="shrink-0">{actions}</div>}</div>
}
