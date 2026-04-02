import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import { SubmitAssignmentForm } from "@/components/student/submit-assignment-form";
import { Calendar, ExternalLink, MessageSquare } from "lucide-react";
import { isPast } from "date-fns";

export default async function StudentAssignmentDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const student = await prisma.student.findUnique({ where: { userId: session!.user.id } });
  if (!student) notFound();

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: params.id,
      isActive: true,
      OR: [
        { mentorId: student.mentorId, target: "ALL" },
        { students: { some: { studentId: student.id } } },
      ],
    },
    include: {
      mentor: { select: { name: true } },
      submissions: { where: { studentId: student.id } },
    },
  });

  if (!assignment) notFound();

  const submission = assignment.submissions[0];
  const overdue = isPast(new Date(assignment.dueDate)) && !submission;

  const statusConfig = {
    ACCEPTED: { label: "Accepted",  variant: "success"  as const },
    REVIEWED: { label: "Reviewed",  variant: "info"     as const },
    PENDING:  { label: "Submitted", variant: "warning"  as const },
  };
  const sc = submission ? (statusConfig[submission.status as keyof typeof statusConfig] ?? statusConfig.PENDING) : null;

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title={assignment.title}
        description={`Assigned by ${assignment.mentor.name}`}
      />

      {/* Meta strip */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className={`flex items-center gap-1.5 text-[13px] font-medium ${overdue ? "text-red-600" : "text-zinc-500"}`}>
          <Calendar className="h-3.5 w-3.5" />
          Due {formatDate(assignment.dueDate)}
        </span>
        {overdue && <Badge variant="destructive" className="text-[11px] px-2 py-0.5">Overdue</Badge>}
        {sc && <Badge variant={sc.variant} className="text-[11px] px-2 py-0.5">{sc.label}</Badge>}
        {!submission && !overdue && <Badge variant="secondary" className="text-[11px] px-2 py-0.5">Not submitted</Badge>}
      </div>

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

      {/* Submission / feedback */}
      {submission ? (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Your Submission</p>
            <span className="text-[12px] text-zinc-400">{formatDateTime(submission.submittedAt)}</span>
          </div>

          <p className="text-[14px] text-zinc-700 whitespace-pre-wrap leading-relaxed">{submission.content}</p>

          {submission.fileUrl && (
            <a
              href={submission.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] text-indigo-600 hover:text-indigo-800 hover:underline transition-colors duration-150"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View attached file
            </a>
          )}

          {submission.mentorComment && (
            <div className="border-t border-zinc-100 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                <p className="text-[13px] font-semibold text-zinc-700">Mentor Feedback</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                <p className="text-[13px] text-indigo-800 leading-relaxed">{submission.mentorComment}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <SubmitAssignmentForm assignmentId={assignment.id} />
      )}

      {/* Resubmit form — only when mentor has reviewed but not yet accepted */}
      {submission?.status === "REVIEWED" && (
        <SubmitAssignmentForm assignmentId={assignment.id} isResubmit />
      )}
    </div>
  );
}
