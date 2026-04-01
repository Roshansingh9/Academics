"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  LayoutDashboard, Users, UserCheck, BookOpen, MessageSquare,
  Bell, AlertTriangle, ClipboardList, BarChart2, UserCircle,
  ClipboardCheck, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePolling } from "@/hooks/usePolling";

const adminNav = [
  { href: "/admin",           label: "Overview",      icon: LayoutDashboard },
  { href: "/admin/mentors",   label: "Mentors",       icon: UserCheck },
  { href: "/admin/students",  label: "Students",      icon: Users },
  { href: "/admin/profile-edits", label: "Profile Edits", icon: ClipboardCheck },
];

const mentorNav = [
  { href: "/mentor",                label: "Overview",      icon: LayoutDashboard },
  { href: "/mentor/students",       label: "My Students",   icon: Users },
  { href: "/mentor/assignments",    label: "Assignments",   icon: BookOpen },
  { href: "/mentor/warnings",       label: "Warnings",      icon: AlertTriangle },
  { href: "/mentor/messages",       label: "Messages",      icon: MessageSquare, badgeKey: "messages" },
  { href: "/mentor/notifications",  label: "Notifications", icon: Bell },
];

const studentNav = [
  { href: "/student",               label: "Overview",      icon: LayoutDashboard },
  { href: "/student/profile",       label: "My Profile",    icon: UserCircle },
  { href: "/student/assignments",   label: "Assignments",   icon: ClipboardList },
  { href: "/student/progress",      label: "Progress",      icon: BarChart2 },
  { href: "/student/messages",      label: "Messages",      icon: MessageSquare, badgeKey: "messages" },
  { href: "/student/notifications", label: "Notifications", icon: Bell,          badgeKey: "notifications" },
  { href: "/student/warnings",      label: "Warnings",      icon: AlertTriangle },
];

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  MENTOR: "Mentor",
  STUDENT: "Student",
};

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [badges, setBadges] = useState<Record<string, number>>({});

  const nav = role === "ADMIN" ? adminNav : role === "MENTOR" ? mentorNav : studentNav;

  const fetchBadges = useCallback(async () => {
    if (!role || role === "ADMIN") return;
    try {
      if (role === "STUDENT") {
        const [n, m] = await Promise.all([
          fetch("/api/student/notifications/unread-count").then((r) => r.json()),
          fetch("/api/student/messages/unread-count").then((r) => r.json()),
        ]);
        setBadges({ notifications: n.count ?? 0, messages: m.count ?? 0 });
      } else if (role === "MENTOR") {
        const m = await fetch("/api/mentor/messages/unread-count").then((r) => r.json());
        setBadges({ messages: m.count ?? 0 });
      }
    } catch {}
  }, [role]);

  useEffect(() => { fetchBadges(); }, [fetchBadges]);
  usePolling(fetchBadges, 30000, !!role && role !== "ADMIN");

  return (
    <aside className="w-[220px] min-h-screen bg-zinc-950 flex flex-col shrink-0 border-r border-zinc-800/60">

      {/* Brand */}
      <div className="h-14 flex items-center px-3 border-b border-zinc-800/60">
        <div className="bg-white rounded-lg px-2.5 py-1.5 flex items-center">
          <Image
            src="/logo.png"
            alt="Leafclutch Academics"
            width={160}
            height={36}
            className="h-7 w-auto object-contain"
            priority
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <div className="space-y-0.5">
          {(nav as Array<{ href: string; label: string; icon: React.ElementType; badgeKey?: string }>).map(
            ({ href, label, icon: Icon, badgeKey }) => {
              const isExact = href === "/admin" || href === "/mentor" || href === "/student";
              const active = isExact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
              const badgeCount = badgeKey ? (badges[badgeKey] ?? 0) : 0;

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium",
                    "transition-all duration-150 ease-out",
                    active
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80"
                  )}
                >
                  <Icon className={cn(
                    "h-[15px] w-[15px] shrink-0 transition-colors duration-150",
                    active ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                  )} />
                  <span className="flex-1 truncate">{label}</span>
                  {badgeCount > 0 && (
                    <span className={cn(
                      "flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold leading-none",
                      active ? "bg-white/20 text-white" : "bg-indigo-600 text-white"
                    )}>
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                  {active && !badgeCount && (
                    <ChevronRight className="h-3 w-3 text-white/40 shrink-0" />
                  )}
                </Link>
              );
            }
          )}
        </div>
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-zinc-800/60">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-zinc-800/60 transition-colors duration-150 cursor-default">
          <div className="h-7 w-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-indigo-300">
              {session?.user?.userId?.slice(0, 2).toUpperCase() ?? "??"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-zinc-300 truncate leading-none">{session?.user?.userId}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5 truncate leading-none">
              {role ? roleLabels[role] ?? role : ""}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
