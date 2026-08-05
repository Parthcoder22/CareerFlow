// ============================================
// Loading Skeleton Components
// ============================================

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex justify-between">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-10 w-10 rounded-xl" />
      </div>
      <div className="skeleton h-8 w-20" />
      <div className="skeleton h-3 w-32" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-white/5">
      <div className="skeleton h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-48" />
        <div className="skeleton h-3 w-32" />
      </div>
      <div className="skeleton h-6 w-20 rounded-full" />
      <div className="skeleton h-4 w-24" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="skeleton h-6 w-40 mb-6" />
          <div className="skeleton h-64 w-full rounded-xl" />
        </div>
        <div className="glass-card p-6">
          <div className="skeleton h-6 w-40 mb-6" />
          <div className="skeleton h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-10 w-32 rounded-xl" />
      </div>
      <div className="skeleton h-12 w-full rounded-xl" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)}
      </div>
    </div>
  );
}
