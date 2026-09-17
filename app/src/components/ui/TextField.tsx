import type { InputHTMLAttributes } from 'react'
import FormField from './FormField'

export default function TextField({ id, label, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string }) {
  return <FormField id={id} label={label} error={error}><input id={id} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20" {...props} /></FormField>
}
