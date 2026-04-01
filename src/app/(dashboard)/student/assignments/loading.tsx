export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-40 bg-zinc-200 rounded-lg" />
        <div className="h-4 w-56 bg-zinc-100 rounded-lg" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-xl px-5 py-4 flex items-center gap-4 shadow-card">
            <div className="h-10 w-10 bg-zinc-100 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-48 bg-zinc-200 rounded" />
                <div className="h-5 w-16 bg-zinc-100 rounded-full" />
              </div>
              <div className="h-3 w-32 bg-zinc-100 rounded" />
            </div>
            <div className="h-4 w-4 bg-zinc-100 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
