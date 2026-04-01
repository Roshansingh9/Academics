import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  course: z.string().optional(),
  batch: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const requests = await prisma.profileEditRequest.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check no pending request exists
  const pending = await prisma.profileEditRequest.findFirst({
    where: { studentId: student.id, status: "PENDING" },
  });
  if (pending) {
    return NextResponse.json({ error: "You already have a pending edit request" }, { status: 409 });
  }

  const request = await prisma.profileEditRequest.create({
    data: { studentId: student.id, ...parse.data },
  });

  return NextResponse.json(request, { status: 201 });
}
