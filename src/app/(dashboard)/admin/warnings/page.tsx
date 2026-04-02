import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/utils";

export default async function AdminWarningsPage({
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
          { student: { name: { contains: search, mode: "insensitive" as const } } },
          { mentor: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [warnings, total] = await Promise.all([
    prisma.warning.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        mentor: { select: { id: true, name: true } },
        student: { select: { id: true, name: true, course: true } },
      },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.warning.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Warnings"
        description={`${total} warning${total !== 1 ? "s" : ""} issued across all mentors`}
      />

      {warnings.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No warnings yet"
          description="No warnings have been issued to students."
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
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                    Issued By
                  </th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">
                    Reason
                  </th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider hidden xl:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {warnings.map((warning) => (
                  <tr key={warning.id} className="hover:bg-zinc-50/60 transition-colors duration-100">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        </div>
                        <span className="font-medium text-zinc-800 text-[13px] max-w-[200px] truncate">
                          {warning.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-[13px] font-medium text-zinc-800">{warning.student.name}</p>
                        {warning.student.course && (
                          <p className="text-[11px] text-zinc-400">{warning.student.course}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-[13px] text-zinc-600">{warning.mentor.name}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <p className="text-[13px] text-zinc-500 max-w-[280px] truncate">{warning.reason}</p>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 text-[12px] hidden xl:table-cell">
                      {formatDateTime(warning.issuedAt)}
                    </td>
                  </tr>
                ))}
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
