import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAssignmentSchema } from "@/lib/validations/assignment";
import { Role } from "@prisma/client";

async function getMentorOrFail(userId: string) {
  return prisma.mentor.findUnique({ where: { userId } });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.MENTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentor = await getMentorOrFail(session.user.id);
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const assignment = await prisma.assignment.findFirst({
    where: { id: params.id, mentorId: mentor.id },
    include: {
      students: { include: { student: { select: { id: true, name: true, email: true } } } },
      submissions: {
        include: { student: { select: { id: true, name: true } } },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(assignment);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.MENTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentor = await getMentorOrFail(session.user.id);
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parse = updateAssignmentSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const { dueDate, target, studentIds, ...rest } = parse.data;

  const assignment = await prisma.assignment.updateMany({
    where: { id: params.id, mentorId: mentor.id },
    data: {
      ...rest,
      ...(dueDate && { dueDate: new Date(dueDate) }),
      ...(target && { target: target as "SPECIFIC" | "ALL" }),
    },
  });

  return NextResponse.json(assignment);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.MENTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentor = await getMentorOrFail(session.user.id);
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.assignment.deleteMany({ where: { id: params.id, mentorId: mentor.id } });

  return NextResponse.json({ success: true });
}
