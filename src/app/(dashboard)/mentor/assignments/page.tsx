import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { BookOpen, Calendar, Users, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { isPast } from "date-fns";

export default async function MentorAssignmentsPage() {
  const session = await getServerSession(authOptions);
  const mentor = await prisma.mentor.findUnique({ where: { userId: session!.user.id } });

  const assignments = await prisma.assignment.findMany({
    where: { mentorId: mentor!.id },
    include: { _count: { select: { submissions: true, students: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Assignments" description="Manage and track assignments for your students">
        <Button asChild size="sm" className="rounded-lg h-8 text-[13px] bg-indigo-600 hover:bg-indigo-700">
          <Link href="/mentor/assignments/new">Create Assignment</Link>
        </Button>
      </PageHeader>

      {assignments.length === 0 ? (
        <EmptyState icon={BookOpen} title="No assignments yet" description="Create your first assignment for students.">
          <Button asChild size="sm" className="rounded-lg bg-indigo-600 hover:bg-indigo-700">
            <Link href="/mentor/assignments/new">Create Assignment</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-2.5">
          {assignments.map((a) => {
            const overdue = isPast(new Date(a.dueDate));
            return (
              <Link key={a.id} href={`/mentor/assignments/${a.id}`} className="group block">
                <div className="bg-white border border-zinc-200 rounded-xl px-5 py-4 shadow-card hover:shadow-card-hover hover:-translate-y-[1px] transition-all duration-200 ease-out flex items-center gap-5">
                  {/* Icon */}
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4.5 w-4.5 text-indigo-600 h-[18px] w-[18px]" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[14px] text-zinc-800 truncate">{a.title}</span>
                      <Badge variant={a.target === "ALL" ? "info" : "secondary"} className="text-[11px] px-2 py-0.5">
                        {a.target === "ALL" ? "All students" : `${a._count.students} specific`}
                      </Badge>
                      {overdue && <Badge variant="destructive" className="text-[11px] px-2 py-0.5">Overdue</Badge>}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="flex items-center gap-1 text-[12px] text-zinc-400">
                        <Calendar className="h-3 w-3" />
                        Due {formatDate(a.dueDate)}
                      </span>
                      <span className="flex items-center gap-1 text-[12px] text-zinc-400">
                        <Users className="h-3 w-3" />
                        {a._count.submissions} submission{a._count.submissions !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
