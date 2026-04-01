import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.MENTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.warning.deleteMany({ where: { id: params.id, mentorId: mentor.id } });

  return NextResponse.json({ success: true });
}
