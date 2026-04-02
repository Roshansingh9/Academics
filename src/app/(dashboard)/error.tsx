"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-lg font-semibold text-zinc-800">Something went wrong</h2>
      <p className="text-sm text-zinc-500 max-w-sm text-center">{error.message || "An unexpected error occurred."}</p>
      <Button onClick={reset} size="sm" className="rounded-lg bg-indigo-600 hover:bg-indigo-700">
        Try again
      </Button>
    </div>
  );
}
