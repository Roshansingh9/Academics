import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  Mail,
  Phone,
  BookOpen,
  AlertTriangle,
  Activity,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  UserCheck,
  ClipboardList,
} from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  PASSED_OUT: "Passed Out",
  DROPPED_OUT: "Dropped Out",
};

const STATUS_VARIANT: Record<string, "success" | "secondary" | "destructive"> = {
  ACTIVE: "success",
  PASSED_OUT: "secondary",
  DROPPED_OUT: "destructive",
};

const SUBMISSION_LABEL: Record<string, string> = {
  PENDING: "Pending",
  REVIEWED: "Reviewed",
  ACCEPTED: "Accepted",
};

const SUBMISSION_COLOR: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  REVIEWED: "bg-blue-50 text-blue-700 border-blue-200",
  ACCEPTED: "bg-green-50 text-green-700 border-green-200",
};

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          userId: true,
          createdAt: true,
          emailSentAt: true,
          activatedAt: true,
          mustChangePassword: true,
        },
      },
      mentor: {
        select: { id: true, name: true, email: true, specialization: true, isActive: true },
      },
      statusLogs: { orderBy: { createdAt: "desc" } },
      warnings: {
        include: { mentor: { select: { name: true } } },
        orderBy: { issuedAt: "desc" },
        take: 20,
      },
      submissions: {
        include: {
          assignment: { select: { title: true, dueDate: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: 20,
      },
      _count: { select: { warnings: true, submissions: true } },
    },
  });

  if (!student) notFound();

  // Fetch all assignments this student has access to (ALL target from their mentor + SPECIFIC assigned to them)
  const assignments = await prisma.assignment.findMany({
    where: {
      OR: [
        { target: "ALL", mentorId: student.mentorId },
        { target: "SPECIFIC", students: { some: { studentId: student.id } } },
      ],
    },
    include: {
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Build submission lookup for quick access
  const submissionByAssignment = new Map(
    student.submissions.map((s) => [s.assignmentId, s])
  );

  // Build timeline
  type TimelineEvent = {
    at: Date;
    label: string;
    sub?: string;
    color: string;
    icon: typeof CheckCircle2;
  };

  const timeline: TimelineEvent[] = [];

  timeline.push({
    at: student.user.createdAt,
    label: "Account created",
    sub: `User ID: ${student.user.userId}`,
    color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    icon: UserCheck,
  });

  if (student.user.emailSentAt) {
    timeline.push({
      at: student.user.emailSentAt,
      label: "Welcome email sent",
      sub: student.email,
      color: "text-sky-600 bg-sky-50 border-sky-100",
      icon: Mail,
    });
  }

  if (student.user.activatedAt) {
    timeline.push({
      at: student.user.activatedAt,
      label: "First login / password set",
      color: "text-green-600 bg-green-50 border-green-100",
      icon: CheckCircle2,
    });
  }

  for (const log of student.statusLogs) {
    timeline.push({
      at: log.createdAt,
      label:
        log.status === "ACTIVE"
          ? "Status set to Active"
          : log.status === "PASSED_OUT"
          ? "Marked as Passed Out"
          : "Marked as Dropped Out",
      color:
        log.status === "ACTIVE"
          ? "text-green-600 bg-green-50 border-green-100"
          : log.status === "PASSED_OUT"
          ? "text-zinc-600 bg-zinc-50 border-zinc-200"
          : "text-red-600 bg-red-50 border-red-100",
      icon: log.status === "ACTIVE" ? CheckCircle2 : XCircle,
    });
  }

  timeline.sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <div className="space-y-7">
      {/* Back + header */}
      <div className="space-y-1">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-600 transition-colors mb-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Students
        </Link>
        <PageHeader
          title={student.name}
          description={
            student.course
              ? `${student.course}${student.batch ? ` · Batch ${student.batch}` : ""}`
              : "Student"
          }
        >
          <Button asChild size="sm" variant="outline" className="rounded-lg h-8 text-[13px]">
            <Link href={`/admin/students/${student.id}/edit`}>Edit Profile</Link>
          </Button>
        </PageHeader>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="xl:col-span-1 space-y-5">
          {/* Profile card */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-lg font-bold shrink-0">
                {student.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900 text-[15px] truncate">{student.name}</p>
                <span className="font-mono text-[11px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                  {student.user.userId}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-[13px]">
              <div className="flex items-center gap-2 text-zinc-600">
                <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{student.email}</span>
              </div>
              {student.phone && (
                <div className="flex items-center gap-2 text-zinc-600">
                  <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>{student.phone}</span>
                </div>
              )}
            </div>

            {/* Mentor */}
            <div className="border-t border-zinc-100 pt-3 space-y-1">
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Mentor</p>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/mentors/${student.mentor.id}`}
                  className="text-[13px] text-indigo-600 hover:underline font-medium"
                >
                  {student.mentor.name}
                </Link>
                {!student.mentor.isActive && (
                  <span className="text-[10px] font-medium bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              {student.mentor.specialization && (
                <p className="text-[12px] text-zinc-400">{student.mentor.specialization}</p>
              )}
            </div>

            <div className="border-t border-zinc-100 pt-3">
              {student.user.mustChangePassword ? (
                <Badge className="text-[11px] px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-200">
                  Invitation Pending
                </Badge>
              ) : (
                <Badge
                  variant={STATUS_VARIANT[student.status] ?? "secondary"}
                  className="text-[11px] px-2 py-0.5"
                >
                  {STATUS_LABEL[student.status] ?? student.status}
                </Badge>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: BookOpen, label: "Assignments", value: assignments.length, sub: "available" },
              { icon: ClipboardList, label: "Submissions", value: student._count.submissions, sub: "total" },
              { icon: AlertTriangle, label: "Warnings", value: student._count.warnings, sub: "received" },
              {
                icon: CheckCircle2,
                label: "Accepted",
                value: student.submissions.filter((s) => s.status === "ACCEPTED").length,
                sub: "submissions",
              },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div
                key={label}
                className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-card text-center"
              >
                <Icon className="h-4 w-4 text-zinc-400 mx-auto mb-1.5" />
                <p className="text-[22px] font-bold text-zinc-900 leading-none">{value}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">{sub}</p>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Activity timeline */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-zinc-400" />
              <h3 className="text-[13px] font-semibold text-zinc-700">Activity Timeline</h3>
            </div>
            <div className="space-y-3">
              {timeline.map((event, i) => {
                const Icon = event.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${event.color}`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-zinc-700">{event.label}</p>
                      {event.sub && (
                        <p className="text-[12px] text-zinc-400 truncate">{event.sub}</p>
                      )}
                      <p className="text-[11px] text-zinc-300 mt-0.5">{formatDateTime(event.at)}</p>
                    </div>
                  </div>
                );
              })}
              {timeline.length === 0 && (
                <p className="text-[13px] text-zinc-400">No activity recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Assignments */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100">
              <BookOpen className="h-4 w-4 text-zinc-400" />
              <h3 className="text-[13px] font-semibold text-zinc-700">
                Assignments ({assignments.length})
                {assignments.length >= 20 && (
                  <span className="text-zinc-400 font-normal"> — showing latest 20</span>
                )}
              </h3>
            </div>
            {assignments.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-zinc-400">No assignments yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50/70">
                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                      Due
                    </th>
                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Submission
                    </th>
                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {assignments.map((assignment) => {
                    const submission = submissionByAssignment.get(assignment.id);
                    const isPastDue = new Date(assignment.dueDate) < new Date();
                    return (
                      <tr key={assignment.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-[13px] font-medium text-zinc-800 max-w-[220px] truncate">
                            {assignment.title}
                          </p>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span
                            className={`text-[13px] ${
                              isPastDue && !submission ? "text-red-500 font-medium" : "text-zinc-500"
                            }`}
                          >
                            {formatDate(assignment.dueDate)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {submission ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                SUBMISSION_COLOR[submission.status] ?? ""
                              }`}
                            >
                              {SUBMISSION_LABEL[submission.status] ?? submission.status}
                            </span>
                          ) : (
                            <span className="text-[12px] text-zinc-400 italic">Not submitted</span>
                          )}
                        </td>
                        <td className="px-5 py-3 hidden lg:table-cell">
                          <Badge
                            variant={assignment.isActive ? "success" : "secondary"}
                            className="text-[11px] px-2 py-0.5"
                          >
                            {assignment.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Warnings */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100">
              <AlertTriangle className="h-4 w-4 text-zinc-400" />
              <h3 className="text-[13px] font-semibold text-zinc-700">
                Warnings Received ({student._count.warnings})
                {student._count.warnings > 20 && (
                  <span className="text-zinc-400 font-normal"> — showing latest 20</span>
                )}
              </h3>
            </div>
            {student.warnings.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-zinc-400">No warnings issued.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50/70">
                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                      Issued By
                    </th>
                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">
                      Reason
                    </th>
                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hidden xl:table-cell">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {student.warnings.map((warning) => (
                    <tr key={warning.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <p className="text-[13px] font-medium text-zinc-800 max-w-[200px] truncate">
                            {warning.title}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className="text-[13px] text-zinc-600">{warning.mentor.name}</span>
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <p className="text-[13px] text-zinc-500 max-w-[260px] truncate">
                          {warning.reason}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-zinc-400 text-[12px] hidden xl:table-cell">
                        {formatDateTime(warning.issuedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
