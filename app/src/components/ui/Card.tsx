import type { HTMLAttributes } from 'react'

export default function Card({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`rounded-xl border border-neutral-200 bg-white p-6 shadow-sm ${className}`} {...props} />
}
