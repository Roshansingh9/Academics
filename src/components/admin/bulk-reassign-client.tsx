"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, CheckSquare, Square } from "lucide-react";

interface Mentor {
  id: string;
  name: string;
  email: string;
  _count: { students: number };
}

interface Student {
  id: string;
  name: string;
  email: string;
  course: string | null;
  mentor: { id: string; name: string };
}

interface Props {
  mentors: Mentor[];
  allStudents: Student[];
}

export function BulkReassignClient({ mentors, allStudents }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fromMentorId, setFromMentorId] = useState(searchParams.get("fromMentor") ?? "");
  const [toMentorId, setToMentorId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const filteredStudents = fromMentorId
    ? allStudents.filter((s) => s.mentor.id === fromMentorId)
    : allStudents;

  // Auto-select all when source mentor changes
  useEffect(() => {
    setSelected(new Set(filteredStudents.map((s) => s.id)));
    setResult("");
    setError("");
  }, [fromMentorId]);

  function toggleStudent(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filteredStudents.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredStudents.map((s) => s.id)));
    }
  }

  async function handleSubmit() {
    if (!toMentorId) { setError("Select a target mentor."); return; }
    if (toMentorId === fromMentorId) { setError("Source and target mentor must be different."); return; }
    if (selected.size === 0) { setError("Select at least one student."); return; }

    setLoading(true);
    setError("");
    setResult("");

    const res = await fetch("/api/admin/students/bulk-reassign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentIds: Array.from(selected), newMentorId: toMentorId }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Reassignment failed.");
      return;
    }

    setResult(`Successfully reassigned ${data.reassigned} student${data.reassigned !== 1 ? "s" : ""} to ${data.toMentor}.`);
    setSelected(new Set());
    router.refresh();
  }

  const allChecked = filteredStudents.length > 0 && selected.size === filteredStudents.length;
  const someChecked = selected.size > 0 && selected.size < filteredStudents.length;

  return (
    <div className="space-y-6">
      {/* Mentor selectors */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">From Mentor</label>
            <select
              value={fromMentorId}
              onChange={(e) => setFromMentorId(e.target.value)}
              className="w-full h-9 rounded-xl border border-zinc-200 bg-white text-sm px-3 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
            >
              <option value="">All mentors</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m._count.students} students)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-center pb-1.5">
            <ArrowRight className="h-5 w-5 text-zinc-400" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">To Mentor (Target)</label>
            <select
              value={toMentorId}
              onChange={(e) => setToMentorId(e.target.value)}
              className="w-full h-9 rounded-xl border border-zinc-200 bg-white text-sm px-3 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
            >
              <option value="">Select target mentor…</option>
              {mentors
                .filter((m) => m.id !== fromMentorId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m._count.students} students)
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Student list */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
          <Users className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">No students to display. Select a source mentor.</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/70">
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 text-[13px] font-medium text-zinc-700 hover:text-zinc-900"
            >
              {allChecked ? (
                <CheckSquare className="h-4 w-4 text-indigo-600" />
              ) : someChecked ? (
                <CheckSquare className="h-4 w-4 text-zinc-400" />
              ) : (
                <Square className="h-4 w-4 text-zinc-400" />
              )}
              {selected.size === 0 ? "Select all" : `${selected.size} selected`}
            </button>
            <span className="text-[12px] text-zinc-400">{filteredStudents.length} students</span>
          </div>

          <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto">
            {filteredStudents.map((student) => (
              <label
                key={student.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(student.id)}
                  onChange={() => toggleStudent(student.id)}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-zinc-800 truncate">{student.name}</p>
                  <p className="text-[12px] text-zinc-400 truncate">{student.email}{student.course ? ` · ${student.course}` : ""}</p>
                </div>
                <span className="text-[11px] text-zinc-400 shrink-0">{student.mentor.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
      {result && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">{result}</p>}

      {/* Action */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" className="rounded-lg" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          className="rounded-lg bg-indigo-600 hover:bg-indigo-700"
          disabled={loading || selected.size === 0 || !toMentorId}
          onClick={handleSubmit}
        >
          {loading ? "Reassigning…" : `Reassign ${selected.size > 0 ? selected.size : ""} Student${selected.size !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );
}
