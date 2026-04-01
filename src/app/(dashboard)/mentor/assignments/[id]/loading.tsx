export default function Loading() {
  return (
    <div className="space-y-6 max-w-4xl animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-72 bg-zinc-200 rounded-lg" />
          <div className="h-4 w-32 bg-zinc-100 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-24 bg-zinc-100 rounded-full" />
          <div className="h-8 w-20 bg-zinc-100 rounded-lg" />
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <div className="h-3 w-24 bg-zinc-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3.5 w-full bg-zinc-100 rounded" />
          <div className="h-3.5 w-5/6 bg-zinc-100 rounded" />
          <div className="h-3.5 w-4/6 bg-zinc-100 rounded" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-5 w-40 bg-zinc-200 rounded" />
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="bg-zinc-50 px-5 py-3 flex gap-8 border-b border-zinc-100">
            {["w-24", "w-28", "w-20", "w-32", "w-20"].map((w, i) => (
              <div key={i} className={`h-3 ${w} bg-zinc-200 rounded`} />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-5 py-3.5 border-b border-zinc-100 last:border-0">
              <div className="h-4 w-24 bg-zinc-200 rounded" />
              <div className="h-3.5 w-28 bg-zinc-100 rounded" />
              <div className="h-5 w-20 bg-zinc-100 rounded-full" />
              <div className="h-3.5 w-32 bg-zinc-100 rounded" />
              <div className="h-7 w-20 bg-zinc-200 rounded-lg ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
