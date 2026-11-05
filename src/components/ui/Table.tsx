import type { ReactNode } from "react"

import { EmptyState } from "./EmptyState"

export type Column<T> = {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
}

/** Scrollable data table (`.table-scroll`) with an empty state. */
export function Table<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  className = "",
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  empty?: ReactNode
  className?: string
}) {
  return (
    <div className={`table-scroll ${className}`.trim()}>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && empty && <EmptyState>{empty}</EmptyState>}
    </div>
  )
}
