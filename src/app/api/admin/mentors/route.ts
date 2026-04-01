import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { generateUserId } from "@/lib/user-id";
import { createMentorSchema } from "@/lib/validations/mentor";
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
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);

  const where = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] }
    : {};

  const [mentors, total] = await Promise.all([
    prisma.mentor.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { userId: true, mustChangePassword: true } }, _count: { select: { students: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mentor.count({ where }),
  ]);

  return NextResponse.json({ mentors, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || adminOnly(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parse = createMentorSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const { name, email, phone, specialization, department, bio, initialPassword, avatarUrl } = parse.data;

  const existing = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const [userId, passwordHash] = await Promise.all([
    generateUserId("MENTOR"),
    hashPassword(initialPassword),
  ]);

  const user = await prisma.user.create({
    data: {
      userId,
      email: email.toLowerCase(),
      passwordHash,
      role: Role.MENTOR,
      mustChangePassword: true,
      mentor: {
        create: { name, email: email.toLowerCase(), phone, specialization, department, bio, avatarUrl },
      },
    },
    include: { mentor: true },
  });

  sendWelcomeEmail(email.toLowerCase(), name, userId, initialPassword, "MENTOR");

  return NextResponse.json(
    { userId: user.userId, mentor: user.mentor, initialPassword },
    { status: 201 }
  );
}
