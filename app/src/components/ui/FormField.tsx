import type { ReactNode } from 'react'

export default function FormField({ id, label, children, error }: { id: string; label: string; children: ReactNode; error?: string }) {
  return <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-neutral-700" htmlFor={id}>{label}</label>{children}{error && <p className="text-sm text-brand-danger">{error}</p>}</div>
}
