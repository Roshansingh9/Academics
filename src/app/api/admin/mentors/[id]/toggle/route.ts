import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentor = await prisma.mentor.findUnique({ where: { id: params.id } });
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.mentor.update({
    where: { id: params.id },
    data: { isActive: !mentor.isActive },
  });

  return NextResponse.json({ isActive: updated.isActive });
}
