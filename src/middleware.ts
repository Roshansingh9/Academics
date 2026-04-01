import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Role-based path guarding
    if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL(getDashboardPath(token.role as string), req.url));
    }
    if (pathname.startsWith("/mentor") && token.role !== "MENTOR") {
      return NextResponse.redirect(new URL(getDashboardPath(token.role as string), req.url));
    }
    if (pathname.startsWith("/student") && token.role !== "STUDENT") {
      return NextResponse.redirect(new URL(getDashboardPath(token.role as string), req.url));
    }

    // Block deactivated non-admin users from accessing dashboard routes.
    // isActive is refreshed via the jwt callback on every getServerSession() call,
    // so the dashboard layout provides an immediate check as well.
    if (
      token.isActive === false &&
      token.role !== "ADMIN" &&
      !pathname.startsWith("/api")
    ) {
      return NextResponse.redirect(new URL("/blocked", req.url));
    }

    // Force password change for invited users
    if (
      token.mustChangePassword &&
      !pathname.includes("/change-password") &&
      !pathname.startsWith("/api")
    ) {
      const changePasswordPath = getChangePasswordPath(token.role as string);
      if (!pathname.startsWith(changePasswordPath)) {
        return NextResponse.redirect(new URL(changePasswordPath, req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

function getDashboardPath(role: string): string {
  switch (role) {
    case "ADMIN": return "/admin";
    case "MENTOR": return "/mentor";
    case "STUDENT": return "/student";
    default: return "/login";
  }
}

function getChangePasswordPath(role: string): string {
  switch (role) {
    case "ADMIN": return "/admin/change-password";
    case "MENTOR": return "/mentor/change-password";
    case "STUDENT": return "/student/change-password";
    default: return "/login";
  }
}

export const config = {
  matcher: ["/admin/:path*", "/mentor/:path*", "/student/:path*"],
};
