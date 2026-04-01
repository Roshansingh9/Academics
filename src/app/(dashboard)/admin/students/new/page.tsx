import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StudentForm } from "@/components/admin/student-form";

export default async function NewStudentPage() {
  const mentors = await prisma.mentor.findMany({
    where: { isActive: true },
    select: { id: true, name: true, specialization: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Add Student" description="Create a new student account" />
      <StudentForm mode="create" mentors={mentors} />
    </div>
  );
}
