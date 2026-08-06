import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import type { DayDoc } from "@/lib/types"

// One point per calendar date this exercise was touched: heaviest weight
// used that day (the number worth graphing), total sets, and total reps —
// enough for a weight-progression line plus volume context in the tooltip.
export async function GET(req: NextRequest) {
  const authErr = requireAuth(req)
  if (authErr) return authErr

  const dayIdx = req.nextUrl.searchParams.get("dayIdx")
  const exIdx = req.nextUrl.searchParams.get("exIdx")
  if (dayIdx == null || exIdx == null) {
    return NextResponse.json({ error: "dayIdx and exIdx required" }, { status: 400 })
  }

  const db = await getDb()
  const col = db.collection<DayDoc>("workout_days")
  const docs = await col
    .find(
      { [`templates.${dayIdx}.${exIdx}`]: { $exists: true } },
      { projection: { _id: 1, [`templates.${dayIdx}.${exIdx}`]: 1 } }
    )
    .sort({ _id: 1 })
    .toArray()

  const points = docs.map((doc) => {
    const sets = Object.values(doc.templates?.[dayIdx]?.[exIdx] ?? {})
    const weights = sets.map((s) => s.weight).filter((w): w is number => w != null)
    const reps = sets.reduce((a, s) => a + (s.reps ?? 0), 0)
    return {
      date: doc._id,
      weight: weights.length ? Math.max(...weights) : null,
      sets: sets.length,
      reps,
    }
  })

  return NextResponse.json({ points })
}
