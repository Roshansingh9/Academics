import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { AssignmentForm } from "@/components/mentor/assignment-form";

export default async function EditAssignmentPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const mentor = await prisma.mentor.findUnique({ where: { userId: session!.user.id } });

  const [assignment, students] = await Promise.all([
    prisma.assignment.findFirst({
      where: { id: params.id, mentorId: mentor!.id },
    }),
    prisma.student.findMany({
      where: { mentorId: mentor!.id, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!assignment) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Assignment"
        description={`Editing: ${assignment.title}`}
      />
      <AssignmentForm
        mode="edit"
        assignmentId={assignment.id}
        students={students}
        defaultValues={{
          title: assignment.title,
          description: assignment.description,
          dueDate: new Date(assignment.dueDate).toISOString().slice(0, 16),
          target: assignment.target as "ALL" | "SPECIFIC",
          relevantLinks: assignment.relevantLinks,
        }}
      />
    </div>
  );
}
