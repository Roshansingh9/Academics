import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MentorActionsMenu } from "@/components/admin/mentor-actions-menu";
import { formatDate } from "@/lib/utils";
import { UserCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default async function AdminMentorsPage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string };
}) {
  const search = searchParams.search ?? "";
  const page = Number(searchParams.page ?? 1);
  const limit = 20;

  const where = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] }
    : {};

  const [mentors, total] = await Promise.all([
    prisma.mentor.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, userId: true, createdAt: true, mustChangePassword: true } },
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mentor.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Mentors" description={`${total} mentor${total !== 1 ? "s" : ""} registered`}>
        <Button asChild size="sm" variant="outline" className="rounded-lg h-8 text-[13px]">
          <Link href="/admin/students/reassign">Reassign Students</Link>
        </Button>
        <Button asChild size="sm" className="rounded-lg h-8 text-[13px] bg-indigo-600 hover:bg-indigo-700">
          <Link href="/admin/mentors/new">Add Mentor</Link>
        </Button>
      </PageHeader>

      {mentors.length === 0 ? (
        <EmptyState icon={UserCheck} title="No mentors yet" description="Create your first mentor to get started.">
          <Button asChild size="sm" className="rounded-lg bg-indigo-600 hover:bg-indigo-700">
            <Link href="/admin/mentors/new">Add Mentor</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/70">
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">User ID</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Specialization</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Students</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider hidden xl:table-cell">Joined</th>
                <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {mentors.map((mentor) => (
                <tr key={mentor.id} className="hover:bg-zinc-50/60 transition-colors duration-100 group">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-[12px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">{mentor.user.userId}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/mentors/${mentor.id}`} className="flex items-center gap-2.5 group/name">
                      <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[11px] font-bold shrink-0">
                        {mentor.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-zinc-800 text-[13px] group-hover/name:text-indigo-600 group-hover/name:underline transition-colors">
                        {mentor.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500 text-[13px] hidden md:table-cell">{mentor.email}</td>
                  <td className="px-5 py-3.5 text-zinc-500 text-[13px] hidden lg:table-cell">{mentor.specialization ?? <span className="text-zinc-300">—</span>}</td>
                  <td className="px-5 py-3.5">
                    {mentor._count.students > 0 ? (
                      <Link href={`/admin/students/reassign?fromMentor=${mentor.id}`} className="text-[13px] font-semibold text-indigo-600 hover:underline">
                        {mentor._count.students}
                      </Link>
                    ) : (
                      <span className="text-[13px] font-semibold text-zinc-700">0</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {mentor.user.mustChangePassword ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        Invitation Sent
                      </span>
                    ) : (
                      <Badge variant={mentor.isActive ? "success" : "secondary"} className="text-[11px] px-2 py-0.5">
                        {mentor.isActive ? "Active" : "Inactive"}
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400 text-[12px] hidden xl:table-cell">{formatDate(mentor.user.createdAt)}</td>
                  <td className="px-4 py-3.5 text-right w-10">
                    <MentorActionsMenu
                      mentorId={mentor.id}
                      userId={mentor.user.id}
                      mentorName={mentor.name}
                      isActive={mentor.isActive}
                      studentCount={mentor._count.students}
                    />
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
