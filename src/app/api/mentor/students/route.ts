import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.MENTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
  if (!mentor) return NextResponse.json({ error: "Mentor not found" }, { status: 404 });

  const students = await prisma.student.findMany({
    where: { mentorId: mentor.id, status: "ACTIVE" },
    include: {
      user: { select: { userId: true } },
      _count: { select: { submissions: true, warnings: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(students);
}
