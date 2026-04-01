import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  studentIds: z.array(z.string().min(1)).min(1, "Select at least one student"),
  newMentorId: z.string().min(1, "Target mentor is required"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const { studentIds, newMentorId } = parse.data;

  const newMentor = await prisma.mentor.findUnique({
    where: { id: newMentorId },
    select: { id: true, name: true, isActive: true },
  });
  if (!newMentor) return NextResponse.json({ error: "Target mentor not found" }, { status: 404 });
  if (!newMentor.isActive) {
    return NextResponse.json({ error: "Cannot reassign to an inactive mentor" }, { status: 409 });
  }

  // Verify all student IDs exist
  const existing = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true },
  });
  if (existing.length !== studentIds.length) {
    return NextResponse.json({ error: "One or more students not found" }, { status: 404 });
  }

  await prisma.student.updateMany({
    where: { id: { in: studentIds } },
    data: { mentorId: newMentorId },
  });

  return NextResponse.json({ success: true, reassigned: studentIds.length, toMentor: newMentor.name });
}
