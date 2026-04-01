import { prisma } from "@/lib/prisma";

function getYearPrefix(): string {
  return new Date().getFullYear().toString().slice(-2);
}

export async function generateUserId(role: "MENTOR" | "STUDENT"): Promise<string> {
  const year = getYearPrefix();
  const prefix = role === "MENTOR" ? "MEN" : "STD";
  const pattern = `${year}${prefix}`;

  // Count existing users with this pattern to derive next number
  const count = await prisma.user.count({
    where: {
      userId: { startsWith: pattern },
      role: role,
    },
  });

  const next = (count + 1).toString().padStart(3, "0");
  return `${pattern}${next}`;
}
