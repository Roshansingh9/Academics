import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function StudentWarningsPage() {
  const session = await getServerSession(authOptions);
  const student = await prisma.student.findUnique({ where: { userId: session!.user.id } });

  const warnings = await prisma.warning.findMany({
    where: { studentId: student!.id },
    include: { mentor: { select: { name: true } } },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Warning Certificates" description="Warnings issued by your mentor" />

      {warnings.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No warnings" description="You have no warnings. Keep up the good work!" />
      ) : (
        <div className="space-y-4">
          {warnings.map((w) => (
            <Card key={w.id} className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  {w.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground whitespace-pre-wrap">{w.reason}</p>
                <div className="flex gap-4 text-xs text-muted-foreground border-t pt-2">
                  <span>Issued by: <strong>{w.mentor.name}</strong></span>
                  <span>Date: <strong>{formatDate(w.issuedAt)}</strong></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
