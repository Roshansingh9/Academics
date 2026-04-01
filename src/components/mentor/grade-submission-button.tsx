"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Props {
  assignmentId: string;
  submissionId: string;
  content: string;
  fileUrl?: string;
  currentComment: string;
  currentStatus: string;
}

export function GradeSubmissionButton({ assignmentId, submissionId, content, fileUrl, currentComment, currentStatus }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState(currentComment);
  const [status, setStatus] = useState(currentStatus === "PENDING" ? "REVIEWED" : currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    await fetch(`/api/mentor/assignments/${assignmentId}/submissions/${submissionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentorComment: comment, status }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Review</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Review Submission</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Submission Content</Label>
              <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">{content}</div>
            </div>
            {fileUrl && (
              <a href={fileUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">View attached file</a>
            )}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Feedback Comment</Label>
              <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Optional feedback..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save Review"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
