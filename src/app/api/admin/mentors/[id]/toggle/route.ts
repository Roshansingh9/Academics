import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mentor = await prisma.mentor.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { students: true } },
      students: {
        where: { status: "ACTIVE" },
        select: { name: true },
        take: 5,
      },
    },
  });
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Block deactivation if mentor still has active students — prevents orphaned students
  if (mentor.isActive && mentor._count.students > 0) {
    const names = mentor.students.map((s) => s.name).join(", ");
    const overflow = mentor._count.students > 5 ? ` and ${mentor._count.students - 5} more` : "";
    return NextResponse.json(
      {
        error: `Cannot deactivate: ${mentor._count.students} student${mentor._count.students !== 1 ? "s are" : " is"} still assigned to this mentor.`,
        detail: `Reassign ${names}${overflow} before deactivating.`,
        studentCount: mentor._count.students,
      },
      { status: 409 }
    );
  }

  const updated = await prisma.mentor.update({
    where: { id: params.id },
    data: { isActive: !mentor.isActive },
  });

  return NextResponse.json({ isActive: updated.isActive });
}
