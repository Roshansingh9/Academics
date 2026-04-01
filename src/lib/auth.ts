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
            mentor: { select: { id: true } },
            student: { select: { id: true } },
          },
        });

        if (!user) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

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
        token.profileId = user.profileId;
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
        profileId: token.profileId,
      };
      return session;
    },
  },
};
