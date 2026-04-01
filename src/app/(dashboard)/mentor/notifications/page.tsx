import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { Bell } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default async function MentorNotificationsPage() {
  const session = await getServerSession(authOptions);
  const mentor = await prisma.mentor.findUnique({ where: { userId: session!.user.id } });

  const notifications = await prisma.notification.findMany({
    where: { mentorId: mentor!.id },
    include: { _count: { select: { recipients: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Notifications sent to your students">
        <Button asChild>
          <Link href="/mentor/notifications/new">Send Notification</Link>
        </Button>
      </PageHeader>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications sent" description="Send your first notification to students.">
          <Button asChild><Link href="/mentor/notifications/new">Send Notification</Link></Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{n.title}</p>
                    <Badge variant={n.target === "ALL" ? "info" : "secondary"}>
                      {n.target === "ALL" ? "All Students" : "Specific"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n._count.recipients} recipient(s)</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
