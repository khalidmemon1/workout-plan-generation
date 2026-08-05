import { NextRequest, NextResponse } from "next/server"

// Single shared-secret gate for the whole app — not real multi-user auth,
// just keeps anyone without the password from viewing or writing data.
export function requireAuth(req: NextRequest): NextResponse | null {
  const password = req.headers.get("x-app-password")
  if (!process.env.APP_PASSWORD || password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  return null
}
