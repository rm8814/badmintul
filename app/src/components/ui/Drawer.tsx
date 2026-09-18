import { useEffect, type ReactNode } from 'react'
import Button from './Button'

export default function Drawer({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => { if (!open) return; const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown) }, [open, onClose])
  if (!open) return null
  return <div className="fixed inset-0 z-50 bg-slate-950/40" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}><aside className="ml-auto h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-card-hover" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><div className="flex items-start justify-between gap-4"><h2 id="drawer-title" className="text-xl font-bold">{title}</h2><Button type="button" variant="secondary" className="px-3 py-1" aria-label="Close drawer" onClick={onClose}>×</Button></div><div className="mt-4">{children}</div></aside></div>
}
