import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { z } from "zod";

const submitSchema = z.object({
  content: z.string().min(1, "Submission content is required"),
  fileUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.STUDENT) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parse = submitSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check the assignment is accessible by this student
  const assignment = await prisma.assignment.findFirst({
    where: {
      id: params.id,
      isActive: true,
      OR: [
        { mentorId: student.mentorId, target: "ALL" },
        { students: { some: { studentId: student.id } } },
      ],
    },
  });
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  const existing = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId: params.id, studentId: student.id } },
  });

  if (existing) {
    // Only allow resubmission when mentor has marked REVIEWED (not yet accepted)
    if (existing.status !== "REVIEWED") {
      return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    }
    const updated = await prisma.submission.update({
      where: { assignmentId_studentId: { assignmentId: params.id, studentId: student.id } },
      data: {
        content: parse.data.content,
        fileUrl: parse.data.fileUrl ?? null,
        status: "PENDING",
        mentorComment: null,
        submittedAt: new Date(),
      },
    });
    return NextResponse.json(updated, { status: 200 });
  }

  const submission = await prisma.submission.create({
    data: {
      assignmentId: params.id,
      studentId: student.id,
      content: parse.data.content,
      fileUrl: parse.data.fileUrl,
    },
  });

  return NextResponse.json(submission, { status: 201 });
}
