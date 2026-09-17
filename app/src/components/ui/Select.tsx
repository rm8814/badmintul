import type { SelectHTMLAttributes } from 'react'
import FormField from './FormField'

export default function Select({ id, label, error, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { id: string; label: string; error?: string }) {
  return <FormField id={id} label={label} error={error}><select id={id} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20" {...props}>{children}</select></FormField>
}
