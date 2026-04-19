import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/middleware-auth";

export async function middleware(request: NextRequest) {
    // Pass the request to Supabase to handle the refresh token and session cookies
    return await updateSession(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         * - images/ (public images)
         * - icons/ (PWA icons)
         * - manifest.json (PWA manifest)
         * - sw.js (Service Worker)
         */
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|icons|manifest.json|sw.js).*)",
    ],
};
