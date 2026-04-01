import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MessageThread } from "@/components/shared/message-thread";

export default async function StudentMessagesPage() {
  const session = await getServerSession(authOptions);
  const student = await prisma.student.findUnique({ where: { userId: session!.user.id } });
  if (!student) notFound();

  const messages = await prisma.message.findMany({
    where: { studentId: student.id },
    orderBy: { sentAt: "asc" },
    take: 100,
  });

  // Mark mentor messages as read
  await prisma.message.updateMany({
    where: { studentId: student.id, senderType: "MENTOR", isReadByStudent: false },
    data: { isReadByStudent: true },
  });

  const mentor = await prisma.mentor.findUnique({ where: { id: student.mentorId } });

  return (
    <MessageThread
      title={mentor?.name ?? "My Mentor"}
      subtitle={mentor?.email}
      messages={messages.map((m) => ({
        id: m.id,
        content: m.content,
        sentAt: m.sentAt.toISOString(),
        isMine: m.senderType === "STUDENT",
      }))}
      sendUrl="/api/student/messages"
      pollUrl="/api/student/messages"
      viewerRole="STUDENT"
    />
  );
}
