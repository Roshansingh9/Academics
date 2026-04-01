import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.STUDENT) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch assignments that are either: target=ALL from student's mentor, or SPECIFIC with student in list
  const assignments = await prisma.assignment.findMany({
    where: {
      isActive: true,
      OR: [
        { mentorId: student.mentorId, target: "ALL" },
        { students: { some: { studentId: student.id } } },
      ],
    },
    include: {
      submissions: {
        where: { studentId: student.id },
        select: { id: true, status: true, submittedAt: true },
      },
      mentor: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(assignments);
}
