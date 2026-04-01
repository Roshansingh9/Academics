export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-36 bg-zinc-200 rounded-lg" />
        <div className="h-4 w-56 bg-zinc-100 rounded-lg" />
      </div>
      <div className="bg-white border border-zinc-200 rounded-xl shadow-card overflow-hidden divide-y divide-zinc-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="h-10 w-10 rounded-full bg-zinc-100 shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="h-4 w-32 bg-zinc-200 rounded" />
                <div className="h-3 w-16 bg-zinc-100 rounded" />
              </div>
              <div className="h-3 w-48 bg-zinc-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
