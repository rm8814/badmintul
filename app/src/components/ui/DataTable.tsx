import type { ReactNode } from 'react'

export default function DataTable<T extends { id: string | number }>({ columns, rows, empty }: { columns: Array<{ key: string; label: string; render: (row: T) => ReactNode }>; rows: T[]; empty?: ReactNode }) {
  if (!rows.length && empty) return <>{empty}</>
  return <div className="overflow-x-auto rounded-card border border-border-subtle bg-surface"><table className="min-w-full text-left text-sm"><thead className="bg-surface-subtle text-xs uppercase tracking-wide text-content-muted"><tr>{columns.map((column) => <th className="px-4 py-3 font-bold" key={column.key}>{column.label}</th>)}</tr></thead><tbody className="divide-y divide-border-subtle">{rows.map((row) => <tr className="hover:bg-surface-subtle" key={row.id}>{columns.map((column) => <td className="whitespace-nowrap px-4 py-3" key={column.key}>{column.render(row)}</td>)}</tr>)}</tbody></table></div>
}
