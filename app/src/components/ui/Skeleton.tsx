export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-control bg-slate-200 ${className}`} aria-hidden="true" />
}
