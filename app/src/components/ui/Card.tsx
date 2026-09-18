import type { HTMLAttributes } from 'react'

export default function Card({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`rounded-card border border-border-subtle bg-surface p-card shadow-card ${className}`} {...props} />
}
