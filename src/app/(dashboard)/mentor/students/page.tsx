import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";

export default async function MentorStudentsPage() {
  const session = await getServerSession(authOptions);
  const mentor = await prisma.mentor.findUnique({ where: { userId: session!.user.id } });

  const students = await prisma.student.findMany({
    where: { mentorId: mentor!.id },
    include: {
      user: { select: { userId: true } },
      _count: { select: { submissions: true, warnings: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="My Students" description={`${students.length} students assigned to you`} />

      {students.length === 0 ? (
        <EmptyState icon={Users} title="No students assigned" description="Students will appear here once assigned by admin." />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">User ID</th>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Course</th>
                <th className="text-left px-4 py-3 font-medium">Submissions</th>
                <th className="text-left px-4 py-3 font-medium">Warnings</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{student.user.userId}</td>
                  <td className="px-4 py-3 font-medium">{student.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{student.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{student.course ?? "—"}</td>
                  <td className="px-4 py-3">{student._count.submissions}</td>
                  <td className="px-4 py-3">
                    {student._count.warnings > 0 ? (
                      <Badge variant="warning">{student._count.warnings}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/mentor/messages/${student.id}`}>Message</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
