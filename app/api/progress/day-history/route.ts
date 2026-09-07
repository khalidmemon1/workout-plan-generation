import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { buildHistoryByNames } from "@/lib/exerciseHistory.mjs"
import type { DayDoc } from "@/lib/types"

// Weight-history sparkline data, one request for every exercise currently
// visible on a day instead of one request per card. Scoped by exercise name
// (not dayIdx/exIdx) so a switched-in alternate exercise shows its own
// history instead of whatever was last logged in that day-slot.
export async function GET(req: NextRequest) {
  const authErr = requireAuth(req)
  if (authErr) return authErr

  const namesParam = req.nextUrl.searchParams.get("names")
  if (!namesParam) {
    return NextResponse.json({ error: "names required" }, { status: 400 })
  }
  const names = new Set(namesParam.split("|"))

  const db = await getDb()
  const col = db.collection<DayDoc>("workout_days")
  const docs = await col
    .find({}, { projection: { _id: 1, templates: 1 } })
    .sort({ _id: 1 })
    .toArray()

  const { byName, bestByName } = buildHistoryByNames(docs, names)

  return NextResponse.json({ byName, bestByName })
}
