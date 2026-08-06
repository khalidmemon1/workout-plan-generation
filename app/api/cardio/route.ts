import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { computeStreak } from "@/lib/streak"
import { requireAuth } from "@/lib/auth"

type CardioEntry = { atSec: number; speed?: number | null; incline?: number | null; resistance?: number | null; cadence?: number | null }
type CardioDoc = {
  _id: string
  dayIdx: number
  machine: "treadmill" | "cycle"
  durationSec: number
  entries: CardioEntry[]
  completedAt: Date
}

// Cardio gets its own collection and its own streak — deliberately separate
// from workout_days/lifting, per the request: a cardio-only day should keep
// the cardio streak alive even with zero sets logged that day, and vice versa.

export async function GET(req: NextRequest) {
  const authErr = requireAuth(req)
  if (authErr) return authErr

  const date = req.nextUrl.searchParams.get("date")
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 })

  const db = await getDb()
  const col = db.collection<CardioDoc>("cardio_days")
  const [todayDoc, allIds] = await Promise.all([
    col.findOne({ _id: date }),
    col.find({}, { projection: { _id: 1 } }).toArray(),
  ])

  return NextResponse.json({
    today: todayDoc ?? null,
    streak: computeStreak(allIds.map((d) => d._id), date),
  })
}

export async function POST(req: NextRequest) {
  const authErr = requireAuth(req)
  if (authErr) return authErr

  const { date, dayIdx, machine, durationSec, entries } = await req.json()
  if (!date || dayIdx == null || !machine) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 })
  }

  const db = await getDb()
  const col = db.collection<CardioDoc>("cardio_days")
  await col.updateOne(
    { _id: date },
    { $set: { dayIdx, machine, durationSec: durationSec ?? 0, entries: entries ?? [], completedAt: new Date() } },
    { upsert: true }
  )

  const allIds = await col.find({}, { projection: { _id: 1 } }).toArray()
  return NextResponse.json({ streak: computeStreak(allIds.map((d) => d._id), date) })
}
