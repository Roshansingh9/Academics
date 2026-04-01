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

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/admin/students/${studentId}`, { method: "DELETE" });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
        Delete
      </Button>
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
