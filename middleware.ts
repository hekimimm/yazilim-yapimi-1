import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Skip middleware for static files and API routes
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname.startsWith("/favicon.ico") ||
    req.nextUrl.pathname.includes(".")
  ) {
    return res
  }

  try {
    const supabase = createMiddlewareClient({ req, res })

    // Refresh session if expired
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Redirect authenticated users away from auth pages
    if (session && req.nextUrl.pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Protected routes
    const protectedPaths = [
      "/dashboard",
      "/quiz",
      "/words",
      "/settings",
      "/analytics",
      "/wordle",
      "/stories",
      "/admin",
      "/learn",
      "/gorsel-uret",
    ]

    const isProtectedPath = protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path))

    if (!session && isProtectedPath) {
      return NextResponse.redirect(new URL("/auth/login", req.url))
    }

    // Admin route protection
    if (req.nextUrl.pathname.startsWith("/admin") && session) {
      const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", session.user.id).single()

      if (!profile || profile.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // Return response without redirect on error to prevent infinite loops
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
