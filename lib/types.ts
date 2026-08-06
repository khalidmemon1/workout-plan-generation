export type SetLog = { reps: number | null; weight: number | null; mode: "hold" | "tap"; at: Date }
export type DayDoc = { _id: string; templates: Record<string, Record<string, Record<string, SetLog>>> }
