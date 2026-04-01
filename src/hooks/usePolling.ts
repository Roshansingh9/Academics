"use client";

import { useCallback, useEffect, useRef } from "react";

export function usePolling(
  fetchFn: () => Promise<void>,
  intervalMs: number = 5000,
  enabled: boolean = true
) {
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  useEffect(() => {
    if (!enabled) return;

    let id: ReturnType<typeof setInterval>;

    function start() {
      id = setInterval(() => {
        if (document.visibilityState === "visible") {
          fetchRef.current();
        }
      }, intervalMs);
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        fetchRef.current();
      }
    }

    start();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [intervalMs, enabled]);
}
