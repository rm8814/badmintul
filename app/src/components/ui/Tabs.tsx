import type { ReactNode } from 'react'

export default function Tabs<T extends string>({ items, value, onChange }: { items: Array<{ value: T; label: ReactNode }>; value: T; onChange: (value: T) => void }) {
  return <div className="flex flex-wrap gap-2 border-b border-border-subtle" role="tablist">{items.map((item) => <button key={item.value} type="button" role="tab" aria-selected={value === item.value} className={`rounded-t-control border-b-2 px-4 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${value === item.value ? 'border-brand-primary text-brand-primary' : 'border-transparent text-content-muted hover:border-border-strong hover:text-neutral-900'}`} onClick={() => onChange(item.value)}>{item.label}</button>)}</div>
}
