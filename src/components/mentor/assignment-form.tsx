"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAssignmentSchema, type CreateAssignmentInput } from "@/lib/validations/assignment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, Plus, X } from "lucide-react";

interface Student { id: string; name: string; }

interface AssignmentFormProps {
  students: Student[];
  mode?: "create" | "edit";
  assignmentId?: string;
  defaultValues?: {
    title?: string;
    description?: string;
    dueDate?: string;
    target?: "ALL" | "SPECIFIC";
    relevantLinks?: string[];
  };
}

const inputCls = "h-10 rounded-xl border-zinc-200 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500/25 focus-visible:border-indigo-500 transition-all";

export function AssignmentForm({ students, mode = "create", assignmentId, defaultValues }: AssignmentFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [target, setTarget] = useState<"ALL" | "SPECIFIC">(defaultValues?.target ?? "ALL");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>(
    defaultValues?.relevantLinks?.length ? defaultValues.relevantLinks : [""]
  );

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CreateAssignmentInput>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      dueDate: defaultValues?.dueDate ?? "",
      target: defaultValues?.target ?? "ALL",
    },
  });

  function toggleStudent(id: string) {
    setSelectedStudents((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  function addLink() { setLinks((l) => [...l, ""]); }
  function removeLink(i: number) { setLinks((l) => l.filter((_, idx) => idx !== i)); }
  function updateLink(i: number, val: string) { setLinks((l) => l.map((x, idx) => idx === i ? val : x)); }

  async function onSubmit(data: CreateAssignmentInput) {
    setError("");
    const validLinks = links.filter((l) => l.trim().length > 0);
    const isEdit = mode === "edit";
    const url = isEdit ? `/api/mentor/assignments/${assignmentId}` : "/api/mentor/assignments";

    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        target,
        relevantLinks: validLinks,
        studentIds: target === "SPECIFIC" ? selectedStudents : undefined,
      }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? `Failed to ${isEdit ? "update" : "create"} assignment`);
      return;
    }

    router.push(isEdit ? `/mentor/assignments/${assignmentId}` : "/mentor/assignments");
    router.refresh();
  }

  return (
    <div className="max-w-2xl bg-white border border-zinc-200 rounded-xl shadow-card p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /><p>{error}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-zinc-700">Title *</Label>
          <Input {...register("title")} placeholder="Assignment title" className={inputCls} />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-zinc-700">Description *</Label>
          <Textarea
            {...register("description")}
            placeholder="Assignment details and requirements…"
            rows={4}
            className="rounded-xl border-zinc-200 text-sm resize-none focus-visible:ring-2 focus-visible:ring-indigo-500/25 focus-visible:border-indigo-500 transition-all"
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-zinc-700">Due Date *</Label>
          <Input type="datetime-local" {...register("dueDate")} className={inputCls} />
          {errors.dueDate && <p className="text-xs text-red-500">{errors.dueDate.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[13px] font-medium text-zinc-700">Relevant Links</Label>
            <button
              type="button"
              onClick={addLink}
              className="flex items-center gap-1 text-[12px] text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />Add Link
            </button>
          </div>
          <div className="space-y-2">
            {links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={link}
                  onChange={(e) => updateLink(i, e.target.value)}
                  placeholder="https://example.com/resource"
                  className={`${inputCls} flex-1`}
                />
                {links.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLink(i)}
                    title="Remove link"
                    className="h-10 w-10 flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-200 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-zinc-700">Assign To *</Label>
          <Select
            value={target}
            onValueChange={(v) => { const t = v as "ALL" | "SPECIFIC"; setTarget(t); setValue("target", t); }}
          >
            <SelectTrigger className="h-10 rounded-xl border-zinc-200 text-sm focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-zinc-200 shadow-lg">
              <SelectItem value="ALL">All My Students</SelectItem>
              <SelectItem value="SPECIFIC">Specific Students</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {target === "SPECIFIC" && (
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-zinc-700">Select Students *</Label>
            <div className="border border-zinc-200 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto bg-zinc-50/50">
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-2.5 cursor-pointer text-[13px] text-zinc-700 hover:text-zinc-900">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(s.id)}
                    onChange={() => toggleStudent(s.id)}
                    className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500/25"
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2.5 pt-1 border-t border-zinc-100">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[13px] h-9 active:scale-[0.98] transition-all"
          >
            {isSubmitting
              ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />{mode === "edit" ? "Saving…" : "Creating…"}</>
              : mode === "edit" ? "Save Changes" : "Create Assignment"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(mode === "edit" && assignmentId ? `/mentor/assignments/${assignmentId}` : "/mentor/assignments")}
            className="rounded-lg text-[13px] h-9"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
