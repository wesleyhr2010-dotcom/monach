import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/middleware-auth";

export async function middleware(request: NextRequest) {
    const response = await updateSession(request);

    // Injeta o pathname atual para que o layout possa checar rotas restritas
    // sem precisar do client-side usePathname (que não está disponível em RSC).
    const res = response instanceof NextResponse
        ? response
        : NextResponse.next({ request });
    res.headers.set("x-current-path", request.nextUrl.pathname);
    return res;
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
