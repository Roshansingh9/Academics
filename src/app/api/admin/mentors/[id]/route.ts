import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateMentorSchema } from "@/lib/validations/mentor";
import { Role } from "@prisma/client";

function adminOnly(session: { user: { role: Role } } | null) {
  return session?.user?.role !== Role.ADMIN;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || adminOnly(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentor = await prisma.mentor.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { userId: true, mustChangePassword: true, createdAt: true } },
      students: { select: { id: true, name: true, email: true, course: true, status: true } },
    },
  });

  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(mentor);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || adminOnly(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parse = updateMentorSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const { email, ...rest } = parse.data;

  const mentor = await prisma.mentor.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(email && { email: email.toLowerCase() }),
    },
  });

  if (email) {
    await prisma.user.update({
      where: { id: mentor.userId },
      data: { email: email.toLowerCase() },
    });
  }

  return NextResponse.json(mentor);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || adminOnly(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentor = await prisma.mentor.findUnique({ where: { id: params.id } });
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete user (cascades to mentor profile)
  await prisma.user.delete({ where: { id: mentor.userId } });

  return NextResponse.json({ success: true });
}
