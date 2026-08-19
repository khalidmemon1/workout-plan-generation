import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import type { DayDoc, SetLog } from "@/lib/types"

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

  const byName: Record<string, { date: string; weight: number | null; sets: number; reps: number }[]> = {}
  for (const doc of docs) {
    const setsByName: Record<string, SetLog[]> = {}
    for (const exercises of Object.values(doc.templates ?? {})) {
      for (const sets of Object.values(exercises)) {
        for (const set of Object.values(sets)) {
          if (!set.exercise || !names.has(set.exercise)) continue
          ;(setsByName[set.exercise] ??= []).push(set)
        }
      }
    }
    for (const [name, sets] of Object.entries(setsByName)) {
      const weights = sets.map((s) => s.weight).filter((w): w is number => w != null)
      const reps = sets.reduce((a, s) => a + (s.reps ?? 0), 0)
      ;(byName[name] ??= []).push({
        date: doc._id,
        weight: weights.length ? Math.max(...weights) : null,
        sets: sets.length,
        reps,
      })
    }
  }

  return NextResponse.json({ byName })
}
