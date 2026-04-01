import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ count: 0 });
  }
  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ count: 0 });

  const count = await prisma.message.count({
    where: { studentId: student.id, senderType: "MENTOR", isReadByStudent: false },
  });
  return NextResponse.json({ count });
}
