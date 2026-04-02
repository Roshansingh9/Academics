"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Paperclip, Send } from "lucide-react";

export function SubmitAssignmentForm({ assignmentId, isResubmit = false }: { assignmentId: string; isResubmit?: boolean }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) { setError("Please write your submission."); return; }

    setError("");
    setSubmitting(true);

    let fileUrl: string | undefined;
    if (file) {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      setUploading(false);
      if (!uploadRes.ok) {
        const json = await uploadRes.json();
        setError(typeof json.error === "string" ? json.error : "File upload failed");
        setSubmitting(false);
        return;
      }
      const { url } = await uploadRes.json();
      fileUrl = url;
    }

    const res = await fetch(`/api/student/assignments/${assignmentId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, fileUrl }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const json = await res.json();
      setError(typeof json.error === "string" ? json.error : "Submission failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-card p-6">
      <h2 className="text-[15px] font-semibold text-zinc-900 mb-5">{isResubmit ? "Resubmit Your Work" : "Submit Your Work"}</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /><p>{error}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-zinc-700">Your Answer *</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your submission here…"
            rows={6}
            className="rounded-xl border-zinc-200 text-sm resize-none focus-visible:ring-2 focus-visible:ring-indigo-500/25 focus-visible:border-indigo-500 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-zinc-700 flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5 text-zinc-400" />
            Attach File <span className="text-zinc-400 font-normal">(optional)</span>
          </Label>
          <Input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip"
            className="h-10 rounded-xl border-zinc-200 text-sm file:text-indigo-600 file:font-medium file:bg-transparent file:border-0 file:mr-3 cursor-pointer transition-all"
          />
          <p className="text-[12px] text-zinc-400">PDF, Word, images, ZIP — max 10 MB</p>
        </div>

        <div className="pt-1 border-t border-zinc-100">
          <Button
            type="submit"
            disabled={submitting || uploading}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[13px] h-9 active:scale-[0.98] transition-all"
          >
            {uploading ? (
              <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Uploading file…</>
            ) : submitting ? (
              <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Submitting…</>
            ) : (
              <><Send className="h-3.5 w-3.5 mr-2" />{isResubmit ? "Resubmit Assignment" : "Submit Assignment"}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
