import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotificationSchema } from "@/lib/validations/notification";
import { sendNotificationEmail } from "@/lib/email";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.MENTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const notifications = await prisma.notification.findMany({
    where: { mentorId: mentor.id },
    include: { _count: { select: { recipients: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notifications);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.MENTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parse = createNotificationSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, body: notifBody, target, studentId } = parse.data;

  let recipientStudents: { id: string; name: string; email: string }[] = [];

  if (target === "ALL") {
    recipientStudents = await prisma.student.findMany({
      where: { mentorId: mentor.id, status: "ACTIVE" },
      select: { id: true, name: true, email: true },
    });
  } else if (studentId) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, mentorId: mentor.id },
      select: { id: true, name: true, email: true },
    });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    recipientStudents = [student];
  }

  const notification = await prisma.notification.create({
    data: {
      mentorId: mentor.id,
      title,
      body: notifBody,
      target: target as "SPECIFIC" | "ALL",
      recipients: {
        create: recipientStudents.map((s) => ({ studentId: s.id })),
      },
    },
  });

  // Send emails (fire-and-forget)
  for (const s of recipientStudents) {
    sendNotificationEmail(s.email, s.name, mentor.name, title, notifBody);
  }

  return NextResponse.json(notification, { status: 201 });
}
