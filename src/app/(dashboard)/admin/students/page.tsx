import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { StudentDeleteButton } from "@/components/admin/student-delete-button";
import { ResetPasswordButton } from "@/components/admin/reset-password-button";
import { formatDate } from "@/lib/utils";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default async function AdminStudentsPage({
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

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, userId: true, createdAt: true, mustChangePassword: true } },
        mentor: { select: { name: true, isActive: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.count({ where }),
  ]);

  const statusConfig = {
    ACTIVE:      { label: "Active",      variant: "success"     as const },
    PASSED_OUT:  { label: "Passed Out",  variant: "secondary"   as const },
    DROPPED_OUT: { label: "Dropped Out", variant: "destructive" as const },
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description={`${total} student${total !== 1 ? "s" : ""} enrolled`}>
        <Button asChild size="sm" variant="outline" className="rounded-lg h-8 text-[13px]">
          <Link href="/admin/students/reassign">Reassign Students</Link>
        </Button>
        <Button asChild size="sm" className="rounded-lg h-8 text-[13px] bg-indigo-600 hover:bg-indigo-700">
          <Link href="/admin/students/new">Add Student</Link>
        </Button>
      </PageHeader>

      {students.length === 0 ? (
        <EmptyState icon={Users} title="No students yet" description="Create your first student to get started.">
          <Button asChild size="sm" className="rounded-lg bg-indigo-600 hover:bg-indigo-700">
            <Link href="/admin/students/new">Add Student</Link>
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
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Course</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Mentor</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider hidden xl:table-cell">Joined</th>
                <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {students.map((student) => {
                const sc = statusConfig[student.status] ?? statusConfig.ACTIVE;
                return (
                  <tr key={student.id} className="hover:bg-zinc-50/60 transition-colors duration-100 group">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[12px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">{student.user.userId}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[11px] font-bold shrink-0">
                          {student.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-zinc-800 text-[13px]">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 text-[13px] hidden md:table-cell">{student.email}</td>
                    <td className="px-5 py-3.5 text-zinc-500 text-[13px] hidden lg:table-cell">{student.course ?? <span className="text-zinc-300">—</span>}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-600 text-[13px]">{student.mentor.name}</span>
                        {!student.mentor.isActive && (
                          <span className="text-[10px] font-medium bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded-full">Inactive</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {student.user.mustChangePassword ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Invitation Sent
                        </span>
                      ) : (
                        <Badge variant={sc.variant} className="text-[11px] px-2 py-0.5">{sc.label}</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 text-[12px] hidden xl:table-cell">{formatDate(student.user.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <ResetPasswordButton userId={student.user.id} userName={student.name} />
                        <Button asChild size="sm" variant="outline" className="h-7 rounded-lg text-[12px] px-2.5">
                          <Link href={`/admin/students/${student.id}/edit`}>Edit</Link>
                        </Button>
                        <StudentDeleteButton studentId={student.id} studentName={student.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
