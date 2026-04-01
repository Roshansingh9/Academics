"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export function WarningDeleteButton({ warningId }: { warningId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/mentor/warnings/${warningId}`, { method: "DELETE" });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>Revoke</Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Revoke Warning"
        description="Are you sure you want to revoke this warning?"
        confirmLabel="Revoke"
        onConfirm={handleDelete}
        loading={loading}
      />
    </>
  );
}
