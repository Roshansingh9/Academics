"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface StudentDeleteButtonProps {
  studentId: string;
  studentName: string;
}

export function StudentDeleteButton({ studentId, studentName }: StudentDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/students/${studentId}`, { method: "DELETE" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to delete student.");
      setOpen(false);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="destructive" className="h-7 rounded-lg text-[12px] px-2.5" onClick={() => { setOpen(true); setError(""); }}>
        Delete
      </Button>
      {error && (
        <p className="text-[11px] text-red-600 mt-1 text-right leading-snug">{error}</p>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Student"
        description={`Are you sure you want to delete "${studentName}"? This will also remove their account and all associated data.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={loading}
      />
    </>
  );
}
