import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  UserCheck,
  Mail,
  Phone,
  BookOpen,
  AlertTriangle,
  Users,
  Activity,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default async function MentorDetailPage({ params }: { params: { id: string } }) {
  const mentor = await prisma.mentor.findUnique({
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
      students: {
        select: {
          id: true,
          name: true,
          email: true,
          course: true,
          batch: true,
          status: true,
          user: { select: { userId: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      assignments: {
        include: {
          _count: { select: { submissions: true, students: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      warnings: {
        include: {
          student: { select: { id: true, name: true } },
        },
        orderBy: { issuedAt: "desc" },
        take: 20,
      },
      statusLogs: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { assignments: true, warnings: true, students: true },
      },
    },
  });

  if (!mentor) notFound();

  // Build timeline events
  type TimelineEvent = {
    at: Date;
    label: string;
    sub?: string;
    color: string;
    icon: typeof CheckCircle2;
  };

  const timeline: TimelineEvent[] = [];

  timeline.push({
    at: mentor.user.createdAt,
    label: "Account created",
    sub: `User ID: ${mentor.user.userId}`,
    color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    icon: UserCheck,
  });

  if (mentor.user.emailSentAt) {
    timeline.push({
      at: mentor.user.emailSentAt,
      label: "Welcome email sent",
      sub: mentor.email,
      color: "text-sky-600 bg-sky-50 border-sky-100",
      icon: Mail,
    });
  }

  if (mentor.user.activatedAt) {
    timeline.push({
      at: mentor.user.activatedAt,
      label: "First login / password set",
      color: "text-green-600 bg-green-50 border-green-100",
      icon: CheckCircle2,
    });
  }

  for (const log of mentor.statusLogs) {
    timeline.push({
      at: log.createdAt,
      label: log.isActive ? "Account activated" : "Account deactivated",
      color: log.isActive
        ? "text-green-600 bg-green-50 border-green-100"
        : "text-red-600 bg-red-50 border-red-100",
      icon: log.isActive ? CheckCircle2 : XCircle,
    });
  }

  timeline.sort((a, b) => b.at.getTime() - a.at.getTime());

  const activeStudents = mentor.students.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="space-y-7">
      {/* Back + header */}
      <div className="space-y-1">
        <Link
          href="/admin/mentors"
          className="inline-flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-600 transition-colors mb-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Mentors
        </Link>
        <PageHeader
          title={mentor.name}
          description={mentor.specialization ?? mentor.department ?? "Mentor"}
        >
          <Button asChild size="sm" variant="outline" className="rounded-lg h-8 text-[13px]">
            <Link href={`/admin/mentors/${mentor.id}/edit`}>Edit Profile</Link>
          </Button>
        </PageHeader>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: info + stats + timeline */}
        <div className="xl:col-span-1 space-y-5">
          {/* Profile card */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-lg font-bold shrink-0">
                {mentor.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900 text-[15px] truncate">{mentor.name}</p>
                <span className="font-mono text-[11px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                  {mentor.user.userId}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-[13px]">
              <div className="flex items-center gap-2 text-zinc-600">
                <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{mentor.email}</span>
              </div>
              {mentor.phone && (
                <div className="flex items-center gap-2 text-zinc-600">
                  <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>{mentor.phone}</span>
                </div>
              )}
              {mentor.department && (
                <div className="flex items-center gap-2 text-zinc-600">
                  <UserCheck className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>{mentor.department}</span>
                </div>
              )}
            </div>

            {mentor.bio && (
              <p className="text-[13px] text-zinc-500 leading-relaxed border-t border-zinc-100 pt-3">
                {mentor.bio}
              </p>
            )}

            <div className="border-t border-zinc-100 pt-3">
              {mentor.user.mustChangePassword ? (
                <Badge className="text-[11px] px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-200">
                  Invitation Pending
                </Badge>
              ) : (
                <Badge
                  variant={mentor.isActive ? "success" : "secondary"}
                  className="text-[11px] px-2 py-0.5"
                >
                  {mentor.isActive ? "Active" : "Inactive"}
                </Badge>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Users, label: "Students", value: mentor._count.students, sub: `${activeStudents} active` },
              { icon: BookOpen, label: "Assignments", value: mentor._count.assignments, sub: "total" },
              { icon: AlertTriangle, label: "Warnings", value: mentor._count.warnings, sub: "issued" },
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

        {/* Right column: students, assignments, warnings */}
        <div className="xl:col-span-2 space-y-6">
          {/* Students */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-400" />
                <h3 className="text-[13px] font-semibold text-zinc-700">
                  Assigned Students ({mentor.students.length})
                </h3>
              </div>
              {mentor.students.length > 0 && (
                <Link
                  href={`/admin/students/reassign?fromMentor=${mentor.id}`}
                  className="text-[12px] text-indigo-600 hover:underline"
                >
                  Reassign
                </Link>
              )}
            </div>
            {mentor.students.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-zinc-400">No students assigned yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50/70">
                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                      Course / Batch
                    </th>
                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {mentor.students.map((student) => (
                    <tr key={student.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-[13px] font-medium text-zinc-800">{student.name}</p>
                          <p className="text-[11px] text-zinc-400 font-mono">{student.user.userId}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <p className="text-[13px] text-zinc-500">
                          {student.course ?? <span className="text-zinc-300">—</span>}
                          {student.batch && (
                            <span className="text-zinc-400"> · {student.batch}</span>
                          )}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          variant={student.status === "ACTIVE" ? "success" : "secondary"}
                          className="text-[11px] px-2 py-0.5"
                        >
                          {student.status === "ACTIVE"
                            ? "Active"
                            : student.status === "PASSED_OUT"
                            ? "Passed Out"
                            : "Dropped Out"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Assignments */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100">
              <BookOpen className="h-4 w-4 text-zinc-400" />
              <h3 className="text-[13px] font-semibold text-zinc-700">
                Assignments ({mentor._count.assignments})
                {mentor._count.assignments > 20 && (
                  <span className="text-zinc-400 font-normal"> — showing latest 20</span>
                )}
              </h3>
            </div>
            {mentor.assignments.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-zinc-400">No assignments created yet.</p>
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
                      Submissions
                    </th>
                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {mentor.assignments.map((assignment) => {
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
                              isPastDue ? "text-red-500" : "text-zinc-500"
                            }`}
                          >
                            {formatDate(assignment.dueDate)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[13px] text-zinc-700 font-medium">
                            {assignment._count.submissions}
                            {assignment.target === "SPECIFIC" && (
                              <span className="text-zinc-400 font-normal">
                                /{assignment._count.students}
                              </span>
                            )}
                          </span>
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
                Warnings Issued ({mentor._count.warnings})
                {mentor._count.warnings > 20 && (
                  <span className="text-zinc-400 font-normal"> — showing latest 20</span>
                )}
              </h3>
            </div>
            {mentor.warnings.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-zinc-400">No warnings issued yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50/70">
                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Student
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
                  {mentor.warnings.map((warning) => (
                    <tr key={warning.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-[13px] font-medium text-zinc-800 max-w-[200px] truncate">
                          {warning.title}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-[13px] text-zinc-600">{warning.student.name}</p>
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
