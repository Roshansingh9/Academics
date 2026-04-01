import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { generateUserId } from "@/lib/user-id";
import { createStudentSchema } from "@/lib/validations/student";
import { sendWelcomeEmail } from "@/lib/email";
import { Role } from "@prisma/client";

function adminOnly(session: { user: { role: Role } } | null) {
  return session?.user?.role !== Role.ADMIN;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || adminOnly(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const mentorId = searchParams.get("mentorId") ?? "";
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (mentorId) where.mentorId = mentorId;

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { userId: true } },
        mentor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.count({ where }),
  ]);

  return NextResponse.json({ students, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || adminOnly(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parse = createStudentSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const { name, email, phone, course, batch, mentorId, initialPassword, avatarUrl } = parse.data;

  const existing = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const mentorExists = await prisma.mentor.findUnique({ where: { id: mentorId } });
  if (!mentorExists) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  const [userId, passwordHash] = await Promise.all([
    generateUserId("STUDENT"),
    hashPassword(initialPassword),
  ]);

  const user = await prisma.user.create({
    data: {
      userId,
      email: email.toLowerCase(),
      passwordHash,
      role: Role.STUDENT,
      mustChangePassword: true,
      student: {
        create: { name, email: email.toLowerCase(), phone, course, batch, mentorId, avatarUrl },
      },
    },
    include: { student: { include: { mentor: { select: { name: true } } } } },
  });

  sendWelcomeEmail(email.toLowerCase(), name, userId, initialPassword, "STUDENT");

  return NextResponse.json(
    { userId: user.userId, student: user.student, initialPassword },
    { status: 201 }
  );
}
