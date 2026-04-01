"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileEditActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handle(action: "APPROVED" | "REJECTED") {
    setLoading(action === "APPROVED" ? "approve" : "reject");
    await fetch(`/api/admin/profile-edits/${requestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNote: note }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Optional note..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-8 text-xs w-36"
      />
      <Button size="sm" variant="outline" className="text-green-600 h-8" onClick={() => handle("APPROVED")} disabled={!!loading}>
        {loading === "approve" ? "..." : "Approve"}
      </Button>
      <Button size="sm" variant="outline" className="text-red-600 h-8" onClick={() => handle("REJECTED")} disabled={!!loading}>
        {loading === "reject" ? "..." : "Reject"}
      </Button>
    </div>
  );
}
