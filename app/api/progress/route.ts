import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { computeStreak } from "@/lib/streak"
import { requireAuth } from "@/lib/auth"

type SetLog = { reps: number; mode: "hold" | "tap"; at: Date }
type DayDoc = { _id: string; templates: Record<string, Record<string, Record<string, SetLog>>> }

export async function GET(req: NextRequest) {
  const authErr = requireAuth(req)
  if (authErr) return authErr

  const date = req.nextUrl.searchParams.get("date")
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 })

  const db = await getDb()
  const col = db.collection<DayDoc>("workout_days")
  const [todayDoc, allIds] = await Promise.all([
    col.findOne({ _id: date }),
    col.find({}, { projection: { _id: 1 } }).toArray(),
  ])

  return NextResponse.json({
    today: todayDoc?.templates ?? {},
    streak: computeStreak(allIds.map((d) => d._id), date),
  })
}

export async function POST(req: NextRequest) {
  const authErr = requireAuth(req)
  if (authErr) return authErr

  const { date, dayIdx, exIdx, setIdx, reps, mode } = await req.json()
  if (!date || dayIdx == null || exIdx == null || setIdx == null) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 })
  }

  const db = await getDb()
  const col = db.collection<DayDoc>("workout_days")
  const path = `templates.${dayIdx}.${exIdx}.${setIdx}`
  await col.updateOne(
    { _id: date },
    { $set: { [path]: { reps, mode, at: new Date() } } },
    { upsert: true }
  )

  const allIds = await col.find({}, { projection: { _id: 1 } }).toArray()
  return NextResponse.json({ streak: computeStreak(allIds.map((d) => d._id), date) })
}
