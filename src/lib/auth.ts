import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { Role } from "@prisma/client";

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
      if (user) {
        token.id = user.id;
        token.userId = user.userId;
        token.email = user.email;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
        token.isActive = user.isActive;
        token.profileId = user.profileId;
      }

      // Re-check mustChangePassword from DB so admin password resets
      // and re-activations take effect on the next request.
      if (token.id && token.role !== Role.ADMIN) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { mustChangePassword: true },
          });
          if (dbUser) {
            token.mustChangePassword = dbUser.mustChangePassword;
          }
        } catch {
          // Fail open — don't block auth if DB is briefly unavailable
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
