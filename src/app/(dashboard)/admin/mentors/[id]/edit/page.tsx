import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { MentorForm } from "@/components/admin/mentor-form";

export default async function EditMentorPage({ params }: { params: { id: string } }) {
  const mentor = await prisma.mentor.findUnique({ where: { id: params.id } });
  if (!mentor) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit: ${mentor.name}`} />
      <MentorForm
        mode="edit"
        mentorId={mentor.id}
        defaultValues={{
          name: mentor.name,
          email: mentor.email,
          phone: mentor.phone ?? "",
          specialization: mentor.specialization ?? "",
          department: mentor.department ?? "",
          bio: mentor.bio ?? "",
        }}
      />
    </div>
  );
}
