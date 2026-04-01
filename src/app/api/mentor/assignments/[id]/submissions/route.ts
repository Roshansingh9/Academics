import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.MENTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify assignment belongs to this mentor
  const assignment = await prisma.assignment.findFirst({
    where: { id: params.id, mentorId: mentor.id },
  });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const submissions = await prisma.submission.findMany({
    where: { assignmentId: params.id },
    include: { student: { select: { id: true, name: true, email: true } } },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json(submissions);
}
