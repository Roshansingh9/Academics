import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MENTOR") {
    return NextResponse.json({ count: 0 });
  }
  const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
  if (!mentor) return NextResponse.json({ count: 0 });

  const count = await prisma.message.count({
    where: { mentorId: mentor.id, senderType: "STUDENT", isReadByMentor: false },
  });
  return NextResponse.json({ count });
}
