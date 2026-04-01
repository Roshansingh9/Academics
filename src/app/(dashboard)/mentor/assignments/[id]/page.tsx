import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { GradeSubmissionButton } from "@/components/mentor/grade-submission-button";
import { Pencil, ExternalLink } from "lucide-react";

export default async function AssignmentDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const mentor = await prisma.mentor.findUnique({ where: { userId: session!.user.id } });

  const assignment = await prisma.assignment.findFirst({
    where: { id: params.id, mentorId: mentor!.id },
    include: {
      students: { include: { student: { select: { id: true, name: true } } } },
      submissions: {
        include: { student: { select: { id: true, name: true } } },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assignment) notFound();

  const statusConfig = {
    PENDING:  { label: "Submitted", variant: "warning"  as const },
    REVIEWED: { label: "Reviewed",  variant: "info"     as const },
    ACCEPTED: { label: "Accepted",  variant: "success"  as const },
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title={assignment.title} description={`Due: ${formatDate(assignment.dueDate)}`}>
        <div className="flex items-center gap-2">
          <Badge variant={assignment.target === "ALL" ? "info" : "secondary"} className="text-[11px] px-2 py-0.5">
            {assignment.target === "ALL" ? "All Students" : "Specific Students"}
          </Badge>
          <Button asChild size="sm" variant="outline" className="rounded-lg h-8 text-[13px] gap-1.5">
            <Link href={`/mentor/assignments/${assignment.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Description */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-card p-5">
        <p className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">Description</p>
        <p className="text-[14px] text-zinc-700 whitespace-pre-wrap leading-relaxed">{assignment.description}</p>
      </div>

      {/* Relevant links */}
      {assignment.relevantLinks && assignment.relevantLinks.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-card p-5">
          <p className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">Relevant Links</p>
          <div className="space-y-2">
            {assignment.relevantLinks.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-[13px] text-indigo-600 hover:text-indigo-800 hover:underline transition-colors duration-150"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{link}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Submissions */}
      <div className="space-y-3">
        <h2 className="text-[15px] font-semibold text-zinc-900">
          Submissions <span className="text-zinc-400 font-normal">({assignment.submissions.length})</span>
        </h2>

        {assignment.submissions.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl shadow-card px-5 py-8 text-center">
            <p className="text-[13px] text-zinc-400">No submissions yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-xl shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50/70 border-b border-zinc-100">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Submitted</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Feedback</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {assignment.submissions.map((sub) => {
                  const sc = statusConfig[sub.status as keyof typeof statusConfig] ?? statusConfig.PENDING;
                  return (
                    <tr key={sub.id} className="hover:bg-zinc-50/50 transition-colors duration-100">
                      <td className="px-5 py-3.5 font-medium text-[13px] text-zinc-800">{sub.student.name}</td>
                      <td className="px-5 py-3.5 text-[12px] text-zinc-400">{formatDateTime(sub.submittedAt)}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={sc.variant} className="text-[11px] px-2 py-0.5">{sc.label}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-zinc-400 max-w-[200px] truncate">
                        {sub.mentorComment ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <GradeSubmissionButton
                          assignmentId={assignment.id}
                          submissionId={sub.id}
                          content={sub.content}
                          fileUrl={sub.fileUrl ?? undefined}
                          currentComment={sub.mentorComment ?? ""}
                          currentStatus={sub.status}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
