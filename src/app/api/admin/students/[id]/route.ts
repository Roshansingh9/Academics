import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateStudentSchema } from "@/lib/validations/student";
import { Role } from "@prisma/client";

function adminOnly(session: { user: { role: Role } } | null) {
  return session?.user?.role !== Role.ADMIN;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || adminOnly(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { userId: true, mustChangePassword: true, createdAt: true } },
      mentor: { select: { id: true, name: true, email: true, specialization: true } },
      _count: { select: { submissions: true, warnings: true } },
    },
  });

  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(student);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || adminOnly(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parse = updateStudentSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const { email, ...rest } = parse.data;

  const student = await prisma.student.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(email && { email: email.toLowerCase() }),
    },
  });

  if (email) {
    await prisma.user.update({
      where: { id: student.userId },
      data: { email: email.toLowerCase() },
    });
  }

  return NextResponse.json(student);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || adminOnly(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const student = await prisma.student.findUnique({ where: { id: params.id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.user.delete({ where: { id: student.userId } });

  return NextResponse.json({ success: true });
}
