import { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      userId: string;
      email: string;
      role: Role;
      mustChangePassword: boolean;
      isActive: boolean;
      profileId?: string;
    };
  }

  interface User {
    id: string;
    userId: string;
    email: string;
    role: Role;
    mustChangePassword: boolean;
    isActive: boolean;
    profileId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    userId: string;
    email: string;
    role: Role;
    mustChangePassword: boolean;
    isActive: boolean;
    profileId?: string;
  }
}
