"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html>
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "16px", fontFamily: "sans-serif" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Something went wrong</h2>
          <p style={{ fontSize: "14px", color: "#71717a" }}>{error.message || "An unexpected error occurred."}</p>
          <button onClick={reset} style={{ padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
