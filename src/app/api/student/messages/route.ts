import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validations/message";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.STUDENT) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after");

  const messages = await prisma.message.findMany({
    where: {
      studentId: student.id,
      ...(after && { sentAt: { gt: (await prisma.message.findUnique({ where: { id: after } }))?.sentAt ?? new Date(0) } }),
    },
    orderBy: { sentAt: "asc" },
    take: 100,
  });

  // Mark mentor messages as read
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

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: { mentor: true },
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

  return NextResponse.json(message, { status: 201 });
}
