"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

interface Props {
  student: { name: string; phone: string; course: string; batch: string };
  hasPendingRequest: boolean;
}

export function EditProfileButton({ student, hasPendingRequest }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(student);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/student/profile-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to submit");
      return;
    }
    setSuccess(true);
    setTimeout(() => { setOpen(false); setSuccess(false); router.refresh(); }, 1500);
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={hasPendingRequest}>
        <Pencil className="h-4 w-4 mr-2" />
        {hasPendingRequest ? "Edit Pending Approval" : "Edit Profile"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Changes will be sent to admin for approval.</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">Request submitted successfully!</p>}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Course</Label>
              <Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Batch</Label>
              <Input value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>{loading ? "Submitting..." : "Submit for Approval"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
