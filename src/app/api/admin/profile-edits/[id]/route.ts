import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["APPROVED", "REJECTED"]),
  adminNote: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const editReq = await prisma.profileEditRequest.findUnique({
    where: { id: params.id },
  });
  if (!editReq) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.profileEditRequest.update({
      where: { id: params.id },
      data: {
        status: parse.data.action,
        adminNote: parse.data.adminNote,
        reviewedAt: new Date(),
      },
    });

    if (parse.data.action === "APPROVED") {
      const updateData: Record<string, string> = {};
      if (editReq.name) updateData.name = editReq.name;
      if (editReq.phone) updateData.phone = editReq.phone;
      if (editReq.course) updateData.course = editReq.course;
      if (editReq.batch) updateData.batch = editReq.batch;

      if (Object.keys(updateData).length > 0) {
        await tx.student.update({ where: { id: editReq.studentId }, data: updateData });
      }
    }
  });

  return NextResponse.json({ success: true });
}
