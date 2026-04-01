import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSubmissionSchema } from "@/lib/validations/assignment";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; subId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MENTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parse = reviewSubmissionSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
  if (!mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const assignment = await prisma.assignment.findFirst({
    where: { id: params.id, mentorId: mentor.id },
  });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const submission = await prisma.submission.update({
    where: { id: params.subId },
    data: {
      ...parse.data,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json(submission);
}
