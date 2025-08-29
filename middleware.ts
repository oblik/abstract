import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { protectedRoutes } from "./app/components/Router/routes";

const PUBLIC_FILE = /\.(.*)$/;

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const token = request.cookies.get("user-token")?.value;

    if (pathname.startsWith("/_next") || pathname.includes("/api/") || PUBLIC_FILE.test(pathname)) {
        return;
    }

    const protectedPathnameRegex = new RegExp(
        `^(${protectedRoutes
            .map((route) => (route.includes("[") ? route.replace(/\[.*?\]/g, "[^/]+") : route))
            .join("|")})/?$`,
        "i"
    );

    let tokenValid = false;
    if (token) {
        try {
            const { payload } = await jwtVerify(
                token,
                new TextEncoder().encode(process.env.JWT_SECRET as string)
            );
            if (!payload.exp) {
                throw new Error("Missing exp");
            }
            if (payload.exp * 1000 > Date.now()) {
                tokenValid = true;
            } else {
                throw new Error("Token expired");
            }
        } catch {
            request.cookies.delete("user-token");
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    // const authPathnameRegex = new RegExp(
    //     `^(${authRoutes
    //         .map((route) => (route.includes("[") ? route.replace(/\[.*?\]/g, "[^/]+") : route))
    //         .join("|")})/?$`,
    //     "i"
    // );

    //   const authPathnameRegex = new RegExp(`^(/(${i18n.locales.join("|")}))?(${authRoutes.map((route) => (route.includes("[") ? route.replace(/\[.*?\]/g, "[^/]+") : route)).join("|")})/?$`, "i");

    //   const protectedPathnameRegex = new RegExp(`^(/(${i18n.locales.join("|")}))?(${protectedRoutes.map((route) => (route.includes("[") ? route.replace(/\[.*?\]/g, "[^/]+") : route)).join("|")})/?$`, "i");
    //   const locale = getLocale(request);

    if (protectedPathnameRegex.test(pathname) && !tokenValid) {
        request.cookies.delete("user-token");
        return NextResponse.redirect(new URL("/", request.url));
    }

    // if (authPathnameRegex.test(pathname) && currentUser) {
    //     return NextResponse.redirect(new URL("/",request.url));
    // }

}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
