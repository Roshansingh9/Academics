import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.STUDENT) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: params.id,
      isActive: true,
      OR: [
        { mentorId: student.mentorId, target: "ALL" },
        { students: { some: { studentId: student.id } } },
      ],
    },
    include: {
      mentor: { select: { name: true } },
      submissions: {
        where: { studentId: student.id },
      },
    },
  });

  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(assignment);
}
