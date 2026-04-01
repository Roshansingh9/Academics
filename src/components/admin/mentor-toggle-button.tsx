"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import Link from "next/link";

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
  const [detail, setDetail] = useState("");

  async function handleToggle() {
    setLoading(true);
    setError("");
    setDetail("");
    const res = await fetch(`/api/admin/mentors/${mentorId}/toggle`, { method: "PUT" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to update mentor status.");
      setDetail(data.detail ?? "");
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
        onClick={() => { setOpen(true); setError(""); setDetail(""); }}
      >
        {isActive ? "Deactivate" : "Activate"}
      </Button>

      {error && (
        <div className="mt-1 text-right space-y-0.5">
          <p className="text-[11px] text-red-600 leading-snug max-w-[260px] ml-auto">{error}</p>
          {detail && <p className="text-[11px] text-zinc-500 leading-snug max-w-[260px] ml-auto">{detail}</p>}
          {error.includes("assigned") && (
            <Link
              href={`/admin/students/reassign?fromMentor=${mentorId}`}
              className="text-[11px] text-indigo-600 hover:underline block"
            >
              Reassign students →
            </Link>
          )}
        </div>
      )}

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={isActive ? "Deactivate Mentor" : "Activate Mentor"}
        description={
          isActive
            ? `Deactivate "${mentorName}"? They will immediately lose dashboard access. All their students must be reassigned first.`
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
