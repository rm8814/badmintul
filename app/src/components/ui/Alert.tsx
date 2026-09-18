import type { ReactNode } from 'react'

type AlertVariant = 'info' | 'success' | 'warning' | 'danger'
const variants: Record<AlertVariant, string> = { info: 'border-brand-accent/30 bg-cyan-50 text-cyan-900', success: 'border-brand-success/30 bg-green-50 text-green-900', warning: 'border-brand-warning/30 bg-amber-50 text-amber-900', danger: 'border-brand-danger/30 bg-red-50 text-red-900' }

export default function Alert({ children, title, variant = 'info' }: { children: ReactNode; title?: string; variant?: AlertVariant }) {
  return <div className={`rounded-card border p-4 text-sm ${variants[variant]}`} role="status">{title && <p className="font-bold">{title}</p>}<div className={title ? 'mt-1' : ''}>{children}</div></div>
}
