import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validations/message";
import { sendMessageEmail } from "@/lib/email";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.MENTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use profileId from session to avoid a redundant DB lookup by userId
  const mentorId = session.user.profileId;
  if (!mentorId) return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });

  // Verify student belongs to this mentor
  const student = await prisma.student.findFirst({
    where: { id: params.studentId, mentorId },
  });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after"); // cursor: ID of last message seen

  // Use Prisma cursor pagination — avoids the nested findUnique N+1 pattern.
  // The Message table has @@index([mentorId, studentId, sentAt]) which covers this query.
  const messages = await prisma.message.findMany({
    where: { mentorId, studentId: params.studentId },
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
    orderBy: { sentAt: "asc" },
    take: 100,
  });

  // Mark messages from student as read (use the compound index for efficiency)
  await prisma.message.updateMany({
    where: { mentorId, studentId: params.studentId, senderType: "STUDENT", isReadByMentor: false },
    data: { isReadByMentor: true },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: { studentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.MENTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parse = sendMessageSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const mentorId = session.user.profileId;
  if (!mentorId) return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });

  // Fetch mentor name (needed for email) and verify student ownership in one query
  const [mentor, student] = await Promise.all([
    prisma.mentor.findUnique({ where: { id: mentorId }, select: { name: true } }),
    prisma.student.findFirst({ where: { id: params.studentId, mentorId } }),
  ]);

  if (!mentor) return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const message = await prisma.message.create({
    data: {
      mentorId,
      studentId: params.studentId,
      senderType: "MENTOR",
      content: parse.data.content,
    },
  });

  // Email the student (fire-and-forget with retry)
  sendMessageEmail(
    student.email,
    student.name,
    mentor.name,
    parse.data.content.slice(0, 120)
  );

  return NextResponse.json(message, { status: 201 });
}
