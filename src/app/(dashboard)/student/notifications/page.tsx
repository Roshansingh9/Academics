"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Bell } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { usePolling } from "@/hooks/usePolling";

interface Notification {
  id: string;
  isRead: boolean;
  deliveredAt: string;
  notification: { title: string; body: string; createdAt: string };
}

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  async function fetchNotifications() {
    const res = await fetch("/api/student/notifications");
    if (res.ok) setNotifications(await res.json());
  }

  useEffect(() => { fetchNotifications(); }, []);
  usePolling(fetchNotifications, 30000, true);

  async function markRead(id: string) {
    await fetch(`/api/student/notifications/${id}`, { method: "PUT" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Messages from your mentor" />

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="Notifications from your mentor will appear here." />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${!n.isRead ? "bg-indigo-50 border-indigo-200" : ""}`}
              onClick={() => !n.isRead && markRead(n.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{n.notification.title}</p>
                    {!n.isRead && <Badge variant="default" className="text-xs">New</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.notification.body}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">{formatDateTime(n.deliveredAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
