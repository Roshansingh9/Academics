import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { BarChart2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function StudentProgressPage() {
  const session = await getServerSession(authOptions);
  const student = await prisma.student.findUnique({ where: { userId: session!.user.id } });

  const submissions = await prisma.submission.findMany({
    where: { studentId: student!.id },
    include: { assignment: { select: { title: true, dueDate: true } } },
    orderBy: { submittedAt: "desc" },
  });

  const graded = submissions.filter((s) => s.status === "ACCEPTED");
  const reviewed = submissions.filter((s) => s.status === "REVIEWED");
  const pending = submissions.filter((s) => s.status === "PENDING");

  return (
    <div className="space-y-6">
      <PageHeader title="My Progress" description="Track your assignment submissions and grades" />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Accepted", count: graded.length, variant: "success" as const },
          { label: "Reviewed", count: reviewed.length, variant: "info" as const },
          { label: "Pending Review", count: pending.length, variant: "warning" as const },
        ].map(({ label, count, variant }) => (
          <div key={label} className="border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{count}</p>
            <Badge variant={variant} className="mt-1">{label}</Badge>
          </div>
        ))}
      </div>

      {submissions.length === 0 ? (
        <EmptyState icon={BarChart2} title="No submissions yet" description="Submit assignments to track your progress." />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Assignment</th>
                <th className="text-left px-4 py-3 font-medium">Submitted</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{s.assignment.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(s.submittedAt)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={s.status === "ACCEPTED" ? "success" : s.status === "REVIEWED" ? "info" : "warning"}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{s.mentorComment ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
