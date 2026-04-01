import { PageHeader } from "@/components/shared/page-header";
import { MentorForm } from "@/components/admin/mentor-form";

export default function NewMentorPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add Mentor" description="Create a new mentor account" />
      <MentorForm mode="create" />
    </div>
  );
}
