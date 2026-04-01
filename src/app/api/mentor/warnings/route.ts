import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createWarningSchema } from "@/lib/validations/warning";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.MENTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const warnings = await prisma.warning.findMany({
    where: { mentorId: mentor.id },
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

  const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify student belongs to this mentor
  const student = await prisma.student.findFirst({
    where: { id: parse.data.studentId, mentorId: mentor.id },
  });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const warning = await prisma.warning.create({
    data: {
      mentorId: mentor.id,
      studentId: parse.data.studentId,
      title: parse.data.title,
      reason: parse.data.reason,
    },
  });

  return NextResponse.json(warning, { status: 201 });
}
