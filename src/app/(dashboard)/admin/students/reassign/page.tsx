import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { BulkReassignClient } from "@/components/admin/bulk-reassign-client";

export default async function BulkReassignPage() {
  const [mentors, students] = await Promise.all([
    prisma.mentor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        _count: { select: { students: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.student.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        email: true,
        course: true,
        mentor: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reassign Students"
        description="Move one or more students from one mentor to another"
      />
      <BulkReassignClient mentors={mentors} allStudents={students} />
    </div>
  );
}
