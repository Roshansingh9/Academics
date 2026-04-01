import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { ClipboardList, Calendar, ArrowRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { isPast } from "date-fns";

export default async function StudentAssignmentsPage() {
  const session = await getServerSession(authOptions);
  const student = await prisma.student.findUnique({ where: { userId: session!.user.id } });

  const assignments = await prisma.assignment.findMany({
    where: {
      isActive: true,
      OR: [
        { mentorId: student!.mentorId, target: "ALL" },
        { students: { some: { studentId: student!.id } } },
      ],
    },
    include: {
      submissions: { where: { studentId: student!.id }, select: { id: true, status: true, mentorComment: true } },
      mentor: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const statusConfig = {
    ACCEPTED: { label: "Accepted",  variant: "success"  as const, icon: CheckCircle2 },
    REVIEWED: { label: "Reviewed",  variant: "info"     as const, icon: Clock },
    PENDING:  { label: "Submitted", variant: "warning"  as const, icon: Clock },
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Assignments" description="Assignments from your mentor" />

      {assignments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assignments yet" description="Your mentor hasn't assigned anything yet." />
      ) : (
        <div className="space-y-2.5">
          {assignments.map((a) => {
            const submission = a.submissions[0];
            const overdue = isPast(new Date(a.dueDate)) && !submission;
            const sc = submission ? statusConfig[submission.status as keyof typeof statusConfig] : null;

            return (
              <Link key={a.id} href={`/student/assignments/${a.id}`} className="group block">
                <div className={`bg-white border rounded-xl px-5 py-4 shadow-card hover:shadow-card-hover hover:-translate-y-[1px] transition-all duration-200 ease-out flex items-center gap-4 ${overdue ? "border-red-200" : "border-zinc-200"}`}>
                  {/* Status icon */}
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    sc?.variant === "success" ? "bg-emerald-50 border-emerald-100" :
                    sc?.variant === "info"    ? "bg-sky-50 border-sky-100" :
                    sc?.variant === "warning" ? "bg-amber-50 border-amber-100" :
                    overdue                  ? "bg-red-50 border-red-100" :
                                               "bg-zinc-50 border-zinc-100"
                  }`}>
                    {sc ? (
                      <sc.icon className={`h-[18px] w-[18px] ${
                        sc.variant === "success" ? "text-emerald-600" :
                        sc.variant === "info"    ? "text-sky-600" : "text-amber-600"
                      }`} />
                    ) : overdue ? (
                      <AlertCircle className="h-[18px] w-[18px] text-red-500" />
                    ) : (
                      <ClipboardList className="h-[18px] w-[18px] text-zinc-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-[14px] text-zinc-800">{a.title}</span>
                      {sc && <Badge variant={sc.variant} className="text-[11px] px-2 py-0.5">{sc.label}</Badge>}
                      {!submission && !overdue && <Badge variant="secondary" className="text-[11px] px-2 py-0.5">Pending</Badge>}
                      {overdue && <Badge variant="destructive" className="text-[11px] px-2 py-0.5">Overdue</Badge>}
                    </div>
                    <div className="flex items-center gap-1 text-[12px] text-zinc-400">
                      <Calendar className="h-3 w-3" />
                      <span>By {a.mentor.name} · Due {formatDate(a.dueDate)}</span>
                    </div>
                    {submission?.mentorComment && sc?.variant !== "success" && (
                      <p className="text-[12px] text-indigo-600 mt-1.5 truncate">
                        Feedback: {submission.mentorComment}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button asChild size="sm" variant={submission ? "outline" : "default"} className={`rounded-lg text-[12px] h-7 px-3 ${!submission ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}>
                      <span>{submission ? "View" : "Submit"}</span>
                    </Button>
                    <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all duration-150" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
