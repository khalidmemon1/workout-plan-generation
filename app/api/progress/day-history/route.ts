import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import type { DayDoc } from "@/lib/types"

// Same data as /api/progress/history, but for every exercise in a day at
// once — a session open used to fire one of these per exercise (up to 9
// requests); this collapses it to 1.
export async function GET(req: NextRequest) {
  const authErr = requireAuth(req)
  if (authErr) return authErr

  const dayIdx = req.nextUrl.searchParams.get("dayIdx")
  if (dayIdx == null) {
    return NextResponse.json({ error: "dayIdx required" }, { status: 400 })
  }

  const db = await getDb()
  const col = db.collection<DayDoc>("workout_days")
  const docs = await col
    .find(
      { [`templates.${dayIdx}`]: { $exists: true } },
      { projection: { _id: 1, [`templates.${dayIdx}`]: 1 } }
    )
    .sort({ _id: 1 })
    .toArray()

  const byExercise: Record<string, { date: string; weight: number | null; sets: number; reps: number }[]> = {}
  for (const doc of docs) {
    const dayTemplates = doc.templates?.[dayIdx] ?? {}
    for (const [exIdx, setsObj] of Object.entries(dayTemplates)) {
      const sets = Object.values(setsObj)
      const weights = sets.map((s) => s.weight).filter((w): w is number => w != null)
      const reps = sets.reduce((a, s) => a + (s.reps ?? 0), 0)
      ;(byExercise[exIdx] ??= []).push({
        date: doc._id,
        weight: weights.length ? Math.max(...weights) : null,
        sets: sets.length,
        reps,
      })
    }
  }

  return NextResponse.json({ byExercise })
}
