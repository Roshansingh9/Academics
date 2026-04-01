export default function Loading() {
  return (
    <div className="space-y-5 max-w-2xl animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-72 bg-zinc-200 rounded-lg" />
        <div className="h-4 w-48 bg-zinc-100 rounded-lg" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-5 w-32 bg-zinc-100 rounded" />
        <div className="h-5 w-16 bg-zinc-100 rounded-full" />
      </div>
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <div className="h-3 w-24 bg-zinc-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3.5 w-full bg-zinc-100 rounded" />
          <div className="h-3.5 w-5/6 bg-zinc-100 rounded" />
          <div className="h-3.5 w-3/6 bg-zinc-100 rounded" />
        </div>
      </div>
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="h-4 w-36 bg-zinc-200 rounded mb-5" />
        <div className="space-y-3">
          <div className="h-3.5 w-20 bg-zinc-100 rounded" />
          <div className="h-32 w-full bg-zinc-100 rounded-xl" />
          <div className="h-3.5 w-20 bg-zinc-100 rounded mt-1" />
          <div className="h-10 w-full bg-zinc-100 rounded-xl" />
        </div>
        <div className="h-9 w-40 bg-zinc-200 rounded-lg mt-5" />
      </div>
    </div>
  );
}
