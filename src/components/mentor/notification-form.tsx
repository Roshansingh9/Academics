"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createNotificationSchema, type CreateNotificationInput } from "@/lib/validations/notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";

interface Student { id: string; name: string; }

export function NotificationForm({ students }: { students: Student[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [target, setTarget] = useState<"ALL" | "SPECIFIC">("ALL");
  const [selectedStudent, setSelectedStudent] = useState("");

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CreateNotificationInput>({
    resolver: zodResolver(createNotificationSchema),
    defaultValues: { target: "ALL" },
  });

  async function onSubmit(data: CreateNotificationInput) {
    setError("");
    const res = await fetch("/api/mentor/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, target, studentId: target === "SPECIFIC" ? selectedStudent : undefined }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(typeof json.error === "string" ? json.error : "Failed to send notification");
      return;
    }
    router.push("/mentor/notifications");
    router.refresh();
  }

  const inputCls = "h-10 rounded-xl border-zinc-200 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500/25 focus-visible:border-indigo-500 transition-all";

  return (
    <div className="max-w-lg bg-white border border-zinc-200 rounded-xl shadow-card p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /><p>{error}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-zinc-700">Title *</Label>
          <Input {...register("title")} placeholder="Notification title" className={inputCls} />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-zinc-700">Message *</Label>
          <Textarea
            {...register("body")}
            placeholder="Write your notification message…"
            rows={4}
            className="rounded-xl border-zinc-200 text-sm resize-none focus-visible:ring-2 focus-visible:ring-indigo-500/25 focus-visible:border-indigo-500 transition-all"
          />
          {errors.body && <p className="text-xs text-red-500">{errors.body.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-zinc-700">Send To *</Label>
          <Select
            value={target}
            onValueChange={(v) => {
              const t = v as "ALL" | "SPECIFIC";
              setTarget(t);
              setValue("target", t);
            }}
          >
            <SelectTrigger className="h-10 rounded-xl border-zinc-200 text-sm transition-all focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-zinc-200 shadow-lg">
              <SelectItem value="ALL">All My Students</SelectItem>
              <SelectItem value="SPECIFIC">Specific Student</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {target === "SPECIFIC" && (
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-zinc-700">Student *</Label>
            <Select
              value={selectedStudent}
              onValueChange={(v) => { setSelectedStudent(v); setValue("studentId", v); }}
            >
              <SelectTrigger className="h-10 rounded-xl border-zinc-200 text-sm transition-all focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500">
                <SelectValue placeholder="Select student…" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-200 shadow-lg">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex gap-2.5 pt-1 border-t border-zinc-100">
          <Button type="submit" disabled={isSubmitting} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[13px] h-9 active:scale-[0.98] transition-all">
            {isSubmitting
              ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Sending…</>
              : "Send Notification"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/mentor/notifications")} className="rounded-lg text-[13px] h-9">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
