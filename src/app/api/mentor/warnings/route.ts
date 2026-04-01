import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createWarningSchema } from "@/lib/validations/warning";
import { sendWarningEmail } from "@/lib/email";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.MENTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentorId = session.user.profileId;
  if (!mentorId) return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });

  const warnings = await prisma.warning.findMany({
    where: { mentorId },
    include: { student: { select: { id: true, name: true } } },
    orderBy: { issuedAt: "desc" },
  });

  return NextResponse.json(warnings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.MENTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parse = createWarningSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const mentorId = session.user.profileId;
  if (!mentorId) return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });

  // Fetch mentor name (needed for email) and verify student ownership in one query
  const [mentor, student] = await Promise.all([
    prisma.mentor.findUnique({ where: { id: mentorId }, select: { name: true } }),
    prisma.student.findFirst({ where: { id: parse.data.studentId, mentorId } }),
  ]);

  if (!mentor) return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const warning = await prisma.warning.create({
    data: {
      mentorId,
      studentId: parse.data.studentId,
      title: parse.data.title,
      reason: parse.data.reason,
    },
  });

  // Email the student about the warning (fire-and-forget with retry)
  sendWarningEmail(student.email, student.name, mentor.name, parse.data.title, parse.data.reason);

  return NextResponse.json(warning, { status: 201 });
}
