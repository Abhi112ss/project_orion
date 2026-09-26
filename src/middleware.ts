import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Route prefixes that require *some* authenticated session.
// Role-level authorization (does this user's role match this
// section?) happens in each layout via getSessionBundle(), since
// that needs a database read and shouldn't run on every request
// at the edge.
const PROTECTED_PREFIXES = ["/tpo", "/coordinator", "/company-hr", "/student", "/admin"];

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Kill switch: check this before anything else. Cheap in the common
  // case (one row, one boolean) — the extra profile lookup only runs
  // while maintenance mode is actually on, and only for signed-in
  // visitors, to let a super_admin through to turn it back off.
  if (!pathname.startsWith("/maintenance")) {
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("maintenance_mode")
      .eq("id", true)
      .maybeSingle();

    if (settings?.maintenance_mode) {
      let isSuperAdmin = false;

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        isSuperAdmin = profile?.role === "super_admin";
      }

      if (!isSuperAdmin) {
        return NextResponse.redirect(new URL("/maintenance", request.url));
      }
    }
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};