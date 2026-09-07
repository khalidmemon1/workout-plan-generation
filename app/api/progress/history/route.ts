import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { buildHistoryForName } from "@/lib/exerciseHistory.mjs"
import type { DayDoc } from "@/lib/types"

// One point per calendar date this exercise was touched: heaviest weight
// used that day (the number worth graphing), total sets, and total reps —
// enough for a weight-progression line plus volume context in the tooltip.
// Scoped by exercise name (not dayIdx/exIdx) so the graph reflects that
// exercise's own history even if it was logged under a different day-slot
// via the exercise-switch feature.
export async function GET(req: NextRequest) {
  const authErr = requireAuth(req)
  if (authErr) return authErr

  const name = req.nextUrl.searchParams.get("name")
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 })
  }

  const db = await getDb()
  const col = db.collection<DayDoc>("workout_days")
  const docs = await col
    .find({}, { projection: { _id: 1, templates: 1 } })
    .sort({ _id: 1 })
    .toArray()

  const points = buildHistoryForName(docs, name)

  return NextResponse.json({ points })
}
