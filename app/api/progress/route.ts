import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { computeStreak } from "@/lib/streak"
import { requireAuth } from "@/lib/auth"
import type { DayDoc } from "@/lib/types"

// Most recent weight logged per exercise (by name, not by day-slot), as of
// `today` — lets the UI pre-fill "last time you did this exercise you used
// 42.5kg" instead of starting blank every session. Keying by name instead of
// dayIdx/exIdx matters because the same slot can hold different exercises
// across sessions (via the exercise-switch feature) — a slot-keyed map would
// show one exercise's weight under a completely different exercise's card.
// Docs are walked oldest→newest so later dates simply overwrite earlier ones.
// Sets logged before this field existed have no `exercise` and are skipped —
// safer to start that exercise's history blank than guess wrong.
function computeLastWeights(docs: DayDoc[], today: string) {
  const lastWeights: Record<string, number> = {}
  for (const doc of [...docs].sort((a, b) => (a._id < b._id ? -1 : 1))) {
    if (doc._id > today) continue
    for (const exercises of Object.values(doc.templates ?? {})) {
      for (const sets of Object.values(exercises)) {
        for (const set of Object.values(sets)) {
          if (set.weight != null && set.exercise) {
            lastWeights[set.exercise] = set.weight
          }
        }
      }
    }
  }
  return lastWeights
}

export async function GET(req: NextRequest) {
  const authErr = requireAuth(req)
  if (authErr) return authErr

  const date = req.nextUrl.searchParams.get("date")
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 })

  const db = await getDb()
  const col = db.collection<DayDoc>("workout_days")
  const [todayDoc, allDocs] = await Promise.all([
    col.findOne({ _id: date }),
    col.find({}, { projection: { _id: 1, templates: 1 } }).toArray(),
  ])

  return NextResponse.json({
    today: todayDoc?.templates ?? {},
    streak: computeStreak(allDocs.map((d) => d._id), date),
    lastWeights: computeLastWeights(allDocs, date),
  })
}

export async function POST(req: NextRequest) {
  const authErr = requireAuth(req)
  if (authErr) return authErr

  const { date, dayIdx, exIdx, setIdx, reps, weight, mode, exercise } = await req.json()
  if (!date || dayIdx == null || exIdx == null || setIdx == null) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 })
  }

  const db = await getDb()
  const col = db.collection<DayDoc>("workout_days")
  const path = `templates.${dayIdx}.${exIdx}.${setIdx}`
  await col.updateOne(
    { _id: date },
    { $set: { [path]: { reps, weight: weight ?? null, mode, exercise: exercise ?? null, at: new Date() } } },
    { upsert: true }
  )

  const allDocs = await col.find({}, { projection: { _id: 1, templates: 1 } }).toArray()
  return NextResponse.json({
    streak: computeStreak(allDocs.map((d) => d._id), date),
    lastWeights: computeLastWeights(allDocs, date),
  })
}
