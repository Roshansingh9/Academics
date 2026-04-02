"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createWarningSchema, type CreateWarningInput } from "@/lib/validations/warning";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";

interface Student { id: string; name: string; }

export function WarningForm({ students }: { students: Student[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CreateWarningInput>({
    resolver: zodResolver(createWarningSchema),
  });

  async function onSubmit(data: CreateWarningInput) {
    setError("");
    const res = await fetch("/api/mentor/warnings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, studentId: selectedStudent }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(typeof json.error === "string" ? json.error : "Failed to issue warning");
      return;
    }

    router.push("/mentor/warnings");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      <div className="space-y-2">
        <Label>Student *</Label>
        <Select value={selectedStudent} onValueChange={(v) => { setSelectedStudent(v); setValue("studentId", v); }}>
          <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
          <SelectContent>
            {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.studentId && <p className="text-xs text-red-500">{errors.studentId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Warning Title *</Label>
        <Input id="title" {...register("title")} placeholder="Attendance Warning, Misconduct Warning..." />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason *</Label>
        <Textarea id="reason" {...register("reason")} placeholder="Detailed reason for the warning..." rows={4} />
        {errors.reason && <p className="text-xs text-red-500">{errors.reason.message}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Issuing...</> : "Issue Warning"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/mentor/warnings")}>Cancel</Button>
      </div>
    </form>
  );
}
