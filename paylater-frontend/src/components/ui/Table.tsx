import { type ReactNode } from 'react'

export interface TableColumn<T extends object> {
  key: string
  header: string
  render?: (row: T, index: number) => ReactNode
  className?: string
  headerClassName?: string
}

export interface TableProps<T extends object> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  error?: string
  rowKey?: keyof T | ((row: T) => string | number)
  className?: string
}

function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function getDefaultCellValue<T extends object>(
  row: T,
  key: string,
): ReactNode {
  if (!(key in row)) {
    return null
  }

  const value = row[key as keyof T]

  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'object') {
    return String(value)
  }

  return value as ReactNode
}

function resolveRowKey<T extends object>(
  row: T,
  index: number,
  rowKey?: keyof T | ((row: T) => string | number),
): string {
  if (typeof rowKey === 'function') {
    return String(rowKey(row))
  }

  if (rowKey !== undefined && rowKey in row) {
    return String(row[rowKey])
  }

  if ('id' in row && row.id !== null && row.id !== undefined) {
    return String(row.id)
  }

  return String(index)
}

export function Table<T extends object>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  error,
  rowKey,
  className,
}: TableProps<T>) {
  const columnCount = columns.length

  function renderStateRow(content: ReactNode, tone: 'default' | 'error' = 'default') {
    return (
      <tr>
        <td
          colSpan={columnCount}
          className={cn(
            'px-4 py-10 text-center text-sm',
            tone === 'error' ? 'text-error' : 'text-text-muted',
          )}
        >
          {content}
        </td>
      </tr>
    )
  }

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-sm',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted',
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {error
              ? renderStateRow(error, 'error')
              : loading
                ? renderStateRow('Loading...')
                : data.length === 0
                  ? renderStateRow(emptyMessage)
                  : data.map((row, index) => (
                      <tr
                        key={resolveRowKey(row, index, rowKey)}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={cn(
                              'whitespace-nowrap px-4 py-3 text-text',
                              column.className,
                            )}
                          >
                            {column.render
                              ? column.render(row, index)
                              : getDefaultCellValue(row, column.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
