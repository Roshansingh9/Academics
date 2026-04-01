import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Users, UserCheck, BookOpen, AlertTriangle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminOverviewPage() {
  const [mentorCount, studentCount, assignmentCount, warningCount] = await Promise.all([
    prisma.mentor.count({ where: { isActive: true } }),
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.assignment.count({ where: { isActive: true } }),
    prisma.warning.count(),
  ]);

  const stats = [
    { label: "Active Mentors",    value: mentorCount,    icon: UserCheck,     href: "/admin/mentors",  accent: "bg-indigo-50 text-indigo-600 border-indigo-100" },
    { label: "Active Students",   value: studentCount,   icon: Users,         href: "/admin/students", accent: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { label: "Total Assignments", value: assignmentCount, icon: BookOpen,     href: "#",               accent: "bg-sky-50 text-sky-600 border-sky-100" },
    { label: "Total Warnings",    value: warningCount,   icon: AlertTriangle,  href: "#",               accent: "bg-amber-50 text-amber-600 border-amber-100" },
  ];

  return (
    <div className="space-y-7">
      <PageHeader title="Overview" description="Platform health at a glance">
        <Button asChild size="sm" variant="outline" className="rounded-lg h-8 text-[13px]">
          <Link href="/admin/students/new">Add Student</Link>
        </Button>
        <Button asChild size="sm" className="rounded-lg h-8 text-[13px] bg-indigo-600 hover:bg-indigo-700">
          <Link href="/admin/mentors/new">Add Mentor</Link>
        </Button>
      </PageHeader>

      {/* Stat cards */}
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

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/mentors" className="group flex items-center gap-4 bg-white border border-zinc-200 rounded-xl p-4 shadow-card hover:shadow-card-hover hover:-translate-y-[1px] transition-all duration-200">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-zinc-800">Manage Mentors</p>
            <p className="text-[13px] text-zinc-500 truncate">View, edit, and toggle mentor accounts</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-600 transition-colors shrink-0" />
        </Link>
        <Link href="/admin/profile-edits" className="group flex items-center gap-4 bg-white border border-zinc-200 rounded-xl p-4 shadow-card hover:shadow-card-hover hover:-translate-y-[1px] transition-all duration-200">
          <div className="h-10 w-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-zinc-800">Profile Edit Requests</p>
            <p className="text-[13px] text-zinc-500 truncate">Approve or reject student profile changes</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-600 transition-colors shrink-0" />
        </Link>
      </div>
    </div>
  );
}
