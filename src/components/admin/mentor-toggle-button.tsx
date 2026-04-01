"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  mentorId: string;
  isActive: boolean;
  mentorName: string;
}

export function MentorToggleButton({ mentorId, isActive, mentorName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (!confirm(`${isActive ? "Deactivate" : "Activate"} ${mentorName}?`)) return;
    setLoading(true);
    await fetch(`/api/admin/mentors/${mentorId}/toggle`, { method: "PUT" });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      size="sm"
      variant={isActive ? "secondary" : "outline"}
      onClick={handleToggle}
      disabled={loading}
      className={isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
    >
      {loading ? "..." : isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
