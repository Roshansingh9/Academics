"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { KeyRound, Copy, Check } from "lucide-react";

interface Props {
  userId: string;
  userName: string;
}

export function ResetPasswordButton({ userId, userName }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function handleReset() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to reset password.");
      setConfirmOpen(false);
      return;
    }

    setNewPassword(data.newPassword);
    setConfirmOpen(false);
    setResultOpen(true);
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-7 rounded-lg text-[12px] px-2.5 text-violet-600 hover:text-violet-700 hover:bg-violet-50 border-violet-200"
        onClick={() => { setConfirmOpen(true); setError(""); }}
      >
        <KeyRound className="h-3 w-3 mr-1" />
        Reset Password
      </Button>

      {error && <p className="text-[11px] text-red-600 mt-1 text-right">{error}</p>}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Reset Password"
        description={`Generate a new random password for "${userName}"? They will be required to change it on next login. A new credentials email will be sent.`}
        confirmLabel="Reset Password"
        variant="default"
        onConfirm={handleReset}
        loading={loading}
      />

      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Password Reset</DialogTitle>
            <DialogDescription>
              A new password has been generated for {userName}. An email has been sent to their registered address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-zinc-800 tracking-wider">{newPassword}</span>
              <button
                onClick={copyPassword}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-zinc-200 transition-colors shrink-0"
                title="Copy password"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-zinc-500" />}
              </button>
            </div>
            <p className="text-[12px] text-zinc-500">
              The user must change this password on their next login.
              Keep this secure — it will not be shown again.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
