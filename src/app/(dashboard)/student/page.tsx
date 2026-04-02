import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { ClipboardList, MessageSquare, AlertTriangle, Bell, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function StudentOverviewPage() {
  const session = await getServerSession(authOptions);
  const student = await prisma.student.findUnique({ where: { userId: session!.user.id } });

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-zinc-500 text-sm">Student profile not found. Please contact your administrator.</p>
      </div>
    );
  }

  const [pendingAssignments, unreadMessages, warnings, unreadNotifications] = await Promise.all([
    prisma.assignment.count({
      where: {
        isActive: true,
        OR: [
          { mentorId: student.mentorId, target: "ALL" },
          { students: { some: { studentId: student.id } } },
        ],
        submissions: { none: { studentId: student.id } },
      },
    }),
    prisma.message.count({
      where: { studentId: student.id, senderType: "MENTOR", isReadByStudent: false },
    }),
    prisma.warning.count({ where: { studentId: student.id } }),
    prisma.studentNotification.count({ where: { studentId: student.id, isRead: false } }),
  ]);

  const stats = [
    { label: "Pending Assignments",  value: pendingAssignments,   icon: ClipboardList,  href: "/student/assignments",   accent: "bg-amber-50 text-amber-600 border-amber-100",    urgent: pendingAssignments > 0 },
    { label: "Unread Messages",      value: unreadMessages,        icon: MessageSquare,  href: "/student/messages",      accent: "bg-indigo-50 text-indigo-600 border-indigo-100", urgent: unreadMessages > 0 },
    { label: "Unread Notifications", value: unreadNotifications,   icon: Bell,           href: "/student/notifications", accent: "bg-sky-50 text-sky-600 border-sky-100",          urgent: unreadNotifications > 0 },
    { label: "Warnings Received",    value: warnings,              icon: AlertTriangle,  href: "/student/warnings",      accent: "bg-red-50 text-red-600 border-red-100",          urgent: warnings > 0 },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        title={`Good ${getGreeting()}, ${student?.name?.split(" ")[0] ?? "Student"}`}
        description="Track your assignments, messages, and progress."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, href, accent, urgent }) => (
          <Link key={label} href={href} className="group block">
            <div className={`bg-white border rounded-xl p-5 shadow-card hover:shadow-card-hover hover:-translate-y-[1px] transition-all duration-200 ease-out ${urgent ? "border-zinc-300" : "border-zinc-200"}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center border ${accent}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors duration-150" />
              </div>
              <p className="text-[2rem] font-bold tracking-tight text-zinc-900 leading-none">{value}</p>
              <p className="text-[13px] text-zinc-500 mt-1.5">{label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
