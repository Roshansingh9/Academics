export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-36 bg-zinc-200 rounded-lg" />
        <div className="h-4 w-48 bg-zinc-100 rounded-lg" />
      </div>
      <div className="bg-white border border-zinc-200 rounded-xl shadow-card p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <div className="h-9 w-9 rounded-full bg-zinc-100 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-zinc-200 rounded" />
            <div className="h-3 w-16 bg-zinc-100 rounded" />
          </div>
        </div>
        {/* Messages */}
        <div className="px-5 py-4 space-y-4 min-h-[300px]">
          {[false, true, false, false, true].map((right, i) => (
            <div key={i} className={`flex ${right ? "justify-end" : "justify-start"}`}>
              <div className={`h-10 rounded-xl ${right ? "bg-indigo-100 w-48" : "bg-zinc-100 w-56"}`} />
            </div>
          ))}
        </div>
        {/* Input */}
        <div className="border-t border-zinc-100 px-5 py-4">
          <div className="h-10 w-full bg-zinc-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
