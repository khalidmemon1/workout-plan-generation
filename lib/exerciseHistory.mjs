// Groups logged sets by exact exercise name — never by dayIdx/exIdx. A slot
// can hold a different exercise from one session to the next (the switch
// feature), so grouping by slot would blend two different exercises' weights
// into one history; grouping by the `exercise` tag each set carries is what
// keeps them separate. When the same exercise name is deliberately reused as
// a swap-in under more than one planned slot, its sets are meant to combine
// into one line — it's the same real movement regardless of which slot it
// stood in for that day.
export function buildHistoryByNames(docs, names) {
  const nameSet = new Set(names);
  const byName = {};
  const bestByName = {};
  for (const doc of docs) {
    const setsByName = {};
    for (const exercises of Object.values(doc.templates ?? {})) {
      for (const sets of Object.values(exercises)) {
        for (const set of Object.values(sets)) {
          if (!set.exercise || !nameSet.has(set.exercise)) continue;
          ;(setsByName[set.exercise] ??= []).push(set);
        }
      }
    }
    for (const [name, sets] of Object.entries(setsByName)) {
      const weights = sets.map((s) => s.weight).filter((w) => w != null);
      const reps = sets.reduce((a, s) => a + (s.reps ?? 0), 0);
      const dayBest = weights.length ? Math.max(...weights) : null;
      ;(byName[name] ??= []).push({ date: doc._id, weight: dayBest, sets: sets.length, reps });
      if (dayBest != null && (bestByName[name] == null || dayBest > bestByName[name])) {
        bestByName[name] = dayBest;
      }
    }
  }
  return { byName, bestByName };
}

export function buildHistoryForName(docs, name) {
  return buildHistoryByNames(docs, [name]).byName[name] ?? [];
}
