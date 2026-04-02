"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  MoreHorizontal,
  Eye,
  KeyRound,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
  Copy,
  Check,
} from "lucide-react";

interface Props {
  mentorId: string;
  userId: string;
  mentorName: string;
  isActive: boolean;
  studentCount: number;
}

type ActiveDialog =
  | "reset-confirm"
  | "reset-result"
  | "toggle"
  | "delete"
  | null;

export function MentorActionsMenu({
  mentorId,
  userId,
  mentorName,
  isActive,
  studentCount,
}: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState<ActiveDialog>(null);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [copied, setCopied] = useState(false);

  // ── Reset password ──────────────────────────────────────────
  async function handleReset() {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setDialog(null); return; }
    setNewPassword(data.newPassword);
    setDialog("reset-result");
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Toggle active ───────────────────────────────────────────
  async function handleToggle() {
    setLoading(true);
    await fetch(`/api/admin/mentors/${mentorId}/toggle`, { method: "PUT" });
    setLoading(false);
    setDialog(null);
    router.refresh();
  }

  // ── Delete ──────────────────────────────────────────────────
  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/admin/mentors/${mentorId}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) { setDialog(null); return; }
    setDialog(null);
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          {/* View detail */}
          <DropdownMenuItem asChild>
            <Link href={`/admin/mentors/${mentorId}`} className="flex items-center gap-2 cursor-pointer">
              <Eye className="h-3.5 w-3.5" />
              View Details
            </Link>
          </DropdownMenuItem>

          {/* Edit */}
          <DropdownMenuItem asChild>
            <Link href={`/admin/mentors/${mentorId}/edit`} className="flex items-center gap-2 cursor-pointer">
              <Pencil className="h-3.5 w-3.5" />
              Edit Profile
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Reset password */}
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-violet-600 focus:text-violet-700"
            onSelect={() => setDialog("reset-confirm")}
          >
            <KeyRound className="h-3.5 w-3.5" />
            Reset Password
          </DropdownMenuItem>

          {/* Toggle active / inactive */}
          <DropdownMenuItem
            className={`flex items-center gap-2 cursor-pointer ${
              isActive
                ? "text-orange-600 focus:text-orange-700"
                : "text-green-600 focus:text-green-700"
            }`}
            onSelect={() => setDialog("toggle")}
          >
            {isActive ? (
              <ToggleLeft className="h-3.5 w-3.5" />
            ) : (
              <ToggleRight className="h-3.5 w-3.5" />
            )}
            {isActive ? "Deactivate" : "Activate"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Delete — disabled with tooltip when students assigned */}
          {studentCount > 0 ? (
            <DropdownMenuItem disabled className="flex items-center gap-2 opacity-40 cursor-not-allowed">
              <Trash2 className="h-3.5 w-3.5" />
              <span>
                Delete
                <span className="ml-1 text-[11px] font-normal text-zinc-400">
                  (reassign {studentCount} student{studentCount > 1 ? "s" : ""} first)
                </span>
              </span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-700"
              onSelect={() => setDialog("delete")}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Mentor
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Reset password confirm ── */}
      <ConfirmDialog
        open={dialog === "reset-confirm"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Reset Password"
        description={`Generate a new random password for "${mentorName}"? They will be required to change it on next login. A new credentials email will be sent.`}
        confirmLabel="Reset Password"
        variant="default"
        onConfirm={handleReset}
        loading={loading}
      />

      {/* ── New password result ── */}
      <Dialog open={dialog === "reset-result"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Password Reset</DialogTitle>
            <DialogDescription>
              A new password has been generated for {mentorName}. An email has been sent to their registered address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-zinc-800 tracking-wider">
                {newPassword}
              </span>
              <button
                onClick={copyPassword}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-zinc-200 transition-colors shrink-0"
                title="Copy password"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-zinc-500" />
                )}
              </button>
            </div>
            <p className="text-[12px] text-zinc-500">
              The user must change this password on their next login. Keep this secure — it will not be shown again.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Toggle confirm ── */}
      <ConfirmDialog
        open={dialog === "toggle"}
        onOpenChange={(o) => !o && setDialog(null)}
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

      {/* ── Delete confirm ── */}
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(o) => !o && setDialog(null)}
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
