import type { ReactNode } from 'react'

type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
const variants: Record<BadgeVariant, string> = { neutral: 'bg-slate-100 text-slate-700', primary: 'bg-brand-primary/10 text-brand-primary', success: 'bg-brand-success/10 text-brand-success', warning: 'bg-brand-warning/10 text-brand-warning', danger: 'bg-brand-danger/10 text-brand-danger' }

export default function Badge({ children, variant = 'neutral' }: { children: ReactNode; variant?: BadgeVariant }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${variants[variant]}`}>{children}</span>
}
