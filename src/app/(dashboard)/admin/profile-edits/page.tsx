import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileEditActions } from "@/components/admin/profile-edit-actions";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { ClipboardCheck } from "lucide-react";

export default async function ProfileEditsPage() {
  const requests = await prisma.profileEditRequest.findMany({
    where: { status: "PENDING" },
    include: {
      student: { select: { name: true, email: true, user: { select: { userId: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Profile Edit Requests" description={`${requests.length} pending`} />
      {requests.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No pending requests" description="Student profile edit requests will appear here." />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="border rounded-lg p-5 bg-card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{req.student.name} <span className="font-mono text-xs text-muted-foreground">({req.student.user.userId})</span></p>
                  <p className="text-sm text-muted-foreground">{req.student.email} · {formatDate(req.createdAt)}</p>
                </div>
                <ProfileEditActions requestId={req.id} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/40 rounded-md p-3">
                {req.name && <div><span className="text-muted-foreground">Name → </span><strong>{req.name}</strong></div>}
                {req.phone && <div><span className="text-muted-foreground">Phone → </span><strong>{req.phone}</strong></div>}
                {req.course && <div><span className="text-muted-foreground">Course → </span><strong>{req.course}</strong></div>}
                {req.batch && <div><span className="text-muted-foreground">Batch → </span><strong>{req.batch}</strong></div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
