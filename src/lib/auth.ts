import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { Role } from "@prisma/client";

// How often to re-check DB for isActive / mustChangePassword changes.
// The dashboard layout.tsx does a live DB check on every page load, so
// this only needs to protect direct API calls made by a deactivated session.
const JWT_REFRESH_INTERVAL_MS = 30_000; // 30 seconds

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "User ID or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        const { identifier, password } = credentials;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { userId: identifier },
              { email: identifier.toLowerCase() },
            ],
          },
          include: {
            mentor: { select: { id: true, isActive: true } },
            student: { select: { id: true, status: true } },
          },
        });

        if (!user) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        const isActive =
          user.role === Role.ADMIN
            ? true
            : user.role === Role.MENTOR
            ? (user.mentor?.isActive ?? false)
            : user.role === Role.STUDENT
            ? user.student?.status === "ACTIVE"
            : false;

        // Block deactivated users at login.
        // Exception: mustChangePassword=true (invited) users must be able to log in
        // so they can reach the change-password page to complete onboarding.
        if (!isActive && !user.mustChangePassword) {
          throw new Error("AccountDeactivated");
        }

        const profileId =
          user.role === Role.MENTOR
            ? user.mentor?.id
            : user.role === Role.STUDENT
            ? user.student?.id
            : undefined;

        return {
          id: user.id,
          userId: user.userId,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          isActive,
          profileId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in: populate token from the authorize() return value.
      // Mark checkedAt so we don't immediately re-query on the first request.
      if (user) {
        return {
          ...token,
          id: user.id,
          userId: user.userId,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          isActive: user.isActive,
          profileId: user.profileId,
          checkedAt: Date.now(),
        };
      }

      // Subsequent requests: throttle DB re-checks so we don't hit the database
      // on every API call. The layout.tsx live check covers page-navigation blocking;
      // this covers direct API calls from a stale/deactivated session.
      const now = Date.now();
      const lastChecked = token.checkedAt ?? 0;

      if (token.id && token.role !== Role.ADMIN && (now - lastChecked) > JWT_REFRESH_INTERVAL_MS) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              mustChangePassword: true,
              mentor: { select: { isActive: true } },
              student: { select: { status: true } },
            },
          });
          if (dbUser) {
            token.mustChangePassword = dbUser.mustChangePassword;
            if (token.role === Role.MENTOR) {
              token.isActive = dbUser.mentor?.isActive ?? false;
            } else if (token.role === Role.STUDENT) {
              token.isActive = dbUser.student?.status === "ACTIVE";
            }
            token.checkedAt = now;
          }
        } catch {
          // Fail open — don't block auth if DB is briefly unavailable.
          // The stale token values remain; layout.tsx will catch the deactivation
          // on the next page load.
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        userId: token.userId,
        email: token.email,
        role: token.role,
        mustChangePassword: token.mustChangePassword,
        isActive: token.isActive ?? true,
        profileId: token.profileId,
      };
      return session;
    },
  },
};
