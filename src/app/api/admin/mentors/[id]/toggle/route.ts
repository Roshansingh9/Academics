import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentor = await prisma.mentor.findUnique({ where: { id: params.id } });
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Toggle isActive and write a status-change log entry atomically.
  // Deactivation is allowed even when students are assigned — it only removes
  // the mentor's dashboard access. Students remain assigned and visible to admin.
  const newIsActive = !mentor.isActive;
  const [updated] = await prisma.$transaction([
    prisma.mentor.update({
      where: { id: params.id },
      data: { isActive: newIsActive },
    }),
    prisma.mentorStatusLog.create({
      data: { mentorId: params.id, isActive: newIsActive },
    }),
  ]);

  return NextResponse.json({ isActive: updated.isActive });
}
