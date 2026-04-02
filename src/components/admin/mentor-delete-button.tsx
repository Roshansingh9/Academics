"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import Link from "next/link";

interface MentorDeleteButtonProps {
  mentorId: string;
  mentorName: string;
  studentCount: number;
}

export function MentorDeleteButton({ mentorId, mentorName, studentCount }: MentorDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/mentors/${mentorId}`, { method: "DELETE" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to delete mentor.");
      setOpen(false);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  // Block delete when students are assigned — show inline message instead of dialog
  if (studentCount > 0) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <Button
          size="sm"
          variant="destructive"
          className="h-7 rounded-lg text-[12px] px-2.5 opacity-40 cursor-not-allowed"
          disabled
          title={`Reassign ${studentCount} student${studentCount > 1 ? "s" : ""} before deleting`}
        >
          Delete
        </Button>
        <p className="text-[10px] text-zinc-400 leading-none whitespace-nowrap">
          <Link href={`/admin/students/reassign?fromMentor=${mentorId}`} className="underline hover:text-zinc-600">
            Reassign {studentCount} student{studentCount > 1 ? "s" : ""} first
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="destructive"
        className="h-7 rounded-lg text-[12px] px-2.5"
        onClick={() => { setOpen(true); setError(""); }}
      >
        Delete
      </Button>
      {error && (
        <p className="text-[11px] text-red-600 mt-1 text-right leading-snug max-w-[220px]">{error}</p>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Mentor"
        description={`Are you sure you want to delete "${mentorName}"? This will permanently remove their account and all associated assignments, submissions, messages, and warnings.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={loading}
      />
    </>
  );
}
