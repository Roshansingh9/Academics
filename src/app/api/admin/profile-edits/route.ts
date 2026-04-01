import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requests = await prisma.profileEditRequest.findMany({
    where: { status: "PENDING" },
    include: {
      student: { select: { id: true, name: true, email: true, user: { select: { userId: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(requests);
}
