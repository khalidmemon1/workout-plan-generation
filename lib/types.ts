export type SetLog = { reps: number | null; weight: number | null; mode: "hold" | "tap" | "voice"; at: Date; exercise?: string; effort?: { value: number; scale: "RIR" | "RPE" } | null }
export type DayDoc = { _id: string; templates: Record<string, Record<string, Record<string, SetLog>>> }
