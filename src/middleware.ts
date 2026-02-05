import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any;
    const pathname = req.nextUrl.pathname;

    // admin-only routes
    const adminRoutes = ["/admin"];
    // researcher routes (admin can also access)
    const researcherRoutes = ["/research", "/model"];

    if (adminRoutes.some((route) => pathname.startsWith(route))) {
      if (token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    if (researcherRoutes.some((route) => pathname.startsWith(route))) {
      if (token?.role !== "admin" && token?.role !== "researcher") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    if (researcherRoutes.some((route) => pathname.startsWith(route))) {
      if (token?.role !== "admin" && token?.role !== "researcher" && token?.role !== "guest") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const publicRoutes = [
          "/auth-page/signin",
          "/auth-page/signup",
          "/verify-email",
          "/reset-password",
          "/forget-password",
        ];
        if (publicRoutes.includes(req.nextUrl.pathname)) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images).*)"],
};
