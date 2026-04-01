"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface Props {
  mentorId: string;
  isActive: boolean;
  mentorName: string;
}

export function MentorToggleButton({ mentorId, isActive, mentorName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/mentors/${mentorId}/toggle`, { method: "PUT" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to update mentor status.");
      setOpen(false);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        size="sm"
        variant={isActive ? "secondary" : "outline"}
        disabled={loading}
        className={`h-7 rounded-lg text-[12px] px-2.5 ${isActive ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}`}
        onClick={() => { setOpen(true); setError(""); }}
      >
        {isActive ? "Deactivate" : "Activate"}
      </Button>

      {error && (
        <p className="text-[11px] text-red-600 leading-snug max-w-[260px] ml-auto mt-1 text-right">{error}</p>
      )}

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={isActive ? "Deactivate Mentor" : "Activate Mentor"}
        description={
          isActive
            ? `Deactivate "${mentorName}"? They will immediately lose dashboard access. Their assigned students remain unaffected and can still be managed by the admin.`
            : `Activate "${mentorName}"? They will regain full platform access.`
        }
        confirmLabel={isActive ? "Deactivate" : "Activate"}
        variant={isActive ? "destructive" : "default"}
        onConfirm={handleToggle}
        loading={loading}
      />
    </>
  );
}
