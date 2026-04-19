export function DashboardContentSkeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      <div className="h-64 rounded-[2.5rem] bg-slate-200" />
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 rounded-[2rem] bg-slate-200" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="h-[600px] rounded-[2.5rem] bg-slate-200 lg:col-span-2" />
        <div className="space-y-12">
          <div className="h-64 rounded-[2.5rem] bg-slate-200" />
          <div className="h-80 rounded-[2.5rem] bg-slate-200" />
        </div>
      </div>
    </div>
  );
}