import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"

type VariantsDoc = { _id: string; map: Record<string, string> }

// Which alternate exercise (if any) is active per dayIdx-exIdx slot. Not
// date-scoped like workout_days — a switch is a standing preference ("this
// machine is always busy at my gym time") that persists until changed again.
export async function GET(req: NextRequest) {
  const authErr = requireAuth(req)
  if (authErr) return authErr

  const db = await getDb()
  const doc = await db.collection<VariantsDoc>("exercise_variants").findOne({ _id: "variants" })
  return NextResponse.json({ map: doc?.map ?? {} })
}

export async function POST(req: NextRequest) {
  const authErr = requireAuth(req)
  if (authErr) return authErr

  const { dayIdx, exIdx, name } = await req.json()
  if (dayIdx == null || exIdx == null) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 })
  }

  const db = await getDb()
  const col = db.collection<VariantsDoc>("exercise_variants")
  const key = `${dayIdx}-${exIdx}`
  if (name) {
    await col.updateOne({ _id: "variants" }, { $set: { [`map.${key}`]: name } }, { upsert: true })
  } else {
    await col.updateOne({ _id: "variants" }, { $unset: { [`map.${key}`]: "" } }, { upsert: true })
  }
  return NextResponse.json({ ok: true })
}
