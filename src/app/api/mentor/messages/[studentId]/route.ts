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

  const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify student belongs to this mentor
  const student = await prisma.student.findFirst({
    where: { id: params.studentId, mentorId: mentor.id },
  });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after"); // cursor: last message id seen

  const messages = await prisma.message.findMany({
    where: {
      mentorId: mentor.id,
      studentId: params.studentId,
      ...(after && { sentAt: { gt: (await prisma.message.findUnique({ where: { id: after } }))?.sentAt ?? new Date(0) } }),
    },
    orderBy: { sentAt: "asc" },
    take: 100,
  });

  // Mark messages from student as read
  await prisma.message.updateMany({
    where: { mentorId: mentor.id, studentId: params.studentId, senderType: "STUDENT", isReadByMentor: false },
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

  const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const student = await prisma.student.findFirst({
    where: { id: params.studentId, mentorId: mentor.id },
  });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const message = await prisma.message.create({
    data: {
      mentorId: mentor.id,
      studentId: params.studentId,
      senderType: "MENTOR",
      content: parse.data.content,
    },
  });

  // Email the student (fire-and-forget)
  sendMessageEmail(
    student.email,
    student.name,
    mentor.name,
    parse.data.content.slice(0, 120)
  );

  return NextResponse.json(message, { status: 201 });
}
