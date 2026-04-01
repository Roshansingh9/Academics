import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAssignmentSchema } from "@/lib/validations/assignment";
import { sendAssignmentEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MENTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const assignments = await prisma.assignment.findMany({
    where: { mentorId: mentor.id },
    include: {
      _count: { select: { submissions: true, students: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assignments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MENTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parse = createAssignmentSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, description, dueDate, target, studentIds, relevantLinks } = parse.data;

  const assignment = await prisma.assignment.create({
    data: {
      mentorId: mentor.id,
      title,
      description,
      dueDate: new Date(dueDate),
      target: target as "SPECIFIC" | "ALL",
      relevantLinks: relevantLinks ?? [],
      students:
        target === "SPECIFIC" && studentIds?.length
          ? { create: studentIds.map((sid) => ({ studentId: sid })) }
          : undefined,
    },
  });

  // Send emails (fire-and-forget)
  let targetStudents: { name: string; email: string }[] = [];
  if (target === "ALL") {
    targetStudents = await prisma.student.findMany({
      where: { mentorId: mentor.id, status: "ACTIVE" },
      select: { name: true, email: true },
    });
  } else if (studentIds?.length) {
    targetStudents = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { name: true, email: true },
    });
  }

  for (const s of targetStudents) {
    sendAssignmentEmail(s.email, s.name, mentor.name, title, new Date(dueDate));
  }

  return NextResponse.json(assignment, { status: 201 });
}
