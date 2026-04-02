import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { BookOpen } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function AdminAssignmentsPage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string };
}) {
  const search = searchParams.search ?? "";
  const page = Number(searchParams.page ?? 1);
  const limit = 25;

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { mentor: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [assignments, total] = await Promise.all([
    prisma.assignment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        mentor: { select: { id: true, name: true } },
        _count: { select: { submissions: true, students: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assignment.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Assignments"
        description={`${total} assignment${total !== 1 ? "s" : ""} across all mentors`}
      />

      {assignments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No assignments yet"
          description="Mentors haven't created any assignments yet."
        />
      ) : (
        <>
          <div className="bg-white border border-zinc-200 rounded-xl shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/70">
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                    Mentor
                  </th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">
                    Due Date
                  </th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                    Target
                  </th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider hidden xl:table-cell">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {assignments.map((assignment) => {
                  const isPastDue = new Date(assignment.dueDate) < new Date();
                  return (
                    <tr key={assignment.id} className="hover:bg-zinc-50/60 transition-colors duration-100">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-zinc-800 text-[13px] max-w-[260px] truncate">
                          {assignment.title}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-[13px] text-indigo-600 hover:underline cursor-pointer">
                          {assignment.mentor.name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span
                          className={`text-[13px] ${
                            isPastDue ? "text-red-500 font-medium" : "text-zinc-500"
                          }`}
                        >
                          {formatDate(assignment.dueDate)}
                          {isPastDue && (
                            <span className="ml-1 text-[11px] text-red-400">(overdue)</span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] text-zinc-700 font-medium">
                          {assignment._count.submissions}
                          {assignment.target === "SPECIFIC" && (
                            <span className="text-zinc-400 font-normal">
                              /{assignment._count.students}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <Badge
                          variant="secondary"
                          className={`text-[11px] px-2 py-0.5 ${
                            assignment.target === "ALL"
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : "bg-zinc-50 text-zinc-600 border-zinc-200"
                          }`}
                        >
                          {assignment.target === "ALL" ? "All students" : "Specific"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={assignment.isActive ? "success" : "secondary"}
                          className="text-[11px] px-2 py-0.5"
                        >
                          {assignment.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400 text-[12px] hidden xl:table-cell">
                        {formatDate(assignment.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-[13px] text-zinc-500">
              <span>
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={`?page=${page - 1}${search ? `&search=${search}` : ""}`}
                    className="px-3 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
                  >
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={`?page=${page + 1}${search ? `&search=${search}` : ""}`}
                    className="px-3 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
