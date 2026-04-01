import { prisma } from "@/lib/prisma";

function getYearPrefix(): string {
  return new Date().getFullYear().toString().slice(-2);
}

/**
 * Generates the next sequential user ID for a given role.
 *
 * Uses MAX(numeric suffix) instead of COUNT to correctly handle:
 *  - Gaps in the sequence (e.g. deleted users don't cause collisions)
 *  - Race conditions: if two requests race and read the same max, one will fail
 *    with a P2002 unique constraint violation at the INSERT. Callers that need
 *    strict uniqueness under concurrent load should catch P2002 (Prisma error
 *    code) and retry by calling generateUserId again.
 *
 * Examples: 26MEN001, 26MEN002 … 26STD001, 26STD002
 */
export async function generateUserId(role: "MENTOR" | "STUDENT"): Promise<string> {
  const year = getYearPrefix();
  const prefix = role === "MENTOR" ? "MEN" : "STD";
  const pattern = `${year}${prefix}`;

  const existing = await prisma.user.findMany({
    where: { userId: { startsWith: pattern } },
    select: { userId: true },
  });

  // Find the highest numeric suffix in use so we never collide with existing IDs,
  // even when there are gaps from deletions (count-based approach would re-use numbers).
  const maxNum = existing.reduce((max, u) => {
    const suffix = u.userId.slice(pattern.length);
    const num = parseInt(suffix, 10);
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);

  return `${pattern}${(maxNum + 1).toString().padStart(3, "0")}`;
}
