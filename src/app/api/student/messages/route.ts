import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validations/message";
import { sendMentorMessageEmail } from "@/lib/email";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.STUDENT) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use profileId from session to avoid a redundant DB lookup by userId
  const studentId = session.user.profileId;
  if (!studentId) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, mentorId: true },
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after"); // cursor: ID of last message seen

  // Use Prisma cursor pagination — avoids the nested findUnique N+1 pattern.
  const messages = await prisma.message.findMany({
    where: { studentId: student.id },
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
    orderBy: { sentAt: "asc" },
    take: 100,
  });

  // Mark unread mentor messages as read
  await prisma.message.updateMany({
    where: { studentId: student.id, senderType: "MENTOR", isReadByStudent: false },
    data: { isReadByStudent: true },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.STUDENT) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parse = sendMessageSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const studentId = session.user.profileId;
  if (!studentId) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { mentor: { select: { email: true, name: true } } },
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const message = await prisma.message.create({
    data: {
      mentorId: student.mentorId,
      studentId: student.id,
      senderType: "STUDENT",
      content: parse.data.content,
    },
  });

  // Email the mentor (fire-and-forget with retry)
  sendMentorMessageEmail(
    student.mentor.email,
    student.mentor.name,
    student.name,
    parse.data.content.slice(0, 120)
  );

  return NextResponse.json(message, { status: 201 });
}
