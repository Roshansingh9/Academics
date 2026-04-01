export default function Loading() {
  return (
    <div className="space-y-7 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-48 bg-zinc-200 rounded-lg" />
        <div className="h-4 w-56 bg-zinc-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="h-9 w-9 bg-zinc-100 rounded-lg" />
              <div className="h-3.5 w-3.5 bg-zinc-100 rounded" />
            </div>
            <div className="h-8 w-14 bg-zinc-200 rounded-lg mb-2" />
            <div className="h-3.5 w-28 bg-zinc-100 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-xl px-5 py-4 flex items-center gap-4 shadow-card">
            <div className="h-10 w-10 bg-zinc-100 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-zinc-200 rounded" />
              <div className="h-3 w-28 bg-zinc-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
