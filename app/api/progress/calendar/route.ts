import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { computeStreak } from "@/lib/streak"
import { requireAuth } from "@/lib/auth"

type DayDoc = { _id: string; templates: Record<string, Record<string, Record<string, unknown>>> }

function countSets(templates: DayDoc["templates"]): number {
  let count = 0
  for (const exercises of Object.values(templates)) {
    for (const sets of Object.values(exercises)) count += Object.keys(sets).length
  }
  return count
}

export async function GET(req: NextRequest) {
  const authErr = requireAuth(req)
  if (authErr) return authErr

  const month = req.nextUrl.searchParams.get("month") // "YYYY-MM"
  const today = req.nextUrl.searchParams.get("today") // "YYYY-MM-DD"
  if (!month || !today) return NextResponse.json({ error: "month and today required" }, { status: 400 })

  const db = await getDb()
  const col = db.collection<DayDoc>("workout_days")
  const [monthDocs, allIds] = await Promise.all([
    col.find({ _id: { $gte: `${month}-01`, $lte: `${month}-31` } }).toArray(),
    col.find({}, { projection: { _id: 1 } }).toArray(),
  ])

  const days: Record<string, number> = {}
  for (const doc of monthDocs) days[doc._id] = countSets(doc.templates)

  return NextResponse.json({
    days,
    streak: computeStreak(allIds.map((d) => d._id), today),
  })
}
