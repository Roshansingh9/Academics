import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MessageThread } from "@/components/shared/message-thread";

export default async function MentorChatPage({ params }: { params: { studentId: string } }) {
  const session = await getServerSession(authOptions);
  const mentor = await prisma.mentor.findUnique({ where: { userId: session!.user.id } });

  const student = await prisma.student.findFirst({
    where: { id: params.studentId, mentorId: mentor!.id },
  });

  if (!student) notFound();

  const messages = await prisma.message.findMany({
    where: { mentorId: mentor!.id, studentId: student.id },
    orderBy: { sentAt: "asc" },
    take: 100,
  });

  // Mark student messages as read
  await prisma.message.updateMany({
    where: { mentorId: mentor!.id, studentId: student.id, senderType: "STUDENT", isReadByMentor: false },
    data: { isReadByMentor: true },
  });

  return (
    <MessageThread
      title={student.name}
      subtitle={student.email}
      messages={messages.map((m) => ({
        id: m.id,
        content: m.content,
        sentAt: m.sentAt.toISOString(),
        isMine: m.senderType === "MENTOR",
      }))}
      sendUrl={`/api/mentor/messages/${student.id}`}
      pollUrl={`/api/mentor/messages/${student.id}`}
      viewerRole="MENTOR"
    />
  );
}
