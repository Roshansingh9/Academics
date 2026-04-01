import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { WarningForm } from "@/components/mentor/warning-form";

export default async function NewWarningPage() {
  const session = await getServerSession(authOptions);
  const mentor = await prisma.mentor.findUnique({ where: { userId: session!.user.id } });

  const students = await prisma.student.findMany({
    where: { mentorId: mentor!.id, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Issue Warning" description="Create a warning certificate for a student" />
      <WarningForm students={students} />
    </div>
  );
}
