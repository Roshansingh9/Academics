"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStudentSchema, updateStudentSchema, type CreateStudentInput, type UpdateStudentInput } from "@/lib/validations/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, CheckCircle, Copy, Check, ImagePlus } from "lucide-react";

interface Mentor { id: string; name: string; specialization: string | null; }

interface StudentFormProps {
  mode: "create" | "edit";
  studentId?: string;
  mentors: Mentor[];
  defaultValues?: Partial<CreateStudentInput>;
}

function CredentialBox({ userId, password, onBack, onAddAnother }: {
  userId: string; password: string; onBack: () => void; onAddAnother: () => void;
}) {
  const [copied, setCopied] = useState<"userId" | "password" | null>(null);
  function copy(text: string, key: "userId" | "password") {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000); });
  }
  return (
    <div className="max-w-md bg-white border border-zinc-200 rounded-xl shadow-card p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900 text-[15px]">Student created successfully</h3>
          <p className="text-[13px] text-zinc-500 mt-0.5">Share these login credentials with the student.</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {[
          { label: "User ID", value: userId, key: "userId" as const },
          { label: "Password", value: password, key: "password" as const },
        ].map(({ label, value, key }) => (
          <div key={key} className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-zinc-400 uppercase tracking-wide font-medium mb-0.5">{label}</p>
              <p className="font-mono text-[14px] font-semibold text-zinc-800 truncate">{value}</p>
            </div>
            <button type="button" onClick={() => copy(value, key)} className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors duration-150 shrink-0">
              {copied === key ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        Credentials have been emailed to the student. They must change their password on first login.
      </p>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onBack} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[13px]">Back to Students</Button>
        <Button size="sm" variant="outline" onClick={onAddAnother} className="rounded-lg text-[13px]">Add Another</Button>
      </div>
    </div>
  );
}

export function StudentForm({ mode, studentId, mentors, defaultValues }: StudentFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<{ userId: string; password: string } | null>(null);
  const [selectedMentor, setSelectedMentor] = useState(defaultValues?.mentorId ?? "");
  const [selectedStatus, setSelectedStatus] = useState((defaultValues as { status?: string })?.status ?? "ACTIVE");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const schema = mode === "create" ? createStudentSchema : updateStudentSchema;
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
    if (file) setAvatarPreview(URL.createObjectURL(file));
    else setAvatarPreview(null);
  }

  async function onSubmit(data: CreateStudentInput | UpdateStudentInput) {
    setError("");

    let avatarUrl: string | undefined;
    if (avatarFile) {
      const fd = new FormData();
      fd.append("file", avatarFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) {
        const json = await uploadRes.json();
        setError(typeof json.error === "string" ? json.error : "Failed to upload avatar");
        return;
      }
      const { url } = await uploadRes.json();
      avatarUrl = url;
    }

    const url = mode === "create" ? "/api/admin/students" : `/api/admin/students/${studentId}`;
    const res = await fetch(url, {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        mentorId: selectedMentor,
        ...(mode === "edit" && { status: selectedStatus }),
        ...(avatarUrl && { avatarUrl }),
      }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error?.message ?? JSON.stringify(json.error) ?? "An error occurred"); return; }
    if (mode === "create") {
      setCreatedCredentials({ userId: json.userId, password: (data as CreateStudentInput).initialPassword });
    } else {
      router.push("/admin/students");
      router.refresh();
    }
  }

  if (createdCredentials) {
    return (
      <CredentialBox
        userId={createdCredentials.userId}
        password={createdCredentials.password}
        onBack={() => { setCreatedCredentials(null); router.push("/admin/students"); router.refresh(); }}
        onAddAnother={() => { setCreatedCredentials(null); setAvatarFile(null); setAvatarPreview(null); }}
      />
    );
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

        <div className="grid grid-cols-2 gap-4">
          {/* Avatar upload */}
          {mode === "create" && (
            <div className="col-span-2 space-y-1.5">
              <Label className="text-[13px] font-medium text-zinc-700">
                Profile Picture <span className="text-zinc-400 font-normal">(optional)</span>
              </Label>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                    : <ImagePlus className="h-5 w-5 text-zinc-400" />}
                </div>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarChange}
                  className="h-10 rounded-xl border-zinc-200 text-sm file:text-indigo-600 file:font-medium file:bg-transparent file:border-0 file:mr-3 cursor-pointer"
                />
              </div>
            </div>
          )}

          <div className="col-span-2 space-y-1.5">
            <Label className="text-[13px] font-medium text-zinc-700">Full Name *</Label>
            <Input {...register("name")} placeholder="John Doe" className={inputCls} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message as string}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-zinc-700">Email *</Label>
            <Input type="email" {...register("email")} placeholder="john@example.com" className={inputCls} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message as string}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-zinc-700">Phone</Label>
            <Input {...register("phone")} placeholder="+977 98..." className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-zinc-700">Course</Label>
            <Input {...register("course")} placeholder="BSc. CSIT" className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-zinc-700">Batch</Label>
            <Input {...register("batch")} placeholder="2026" className={inputCls} />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label className="text-[13px] font-medium text-zinc-700">Assigned Mentor *</Label>
            <Select value={selectedMentor} onValueChange={(val) => { setSelectedMentor(val); setValue("mentorId" as keyof (CreateStudentInput | UpdateStudentInput), val as never); }}>
              <SelectTrigger className="h-10 rounded-xl border-zinc-200 text-sm focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all">
                <SelectValue placeholder="Select a mentor…" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-200 shadow-lg">
                {mentors.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-sm">
                    {m.name}{m.specialization ? ` — ${m.specialization}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(errors as { mentorId?: { message: string } }).mentorId && (
              <p className="text-xs text-red-500">{(errors as { mentorId?: { message: string } }).mentorId?.message}</p>
            )}
          </div>

          {mode === "edit" && (
            <div className="col-span-2 space-y-1.5">
              <Label className="text-[13px] font-medium text-zinc-700">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-10 rounded-xl border-zinc-200 text-sm transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-200 shadow-lg">
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PASSED_OUT">Passed Out</SelectItem>
                  <SelectItem value="DROPPED_OUT">Dropped Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === "create" && (
            <div className="col-span-2 space-y-1.5">
              <Label className="text-[13px] font-medium text-zinc-700">Initial Password *</Label>
              <Input type="text" {...register("initialPassword")} placeholder="Min. 8 characters, 1 number" className={`${inputCls} font-mono`} />
              {(errors as { initialPassword?: { message: string } }).initialPassword && (
                <p className="text-xs text-red-500">{(errors as { initialPassword?: { message: string } }).initialPassword?.message}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2.5 pt-1 border-t border-zinc-100">
          <Button type="submit" disabled={isSubmitting} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[13px] h-9 active:scale-[0.98] transition-all">
            {isSubmitting
              ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />{mode === "create" ? "Creating…" : "Saving…"}</>
              : mode === "create" ? "Create Student" : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/students")} className="rounded-lg text-[13px] h-9">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
