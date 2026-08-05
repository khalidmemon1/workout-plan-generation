// Pure calendar-date arithmetic on "YYYY-MM-DD" strings — deliberately never
// touches a timezone-aware Date/toISOString round trip, which shifts the date
// by a day whenever the server's local timezone isn't UTC.
export function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + delta)
  return dt.toISOString().slice(0, 10)
}

// A calendar day counts toward the streak if at least one set was logged that
// day. Today doesn't break the streak while still empty — it just doesn't
// extend it yet, so opening the app first thing in the morning doesn't show 0.
export function computeStreak(dates: string[], today: string) {
  const set = new Set(dates)
  let current = 0
  let cursor = set.has(today) ? today : addDays(today, -1)
  while (set.has(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }

  const sorted = [...set].sort()
  let longest = 0
  let run = 0
  let prev: string | null = null
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    prev = d
    longest = Math.max(longest, run)
  }
  return { current, longest: Math.max(longest, current) }
}
