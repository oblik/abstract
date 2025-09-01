import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authRoutes, protectedRoutes } from "./app/components/Router/routes";

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const currentUser = request.cookies.get("user-token");
    console.log("current user test console/.......")
    console.log("currentUser", currentUser)
    if (currentUser) {
        console.log("currentUser is true.......")
    }

    // Debug logging - ALWAYS log every request
    console.log("=== MIDDLEWARE START ===");
    console.log("Middleware - Path:", pathname);
    console.log("Middleware - Method:", request.method);
    console.log("Middleware - URL:", request.url);
    console.log("Middleware - Cookie exists:", !!currentUser);
    console.log("Middleware - Cookie value:", currentUser?.value ? "***exists***" : "null/undefined");

    // Skip middleware for:
    // - Next.js internal routes
    // - API routes (including external ones like /freeipapi/api/json)
    // - Static files
    // - Favicon
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api/") ||
        pathname.includes("/api/") ||
        PUBLIC_FILE.test(pathname) ||
        pathname === "/favicon.ico"
    ) {
        console.log("Middleware - SKIPPING: Internal/API/Static route");
        console.log("=== MIDDLEWARE END (SKIP) ===");
        return;
    }

    const authPathnameRegex = new RegExp(
        `^(${(authRoutes as string[])
            .map((route) => (route.includes("[") ? route.replace(/\[.*?\]/g, "[^/]+") : route))
            .join("|")})/?$`,
        "i"
    );

    const protectedPathnameRegex = new RegExp(
        `^(${(protectedRoutes as string[])
            .map((route) => (route.includes("[") ? route.replace(/\[.*?\]/g, "[^/]+") : route))
            .join("|")})/?$`,
        "i"
    );

    console.log("Middleware - Is protected route:", protectedPathnameRegex.test(pathname));
    console.log("Middleware - Has user token:", !!currentUser?.value);

    if (protectedPathnameRegex.test(pathname) && !currentUser?.value) {
        console.log("Middleware - REDIRECTING: Protected route without valid token");
        console.log("=== MIDDLEWARE END (REDIRECT TO HOME) ===");
        request.cookies.delete("user-token");
        const response = NextResponse.redirect(new URL("/", request.url));
        return response;
    }

    if (authPathnameRegex.test(pathname) && currentUser) {
        console.log("Middleware - REDIRECTING: Auth route with existing token");
        console.log("=== MIDDLEWARE END (REDIRECT FROM AUTH) ===");
        return NextResponse.redirect(new URL(request.url));
    }

    console.log("Middleware - ALLOWING: Request passed through");
    console.log("=== MIDDLEWARE END (ALLOW) ===");

}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};