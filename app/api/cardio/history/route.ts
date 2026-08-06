import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"

type CardioEntry = { atSec: number; speed?: number | null; incline?: number | null; resistance?: number | null; cadence?: number | null }
type CardioDoc = { _id: string; machine: string; durationSec: number; entries: CardioEntry[] }

const avg = (nums: number[]) => (nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null)
const pick = (entries: CardioEntry[], key: keyof CardioEntry) =>
  entries.map((e) => e[key]).filter((v): v is number => v != null)

// One point per cardio session, grouped by machine (not by day-of-week) — the
// question this answers is "is my treadmill pace/incline trending up", which
// spans whichever days you actually did treadmill on, not one fixed weekday.
export async function GET(req: NextRequest) {
  const authErr = requireAuth(req)
  if (authErr) return authErr

  const machine = req.nextUrl.searchParams.get("machine")
  if (!machine) return NextResponse.json({ error: "machine required" }, { status: 400 })

  const db = await getDb()
  const col = db.collection<CardioDoc>("cardio_days")
  const docs = await col.find({ machine }).sort({ _id: 1 }).toArray()

  const points = docs.map((doc) => {
    const entries = doc.entries ?? []
    return {
      date: doc._id,
      durationSec: doc.durationSec ?? 0,
      avgSpeed: avg(pick(entries, "speed")),
      maxIncline: pick(entries, "incline").length ? Math.max(...pick(entries, "incline")) : null,
      avgResistance: avg(pick(entries, "resistance")),
      avgCadence: avg(pick(entries, "cadence")),
    }
  })

  return NextResponse.json({ points })
}
