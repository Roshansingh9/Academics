import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendWelcomeEmail } from "@/lib/email";
import { Role } from "@prisma/client";

function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;
  let pwd = upper[Math.floor(Math.random() * upper.length)]
    + lower[Math.floor(Math.random() * lower.length)]
    + digits[Math.floor(Math.random() * digits.length)];
  for (let i = 3; i < 10; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      mentor: { select: { name: true, email: true } },
      student: { select: { name: true, email: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Admins cannot reset another admin's password via this endpoint
  if (user.role === Role.ADMIN) {
    return NextResponse.json({ error: "Cannot reset admin passwords via this endpoint" }, { status: 400 });
  }

  const newPassword = generatePassword();
  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: params.id },
    data: { passwordHash, mustChangePassword: true },
  });

  const name = user.mentor?.name ?? user.student?.name ?? "User";
  const email = user.mentor?.email ?? user.student?.email ?? user.email;
  const role = user.role === Role.MENTOR ? "MENTOR" : "STUDENT";

  sendWelcomeEmail(email, name, user.userId, newPassword, role);

  return NextResponse.json({ success: true, newPassword });
}
