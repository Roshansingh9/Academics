import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";

// All dashboard pages require auth and live data — never statically render
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // These checks are belt-and-suspenders alongside the middleware check.
  // The layout always queries DB fresh, so deactivation takes effect immediately
  // on the very next page render, even before the JWT cache expires.
  if (session?.user.role === "MENTOR") {
    const mentor = await prisma.mentor.findUnique({
      where: { userId: session.user.id },
      select: { isActive: true },
    });
    if (mentor && !mentor.isActive && !session.user.mustChangePassword) {
      redirect("/blocked");
    }
  } else if (session?.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: { status: true },
    });
    if (student && student.status !== "ACTIVE" && !session.user.mustChangePassword) {
      redirect("/blocked");
    }
  }

  return <DashboardShell>{children}</DashboardShell>;
}
