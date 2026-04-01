"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface MentorDeleteButtonProps {
  mentorId: string;
  mentorName: string;
}

export function MentorDeleteButton({ mentorId, mentorName }: MentorDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/admin/mentors/${mentorId}`, { method: "DELETE" });
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
        title="Delete Mentor"
        description={`Are you sure you want to delete "${mentorName}"? This will also remove their account and all associated data.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={loading}
      />
    </>
  );
}
