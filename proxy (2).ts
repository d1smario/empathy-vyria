import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are missing, allow request to proceed without auth check
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  try {
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) => {
      setTimeout(() => resolve({ data: { user: null } }), 3000)
    })

    const userPromise = supabase.auth.getUser()

    // Race between auth check and timeout
    const {
      data: { user },
    } = await Promise.race([userPromise, timeoutPromise])

    // Protected routes - redirect to login if not authenticated
    const protectedRoutes = ["/dashboard", "/onboarding", "/settings"]
    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    if (isProtectedRoute && !user) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    // Redirect logged in users away from auth pages
    const authRoutes = ["/login", "/register"]
    const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    if (isAuthRoute && user) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error("Middleware auth error:", error)
    // Allow the request to continue - the page will handle auth state
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
