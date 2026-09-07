import { test } from "node:test"
import assert from "node:assert/strict"
import { buildHistoryByNames, buildHistoryForName } from "./exerciseHistory.mjs"

// Same slot (dayIdx 0, exIdx 0), two different exercises on two different
// dates — simulating a mid-plan variant switch (Smith Bench -> Barbell
// Bench). Different reps/weight on each. Must NOT blend into one history.
test("a variant switch in the same slot does not combine two exercises' weights", () => {
  const docs = [
    { _id: "2026-01-01", templates: { 0: { 0: {
      0: { reps: 10, weight: 20, exercise: "Smith Machine Flat Bench Press" },
      1: { reps: 10, weight: 20, exercise: "Smith Machine Flat Bench Press" },
    } } } },
    { _id: "2026-01-02", templates: { 0: { 0: {
      0: { reps: 5, weight: 2.5, exercise: "Barbell Bench Press (Free Weight)" },
    } } } },
  ]

  const { byName, bestByName } = buildHistoryByNames(docs, [
    "Smith Machine Flat Bench Press",
    "Barbell Bench Press (Free Weight)",
  ])

  assert.deepEqual(byName["Smith Machine Flat Bench Press"], [
    { date: "2026-01-01", weight: 20, sets: 2, reps: 20 },
  ])
  assert.deepEqual(byName["Barbell Bench Press (Free Weight)"], [
    { date: "2026-01-02", weight: 2.5, sets: 1, reps: 5 },
  ])
  assert.equal(bestByName["Smith Machine Flat Bench Press"], 20)
  assert.equal(bestByName["Barbell Bench Press (Free Weight)"], 2.5)
})

// Same exercise name, offered as an alt under two different planned slots
// with different set/rep prescriptions (e.g. "Dumbbell Romanian Deadlift"
// standing in for both Leg Curl Machine and Smith Machine Romanian
// Deadlift). This SHOULD combine into one line — it's the same real
// movement regardless of which slot it substituted for that day.
test("the same exercise reused across different slots combines into one history", () => {
  const docs = [
    { _id: "2026-01-01", templates: { 5: { 1: {
      0: { reps: 10, weight: 10, exercise: "Dumbbell Romanian Deadlift" },
    } } } },
    { _id: "2026-01-08", templates: { 5: { 4: {
      0: { reps: 12, weight: 12.5, exercise: "Dumbbell Romanian Deadlift" },
    } } } },
  ]

  const points = buildHistoryForName(docs, "Dumbbell Romanian Deadlift")

  assert.deepEqual(points, [
    { date: "2026-01-01", weight: 10, sets: 1, reps: 10 },
    { date: "2026-01-08", weight: 12.5, sets: 1, reps: 12 },
  ])
})

// Two different exercises logged on the SAME date under the SAME slot
// (a mid-session switch) — the per-set `exercise` tag, not the slot, must
// decide which history each set belongs to.
test("mixed exercises within one slot on one date split by their own tag", () => {
  const docs = [
    { _id: "2026-01-01", templates: { 0: { 0: {
      0: { reps: 15, weight: 12.5, exercise: "Smith Machine Flat Bench Press" },
      1: { reps: 15, weight: 12.5, exercise: "Smith Machine Flat Bench Press" },
      2: { reps: 5, weight: 5, exercise: "Barbell Bench Press (Free Weight)" },
    } } } },
  ]

  const { byName } = buildHistoryByNames(docs, [
    "Smith Machine Flat Bench Press",
    "Barbell Bench Press (Free Weight)",
  ])

  assert.deepEqual(byName["Smith Machine Flat Bench Press"], [
    { date: "2026-01-01", weight: 12.5, sets: 2, reps: 30 },
  ])
  assert.deepEqual(byName["Barbell Bench Press (Free Weight)"], [
    { date: "2026-01-01", weight: 5, sets: 1, reps: 5 },
  ])
})

// A set logged before the `exercise` field existed (or for a name nobody
// asked for) must never leak into a requested exercise's bucket.
test("sets with no exercise tag, or an untracked name, are ignored", () => {
  const docs = [
    { _id: "2026-01-01", templates: { 0: { 0: {
      0: { reps: 10, weight: 20 }, // legacy, no `exercise` field
      1: { reps: 10, weight: 99, exercise: "Some Other Lift" },
    } } } },
  ]

  const points = buildHistoryForName(docs, "Smith Machine Flat Bench Press")
  assert.deepEqual(points, [])
})
