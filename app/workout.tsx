"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const DAYS = [
  {
    key: "mon",
    label: "Monday",
    type: "Push A",
    color: "#6C63FF",
    bg: "#EEF",
    sub: "Chest · Shoulders · Triceps",
    phases: ["5 min warm-up", "30 min strength", "15 min hypertrophy", "10 min cool-down"],
    exercises: [
      { name: "Incline Push-up", sets: 4, reps: "8–12", rest: 60, muscles: "Chest, Triceps, Shoulders", note: "Hands on table/chair. Keep body rigid and straight. Lower chest to surface slowly — 3 sec down, 1 sec up.", tip: "Wrist tip: Keep wrists neutral. If wrists ache, make fists on a mat instead of flat palm.", link: "https://www.muscleandstrength.com/exercises/incline-push-up.html" },
      { name: "Band Chest Press", sets: 3, reps: "12–15", rest: 60, muscles: "Chest, Triceps", note: "Anchor band at chest height behind you. Press forward with arms parallel to floor. Squeeze chest at full extension.", tip: "Control the return — do not let the band snap your arms back.", link: "https://www.muscleandstrength.com/exercises/resistance-band-chest-press.html" },
      { name: "DB Shoulder Press (2 kg)", sets: 3, reps: "12", rest: 60, muscles: "Shoulders, Triceps", note: "Seated or standing. Press dumbbells overhead, stop just before elbows fully lock out.", tip: "Do not shrug shoulders up to your ears. Keep neck long throughout.", link: "https://www.muscleandstrength.com/exercises/seated-dumbbell-press.html" },
      { name: "Band Lateral Raise", sets: 3, reps: "15", rest: 45, muscles: "Lateral deltoid", note: "Step on band centre, hold each end. Raise arms out to shoulder height only — no higher.", tip: "Slight bend in elbow throughout. Do not swing your body for momentum.", link: "https://www.muscleandstrength.com/exercises/band-lateral-raise.html" },
      { name: "DB Tricep Overhead Ext. (2 kg)", sets: 3, reps: "12", rest: 60, muscles: "Triceps", note: "Both hands on one dumbbell overhead. Lower behind head slowly, elbows pointing forward. Press back up.", tip: "Keep elbows close to your ears — do not flare them out.", link: "https://www.muscleandstrength.com/exercises/dumbbell-overhead-tricep-extension.html" },
      { name: "Band Tricep Pushdown", sets: 3, reps: "15", rest: 45, muscles: "Triceps", note: "Anchor band high. Keeping elbows tucked at sides, push hands down until arms are straight.", tip: "Squeeze triceps hard at the bottom. Controlled return — resist the band on the way up.", link: "https://www.muscleandstrength.com/exercises/resistance-band-tricep-pushdown.html" },
      { name: "Wall Push-up Iso Hold", sets: 3, reps: "20 sec", rest: 45, muscles: "Chest, Triceps", note: "Press hands on wall, lower yourself halfway, hold that position. Builds strength for floor push-ups.", tip: "This is your finisher — push hard. It is harder than it looks. Breathe steadily.", link: "https://www.muscleandstrength.com/exercises/wall-pushup.html" },
    ],
  },
  {
    key: "tue",
    label: "Tuesday",
    type: "Pull A",
    color: "#0DBD8B",
    bg: "#E1F5EE",
    sub: "Back · Biceps · Rear delts",
    phases: ["5 min warm-up", "30 min strength", "15 min hypertrophy", "10 min cool-down"],
    exercises: [
      { name: "Band Pull-apart", sets: 4, reps: "15–20", rest: 45, muscles: "Rear delts, Rhomboids", note: "Hold band at shoulder width with straight arms. Pull wide until band touches your chest. Squeeze shoulder blades together.", tip: "Slow and controlled — this is posture-fixing gold. Do not rush it.", link: "https://www.muscleandstrength.com/exercises/band-pull-apart.html" },
      { name: "DB Bent-over Row (5 kg)", sets: 4, reps: "10–12", rest: 90, muscles: "Lats, Rhomboids, Biceps", note: "Support one hand on chair. Hinge at hip, keep back completely flat. Row elbow toward ceiling — not out to the side.", tip: "Lower back note: Keep spine neutral. No rounding. Stop if you feel any twinge.", link: "https://www.muscleandstrength.com/exercises/one-arm-dumbbell-row.html" },
      { name: "Band Face Pull", sets: 3, reps: "15", rest: 60, muscles: "Rear delts, Rotator cuff", note: "Anchor band at face height. Pull toward forehead with elbows flaring high and wide.", tip: "This fixes posture and builds the pull-up foundation. Do not skip it — it is one of the most important exercises for you.", link: "https://www.muscleandstrength.com/exercises/band-face-pull.html" },
      { name: "DB Bicep Curl (3 kg)", sets: 3, reps: "12", rest: 60, muscles: "Biceps", note: "Palms facing up. Curl to shoulder. 2 sec up, 3 sec down. No body swing whatsoever.", tip: "Slow negatives (lowering) build more muscle than fast reps. The descent is where the work happens.", link: "https://www.muscleandstrength.com/exercises/dumbbell-bicep-curl.html" },
      { name: "Band Hammer Curl", sets: 3, reps: "15", rest: 45, muscles: "Biceps, Brachialis", note: "Step on band. Palms facing each other the entire movement. Curl up to shoulder height.", tip: "Hits the brachialis muscle which makes arms look thicker from the front — do not skip this.", link: "https://www.muscleandstrength.com/exercises/resistance-band-hammer-curl.html" },
      { name: "Band Reverse Fly", sets: 3, reps: "15", rest: 45, muscles: "Rear deltoid", note: "Hinge forward 45°. Hold band in front, raise arms out wide like wings. Squeeze at the top.", tip: "Lighter resistance here is better — the squeeze at the top is what matters, not the weight.", link: "https://www.muscleandstrength.com/exercises/band-reverse-fly.html" },
      { name: "Gripper Squeeze", sets: 3, reps: "10 each hand", rest: 30, muscles: "Forearms, Grip", note: "Squeeze gripper fully. Hold 3 seconds. Release slowly. Builds forearm thickness and grip strength.", tip: "Both hands benefit even when only one is squeezing — there is a neural crossover effect.", link: "https://www.muscleandstrength.com/exercises/hand-grip-strengthener.html" },
    ],
  },
  {
    key: "wed",
    label: "Wednesday",
    type: "Legs A + Core",
    color: "#FF6B35",
    bg: "#FAECE7",
    sub: "Quads · Glutes · Hamstrings · Core",
    phases: ["8 min warm-up + knee prep", "25 min leg work", "15 min core", "12 min cool-down & mobility"],
    exercises: [
      { name: "Wall Sit", sets: 4, reps: "30–45 sec", rest: 60, muscles: "Quads, VMO", note: "Back flat on wall, thighs parallel to floor. STOP 10–15° before your knees fully extend — never lock out.", tip: "Knee safety: This is the #1 exercise for your knee issue. VMO (inner quad) directly stabilises hyperextending knees.", link: "https://www.muscleandstrength.com/exercises/wall-sit.html" },
      { name: "Glute Bridge", sets: 4, reps: "15", rest: 60, muscles: "Glutes, Hamstrings", note: "Feet flat, hip-width apart. Drive hips up, squeeze glutes hard at the top. Hold 1 second. Lower slowly.", tip: "Strong glutes support the knee from behind and are essential for running endurance. These two goals align perfectly.", link: "https://www.muscleandstrength.com/exercises/glute-bridge.html" },
      { name: "Step-up (Low Step)", sets: 3, reps: "10 each leg", rest: 60, muscles: "Quads, Glutes", note: "Use a stable low step or thick book stack. Step up slowly. Control the descent — do not drop down.", tip: "Knee safety: Keep knee tracking in line with your toes. Do not let it cave inward.", link: "https://www.muscleandstrength.com/exercises/step-up.html" },
      { name: "Band Lateral Walk", sets: 3, reps: "15 each way", rest: 45, muscles: "Hip abductors, Glutes", note: "Band above knees. Slight squat position throughout. Take small controlled steps sideways — do not let feet come together.", tip: "Directly strengthens hip abductors which correct both knee caving and knee hyperextension. Very important for you.", link: "https://www.muscleandstrength.com/exercises/resistance-band-lateral-walk.html" },
      { name: "Dead Bug", sets: 3, reps: "10 each side", rest: 45, muscles: "Core, Transverse abdominis", note: "Lie on back, arms pointing up, knees at 90°. Lower opposite arm and leg simultaneously while pressing lower back INTO the floor.", tip: "Lower back note: If your lower back lifts off the floor, reduce your range of motion. Quality beats depth every time.", link: "https://www.muscleandstrength.com/exercises/dead-bug.html" },
      { name: "Plank", sets: 3, reps: "30–45 sec", rest: 45, muscles: "Core, Glutes, Shoulders", note: "Elbows directly under shoulders. Neutral spine — hips level with shoulders, not raised or dropped.", tip: "Squeeze glutes AND quads during the hold. That is what makes it genuinely hard and effective.", link: "https://www.muscleandstrength.com/exercises/plank.html" },
      { name: "Bird Dog", sets: 3, reps: "10 each side", rest: 45, muscles: "Core, Lower back, Glutes", note: "On all fours. Extend opposite arm and leg slowly. Hold 2 seconds. Return without letting them touch the floor.", tip: "Lower back note: This directly rehabilitates lower back weakness. Do not rush — slow and controlled is the goal.", link: "https://www.muscleandstrength.com/exercises/bird-dog.html" },
    ],
  },
  {
    key: "thu",
    label: "Thursday",
    type: "Push B",
    color: "#6C63FF",
    bg: "#EEEDFE",
    sub: "Chest · Shoulders · Triceps — variation",
    phases: ["5 min warm-up", "30 min strength", "15 min hypertrophy", "10 min cool-down"],
    exercises: [
      { name: "Knee Push-up", sets: 4, reps: "Max reps", rest: 60, muscles: "Chest, Triceps, Shoulders", note: "Knees on floor, body straight from knee to head. Lower chest to floor, press back up. Track your max reps weekly.", tip: "When you hit 15+ knee push-ups consistently, try transitioning to floor push-ups. Progress is the goal.", link: "https://www.muscleandstrength.com/exercises/knee-push-up.html" },
      { name: "Band Chest Fly", sets: 3, reps: "12–15", rest: 60, muscles: "Chest (inner)", note: "Anchor bands at shoulder height. Arms slightly bent, sweep forward like hugging a tree. Control the return.", tip: "Feel the chest stretch at the start position — that stretch is where the muscle growth happens.", link: "https://www.muscleandstrength.com/exercises/resistance-band-chest-fly.html" },
      { name: "DB Arnold Press (2 kg)", sets: 3, reps: "12", rest: 60, muscles: "All shoulder heads", note: "Start with palms facing you, rotate outward as you press overhead. Reverse on the way down.", tip: "More shoulder activation than a regular press. Builds the round shoulder look you are aiming for.", link: "https://www.muscleandstrength.com/exercises/arnold-dumbbell-press.html" },
      { name: "DB Front Raise (2 kg)", sets: 3, reps: "12 each arm", rest: 45, muscles: "Front deltoid", note: "Raise one arm forward to shoulder height, thumb facing up. Slow controlled descent. Do not swing your body.", tip: "Very light weight, very strict form. If you need to swing, the weight is too heavy.", link: "https://www.muscleandstrength.com/exercises/dumbbell-front-raise.html" },
      { name: "Tricep Dips (Chair)", sets: 3, reps: "8–12", rest: 75, muscles: "Triceps, Chest", note: "Hands on stable chair edge. Lower until elbows reach 90°. Press back up. Keep back close to the chair edge.", tip: "Wrist note: If wrists ache, try making fists on the chair edge rather than flat palm.", link: "https://www.muscleandstrength.com/exercises/bench-dip.html" },
      { name: "Band Overhead Press", sets: 3, reps: "15", rest: 60, muscles: "Shoulders, Triceps", note: "Step on band centre. Press both arms overhead simultaneously. Control the descent — resist the band.", tip: "Band tension increases at the top of the press, making it harder than dumbbells. Stay strict with form.", link: "https://www.muscleandstrength.com/exercises/resistance-band-overhead-press.html" },
      { name: "Incline Push-up Negative", sets: 3, reps: "6–8", rest: 75, muscles: "Chest, Triceps", note: "Take 5 full seconds to lower yourself down from the top position. Reset and repeat. This builds push-up strength the fastest.", tip: "Negatives (slow lowering phase) cause more muscle damage than the push-up itself — this is intentional.", link: "https://www.muscleandstrength.com/exercises/incline-push-up.html" },
    ],
  },
  {
    key: "fri",
    label: "Friday",
    type: "Pull B",
    color: "#0DBD8B",
    bg: "#E1F5EE",
    sub: "Back · Biceps · Rear delts — variation",
    phases: ["5 min warm-up", "30 min strength", "15 min hypertrophy", "10 min cool-down"],
    exercises: [
      { name: "Band Straight Arm Pulldown", sets: 4, reps: "15", rest: 60, muscles: "Lats", note: "Anchor band high. Arms straight throughout. Pull down to hips engaging lats the whole way.", tip: "This is the closest movement to a pull-up. It directly trains lats — the muscle you need to build first.", link: "https://www.muscleandstrength.com/exercises/band-lat-pulldown.html" },
      { name: "DB Chest-supported Row (5 kg)", sets: 4, reps: "10–12", rest: 90, muscles: "Back, Rear delts, Biceps", note: "Lie face-down on inclined chair or stacked firm pillows. Row both DBs up simultaneously. Lower slowly.", tip: "Lower back note: This removes ALL lower back load — the best rowing variation for your situation.", link: "https://www.muscleandstrength.com/exercises/incline-dumbbell-row.html" },
      { name: "Band High Row", sets: 3, reps: "12–15", rest: 60, muscles: "Upper traps, Rear delts", note: "Anchor band high. Pull toward chin with elbows flaring wide. Hold briefly at the top.", tip: "Targets upper traps and rear delts from a different angle than face pulls — both are needed for full development.", link: "https://www.muscleandstrength.com/exercises/band-upright-row.html" },
      { name: "DB Concentration Curl (3 kg)", sets: 3, reps: "12 each", rest: 60, muscles: "Biceps (peak)", note: "Seated with elbow braced on inner thigh. Curl slowly. No body movement at all — pure bicep.", tip: "The best bicep isolation exercise in existence. Cheating is impossible — this forces strict form.", link: "https://www.muscleandstrength.com/exercises/concentration-curl.html" },
      { name: "Band Supinated Curl", sets: 3, reps: "15", rest: 45, muscles: "Biceps", note: "Step on band. Palms fully facing up the ENTIRE movement — do not let them rotate. Curl to shoulder.", tip: "Full supination maximises bicep activation compared to hammer curl. Different days, different angles = more growth.", link: "https://www.muscleandstrength.com/exercises/resistance-band-bicep-curl.html" },
      { name: "Scapular Wall Slide", sets: 3, reps: "15", rest: 45, muscles: "Serratus, Lower traps", note: "Back, head, elbows, wrists all touching wall. Slide arms up and down without losing contact at any point.", tip: "This single exercise will fix your posture and build the foundation needed for pull-ups. It is underrated.", link: "https://www.muscleandstrength.com/exercises/wall-slides.html" },
      { name: "Gripper Hold (5 sec)", sets: 3, reps: "8 each hand", rest: 30, muscles: "Forearms, Grip", note: "Max squeeze. Hold 5 full seconds this time — progressive overload from Tuesday's 3-second hold.", tip: "Grip strength carries directly over to rowing movements and eventually to pull-ups.", link: "https://www.muscleandstrength.com/exercises/hand-grip-strengthener.html" },
    ],
  },
  {
    key: "sat",
    label: "Saturday",
    type: "Legs B + Core",
    color: "#FF6B35",
    bg: "#FAECE7",
    sub: "Glutes · Hamstrings · Calves · Core — variation",
    phases: ["8 min warm-up + knee prep", "25 min leg work", "15 min core", "12 min cool-down & mobility"],
    exercises: [
      { name: "Single-leg Glute Bridge", sets: 3, reps: "12 each leg", rest: 60, muscles: "Glutes, Hamstrings", note: "Lie flat. One leg bent foot on floor, other extended. Drive hips up with the bent leg. Squeeze hard at top.", tip: "If too difficult, keep toes of extended leg lightly touching floor for support. Progress to fully lifted over weeks.", link: "https://www.muscleandstrength.com/exercises/single-leg-glute-bridge.html" },
      { name: "Romanian DB Deadlift (5 kg)", sets: 4, reps: "10–12", rest: 90, muscles: "Hamstrings, Glutes, Lower back", note: "Slight knee bend only — maintain it throughout. Hinge at hip, DBs slide down legs. Feel hamstring stretch. Drive hips forward to return.", tip: "Lower back note: Keep chest up and back neutral. Hinge at hip — NOT at the waist. These are different movements.", link: "https://www.muscleandstrength.com/exercises/romanian-deadlift.html" },
      { name: "Calf Raise", sets: 4, reps: "20", rest: 45, muscles: "Calves", note: "Stand on edge of step. Full range — full stretch at the bottom, full raise at the top. Control both directions.", tip: "For running endurance, calves are critical. Slow tempo: 2 sec up, 2 sec down. Do not bounce.", link: "https://www.muscleandstrength.com/exercises/standing-calf-raise.html" },
      { name: "Band Squat (Feet Wide)", sets: 3, reps: "15", rest: 60, muscles: "Quads, Glutes, Hip abductors", note: "Band just above knees — it will try to push knees in; resist by pushing knees OUT. Wide stance squat. Stop 10–15° before full extension.", tip: "Knee safety: The band resistance directly trains your knees to stay in correct alignment. This is therapeutic as well as strength work.", link: "https://www.muscleandstrength.com/exercises/resistance-band-squat.html" },
      { name: "Hollow Body Hold", sets: 3, reps: "20–30 sec", rest: 45, muscles: "Core, Hip flexors", note: "Lie flat. Press lower back firmly into floor. Raise arms overhead and legs to 45°. Hold. Do not let back arch.", tip: "If lower back lifts, raise your legs higher until it stays down. Shorten hold time before reducing leg height.", link: "https://www.muscleandstrength.com/exercises/hollow-hold.html" },
      { name: "Side Plank", sets: 3, reps: "25 sec each side", rest: 45, muscles: "Obliques, Glutes, Lower back", note: "Elbow directly under shoulder. Hip raised, body in a straight line. Do not let hip sag downward.", tip: "Directly addresses your lower back discomfort. Oblique and glute strength both support the lower back.", link: "https://www.muscleandstrength.com/exercises/side-plank.html" },
      { name: "Reverse Crunch", sets: 3, reps: "15", rest: 45, muscles: "Lower abs", note: "Lie on back, arms flat by sides. Curl hips toward chest using lower abs — no momentum or swinging. Lower slowly.", tip: "Lower back must stay pressed against the floor throughout. Slow lowering = significantly more effective.", link: "https://www.muscleandstrength.com/exercises/reverse-crunch.html" },
    ],
  },
];

// ─── REST TIMER HOOK ─────────────────────────────────────────────────────────

function useRestTimer() {
  const [timers, setTimers] = useState({});
  const intervals = useRef({});

  const startTimer = useCallback((key, seconds) => {
    if (intervals.current[key]) clearInterval(intervals.current[key]);
    setTimers((p) => ({ ...p, [key]: seconds }));
    intervals.current[key] = setInterval(() => {
      setTimers((p) => {
        const next = (p[key] ?? 0) - 1;
        if (next <= 0) {
          clearInterval(intervals.current[key]);
          delete intervals.current[key];
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.value = 880;
            g.gain.setValueAtTime(0.3, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            o.start(); o.stop(ctx.currentTime + 0.5);
          } catch (_) {}
          return { ...p, [key]: 0 };
        }
        return { ...p, [key]: next };
      });
    }, 1000);
  }, []);

  const skipTimer = useCallback((key) => {
    if (intervals.current[key]) clearInterval(intervals.current[key]);
    delete intervals.current[key];
    setTimers((p) => ({ ...p, [key]: 0 }));
  }, []);

  useEffect(() => () => Object.values(intervals.current).forEach(clearInterval), []);
  return { timers, startTimer, skipTimer };
}

// ─── NOTION EXPORT ───────────────────────────────────────────────────────────

function buildNotion(day) {
  let t = `# ${day.label} — ${day.type}\n\n`;
  t += `> ${day.sub}\n\n---\n\n`;
  day.exercises.forEach((ex, i) => {
    t += `## ${i + 1}. ${ex.name}\n\n`;
    t += `**Muscles:** ${ex.muscles}  \n`;
    t += `**Sets:** ${ex.sets} | **Reps:** ${ex.reps} | **Rest:** ${ex.rest}s\n\n`;
    t += `**How to do it:** ${ex.note}\n\n`;
    t += `**Tip:** ${ex.tip}\n\n`;
    t += `**Guide:** [View on Muscle & Strength](${ex.link})\n\n`;
    t += `| Set | Reps / Time | Weight used | Done | Notes |\n`;
    t += `|-----|-------------|-------------|------| ------|\n`;
    for (let s = 0; s < ex.sets; s++) {
      t += `| Set ${s + 1} | ${ex.reps} | — | ☐ | |\n`;
    }
    t += `\n---\n\n`;
  });
  t += `## Session notes\n\n`;
  t += `**Date:** ___________  \n**Energy level (1–10):** ___  \n**Overall feel:** \n\n`;
  t += `---\n*Home workout plan — 80 kg, 5'8–9 · Dumbbells + resistance bands · Evening sessions*\n`;
  return t;
}

// ─── EXERCISE CARD ───────────────────────────────────────────────────────────

function ExerciseCard({ ex, exIdx, dayColor, doneSets, onSetDone, timerVal, onSkip }) {
  const [open, setOpen] = useState(false);
  const allDone = doneSets.length >= ex.sets;

  return (
    <div style={{
      background: "#fff",
      border: allDone ? `1.5px solid ${dayColor}` : "1px solid #E8E8E8",
      borderRadius: 14,
      marginBottom: 10,
      overflow: "hidden",
      opacity: allDone ? 0.6 : 1,
      transition: "all 0.2s",
    }}>
      {/* Header */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: allDone ? dayColor : "#F3F3F3",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 600,
          color: allDone ? "#fff" : "#888",
        }}>
          {allDone ? "✓" : exIdx + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{ex.name}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            {ex.muscles} · {ex.sets} sets · {ex.reps} · {ex.rest}s rest
          </div>
        </div>
        <div style={{ fontSize: 20, color: "#CCC", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</div>
      </div>

      {/* Body */}
      {open && (
        <div style={{ borderTop: "1px solid #F0F0F0", padding: 16 }}>
          {/* Exercise Guide Link */}
          <a
            href={ex.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#F8F8F8", borderRadius: 10, padding: "12px 14px",
              marginBottom: 12, textDecoration: "none",
              border: "1px solid #ECECEC",
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: dayColor + "22",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 18 }}>▶</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>View exercise guide</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>Video + images on Muscle & Strength →</div>
            </div>
          </a>

          {/* How to */}
          <div style={{ background: "#F8F8F8", borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "#444", lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600, color: "#111" }}>How to: </span>{ex.note}
          </div>

          {/* Tip */}
          <div style={{ background: "#FFFBEA", border: "1px solid #FEDD72", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#7A5C00", lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600 }}>Tip: </span>{ex.tip}
          </div>

          {/* Sets */}
          <div style={{ fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>Sets</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Array.from({ length: ex.sets }, (_, si) => {
              const isDone = doneSets.includes(si);
              return (
                <div key={si} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 10,
                  background: isDone ? "#F0FFF8" : "#F8F8F8",
                  border: isDone ? `1px solid ${dayColor}44` : "1px solid #ECECEC",
                }}>
                  <span style={{ fontSize: 12, color: "#888", width: 42, flexShrink: 0 }}>Set {si + 1}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#222" }}>{ex.reps}</span>
                  <span style={{ fontSize: 11, color: "#AAA", flexShrink: 0, marginRight: 8 }}>{ex.rest}s rest</span>
                  {isDone ? (
                    <span style={{ fontSize: 12, color: dayColor, fontWeight: 600, padding: "3px 12px", borderRadius: 20, background: dayColor + "18" }}>Done ✓</span>
                  ) : (
                    <button
                      onClick={() => onSetDone(exIdx, si, ex.rest)}
                      style={{
                        padding: "4px 14px", borderRadius: 20, border: `1px solid ${dayColor}`,
                        background: "transparent", color: dayColor, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      Mark done
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rest timer */}
          {timerVal > 0 && (
            <div style={{
              marginTop: 14, background: dayColor + "18", borderRadius: 12,
              padding: "16px", textAlign: "center",
            }}>
              <div style={{ fontSize: 42, fontWeight: 700, color: dayColor, lineHeight: 1 }}>{timerVal}</div>
              <div style={{ fontSize: 12, color: dayColor, marginTop: 4 }}>seconds rest — breathe & hydrate</div>
              <button
                onClick={() => onSkip(`${exIdx}`)}
                style={{ marginTop: 8, background: "none", border: "none", color: dayColor, fontSize: 12, cursor: "pointer", textDecoration: "underline", opacity: 0.7 }}
              >
                Skip rest
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── NOTION MODAL ────────────────────────────────────────────────────────────

function NotionModal({ day, onClose }) {
  const text = buildNotion(day);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: 24, maxWidth: 600, width: "100%",
        maxHeight: "85vh", display: "flex", flexDirection: "column", gap: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>Notion export</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Paste directly into any Notion page — tables and headers auto-format</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>
        </div>
        <textarea
          readOnly
          value={text}
          style={{
            flex: 1, minHeight: 320, fontFamily: "monospace", fontSize: 12,
            background: "#F8F8F8", border: "1px solid #E8E8E8", borderRadius: 10,
            padding: 14, resize: "vertical", color: "#333", lineHeight: 1.6,
          }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={copy}
            style={{
              flex: 1, padding: "10px", borderRadius: 10, border: "none",
              background: "#111", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
            }}
          >
            {copied ? "Copied! ✓" : "Copy to clipboard"}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px", borderRadius: 10, border: "1px solid #E8E8E8",
              background: "#fff", color: "#555", fontSize: 14, cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
        <div style={{ fontSize: 11, color: "#AAA", lineHeight: 1.5 }}>
          How to import: Open Notion → New page → Paste (Ctrl+V / Cmd+V). All tables, headers, and checkboxes format automatically. Repeat for each day.
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function WorkoutApp() {
  const [dayIdx, setDayIdx] = useState(0);
  const [setsDone, setSetsDone] = useState({});
  const [showNotion, setShowNotion] = useState(false);
  const { timers, startTimer, skipTimer } = useRestTimer();

  const day = DAYS[dayIdx];
  const dayKey = `${dayIdx}`;

  const doneSetsForDay = setsDone[dayKey] || {};
  const totalSets = day.exercises.reduce((a, e) => a + e.sets, 0);
  const completedSets = Object.values(doneSetsForDay).flat().length;
  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  const sessionDone = day.exercises.every((ex, ei) => (doneSetsForDay[ei] || []).length >= ex.sets);

  const handleSetDone = (exIdx, setIdx, restSec) => {
    setSetsDone((prev) => {
      const dk = `${dayIdx}`;
      const cur = prev[dk] || {};
      const exSets = cur[exIdx] || [];
      if (exSets.includes(setIdx)) return prev;
      return { ...prev, [dk]: { ...cur, [exIdx]: [...exSets, setIdx] } };
    });
    startTimer(`${exIdx}`, restSec);
  };

  const getTimerVal = (exIdx) => timers[`${exIdx}`] || 0;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px", fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: "#FAFAFA" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Home Workout Plan</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>Mon–Sat Trainer</div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>80 kg · Dumbbells + bands · Evening sessions</div>
      </div>

      {/* Day selector */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 16 }}>
        {DAYS.map((d, i) => (
          <button
            key={d.key}
            onClick={() => setDayIdx(i)}
            style={{
              flexShrink: 0, padding: "8px 14px", borderRadius: 20,
              border: dayIdx === i ? `2px solid ${d.color}` : "1.5px solid #E8E8E8",
              background: dayIdx === i ? d.color : "#fff",
              color: dayIdx === i ? "#fff" : "#555",
              fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            {d.label.slice(0, 3)} — {d.type.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Session card */}
      <div style={{
        background: "#fff", border: "1px solid #E8E8E8", borderRadius: 14,
        padding: "16px", marginBottom: 14,
        borderLeft: `4px solid ${day.color}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>{day.label} — {day.type}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{day.sub}</div>
          </div>
          <button
            onClick={() => setShowNotion(true)}
            style={{
              padding: "6px 14px", borderRadius: 20, border: "1.5px solid #E8E8E8",
              background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#555",
              flexShrink: 0, marginLeft: 10,
            }}
          >
            Notion ↗
          </button>
        </div>

        {/* Phases */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
          {day.phases.map((p) => (
            <span key={p} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#F3F3F3", color: "#666", border: "1px solid #E8E8E8" }}>{p}</span>
          ))}
        </div>

        {/* Progress */}
        <div style={{ marginTop: 14 }}>
          <div style={{ height: 6, background: "#F0F0F0", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: day.color, borderRadius: 3, transition: "width 0.4s" }} />
          </div>
          <div style={{ fontSize: 11, color: "#AAA", marginTop: 4, textAlign: "right" }}>{completedSets} of {totalSets} sets done · {progress}%</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { val: day.exercises.length, lbl: "Exercises" },
          { val: totalSets, lbl: "Total sets" },
          { val: "60 min", lbl: "Est. duration" },
        ].map(({ val, lbl }) => (
          <div key={lbl} style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: 12, padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>{val}</div>
            <div style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Exercises */}
      {day.exercises.map((ex, ei) => (
        <ExerciseCard
          key={ei}
          ex={ex}
          exIdx={ei}
          dayColor={day.color}
          doneSets={doneSetsForDay[ei] || []}
          onSetDone={handleSetDone}
          timerVal={getTimerVal(ei)}
          onSkip={skipTimer}
        />
      ))}

      {/* Complete banner */}
      {sessionDone && (
        <div style={{
          background: "#F0FFF8", border: "1.5px solid #0DBD8B", borderRadius: 14,
          padding: 20, textAlign: "center", marginTop: 10,
        }}>
          <div style={{ fontSize: 28 }}>💪</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#085041", marginTop: 6 }}>Session complete!</div>
          <div style={{ fontSize: 13, color: "#0F6E56", marginTop: 4 }}>Great work. Rest, eat protein, sleep well.</div>
        </div>
      )}

      {/* Notion modal */}
      {showNotion && <NotionModal day={day} onClose={() => setShowNotion(false)} />}

      {/* Footer */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #F0F0F0", fontSize: 11, color: "#CCC", textAlign: "center", lineHeight: 1.6 }}>
        Protein: 90g+ daily · Soy isolate + 6 eggs · Sunday: full rest<br />
        Knee: never lock out · Lower back: neutral spine always
      </div>
    </div>
  );
}