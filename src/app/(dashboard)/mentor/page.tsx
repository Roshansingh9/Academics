import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Users, BookOpen, MessageSquare, AlertTriangle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MentorOverviewPage() {
  const session = await getServerSession(authOptions);
  const mentor = await prisma.mentor.findUnique({
    where: { userId: session!.user.id },
    include: { _count: { select: { students: true, assignments: true, warnings: true } } },
  });

  const unreadMessages = await prisma.message.count({
    where: { mentorId: mentor?.id, senderType: "STUDENT", isReadByMentor: false },
  });

  const stats = [
    { label: "My Students",        value: mentor?._count.students ?? 0,    icon: Users,          href: "/mentor/students",     accent: "bg-indigo-50 text-indigo-600 border-indigo-100" },
    { label: "Assignments Created", value: mentor?._count.assignments ?? 0, icon: BookOpen,        href: "/mentor/assignments",  accent: "bg-sky-50 text-sky-600 border-sky-100" },
    { label: "Unread Messages",     value: unreadMessages,                   icon: MessageSquare,  href: "/mentor/messages",     accent: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { label: "Warnings Issued",     value: mentor?._count.warnings ?? 0,    icon: AlertTriangle,  href: "/mentor/warnings",     accent: "bg-amber-50 text-amber-600 border-amber-100" },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        title={`Good ${getGreeting()}, ${mentor?.name?.split(" ")[0] ?? "Mentor"}`}
        description="Here's what's happening with your students today."
      >
        <Button asChild size="sm" className="rounded-lg h-8 text-[13px] bg-indigo-600 hover:bg-indigo-700">
          <Link href="/mentor/assignments/new">New Assignment</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, href, accent }) => (
          <Link key={label} href={href} className="group block">
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-card hover:shadow-card-hover hover:-translate-y-[1px] transition-all duration-200 ease-out">
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
