/**
 * Reusable data table component with loading and empty states.
 */

import { Loader2 } from 'lucide-react';

interface DataTableColumn<T> {
  headerLabel: string;
  accessorKey?: keyof T;
  renderCell?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProperties<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyStateMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  isLoading = false,
  emptyStateMessage = 'No data available',
  onRowClick,
}: DataTableProperties<T>) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-raahi-500" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-primary">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-primary bg-surface-secondary">
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary ${column.className || ''}`}
              >
                {column.headerLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-primary">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm text-text-muted"
              >
                {emptyStateMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`bg-surface-primary transition-colors hover:bg-surface-hover ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-4 py-3.5 text-sm text-text-primary ${column.className || ''}`}
                  >
                    {column.renderCell
                      ? column.renderCell(row)
                      : column.accessorKey
                        ? String(row[column.accessorKey] ?? '')
                        : ''}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
