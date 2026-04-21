export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-12 w-64 bg-slate-200 rounded-xl" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 rounded-2xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}