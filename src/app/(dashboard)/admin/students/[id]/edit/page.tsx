import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StudentForm } from "@/components/admin/student-form";

export default async function EditStudentPage({ params }: { params: { id: string } }) {
  const [student, mentors] = await Promise.all([
    prisma.student.findUnique({ where: { id: params.id } }),
    prisma.mentor.findMany({
      where: { isActive: true },
      select: { id: true, name: true, specialization: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!student) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit: ${student.name}`} />
      <StudentForm
        mode="edit"
        studentId={student.id}
        mentors={mentors}
        defaultValues={{
          name: student.name,
          email: student.email,
          phone: student.phone ?? "",
          course: student.course ?? "",
          batch: student.batch ?? "",
          mentorId: student.mentorId,
        }}
      />
    </div>
  );
}
