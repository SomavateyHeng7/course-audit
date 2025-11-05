
interface Column<T> {
  key: keyof T | string;
  label: string;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
}

function LoadingSpinner() {
  return (
    <div role="status" aria-label="Loading" className="flex items-center justify-center p-4">
      <svg className="animate-spin h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
    </div>
  );
}

export function DataTable<T extends Record<string, any>>({
  data, columns, loading = false, emptyState, className = ""
}: DataTableProps<T>) {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (data.length === 0) {
    return emptyState || (
      <div className="p-6 text-center text-muted-foreground">
        <div className="text-lg font-medium">No data</div>
        <div className="text-sm">No items to display</div>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-xl border border-border ${className}`}>
      {/* Desktop Table Header */}
      <div className="hidden lg:grid gap-4 p-4 border-b border-border font-medium text-sm text-muted-foreground"
           style={{ gridTemplateColumns: columns.map(col => col.className || '1fr').join(' ') }}>
        {columns.map((column) => (
          <div key={String(column.key)}>{column.label}</div>
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-border">
        {data.map((item, index) => (
          <div
            key={item.id || index}
            className="p-4 lg:grid gap-4 lg:items-center hover:bg-muted/50 transition-colors"
            style={{ gridTemplateColumns: columns.map(col => col.className || '1fr').join(' ') }}
          >
            {columns.map((column) => (
              <div key={String(column.key)} className="mb-3 lg:mb-0">
                {column.render ? column.render(item) : item[column.key]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}