import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageSquare } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default async function MentorMessagesPage() {
  const session = await getServerSession(authOptions);
  const mentor = await prisma.mentor.findUnique({ where: { userId: session!.user.id } });

  // Single query: all students with their messages and unread counts
  const students = await prisma.student.findMany({
    where: { mentorId: mentor!.id, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      messages: {
        where: { mentorId: mentor!.id },
        orderBy: { sentAt: "desc" },
        take: 1,
        select: { content: true, sentAt: true, senderType: true },
      },
      _count: {
        select: {
          messages: {
            where: { mentorId: mentor!.id, senderType: "STUDENT", isReadByMentor: false },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Sort by most recent message
  const sorted = [...students].sort((a, b) => {
    const aTime = a.messages[0]?.sentAt?.getTime() ?? 0;
    const bTime = b.messages[0]?.sentAt?.getTime() ?? 0;
    return bTime - aTime;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Direct conversations with your students" />

      {sorted.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No students to message" description="Assign students to start messaging." />
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-card overflow-hidden divide-y divide-zinc-100">
          {sorted.map((student) => {
            const last = student.messages[0];
            const unread = student._count.messages;
            return (
              <Link
                key={student.id}
                href={`/mentor/messages/${student.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50/70 transition-colors duration-150 group"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[13px]">
                    {student.name.slice(0, 2).toUpperCase()}
                  </div>
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white leading-none">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[14px] ${unread > 0 ? "font-semibold text-zinc-900" : "font-medium text-zinc-700"}`}>
                      {student.name}
                    </span>
                    {last && (
                      <span className="text-[11px] text-zinc-400 shrink-0">{formatDateTime(last.sentAt)}</span>
                    )}
                  </div>
                  <p className={`text-[13px] truncate mt-0.5 ${unread > 0 ? "text-zinc-600" : "text-zinc-400"}`}>
                    {last
                      ? `${last.senderType === "MENTOR" ? "You: " : ""}${last.content.slice(0, 72)}`
                      : "No messages yet"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
