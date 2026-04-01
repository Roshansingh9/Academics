import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { WarningDeleteButton } from "@/components/mentor/warning-delete-button";

export default async function MentorWarningsPage() {
  const session = await getServerSession(authOptions);
  const mentor = await prisma.mentor.findUnique({ where: { userId: session!.user.id } });

  const warnings = await prisma.warning.findMany({
    where: { mentorId: mentor!.id },
    include: { student: { select: { name: true } } },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Warnings" description="Warning certificates issued to students">
        <Button asChild>
          <Link href="/mentor/warnings/new">Issue Warning</Link>
        </Button>
      </PageHeader>

      {warnings.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No warnings issued" description="Issue warnings to students when necessary.">
          <Button asChild><Link href="/mentor/warnings/new">Issue Warning</Link></Button>
        </EmptyState>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Student</th>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Reason</th>
                <th className="text-left px-4 py-3 font-medium">Issued</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {warnings.map((w) => (
                <tr key={w.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{w.student.name}</td>
                  <td className="px-4 py-3">{w.title}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{w.reason}</td>
                  <td className="px-4 py-3">{formatDate(w.issuedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <WarningDeleteButton warningId={w.id} />
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
