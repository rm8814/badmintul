import type { ReactNode } from 'react'
import Button from './Button'

export default function Toast({ children, onClose, variant = 'info' }: { children: ReactNode; onClose?: () => void; variant?: 'info' | 'success' | 'warning' | 'danger' }) {
  const colors = { info: 'border-brand-accent/30', success: 'border-brand-success/30', warning: 'border-brand-warning/30', danger: 'border-brand-danger/30' }
  return <div className={`fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-card border bg-white p-4 shadow-card-hover ${colors[variant]}`} role="status"><div className="flex-1 text-sm text-neutral-800">{children}</div>{onClose && <Button type="button" variant="secondary" className="px-2 py-1 text-xs" aria-label="Dismiss notification" onClick={onClose}>×</Button>}</div>
}
