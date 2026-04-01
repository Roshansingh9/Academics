import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.STUDENT) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const warnings = await prisma.warning.findMany({
    where: { studentId: student.id },
    include: { mentor: { select: { name: true } } },
    orderBy: { issuedAt: "desc" },
  });

  return NextResponse.json(warnings);
}
