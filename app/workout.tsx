"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// DAYS is Monday(0)..Saturday(5). JS getDay() is Sunday(0)..Saturday(6) — null
// on Sunday since there's no template for it (a real rest day, not a bug).
function todayDayIdx(): number | null {
  const d = new Date().getDay();
  return d === 0 ? null : d - 1;
}

// Pulls a rep target out of strings like "8–10", "12 each side", "45–60 sec".
function parseRepsRange(reps: string): { min: number; max: number } | null {
  const range = reps.match(/(\d+)\s*[–\-—]\s*(\d+)/);
  if (range) return { min: parseInt(range[1], 10), max: parseInt(range[2], 10) };
  const single = reps.match(/\d+/);
  if (single) { const n = parseInt(single[0], 10); return { min: Math.max(1, n - 2), max: n }; }
  return null;
}


// ─── DATA ────────────────────────────────────────────────────────────────────

const DAYS = [
  {
    key: "mon",
    label: "Monday",
    type: "Push A",
    color: "#6C63FF",
    bg: "#EEF",
    sub: "Chest priority (Smith + Cable) · Shoulders · Triceps",
    phases: ["8 min bike warm-up", "45 min strength", "12 min treadmill finisher"],
    cardio: { machine: "treadmill", mode: "steady", duration: "12–15 min", target: "8–12% incline, brisk pace", note: "Straight after lifting, glycogen is already partly used — this is when steady incline walking leans hardest on stored fat for fuel. Pace where you can still talk in short sentences, not a jog." },
    exercises: [
      { name: "Smith Machine Flat Bench Press", sets: 4, reps: "8–10", rest: 90, muscles: "Chest, Front delts, Triceps", note: "Bar set at a height you can unrack without shrugging. Grip slightly wider than shoulders. Lower to mid-chest under control, press up without slamming elbows to full lockout. The fixed bar path means your only job is driving the weight — no balancing.", tip: "Because the smith rail removes stabiliser work, you can push closer to failure safely here than on a free bar. Add 2.5 kg once all 4 sets hit 10 clean reps.", link: "https://www.muscleandstrength.com/exercises/smith-machine-bench-press.html" },
      { name: "Smith Machine Incline Bench Press (30°)", sets: 3, reps: "10–12", rest: 90, muscles: "Upper chest, Front delts", note: "Bench at 30°, not steeper — steeper turns it into a shoulder press. Bar path is vertical so keep the bench positioned so the bar lowers to your upper chest, not your neck.", tip: "Upper chest is the region that visually tightens the chest — but the fat itself only comes off through the calorie deficit your diet + these cardio finishers create, not from targeting it with reps.", link: "https://www.muscleandstrength.com/exercises/incline-bench-press.html" },
      { name: "Cable Crossover", sets: 3, reps: "12–15", rest: 60, muscles: "Inner chest, Outer chest", note: "Set both pulleys above head height on the crossover tower. Step forward into a slight lean, soft elbow bend held constant. Sweep both handles down and together in front of your hips, squeeze 1 second, return under control.", tip: "This is your stretch-and-squeeze finisher for chest — the smith presses build strength, this builds the pump and definition.", link: "https://www.muscleandstrength.com/exercises/cable-crossover.html" },
      { name: "Machine Shoulder Press", sets: 3, reps: "10–12", rest: 75, muscles: "All three deltoid heads, Triceps", note: "Seat height so handles start level with shoulders. Press up without shrugging — shoulders stay pressed down into the pads throughout. Stop just short of elbow lockout.", tip: "Machine path protects the rotator cuff while you build pressing strength — good choice while chest/shoulders are still adapting to gym loads.", link: "https://www.muscleandstrength.com/exercises/machine-shoulder-press.html" },
      { name: "Cable Lateral Raise (single arm, low pulley)", sets: 3, reps: "15 each arm", rest: 45, muscles: "Lateral deltoid", note: "Stand side-on to the low pulley, handle in far hand crossing in front of body. Raise arm out to shoulder height only, 4-second controlled lowering back down.", tip: "Cables keep tension on the delt through the whole range, unlike dumbbells which go slack at the bottom — this is the better width builder of the two.", link: "https://www.muscleandstrength.com/exercises/cable-lateral-raise.html" },
      { name: "Cable Tricep Pushdown (rope)", sets: 3, reps: "12–15", rest: 60, muscles: "All three tricep heads", note: "High pulley, rope attachment. Elbows pinned to sides the entire set — only forearms move. Push down until arms straight, split the rope ends apart at the bottom, squeeze 1 second.", tip: "If your elbows drift forward as you push, you're using shoulders to cheat the weight down — drop the pin a plate.", link: "https://www.muscleandstrength.com/exercises/triceps-pushdown.html" },
      { name: "Cable Overhead Tricep Extension (rope)", sets: 3, reps: "12", rest: 60, muscles: "Long head of triceps", note: "Face away from a low pulley, rope overhead, elbows pointing forward and pinned next to ears. Extend forward and up until arms straight, lower behind head to a deep stretch.", tip: "The long head only gets a full stretch in the overhead position — this is the one tricep move your pushdown doesn't cover.", link: "https://www.muscleandstrength.com/exercises/cable-overhead-triceps-extension.html" },
    ],
  },
  {
    key: "tue",
    label: "Tuesday",
    type: "Pull A",
    color: "#0DBD8B",
    bg: "#E1F5EE",
    sub: "Rear Delts FIRST → Lat Width → Biceps",
    phases: ["8 min bike warm-up", "45 min pull", "12 min cycle finisher"],
    cardio: { machine: "cycle", mode: "intervals", duration: "12–15 min", target: "1 min hard / 2 min easy, alternating", note: "Moderate-to-hard resistance on the hard minutes, easy spin on the recovery minutes. Cycling is fully seated, so it adds zero extra load to your legs the day before Legs A." },
    exercises: [
      { name: "Rear Delt Machine Fly", sets: 4, reps: "15", rest: 45, muscles: "Rear deltoids, Rhomboids, Middle traps", note: "Sit facing INTO the pec-deck pad (reverse-fly position), handles at chest height. Open arms wide and back, squeeze shoulder blades together 1 second at the back, return slowly.", tip: "First on the day because rear delts fatigue fast and posture-correcting muscle needs to be trained fresh, not as a tired afterthought.", link: "https://www.muscleandstrength.com/exercises/reverse-machine-fly.html" },
      { name: "Lat Pulldown (wide grip)", sets: 4, reps: "10–12", rest: 90, muscles: "Lats, Biceps, Middle back", note: "Wide overhand grip, slight lean back. Pull the bar to upper chest by driving elbows down and back, not by yanking with arms. Squeeze lats 1 second at the bottom, control the return to a full stretch.", tip: "Think 'elbows to back pockets,' not 'bar to chest.' The elbow path decides whether your lats or your biceps do the work.", link: "https://www.muscleandstrength.com/exercises/lat-pulldown.html" },
      { name: "Seated Cable Row", sets: 4, reps: "10–12", rest: 90, muscles: "Lats, Rhomboids, Middle back, Biceps", note: "Neutral-grip handle, knees soft, chest tall. Row to your lower ribs while keeping torso still — no swinging back to add momentum. Squeeze shoulder blades together 1 second, return to a full stretch with arms extended.", tip: "If your torso is rocking to move the weight, drop the pin — the back muscles should do 100% of the pulling.", link: "https://www.muscleandstrength.com/exercises/seated-cable-rows.html" },
      { name: "Cable Face Pull (rope, high pulley)", sets: 3, reps: "15", rest: 60, muscles: "Rear deltoids, Rotator cuff, Middle traps", note: "Rope at head height. Pull toward your face with elbows travelling high and wide, hands finishing beside your ears. Hold 1 second, return slowly.", tip: "This is rotator-cuff insurance for every heavy press you do this week — never skip it just because rear delts already got Fly work above.", link: "https://www.muscleandstrength.com/exercises/cable-face-pull.html" },
      { name: "Preacher Curl Machine", sets: 3, reps: "10–12", rest: 75, muscles: "Biceps (short head)", note: "Chest against the pad, upper arms flat on the preacher bench, full stretch at the bottom. Curl up over 2 seconds, squeeze 1 second at top, lower over 3 seconds — no swinging is possible here, use that.", tip: "The bench physically blocks cheating with your back or shoulders. This is where your heaviest, strictest bicep work should live.", link: "https://www.muscleandstrength.com/exercises/preacher-curl.html" },
      { name: "Seated Dumbbell Preacher Curl", sets: 3, reps: "10–12 each arm", rest: 60, muscles: "Biceps (peak)", note: "Same arm-support bench, one dumbbell, underhand grip. Rest your upper arm flat on the pad, curl up over 2 seconds, squeeze 1 second, lower over 3 — one arm at a time so each side gets full attention.", tip: "Dumbbells let you rotate the wrist slightly at the top (a small supination twist) for an extra peak squeeze a fixed machine bar can't give you — do one arm fully before switching.", link: "https://www.muscleandstrength.com/exercises/dumbbell-preacher-curl.html" },
      { name: "Cable Rope Hammer Curl", sets: 3, reps: "12–15", rest: 60, muscles: "Brachialis, Biceps, Forearms", note: "Low pulley, rope attachment, neutral (thumbs-up) grip held throughout. Curl to shoulder height, elbows pinned to sides, 3-second controlled lowering.", tip: "The brachialis sits under the bicep and pushes it up — developing it makes your arm look thicker from the front. Standard curls barely touch it.", link: "https://www.muscleandstrength.com/exercises/cable-hammer-curl.html" },
      { name: "Cable Woodchop (FAT ZONE)", sets: 3, reps: "12 each side", rest: 45, muscles: "Obliques, Rotational core", note: "High pulley, stand side-on. Pull the handle diagonally down across your body from high anchor side to low opposite hip, rotating through the torso, not the arms. Return slowly with control.", tip: "Power comes from torso rotation, not arms — the obliques sit directly under the love-handle area, but visible change here comes from the cardio finisher and diet, this exercise just builds the muscle shape underneath.", link: "https://www.muscleandstrength.com/exercises/cable-wood-chop.html" },
    ],
  },
  {
    key: "wed",
    label: "Wednesday",
    type: "Legs A",
    color: "#FF6B35",
    bg: "#FAECE7",
    sub: "Knee-Prehab FIRST → Quads → Hip Stability",
    phases: ["10 min bike warm-up + knee prep", "40 min legs", "12 min cycle finisher"],
    cardio: { machine: "cycle", mode: "steady", duration: "12–15 min", target: "moderate resistance, steady cadence", note: "Cycling loads the knee far less than treadmill impact — use this finisher on leg days specifically so cardio never fights with knee recovery." },
    exercises: [
      { name: "Leg Extension Machine — Controlled Partial Reps (KNEE FIX)", sets: 3, reps: "15–20", rest: 45, muscles: "VMO (inner quad), Knee stabilisers", note: "Light-moderate weight. Do NOT extend to a hard lockout at the top — stop 5–10° short, hold 1 second, lower over 3 seconds. This does the same job the band terminal-knee-extension did at home, but with constant resistance through the full range.", tip: "This is your knee-pain insurance — do it before anything heavy, every single leg day, even on days your knee feels fine. Skipping it because it feels 'too easy' is the mistake that lets the pain come back.", link: "https://www.muscleandstrength.com/exercises/leg-extensions.html" },
      { name: "Sled Leg Press — Knee-Safe Depth", sets: 4, reps: "10–12", rest: 90, muscles: "Quads, Glutes, Hamstrings", note: "Feet shoulder-width, mid-platform. Lower only to where your knees stay pain-free — for most people that's roughly 90°, go less if it hurts sooner. Never lock knees out fully at the top; stop 10–15° short.", tip: "Leg press is safer than a free squat for a sore knee because the fixed sled path removes side-to-side stabiliser stress, so you can control depth precisely instead of your knee having to guess.", link: "https://www.muscleandstrength.com/exercises/leg-press.html" },
      { name: "Smith Machine Squat — Partial Depth", sets: 3, reps: "10", rest: 90, muscles: "Quads, Glutes", note: "Bar across upper traps, feet slightly forward of the bar's vertical path (the smith rail forces a straight line, so your foot position has to compensate). Squat only to a depth that stays pain-free, drive up without locking knees at the top.", tip: "If you feel any pain during the descent, stop the set and reduce depth further next set — never push through knee pain to hit a rep count.", link: "https://www.muscleandstrength.com/exercises/smith-machine-squat.html" },
      { name: "Hip Abductor Machine", sets: 3, reps: "15", rest: 45, muscles: "Glute medius, Hip stabilisers", note: "Seated, pads on outer thighs. Push knees apart against the resistance, hold 1 second at the widest point, return under control.", tip: "Weak hip abductors let your knees cave inward under load — that inward cave is a common, fixable source of knee pain. This is one of the more direct relief exercises in the whole plan.", link: "https://www.muscleandstrength.com/exercises/hip-abductor-machine.html" },
      { name: "Hip Adductor Machine", sets: 3, reps: "15", rest: 45, muscles: "Inner thigh, Hip stabilisers", note: "Seated, pads on inner thighs, start with knees apart. Squeeze knees together against the resistance, hold 1 second, return under control.", tip: "Balances the abductor work above — inner and outer hip strength together is what actually keeps the knee tracking straight over the toes.", link: "https://www.muscleandstrength.com/exercises/hip-adductor-machine.html" },
      { name: "Standing Calf Raise Machine", sets: 3, reps: "15–20", rest: 45, muscles: "Gastrocnemius, Soleus", note: "Balls of feet on the platform edge, shoulders under the pads. Lower heels to a full stretch below the platform, rise fully onto toes, 2 seconds each way, no bouncing.", tip: "Strong calves absorb ground impact on every step — building them reduces the load that reaches your knee when you walk.", link: "https://www.muscleandstrength.com/exercises/standing-calf-raise.html" },
      { name: "Cable Crunch (FAT ZONE)", sets: 3, reps: "15", rest: 45, muscles: "Rectus abdominis, Deep core", note: "Kneel facing a high pulley with rope behind your head. Curl your ribs down toward your hips by flexing the spine — hips stay still, this is not a hip-hinge movement. Squeeze 1 second, return under control.", tip: "Ab work does not remove belly fat directly — it builds the muscle that shows once diet and the cardio finishers bring body fat down.", link: "https://www.muscleandstrength.com/exercises/cable-crunch.html" },
    ],
  },
  {
    key: "thu",
    label: "Thursday",
    type: "Push B",
    color: "#6C63FF",
    bg: "#EEEDFE",
    sub: "Shoulders FIRST · Free-Bar Chest · Triceps",
    phases: ["8 min bike warm-up", "45 min push", "12 min treadmill finisher"],
    cardio: { machine: "treadmill", mode: "intervals", duration: "~12 min", target: "6 rounds: 30 sec fast / 90 sec walk", note: "Push the 30-second efforts hard — near a jog or fast walk on incline. Full recovery walk between. This is your one higher-intensity cardio session of the week." },
    exercises: [
      { name: "Cable Shoulder Press", sets: 4, reps: "8–10", rest: 90, muscles: "All three deltoid heads, Triceps", note: "Trained first while shoulders are completely fresh — same logic as rear delts first on pull days. Dual low pulleys (or a single-arm alternating set-up), press straight overhead, stop just short of elbow lockout.", tip: "Cables keep tension on the delt through the whole press, unlike a machine which unloads at the top — genuinely different stimulus from Monday's machine press, not just the same lift with a new name.", link: "https://www.muscleandstrength.com/exercises/cable-shoulder-press.html" },
      { name: "Cable One-Arm Lateral Raise", sets: 3, reps: "15 each arm", rest: 45, muscles: "Lateral deltoid", note: "Low pulley, stand side-on, handle in far hand crossing your body. Raise to shoulder height, 4-second controlled lowering, then switch arms.", tip: "Unilateral work exposes and fixes left/right delt imbalances that a bilateral raise like Monday's can hide — a real variation, not just a tempo tweak on the same set-up.", link: "https://www.muscleandstrength.com/exercises/cable-one-arm-lateral-raise.html" },
      { name: "Barbell Bench Press (Free Weight)", sets: 4, reps: "8–10", rest: 90, muscles: "Chest, Front delts, Triceps", note: "Use the rack with safety pins/spotter arms set just below chest level. Unlike Monday's smith press, the bar isn't locked to a rail — your stabiliser muscles have to control the path, which is a stronger overall growth stimulus.", tip: "Start a plate lighter than you think on your first few weeks of free-bar pressing — the balance demand alone will make it feel harder than the smith version at the same weight.", link: "https://www.muscleandstrength.com/exercises/barbell-bench-press.html" },
      { name: "Cable Front Raise", sets: 3, reps: "12–15", rest: 60, muscles: "Front deltoid", note: "Low pulley behind you, single handle. Raise straight out in front to shoulder height, slight bend in elbow, lower under control.", tip: "Front delts already get worked by every press — keep this one light and controlled rather than heavy, it's a finishing touch, not a main lift.", link: "https://www.muscleandstrength.com/exercises/cable-front-raise.html" },
      { name: "Cable Crossover — Low-to-High", sets: 3, reps: "12–15", rest: 60, muscles: "Upper/outer chest", note: "Set both pulleys at the LOW position this time (opposite of Monday). Sweep handles up and across in front of your face — this angle hits the upper chest fibres Monday's version misses.", tip: "Same tower, opposite pulley height — small setup change, different part of the chest trained.", link: "https://www.muscleandstrength.com/exercises/cable-crossover.html" },
      { name: "Close-Grip Barbell Bench Press", sets: 3, reps: "10–12", rest: 75, muscles: "Triceps, Inner chest", note: "Same bar and rack as your bench press, hands just inside shoulder-width. Lower to your lower chest, elbows tracking close to your sides rather than flaring out.", tip: "This is your compound tricep builder — heavier overall load than any cable pushdown, which is exactly what triceps need to keep growing.", link: "https://www.muscleandstrength.com/exercises/close-grip-bench-press.html" },
      { name: "Dumbbell Seated Triceps Extension", sets: 3, reps: "12", rest: 60, muscles: "Long head of triceps", note: "Sit on a bench, back straight. Hold one dumbbell with both hands, press it straight overhead. Bend elbows and lower the dumbbell behind your head, upper arms staying close to your ears, then press back up.", tip: "This is your only free-weight isolation move for triceps this week — the compound close-grip press above builds raw strength, this finishes the long head with a deep overhead stretch a cable can't quite replicate at this angle.", link: "https://www.muscleandstrength.com/exercises/seated-dumbbell-triceps-extension.html" },
    ],
  },
  {
    key: "fri",
    label: "Friday",
    type: "Pull B",
    color: "#0DBD8B",
    bg: "#E1F5EE",
    sub: "Rear Delts FIRST → Back Thickness → Biceps",
    phases: ["8 min bike warm-up", "45 min pull", "12 min cycle finisher"],
    cardio: { machine: "cycle", mode: "intervals", duration: "12–15 min", target: "1 min hard / 2 min easy, alternating", note: "Same protocol as Tuesday. Seated cycling adds no extra load before tomorrow's Legs B session." },
    exercises: [
      { name: "Barbell Rear Delt Raise", sets: 4, reps: "15", rest: 45, muscles: "Rear deltoids, Rhomboids", note: "Bent over at the hips ~45°, barbell hanging at arm's length, palms facing you. Raise the bar out and up by driving elbows high and wide until arms are level with your torso, squeeze 1 second, lower slowly.", tip: "Free-bar bent-over raise instead of Tuesday's machine fly — different balance and stabiliser demand on the same small muscle, real variation rather than a paused rep on the same machine.", link: "https://www.muscleandstrength.com/exercises/bent-over-barbell-rear-delt-raise.html" },
      { name: "Cable Straight-Arm Pulldown", sets: 3, reps: "15", rest: 60, muscles: "Lats, Serratus", note: "High pulley, straight-bar or rope attachment, arms kept straight the whole movement. Pull down to your hips by squeezing your lats — imagine pinching a pencil in your armpits.", tip: "With arms straight, biceps physically can't help — this is pure lat isolation before the compound rows tire your arms out.", link: "https://www.muscleandstrength.com/exercises/straight-arm-pulldown.html" },
      { name: "Cable Lat Pulldown (Full Range)", sets: 4, reps: "10–12", rest: 90, muscles: "Lats, Biceps", note: "Different rig from Tuesday — a cable-stack pulldown station instead of the plate-loaded lever machine. Pull the bar to your upper chest through a deliberately full range, stretching all the way up at the top.", tip: "Same target muscle, different resistance curve — a cable stack loads the stretched position harder than a lever machine does, which the lever pulldown on Tuesday doesn't give you.", link: "https://www.muscleandstrength.com/exercises/cable-lat-pulldown.html" },
      { name: "Lever High Row", sets: 3, reps: "10–12", rest: 90, muscles: "Upper back, Rhomboids, Rear delts", note: "Plate-loaded row machine, handles set high. Row with elbows flaring wide and high toward your ears rather than tucked to your ribs — a different pulling angle from Tuesday's seated cable row.", tip: "High row hits the upper back and rear delts harder than a standard row — back width and back thickness need different pulling angles to both grow, and this is a genuinely different machine from Tuesday's.", link: "https://www.muscleandstrength.com/exercises/lever-high-row.html" },
      { name: "Barbell Preacher Curl", sets: 3, reps: "10–12", rest: 75, muscles: "Biceps (short head)", note: "Chest against the preacher pad, EZ or straight bar, full stretch at the bottom. Curl up in 1 second, lower over a full 4 seconds — free weight instead of Tuesday's cable stack.", tip: "Free weight on the preacher bench loads the bottom stretch differently than a cable, which keeps constant tension throughout — swapping the resistance type is what makes this a real second bicep stimulus, not just a tempo change on the same cable.", link: "https://www.muscleandstrength.com/exercises/preacher-curl.html" },
      { name: "Cable Concentration Curl (single arm, low pulley)", sets: 3, reps: "12 each arm", rest: 75, muscles: "Bicep peak", note: "Seated, elbow braced against the inside of your thigh (not your knee), single handle on a low pulley. Curl slowly, squeeze 1 second at the top, lower over 3 seconds.", tip: "With the elbow braced, swinging is physically impossible — every rep here is pure bicep, unlike a free curl where momentum can sneak in.", link: "https://www.muscleandstrength.com/exercises/concentration-curl.html" },
      { name: "Cable Side Bend (FAT ZONE)", sets: 3, reps: "15 each side", rest: 45, muscles: "Obliques, Quadratus lumborum", note: "Stand side-on to a low pulley, handle in the far hand. Keeping hips square and still, bend sideways toward the pulley, feel the far-side oblique stretch, return upright by contracting it.", tip: "Hips must not tilt — if they do, you're just swinging, not training obliques. These sit directly under the love-handle area, but they'll only show once overall body fat drops through diet and the cardio finishers.", link: "https://www.muscleandstrength.com/exercises/cable-side-bend.html" },
    ],
  },
  {
    key: "sat",
    label: "Saturday",
    type: "Legs B",
    color: "#FF6B35",
    bg: "#FAECE7",
    sub: "Knee-Prehab FIRST → Hamstrings/Glutes → Calves",
    phases: ["10 min bike warm-up + knee prep", "40 min legs", "12 min treadmill finisher"],
    cardio: { machine: "treadmill", mode: "steady", duration: "12–15 min", target: "8–12% incline, brisk pace", note: "Same protocol as Monday — steady incline walk to close the week's cardio volume." },
    exercises: [
      { name: "Leg Extension Machine — Activation Sets (KNEE FIX)", sets: 3, reps: "15–20", rest: 45, muscles: "VMO (inner quad), Knee stabilisers", note: "Same protocol as Wednesday — light weight, stop short of lockout, controlled tempo. Non-negotiable on both leg days regardless of how the knee feels that day.", tip: "Skipping this on the days it feels fine is exactly how the pain comes back — consistency here is what builds lasting knee resilience, not intensity.", link: "https://www.muscleandstrength.com/exercises/leg-extensions.html" },
      { name: "Leg Curl Machine (lying or seated)", sets: 4, reps: "10–12", rest: 90, muscles: "Hamstrings", note: "Pad positioned just above the heel. Curl through a full range without lifting your hips off the pad, squeeze 1 second at the top, lower over 3 seconds.", tip: "Quad-dominant training (leg press, squats) without matching hamstring work creates a strength imbalance that itself stresses the knee joint — this exercise is what balances it out.", link: "https://www.muscleandstrength.com/exercises/lying-leg-curl.html" },
      { name: "Sled Leg Press — High Foot Placement", sets: 4, reps: "10–12", rest: 90, muscles: "Glutes, Hamstrings, Quads", note: "Same machine as Wednesday, feet moved higher on the platform this time — shifts emphasis from quads toward glutes and hamstrings. Same knee-safe depth rule applies: never lock out, stop where it's pain-free.", tip: "Foot position is the easiest way to change what a leg press trains — high and wide biases posterior chain, low and narrow biases quads.", link: "https://www.muscleandstrength.com/exercises/leg-press.html" },
      { name: "Side-Lying Hip Abduction — Burnout", sets: 3, reps: "20 each side", rest: 45, muscles: "Glute medius, Hip stabilisers", note: "Lie on your side, legs stacked and straight (or bottom knee bent for balance). Raise the top leg straight up toward the ceiling, hold 1 second at the top, lower under control without letting the hip roll back.", tip: "Bodyweight instead of Wednesday's machine — this is one of the two most directly knee-relief-focused exercises in the whole week, and doing it unloaded lets you feel (and fix) any rolling-hip cheat the machine's pad hides.", link: "https://www.muscleandstrength.com/exercises/side-lying-hip-abduction.html" },
      { name: "Smith Machine Romanian Deadlift", sets: 3, reps: "10–12", rest: 90, muscles: "Hamstrings, Glutes, Lower back", note: "Bar in the smith rail, feet hip-width. Hinge at the hips with a soft, fixed knee bend — the bar travels straight down close to your shins as your hips push back. Drive hips forward to stand.", tip: "This is a hip-hinge, not a knee-bend movement — it loads hamstrings and glutes hard while asking almost nothing of the knee joint itself, a good compound on a day the knee needs a break from bending.", link: "https://www.muscleandstrength.com/exercises/smith-machine-romanian-deadlift.html" },
      { name: "Seated / Cable Calf Raise Machine", sets: 3, reps: "15–20", rest: 45, muscles: "Soleus, Gastrocnemius", note: "Pads on thighs (seated machine) or handle at floor level (cable calf press). Full stretch at the bottom, full contraction at the top, 2 seconds each way.", tip: "The seated position isolates the soleus (the deep calf muscle) better than standing raises — pair it with Wednesday's standing version for full calf development.", link: "https://www.muscleandstrength.com/exercises/seated-calf-raise.html" },
      { name: "Hanging Leg Raise (Smith Rack) — FAT ZONE", sets: 3, reps: "12–15", rest: 60, muscles: "Lower abs, Hip flexors, Deep core", note: "Hang from the smith rack's pull-up bar or a dip station. Raise knees (or straight legs if strong enough) toward your chest by curling the pelvis under, don't just swing legs up from the hips.", tip: "The curl-the-pelvis detail is what makes this an ab exercise instead of a hip-flexor swing — control the descent just as much as the raise.", link: "https://www.muscleandstrength.com/exercises/hanging-leg-raise.html" },
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

  const addTime = useCallback((key, seconds) => {
    setTimers((p) => ({ ...p, [key]: (p[key] ?? 0) + seconds }));
  }, []);

  useEffect(() => () => Object.values(intervals.current).forEach(clearInterval), []);
  return { timers, startTimer, skipTimer, addTime };
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
  t += `---\n*Phase 3 Gym Recomp — 6 days/wk · Smith Machine, Bench Press, Leg Press, Cable Machines, Treadmill, Cycle*\n`;
  return t;
}

// ─── LOCAL EXERCISEDB GIF LOOKUP ─────────────────────────────────────────────

const g = (f: string) => `/gifs/${f}`;

// Sourced from exercises-dataset-main (github.com/hasaneyldrm/exercises-dataset,
// 1324 real Gym Visual exercises with equipment tags) — every entry below is an
// exact machine/equipment match to what's actually being trained, pulled from
// data/exercises.json. Media © Gym visual — https://gymvisual.com/, used under
// the dataset's redistribution permission at 180×180 (see its NOTICE.md/LICENSE).

const WORKOUT_GIF_MAP: Record<string, string> = {
  // PUSH A (Monday) / PUSH B (Thursday) — shoulder press & lateral raise now use
  // different equipment each day so the same muscle gets a real second stimulus
  "smith machine flat bench press":  g("trqKQv2.gif"),  // "smith bench press"
  "smith machine incline bench press": g("5v7KYld.gif"), // "smith incline bench press"
  "cable crossover":                 g("j7XMAyn.gif"),  // "cable upper chest crossovers"
  "machine shoulder press":          g("67n3r98.gif"),  // "lever shoulder press" (Monday)
  "cable shoulder press":            g("PzQanLE.gif"),  // "cable shoulder press" (Thursday)
  "cable lateral raise":             g("goJ6ezq.gif"),  // "cable lateral raise" (Monday)
  "cable one-arm lateral raise":     g("wEulIzp.gif"),  // "cable one arm lateral raise" (Thursday)
  "cable tricep pushdown":           g("dU605di.gif"),  // "cable pushdown (with rope attachment)"
  "cable overhead tricep extension": g("1xHyxys.gif"),  // "cable high pulley overhead tricep extension"
  "barbell bench press":             g("EIeI8Vf.gif"),  // "barbell bench press"
  "cable front raise":               g("u2X71Np.gif"),  // "cable front raise"
  "close-grip barbell bench press":  g("J6Dx1Mu.gif"),  // "barbell close-grip bench press"
  "treadmill incline walk":          g("rjiM4L3.gif"),  // "walking on incline treadmill"
  "treadmill intervals":             g("rjiM4L3.gif"),  // "walking on incline treadmill"
  "dumbbell seated triceps extension": g("kont8Ut.gif"), // "dumbbell seated triceps extension"

  // PULL A (Tuesday) / PULL B (Friday) — rear delt, lat, row & preacher curl
  // each switch equipment on Friday instead of repeating Tuesday's exercise
  "rear delt machine fly":           g("myfUsKf.gif"),  // "lever seated reverse fly" (Tuesday)
  "seated dumbbell preacher curl":   g("7D5bgLT.gif"),  // "dumbbell seated preacher curl"
  "barbell rear delt raise":         g("Ln9iTbU.gif"),  // "barbell rear delt raise" (Friday)
  "lat pulldown":                    g("7F1DVzn.gif"),  // "lever front pulldown" (Tuesday)
  "cable lat pulldown":              g("LEprlgG.gif"),  // "cable lat pulldown full range of motion" (Friday)
  "seated cable row":                g("fUBheHs.gif"),  // "cable seated row" (Tuesday)
  "lever high row":                  g("nZZZy9m.gif"),  // "lever high row" (Friday)
  "cable face pull":                 g("wqNPGCg.gif"),  // "cable rear delt row (with rope)"
  "cable straight-arm pulldown":     g("x69MAlq.gif"),  // "cable straight arm pulldown"
  "preacher curl machine":           g("P2lNrGL.gif"),  // "cable preacher curl" (Tuesday)
  "barbell preacher curl":           g("qOgPVf6.gif"),  // "barbell preacher curl" (Friday)
  "cable rope hammer curl":          g("HPlPoQA.gif"),  // "cable hammer curl (with rope)"
  "cable concentration curl":        g("NvfE43H.gif"),  // "cable concentration curl"
  "cable woodchop":                  g("aVs3BR3.gif"),  // "cable twist"
  "cable side bend":                 g("wPypxFY.gif"),  // "cable side bend"
  "stationary cycle intervals":      g("H1PESYI.gif"),  // "stationary bike run"
  "stationary cycle — knee-friendly finisher": g("a8VDgLw.gif"), // "stationary bike walk"

  // LEGS A (Wednesday) / LEGS B (Saturday) — leg press is one machine (foot
  // placement is the real variable); hip abductor swaps to bodyweight on Saturday
  "leg extension machine":           g("my33uHU.gif"),  // "lever leg extension"
  "sled leg press":                  g("10Z2DXU.gif"),  // "sled 45° leg press"
  "smith machine squat":             g("jFtipLl.gif"),  // "smith squat"
  "hip abductor machine":            g("CHpahtl.gif"),  // "lever seated hip abduction" (Wednesday)
  "side-lying hip abduction":        g("7WaDzyL.gif"),  // "side hip abduction" (Saturday, bodyweight)
  "hip adductor machine":            g("oHsrypV.gif"),  // "lever seated hip adduction"
  "standing calf raise machine":     g("ykUOVze.gif"),  // "lever standing calf raise"
  "cable crunch":                    g("8xUv4J7.gif"),  // "cable seated crunch"
  "leg curl machine":                g("17lJ1kr.gif"),  // "lever lying leg curl"
  "smith machine romanian deadlift": g("UfePqpx.gif"),  // "smith deadlift"
  "seated cable calf raise machine": g("bOOdeyc.gif"),  // "lever seated calf raise"
  "hanging leg raise":               g("I3tsCnC.gif"),  // "hanging leg raise"
};

// Normalise a workout exercise name for map lookup
function normaliseWorkout(s: string): string {
  return s.toLowerCase()
    .replace(/\([^)]*\)/g, '')   // remove (2 kg), (low step), (5 sec) etc.
    .replace(/[^a-z0-9 \-—]/g, '') // keep letters, digits, spaces, hyphens, em-dash
    .replace(/\s+/g, ' ')
    .trim();
}

// Return the best-matched local GIF URL for a workout exercise name, or null.
function findLocalGif(exerciseName: string): string | null {
  const key = normaliseWorkout(exerciseName);

  // 1. Direct key lookup
  if (WORKOUT_GIF_MAP[key]) return WORKOUT_GIF_MAP[key];

  // 2. Prefix/substring match
  for (const mapKey of Object.keys(WORKOUT_GIF_MAP)) {
    if (key.startsWith(mapKey) || mapKey.startsWith(key)) {
      return WORKOUT_GIF_MAP[mapKey];
    }
  }

  // 3. Word-overlap fallback
  const words = key.split(' ').filter(w => w.length > 3);
  let bestKey = '';
  let bestScore = 0;
  for (const mapKey of Object.keys(WORKOUT_GIF_MAP)) {
    const score = words.filter(w => mapKey.includes(w)).length;
    if (score > bestScore) { bestScore = score; bestKey = mapKey; }
  }
  if (bestScore >= 2) return WORKOUT_GIF_MAP[bestKey];

  return null;
}

type SetLog = { reps: number | null; weight: number | null; mode: "hold" | "tap" };
type ExLogs = Record<number, SetLog>;
type HistoryPoint = { date: string; weight: number | null; sets: number; reps: number };

// ─── THEME (dark "iron & chalk" default, light override) ────────────────────
// Same token values as the approved Session Mode concept artifact.

function ThemeStyles() {
  return (
    <style jsx global>{`
      :root {
        --bg: #17181c;
        --surface: #1f2127;
        --surface-2: #292c33;
        --surface-3: #33363f;
        --ink: #f4f1ea;
        --ink-dim: #93969f;
        --ink-faint: #5b5e68;
        --brass: #e4a93f;
        --brass-ink: #201502;
        --steel: #6b92b0;
        --good: #6fcf97;
        --danger: #e3707c;
        --hairline: rgba(244, 241, 234, 0.09);
      }
      :root[data-theme="light"] {
        --bg: #f6f3ec; --surface: #ffffff; --surface-2: #ece7dc; --surface-3: #e2ddcf;
        --ink: #1b1a17; --ink-dim: #6e6a60; --ink-faint: #a8a396;
        --brass: #b3791c; --brass-ink: #fff8ec; --steel: #3d6e90; --good: #2e9a5c; --danger: #c23a4a;
        --hairline: rgba(27, 26, 23, 0.09);
      }
      @media (prefers-color-scheme: light) {
        :root:not([data-theme="dark"]) {
          --bg: #f6f3ec; --surface: #ffffff; --surface-2: #ece7dc; --surface-3: #e2ddcf;
          --ink: #1b1a17; --ink-dim: #6e6a60; --ink-faint: #a8a396;
          --brass: #b3791c; --brass-ink: #fff8ec; --steel: #3d6e90; --good: #2e9a5c; --danger: #c23a4a;
          --hairline: rgba(27, 26, 23, 0.09);
        }
      }
      html, body { background: var(--bg); color: var(--ink); }
      body { margin: 0; font-family: -apple-system, "SF Pro Text", "Segoe UI", system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
      }
    `}</style>
  );
}

// ─── SET LOGGING (hold ~1s = full reps, tap = enter actual reps) ────────────

function RepsPopover({ dayColor, repsRange, onPick, onClose }: {
  dayColor: string; repsRange: { min: number; max: number } | null;
  onPick: (reps: number | null) => void; onClose: () => void;
}) {
  const [custom, setCustom] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const chips = repsRange
    ? Array.from(new Set([repsRange.min, repsRange.min + 1, repsRange.max - 1, repsRange.max].filter((n) => n > 0))).sort((a, b) => a - b)
    : [];

  // Close on an outside tap — but only start listening a tick after mount, so
  // the trailing synthetic click from the *same* tap that opened this popover
  // doesn't instantly close it again (previously looked like a keyboard flicker).
  useEffect(() => {
    const handleOutside = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    };
    const id = window.setTimeout(() => document.addEventListener("pointerdown", handleOutside), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("pointerdown", handleOutside);
    };
  }, [onClose]);

  return (
    <div className="scrim">
      <div ref={rootRef} className="sheet-card">
        <div className="eyebrow center">Actual reps</div>
        <div className="chip-row center">
          {chips.map((n) => (
            <button key={n} className="chip-btn" style={{ "--dc": dayColor } as any} onClick={() => onPick(n)}>{n}</button>
          ))}
          <button className="chip-btn ghost" onClick={() => onPick(0)}>Skip</button>
        </div>
        <div className="input-row">
          <input
            type="number" inputMode="numeric" value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Custom #"
            className="text-input"
          />
          <button
            className="square-btn"
            style={{ "--dc": dayColor } as any}
            onClick={() => { const n = parseInt(custom, 10); if (!Number.isNaN(n)) onPick(n); }}
          >✓</button>
        </div>
      </div>
      <style jsx>{`
        .scrim { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.55); padding: 24px; }
        .sheet-card { background: var(--surface); border: 1px solid var(--hairline); border-radius: 18px; padding: 18px; width: 100%; max-width: 280px; box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
        .eyebrow { font-size: 11px; font-weight: 700; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; }
        .center { text-align: center; }
        .chip-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .chip-btn { width: 46px; height: 46px; border-radius: 12px; border: 1.5px solid var(--dc, var(--brass)); background: color-mix(in srgb, var(--dc, var(--brass)) 16%, transparent); color: var(--dc, var(--brass)); font-size: 16px; font-weight: 800; cursor: pointer; touch-action: manipulation; }
        .chip-btn.ghost { border-color: var(--hairline); background: var(--surface-2); color: var(--ink-dim); font-size: 13px; font-weight: 600; padding: 0 14px; width: auto; }
        .input-row { display: flex; gap: 8px; }
        .text-input { flex: 1; min-width: 0; height: 46px; border-radius: 12px; border: 1px solid var(--hairline); background: var(--surface-2); color: var(--ink); padding: 0 14px; font-size: 16px; box-sizing: border-box; }
        .square-btn { width: 46px; height: 46px; border-radius: 12px; border: none; background: var(--dc, var(--brass)); color: var(--brass-ink); font-weight: 800; font-size: 17px; cursor: pointer; flex-shrink: 0; touch-action: manipulation; }
      `}</style>
    </div>
  );
}

function SetPip({ setIdx, dayColor, log, repsRange, onConfirm }: {
  setIdx: number; dayColor: string; log?: SetLog;
  repsRange: { min: number; max: number } | null;
  onConfirm: (setIdx: number, reps: number | null, mode: "hold" | "tap") => void;
}) {
  const [holding, setHolding] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const confirmedRef = useRef(false);
  const done = !!log;

  const start = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (done) { setPickerOpen(true); return; }
    confirmedRef.current = false;
    setHolding(true);
  };
  const release = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (confirmedRef.current) { confirmedRef.current = false; return; }
    if (holding) { setHolding(false); setPickerOpen(true); }
  };
  const cancel = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (holding) setHolding(false);
  };
  const onFillDone = () => {
    if (!holding) return;
    confirmedRef.current = true;
    setHolding(false);
    onConfirm(setIdx, repsRange?.max ?? null, "hold");
  };

  return (
    <div className="pip-wrap" style={{ "--dc": dayColor } as any} onClick={(e) => e.stopPropagation()}>
      <button
        className={`pip ${done ? "done" : ""}`}
        onPointerDown={start}
        onPointerUp={release}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          className="fill"
          data-holding={holding}
          onTransitionEnd={(e) => { if (e.propertyName === "transform") onFillDone(); }}
        />
        <span className="num">{done ? (log!.reps ?? "✓") : setIdx + 1}</span>
      </button>

      {pickerOpen && (
        <RepsPopover
          dayColor={dayColor}
          repsRange={repsRange}
          onPick={(reps) => { setPickerOpen(false); onConfirm(setIdx, reps, "tap"); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
      <style jsx>{`
        .pip-wrap { position: relative; }
        .pip {
          position: relative; width: 46px; height: 46px; border-radius: 50%;
          border: 1.5px solid var(--surface-3); background: var(--surface);
          color: var(--ink-dim); font-size: 14px; font-weight: 800; padding: 0;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; cursor: pointer; flex-shrink: 0;
          -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none;
          user-select: none; touch-action: manipulation;
        }
        .pip.done { border-color: var(--dc, var(--brass)); }
        .fill { position: absolute; inset: 0; border-radius: 50%; background: var(--dc, var(--brass)); transform: scale(0); transition: transform 150ms ease-out; }
        .fill[data-holding="true"] { transition: transform 900ms linear; transform: scale(1); }
        .pip.done .fill { transform: scale(1); transition: none; }
        .num { position: relative; z-index: 1; }
        .pip.done .num, .fill[data-holding="true"] ~ .num { color: var(--brass-ink); }
      `}</style>
    </div>
  );
}

function SetPipRow({ ex, exIdx, dayColor, logs, onConfirm }: {
  ex: any; exIdx: number; dayColor: string; logs: ExLogs;
  onConfirm: (exIdx: number, setIdx: number, reps: number | null, mode: "hold" | "tap") => void;
}) {
  const repsRange = parseRepsRange(ex.reps);
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {Array.from({ length: ex.sets }, (_, si) => (
        <SetPip
          key={si} setIdx={si} dayColor={dayColor} log={logs[si]} repsRange={repsRange}
          onConfirm={(setIdx, reps, mode) => onConfirm(exIdx, setIdx, reps, mode)}
        />
      ))}
    </div>
  );
}

// ─── WEIGHT SHEET (draggable ruler + progression sparkline) ─────────────────

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || points.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, h = canvas.height, pad = 4;
    ctx.clearRect(0, 0, w, h);
    const min = Math.min(...points), max = Math.max(...points);
    const range = Math.max(max - min, 1);
    const pts = points.map((v, i) => [
      pad + (i / (points.length - 1)) * (w - pad * 2),
      h - pad - ((v - min) / range) * (h - pad * 2),
    ]);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], h);
    pts.forEach((p) => ctx.lineTo(p[0], p[1]));
    ctx.lineTo(pts[pts.length - 1][0], h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, `${color}59`);
    grad.addColorStop(1, `${color}00`);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = "round";
    ctx.stroke();
    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last[0], last[1], 2.4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [points, color]);
  if (points.length < 2) return null;
  return <canvas ref={ref} width={72} height={30} />;
}

const TICK_COUNT = 161, TICK_W = 14, STEP = 1.25;
const RULER_CENTER_PX = (TICK_COUNT * TICK_W) / 2;

function WeightSheet({ dayColor, current, history, onSave, onClose }: {
  dayColor: string; current: number | null; history: number[];
  onSave: (weight: number | null) => void; onClose: () => void;
}) {
  const [value, setValue] = useState(current ?? 0);
  const rootRef = useRef<HTMLDivElement>(null);
  const ticksRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef(current ?? 0);

  useEffect(() => {
    const handleOutside = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    };
    const id = window.setTimeout(() => document.addEventListener("pointerdown", handleOutside), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("pointerdown", handleOutside);
    };
  }, [onClose]);

  const applyOffset = useCallback((v: number) => {
    if (!ticksRef.current) return;
    const deltaTicks = (v - anchorRef.current) / STEP;
    ticksRef.current.style.transform = `translateX(${-(deltaTicks * TICK_W) - RULER_CENTER_PX}px)`;
  }, []);

  useEffect(() => { applyOffset(value); }, [applyOffset, value]);

  const setVal = (v: number) => setValue(Math.max(0, Math.round(v * 4) / 4));

  const dragRef = useRef<{ startX: number; startVal: number } | null>(null);
  const onRulerDown = (e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, startVal: value };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onRulerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    setVal(dragRef.current.startVal - (dx / TICK_W) * STEP);
  };
  const endDrag = () => { dragRef.current = null; };

  const displayVal = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, "").replace(/\.$/, "");

  return (
    <div className="scrim">
      <div ref={rootRef} className="sheet-card">
        <div className="num-display">{displayVal}</div>
        <div className="label">kg on the bar</div>

        {history.length >= 2 && (
          <div className="spark-row">
            <Sparkline points={history} color={dayColor} />
            <span className="spark-caption">last {history.length} sessions</span>
          </div>
        )}

        <div className="ruler-wrap" onPointerDown={onRulerDown} onPointerMove={onRulerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          <div className="ruler-track">
            <div className="ruler-ticks" ref={ticksRef}>
              {Array.from({ length: TICK_COUNT }, (_, i) => (
                <div key={i} className={`tick ${i % 4 === 0 ? "major" : "minor"}`}><i /></div>
              ))}
            </div>
          </div>
          <div className="ruler-indicator" style={{ "--dc": dayColor } as any} />
        </div>

        <div className="stepper-row">
          <button className="step-btn" onClick={() => setVal(value - 2.5)}>−</button>
          <div className="quick-chips">
            {[-10, -5, 5, 10].map((d) => (
              <button key={d} className="quick-chip" onClick={() => setVal(value + d)}>{d > 0 ? `+${d}` : d}</button>
            ))}
          </div>
          <button className="step-btn" onClick={() => setVal(value + 2.5)}>+</button>
        </div>

        <div className="btn-row">
          <button className="ghost-btn" onClick={() => onSave(null)}>Clear</button>
          <button className="solid-btn" style={{ "--dc": dayColor } as any} onClick={() => onSave(value)}>Save weight</button>
        </div>
      </div>
      <style jsx>{`
        .scrim { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.55); padding: 24px; }
        .sheet-card { background: var(--surface); border: 1px solid var(--hairline); border-radius: 20px; padding: 20px; width: 100%; max-width: 300px; box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
        .num-display { text-align: center; font-size: 46px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; color: var(--ink); }
        .label { text-align: center; font-size: 11px; color: var(--ink-faint); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
        .spark-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px; }
        .spark-caption { font-size: 10px; color: var(--ink-faint); }
        .ruler-wrap { position: relative; height: 60px; margin: 12px 0 18px; touch-action: pan-y; }
        .ruler-track { position: absolute; inset: 0; overflow: hidden; border-radius: 12px; background: var(--surface-2); }
        .ruler-ticks { position: absolute; top: 0; left: 50%; height: 100%; display: flex; align-items: flex-end; will-change: transform; }
        .tick { width: ${TICK_W}px; flex-shrink: 0; display: flex; justify-content: center; }
        .tick i { display: block; width: 2px; height: 12px; background: var(--ink-faint); border-radius: 1px; }
        .tick.major i { height: 24px; width: 2.5px; background: var(--ink-dim); }
        .ruler-indicator { position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; transform: translateX(-1px); background: var(--dc, var(--brass)); border-radius: 1px; pointer-events: none; }
        .stepper-row { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; }
        .step-btn { width: 42px; height: 42px; border-radius: 12px; border: 1px solid var(--hairline); background: var(--surface-2); color: var(--ink); font-size: 18px; font-weight: 700; cursor: pointer; flex-shrink: 0; touch-action: manipulation; }
        .quick-chips { display: flex; gap: 6px; flex: 1; overflow-x: auto; }
        .quick-chip { flex-shrink: 0; padding: 0 12px; height: 30px; border-radius: 16px; border: 1px solid var(--hairline); background: transparent; color: var(--ink-dim); font-size: 12px; font-weight: 700; cursor: pointer; }
        .btn-row { display: flex; gap: 8px; }
        .ghost-btn, .solid-btn { flex: 1; height: 44px; border-radius: 12px; border: none; font-size: 13.5px; font-weight: 700; cursor: pointer; touch-action: manipulation; }
        .ghost-btn { background: var(--surface-2); color: var(--ink-dim); }
        .solid-btn { flex: 2; background: var(--dc, var(--brass)); color: var(--brass-ink); }
      `}</style>
    </div>
  );
}

// ─── REST SHEET (circular ring timer) ────────────────────────────────────────

function RestSheet({ dayColor, seconds, total, onSkip, onAddTime }: {
  dayColor: string; seconds: number; total: number; onSkip: () => void; onAddTime: () => void;
}) {
  const CIRC = 2 * Math.PI * 44;
  const offset = CIRC * (1 - Math.max(seconds, 0) / Math.max(total, 1));
  return (
    <div className="scrim">
      <div className="sheet-card">
        <div className="ring-wrap" style={{ "--dc": dayColor } as any}>
          <svg viewBox="0 0 100 100">
            <circle className="ring-bg" cx="50" cy="50" r="44" />
            <circle className="ring-fg" cx="50" cy="50" r="44" strokeDasharray={CIRC} strokeDashoffset={offset} />
          </svg>
          <div className="ring-num">{Math.max(seconds, 0)}</div>
        </div>
        <p>Rest — breathe &amp; hydrate</p>
        <div className="btn-row">
          <button className="ghost-btn" onClick={onSkip}>Skip rest</button>
          <button className="solid-btn" style={{ "--dc": dayColor } as any} onClick={onAddTime}>+15 sec</button>
        </div>
      </div>
      <style jsx>{`
        .scrim { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.55); padding: 24px; }
        .sheet-card { background: var(--surface); border: 1px solid var(--hairline); border-radius: 20px; padding: 22px; width: 100%; max-width: 300px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
        .ring-wrap { position: relative; width: 168px; height: 168px; margin: 4px auto 16px; }
        .ring-wrap svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .ring-bg { fill: none; stroke: var(--surface-2); stroke-width: 10; }
        .ring-fg { fill: none; stroke: var(--dc, var(--brass)); stroke-width: 10; stroke-linecap: round; transition: stroke-dashoffset 1s linear; }
        .ring-num { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 800; font-variant-numeric: tabular-nums; font-family: ui-monospace, "SF Mono", "Cascadia Code", monospace; color: var(--ink); }
        p { margin: 0 0 18px; color: var(--ink-dim); font-size: 13px; }
        .btn-row { display: flex; gap: 8px; }
        .ghost-btn, .solid-btn { flex: 1; height: 46px; border-radius: 14px; border: none; font-size: 13.5px; font-weight: 700; cursor: pointer; touch-action: manipulation; }
        .ghost-btn { background: var(--surface-2); color: var(--ink-dim); }
        .solid-btn { background: var(--dc, var(--brass)); color: var(--brass-ink); }
      `}</style>
    </div>
  );
}

// ─── INFO SHEET (how-to / tip / gif / guide link) ────────────────────────────

function InfoSheet({ ex, dayColor, onClose }: { ex: any; dayColor: string; onClose: () => void }) {
  const gifUrl = findLocalGif(ex.name);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutside = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    };
    const id = window.setTimeout(() => document.addEventListener("pointerdown", handleOutside), 0);
    return () => { window.clearTimeout(id); document.removeEventListener("pointerdown", handleOutside); };
  }, [onClose]);

  return (
    <div className="scrim">
      <div ref={rootRef} className="sheet-card">
        <div className="head">
          <div className="title">{ex.name}</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {gifUrl && (
          <div className="gif-wrap">
            <img src={gifUrl} alt={`${ex.name} animation`} />
            <div className="credit">© Gym visual — gymvisual.com</div>
          </div>
        )}

        <a href={ex.link} target="_blank" rel="noopener noreferrer" className="guide-link" style={{ "--dc": dayColor } as any}>
          <span className="play">▶</span>
          <span>
            <div className="guide-title">View exercise guide</div>
            <div className="guide-sub">Video + images on Muscle &amp; Strength →</div>
          </span>
        </a>

        <div className="block">
          <span className="block-label">How to</span>
          {ex.note}
        </div>
        <div className="block tip">
          <span className="block-label">Tip</span>
          {ex.tip}
        </div>
      </div>
      <style jsx>{`
        .scrim { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: flex-end; justify-content: center; background: rgba(0,0,0,0.55); }
        .sheet-card { background: var(--surface); border-radius: 24px 24px 0 0; padding: 18px 18px calc(24px + env(safe-area-inset-bottom, 0px)); width: 100%; max-width: 480px; max-height: 82vh; overflow-y: auto; box-shadow: 0 -20px 50px rgba(0,0,0,0.4); }
        .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
        .title { font-size: 17px; font-weight: 800; color: var(--ink); line-height: 1.25; }
        .close-btn { flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; border: none; background: var(--surface-2); color: var(--ink-dim); font-size: 14px; cursor: pointer; }
        .gif-wrap { border-radius: 14px; overflow: hidden; border: 1px solid var(--hairline); background: var(--surface-2); margin-bottom: 12px; }
        .gif-wrap img { width: 100%; display: block; }
        .credit { font-size: 10px; color: var(--ink-faint); text-align: center; padding: 4px 0 6px; }
        .guide-link { display: flex; align-items: center; gap: 10px; background: var(--surface-2); border: 1px solid var(--hairline); border-radius: 12px; padding: 12px 14px; margin-bottom: 12px; text-decoration: none; }
        .play { width: 34px; height: 34px; border-radius: 8px; background: color-mix(in srgb, var(--dc, var(--brass)) 20%, transparent); color: var(--dc, var(--brass)); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 15px; }
        .guide-title { font-size: 13px; font-weight: 700; color: var(--ink); }
        .guide-sub { font-size: 11px; color: var(--ink-faint); margin-top: 1px; }
        .block { background: var(--surface-2); border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; font-size: 13px; color: var(--ink-dim); line-height: 1.6; }
        .block.tip { background: color-mix(in srgb, var(--brass) 14%, var(--surface)); border: 1px solid color-mix(in srgb, var(--brass) 35%, transparent); color: var(--ink); }
        .block-label { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-faint); margin-bottom: 4px; }
        .block.tip .block-label { color: var(--brass); }
      `}</style>
    </div>
  );
}

// ─── SESSION CARD (single exercise, full-bleed) ──────────────────────────────

function SessionCard({ ex, exIdx, dayIdx, dayColor, logs, onConfirm, weight, onWeightChange, password, isLast, allDone, onNext }: {
  ex: any; exIdx: number; dayIdx: number; dayColor: string;
  logs: ExLogs; onConfirm: (exIdx: number, setIdx: number, reps: number | null, mode: "hold" | "tap") => void;
  weight: number | null; onWeightChange: (exIdx: number, weight: number | null) => void;
  password: string | null; isLast: boolean; allDone: boolean; onNext: () => void;
}) {
  const [showWeight, setShowWeight] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    if (!password) return;
    fetch(`/api/progress/history?dayIdx=${dayIdx}&exIdx=${exIdx}`, { headers: { "x-app-password": password } })
      .then((r) => r.json())
      .then((data) => {
        const pts = (data.points || []).map((p: HistoryPoint) => p.weight).filter((w: number | null): w is number => w != null);
        setHistory(pts.slice(-6));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayIdx, exIdx]);

  const gifUrl = findLocalGif(ex.name);

  return (
    <div className="card">
      <div className="muscles" style={{ "--dc": dayColor } as any}>{ex.muscles}</div>
      <div className="title-row">
        <h2>{ex.name}</h2>
        <button className="info-btn" onClick={() => setShowInfo(true)} aria-label="How to do this exercise">ⓘ</button>
      </div>
      <div className="target-row">
        <span className="target-chip">{ex.sets} sets</span>
        <span className="target-chip">{ex.reps} reps</span>
        {ex.rest > 0 && <span className="target-chip">{ex.rest}s rest</span>}
      </div>

      {gifUrl && (
        <button className="gif-preview" onClick={() => setShowInfo(true)} aria-label="View full exercise guide">
          <img src={gifUrl} alt={`${ex.name} animation`} />
          <span className="expand-badge">⤢ Full guide</span>
        </button>
      )}

      <button className="weight-block" onClick={() => setShowWeight(true)}>
        <div className="wb-label"><span>Working weight</span><span className="edit-hint">Tap to edit ›</span></div>
        <div className="wb-num-row">
          <span className="wb-num">{weight ?? "—"}</span><span className="wb-unit">kg</span>
          {history.length >= 2 && <div className="wb-spark"><Sparkline points={history} color={dayColor} /></div>}
        </div>
      </button>

      <div className="sets-label">Sets</div>
      <SetPipRow ex={ex} exIdx={exIdx} dayColor={dayColor} logs={logs} onConfirm={onConfirm} />
      {ex.rest > 0 && <div className="rest-hint">Hold a circle ~1s to log the set and start your {ex.rest}s rest.</div>}

      <div className="footer">
        <div className={`nudge ${allDone ? "show" : ""}`} onClick={() => allDone && !isLast && onNext()} style={{ "--dc": dayColor } as any}>
          {isLast ? "Session complete — nice work 💪" : "All sets logged — swipe for next lift →"}
        </div>
      </div>

      {showWeight && (
        <WeightSheet
          dayColor={dayColor}
          current={weight}
          history={history}
          onSave={(w) => { onWeightChange(exIdx, w); setShowWeight(false); }}
          onClose={() => setShowWeight(false)}
        />
      )}
      {showInfo && <InfoSheet ex={ex} dayColor={dayColor} onClose={() => setShowInfo(false)} />}

      <style jsx>{`
        .card { flex: 0 0 100%; min-width: 0; height: 100%; padding: 4px 20px 18px; display: flex; flex-direction: column; overflow-y: auto; box-sizing: border-box; }
        .muscles { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--dc, var(--brass)); margin-bottom: 6px; }
        .title-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
        h2 { margin: 0; font-size: 21px; font-weight: 800; letter-spacing: -0.01em; line-height: 1.2; text-wrap: balance; color: var(--ink); flex: 1; }
        .info-btn { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--hairline); background: var(--surface); color: var(--ink-dim); font-size: 14px; cursor: pointer; }
        .target-row { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
        .target-chip { font-size: 11.5px; font-weight: 600; color: var(--ink-dim); background: var(--surface); border: 1px solid var(--hairline); padding: 5px 10px; border-radius: 8px; }
        .gif-preview { position: relative; display: block; width: 100%; flex: 1; min-height: 200px; padding: 0; margin-bottom: 16px; border: 1px solid var(--hairline); border-radius: 18px; overflow: hidden; background: #fff; cursor: pointer; touch-action: manipulation; }
        .gif-preview img { width: 100%; height: 100%; object-fit: contain; display: block; }
        .expand-badge { position: absolute; right: 10px; bottom: 10px; padding: 5px 10px; border-radius: 20px; background: rgba(0,0,0,0.55); color: #fff; font-size: 10.5px; font-weight: 700; backdrop-filter: blur(4px); }
        .weight-block { display: block; width: 100%; text-align: left; background: var(--surface); border: 1px solid var(--hairline); border-radius: 18px; padding: 14px 16px; margin-bottom: 18px; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        .wb-label { font-size: 10px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: var(--ink-faint); display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
        .edit-hint { color: var(--ink-dim); font-weight: 600; text-transform: none; letter-spacing: 0; font-size: 11px; }
        .wb-num-row { display: flex; align-items: baseline; gap: 8px; }
        .wb-num { font-variant-numeric: tabular-nums; font-size: 38px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; color: var(--ink); }
        .wb-unit { font-size: 14px; font-weight: 700; color: var(--ink-dim); }
        .wb-spark { margin-left: auto; }
        .sets-label { font-size: 10px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 10px; }
        .rest-hint { font-size: 11.5px; color: var(--ink-faint); margin-top: 10px; }
        .footer { margin-top: auto; padding-top: 16px; }
        .nudge {
          display: flex; align-items: center; justify-content: center; gap: 8px; padding: 13px; border-radius: 14px;
          background: color-mix(in srgb, var(--good) 16%, transparent); color: var(--good); font-weight: 700; font-size: 13px;
          opacity: 0; transform: translateY(6px); transition: opacity 0.3s ease, transform 0.3s ease; pointer-events: none;
        }
        .nudge.show { opacity: 1; transform: translateY(0); pointer-events: auto; cursor: pointer; }
      `}</style>
    </div>
  );
}

// ─── SESSION DECK (swipeable day view) ───────────────────────────────────────

function SessionDeck({ day, dayIdx, logs, onConfirm, weights, onWeightChange, password, timerVal, timerTotal, onSkipRest, onAddRestTime }: {
  day: any; dayIdx: number; logs: Record<number, ExLogs>;
  onConfirm: (exIdx: number, setIdx: number, reps: number | null, mode: "hold" | "tap") => void;
  weights: Record<string, number>; onWeightChange: (exIdx: number, weight: number | null) => void;
  password: string | null;
  timerVal: number | null; timerTotal: number; onSkipRest: () => void; onAddRestTime: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const deckRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; dragging: boolean; delta: number } | null>(null);

  useEffect(() => { setCurrent(0); }, [dayIdx]);

  const clampIdx = (i: number) => Math.max(0, Math.min(day.exercises.length - 1, i));
  const goTo = (i: number) => setCurrent(clampIdx(i));

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".card > button, .card input, .card a")) return;
    dragRef.current = { startX: e.clientX, dragging: true, delta: 0 };
    deckRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current?.dragging || !deckRef.current) return;
    const delta = e.clientX - dragRef.current.startX;
    dragRef.current.delta = delta;
    const pct = (delta / deckRef.current.clientWidth) * 100;
    deckRef.current.style.transition = "none";
    deckRef.current.style.transform = `translateX(${current * -100 + pct}%)`;
  };
  const endDrag = () => {
    if (!dragRef.current || !deckRef.current) return;
    const { delta } = dragRef.current;
    dragRef.current = null;
    deckRef.current.style.transition = "";
    if (delta < -60 && current < day.exercises.length - 1) goTo(current + 1);
    else if (delta > 60 && current > 0) goTo(current - 1);
    else deckRef.current.style.transform = `translateX(${current * -100}%)`;
  };

  useEffect(() => {
    if (deckRef.current) deckRef.current.style.transform = `translateX(${current * -100}%)`;
  }, [current]);

  const totalSets = day.exercises.reduce((a: number, e: any) => a + e.sets, 0);
  const doneSets = Object.values(logs).reduce((a: number, l: ExLogs) => a + Object.keys(l).length, 0);

  return (
    <div className="deck-shell">
      <div className="dots">
        {day.exercises.map((ex: any, i: number) => {
          const done = Object.keys(logs[i] || {}).length;
          const pct = Math.round((done / ex.sets) * 100);
          return (
            <div key={i} className="dot" style={{ "--dc": day.color } as any}>
              <div className={`dot-fill ${done >= ex.sets ? "full" : ""}`} style={{ width: `${done >= ex.sets ? 100 : pct}%` }} />
            </div>
          );
        })}
      </div>

      <div
        className="deck-wrap"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="deck" ref={deckRef}>
          {day.exercises.map((ex: any, i: number) => (
            <SessionCard
              key={i}
              ex={ex}
              exIdx={i}
              dayIdx={dayIdx}
              dayColor={day.color}
              logs={logs[i] || {}}
              onConfirm={onConfirm}
              weight={weights[i] ?? null}
              onWeightChange={onWeightChange}
              password={password}
              isLast={i === day.exercises.length - 1}
              allDone={Object.keys(logs[i] || {}).length >= ex.sets}
              onNext={() => goTo(i + 1)}
            />
          ))}
        </div>

        <button className="nav-arrow left" disabled={current === 0} onClick={() => goTo(current - 1)} aria-label="Previous exercise">‹</button>
        <button className="nav-arrow right" disabled={current === day.exercises.length - 1} onClick={() => goTo(current + 1)} aria-label="Next exercise">›</button>

        {timerVal != null && (
          <RestSheet dayColor={day.color} seconds={timerVal} total={timerTotal} onSkip={onSkipRest} onAddTime={onAddRestTime} />
        )}
      </div>

      <div className="session-bar">
        <div className="session-track"><div className="fill" style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} /></div>
        <div className="session-meta"><span>Set {doneSets} of {totalSets}</span><span>{day.label} · {day.type}</span></div>
      </div>

      <style jsx>{`
        .deck-shell { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .dots { display: flex; gap: 5px; padding: 0 20px; margin-bottom: 10px; }
        .dot { flex: 1; height: 4px; border-radius: 3px; background: var(--surface-2); overflow: hidden; }
        .dot-fill { height: 100%; background: var(--dc, var(--brass)); border-radius: 3px; transition: width 0.3s ease; }
        .dot-fill.full { background: var(--good); }
        .deck-wrap { position: relative; flex: 1; min-height: 0; overflow: hidden; touch-action: pan-y; }
        .deck { display: flex; height: 100%; width: 100%; will-change: transform; transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1); }
        .nav-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 34px; height: 34px; border-radius: 50%; border: none; background: rgba(0,0,0,0.32); color: #fff; font-size: 17px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 5; backdrop-filter: blur(4px); }
        .nav-arrow.left { left: 6px; } .nav-arrow.right { right: 6px; }
        .nav-arrow:disabled { opacity: 0; pointer-events: none; }
        .session-bar { flex-shrink: 0; padding: 12px 20px calc(14px + env(safe-area-inset-bottom, 0px)); }
        .session-track { height: 5px; border-radius: 3px; background: var(--surface-2); overflow: hidden; margin-bottom: 8px; }
        .session-track .fill { height: 100%; background: var(--brass); border-radius: 3px; transition: width 0.35s ease; }
        .session-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--ink-faint); font-weight: 600; }
        .session-meta span:first-child { font-variant-numeric: tabular-nums; }
        @media (min-width: 460px) {
          .nav-arrow { display: flex; }
        }
      `}</style>
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
    <div className="scrim">
      <div className="modal">
        <div className="head">
          <div>
            <div className="title">Notion export</div>
            <div className="sub">Paste directly into any Notion page — tables and headers auto-format</div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <textarea readOnly value={text} className="export-text" />
        <div className="btn-row">
          <button className="solid-btn" onClick={copy}>{copied ? "Copied! ✓" : "Copy to clipboard"}</button>
          <button className="ghost-btn" onClick={onClose}>Close</button>
        </div>
        <div className="hint">How to import: Open Notion → New page → Paste (Ctrl+V / Cmd+V). All tables, headers, and checkboxes format automatically. Repeat for each day.</div>
      </div>
      <style jsx>{`
        .scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: var(--surface); border: 1px solid var(--hairline); border-radius: 18px; padding: 24px; max-width: 600px; width: 100%; max-height: 85vh; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
        .head { display: flex; align-items: center; justify-content: space-between; }
        .title { font-weight: 700; font-size: 16px; color: var(--ink); }
        .sub { font-size: 12px; color: var(--ink-dim); margin-top: 2px; }
        .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--ink-dim); }
        .export-text { flex: 1; min-height: 320px; font-family: monospace; font-size: 12px; background: var(--surface-2); border: 1px solid var(--hairline); border-radius: 10px; padding: 14px; resize: vertical; color: var(--ink-dim); line-height: 1.6; }
        .btn-row { display: flex; gap: 10px; }
        .solid-btn { flex: 1; padding: 10px; border-radius: 10px; border: none; background: var(--brass); color: var(--brass-ink); font-weight: 700; font-size: 14px; cursor: pointer; }
        .ghost-btn { padding: 10px 20px; border-radius: 10px; border: 1px solid var(--hairline); background: transparent; color: var(--ink-dim); font-size: 14px; cursor: pointer; }
        .hint { font-size: 11px; color: var(--ink-faint); line-height: 1.5; }
      `}</style>
    </div>
  );
}

// ─── LOCK SCREEN ─────────────────────────────────────────────────────────────

function LockScreen({ onSubmit, error, loading }: {
  onSubmit: (pw: string) => void; error?: string | null; loading?: boolean;
}) {
  const [pw, setPw] = useState("");
  return (
    <div className="wrap">
      <ThemeStyles />
      <div className="card">
        <div className="lock">🔒</div>
        <div className="title">Aztec Body Trainer</div>
        <div className="sub">Enter the password to view and log your plan.</div>
        <input
          type="password" value={pw} autoFocus
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && pw) onSubmit(pw); }}
          placeholder="Password"
          className={`pw-input ${error ? "err" : ""}`}
        />
        {error && <div className="err-text">{error}</div>}
        <button className="unlock-btn" disabled={!pw || loading} onClick={() => pw && onSubmit(pw)}>
          {loading ? "Checking…" : "Unlock"}
        </button>
      </div>
      <style jsx>{`
        .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: 20px; }
        .card { background: var(--surface); border: 1px solid var(--hairline); border-radius: 20px; padding: 30px; max-width: 320px; width: 100%; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
        .lock { font-size: 28px; margin-bottom: 10px; }
        .title { font-weight: 800; font-size: 18px; color: var(--ink); margin-bottom: 4px; }
        .sub { font-size: 12.5px; color: var(--ink-dim); margin-bottom: 20px; }
        .pw-input { width: 100%; height: 48px; border-radius: 12px; box-sizing: border-box; border: 1px solid var(--hairline); background: var(--surface-2); color: var(--ink); padding: 0 14px; font-size: 15px; margin-bottom: 10px; }
        .pw-input.err { border-color: var(--danger); }
        .err-text { font-size: 12px; color: var(--danger); margin-bottom: 10px; }
        .unlock-btn { width: 100%; height: 48px; border-radius: 12px; border: none; background: var(--brass); color: var(--brass-ink); font-weight: 800; font-size: 15px; cursor: pointer; touch-action: manipulation; }
        .unlock-btn:disabled { background: var(--surface-3); color: var(--ink-faint); cursor: default; }
      `}</style>
    </div>
  );
}

// ─── CALENDAR ────────────────────────────────────────────────────────────────

function heatLevel(setsLogged: number) {
  if (!setsLogged) return 0;
  if (setsLogged <= 15) return 1;
  if (setsLogged <= 30) return 2;
  return 3;
}

function CalendarModal({ password, onClose }: { password: string; onClose: () => void }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [days, setDays] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [loading, setLoading] = useState(true);

  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + monthOffset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthLabel = base.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayIso = todayStr();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/progress/calendar?month=${monthStr}&today=${todayIso}`, {
      headers: { "x-app-password": password },
    })
      .then((r) => r.json())
      .then((data) => {
        setDays(data.days || {});
        if (data.streak) setStreak(data.streak);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [monthStr]); // eslint-disable-line react-hooks/exhaustive-deps

  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="scrim">
      <div className="modal">
        <div className="head">
          <div className="title">Calendar</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="stat-row">
          <div className="stat streak">
            <div className="stat-num">🔥 {streak.current}</div>
            <div className="stat-lbl">current streak</div>
          </div>
          <div className="stat">
            <div className="stat-num">{streak.longest}</div>
            <div className="stat-lbl">longest streak</div>
          </div>
        </div>

        <div className="nav-row">
          <button className="nav-btn" onClick={() => setMonthOffset((m) => m - 1)}>‹</button>
          <div className="month-label">{monthLabel}</div>
          <button className="nav-btn" disabled={monthOffset >= 0} onClick={() => setMonthOffset((m) => m + 1)}>›</button>
        </div>

        <div className="weekday-row">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="weekday">{d}</div>)}
        </div>
        <div className="grid" style={{ opacity: loading ? 0.4 : 1 }}>
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const iso = `${monthStr}-${String(d).padStart(2, "0")}`;
            const count = days[iso] || 0;
            const lv = heatLevel(count);
            const isToday = iso === todayIso;
            return (
              <div key={i} title={count ? `${count} sets logged` : "No activity"} className={`cell lv-${lv} ${isToday ? "today" : ""}`}>
                {d}
              </div>
            );
          })}
        </div>

        <div className="legend">
          <span>Low</span>
          <div className="sw lv-0" /><div className="sw lv-1" /><div className="sw lv-2" /><div className="sw lv-3" />
          <span>High</span>
        </div>
      </div>
      <style jsx>{`
        .scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: var(--surface); border: 1px solid var(--hairline); border-radius: 18px; padding: 22px; max-width: 380px; width: 100%; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
        .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .title { font-weight: 700; font-size: 16px; color: var(--ink); }
        .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--ink-dim); }
        .stat-row { display: flex; gap: 12px; margin-bottom: 16px; }
        .stat { flex: 1; background: var(--surface-2); border-radius: 12px; padding: 10px 12px; text-align: center; }
        .stat.streak { background: color-mix(in srgb, var(--brass) 16%, var(--surface)); }
        .stat-num { font-size: 20px; color: var(--ink); font-weight: 700; }
        .stat-lbl { font-size: 10px; color: var(--ink-faint); font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
        .nav-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .nav-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--hairline); background: var(--surface-2); cursor: pointer; font-size: 14px; color: var(--ink-dim); }
        .nav-btn:disabled { opacity: 0.3; cursor: default; }
        .month-label { font-weight: 600; font-size: 13px; color: var(--ink); }
        .weekday-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 4px; }
        .weekday { text-align: center; font-size: 10px; color: var(--ink-faint); font-weight: 600; }
        .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; transition: opacity 0.15s; }
        .cell { aspect-ratio: 1; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; border: 1px solid transparent; }
        .cell.today { border-color: var(--ink); }
        .cell.lv-0 { background: var(--surface-2); color: var(--ink-faint); }
        .cell.lv-1 { background: color-mix(in srgb, var(--brass) 28%, transparent); color: var(--brass); }
        .cell.lv-2 { background: color-mix(in srgb, var(--brass) 62%, transparent); color: var(--ink); }
        .cell.lv-3 { background: var(--brass); color: var(--brass-ink); }
        .legend { display: flex; gap: 8px; margin-top: 14px; font-size: 10px; color: var(--ink-faint); align-items: center; justify-content: center; }
        .sw { width: 14px; height: 14px; border-radius: 4px; }
        .sw.lv-0 { background: var(--surface-2); border: 1px solid var(--hairline); }
        .sw.lv-1 { background: color-mix(in srgb, var(--brass) 28%, transparent); }
        .sw.lv-2 { background: color-mix(in srgb, var(--brass) 62%, transparent); }
        .sw.lv-3 { background: var(--brass); }
      `}</style>
    </div>
  );
}

// ─── INSIGHTS (weight progression graph) ─────────────────────────────────────

function InsightsModal({ password, onClose }: { password: string; onClose: () => void }) {
  const exerciseOptions = DAYS.flatMap((d, dayIdx) =>
    d.exercises.map((ex, exIdx) => ({ dayIdx, exIdx, name: ex.name, dayLabel: d.label, color: d.color }))
  );
  const [selected, setSelected] = useState(exerciseOptions[0]);
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/progress/history?dayIdx=${selected.dayIdx}&exIdx=${selected.exIdx}`, {
      headers: { "x-app-password": password },
    })
      .then((r) => r.json())
      .then((data) => setPoints(data.points || []))
      .catch(() => setPoints([]))
      .finally(() => setLoading(false));
  }, [selected, password]);

  const withWeight = points.filter((p) => p.weight != null);
  const first = withWeight[0]?.weight ?? null;
  const last = withWeight[withWeight.length - 1]?.weight ?? null;
  const delta = first != null && last != null ? Math.round((last - first) * 10) / 10 : null;

  return (
    <div className="scrim">
      <div className="modal">
        <div className="head">
          <div className="title">Progress</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <select
          value={`${selected.dayIdx}-${selected.exIdx}`}
          onChange={(e) => {
            const [d, x] = e.target.value.split("-").map(Number);
            const next = exerciseOptions.find((o) => o.dayIdx === d && o.exIdx === x);
            if (next) setSelected(next);
          }}
          className="picker"
        >
          {DAYS.map((d, dayIdx) => (
            <optgroup key={d.key} label={d.label}>
              {d.exercises.map((ex, exIdx) => (
                <option key={exIdx} value={`${dayIdx}-${exIdx}`}>{ex.name}</option>
              ))}
            </optgroup>
          ))}
        </select>

        {withWeight.length === 0 ? (
          <div className="empty">{loading ? "Loading…" : "No weight logged for this exercise yet — add one from its weight block on the plan."}</div>
        ) : (
          <>
            <div className="stat-row">
              <div className="stat"><div className="stat-num">{last} kg</div><div className="stat-lbl">latest</div></div>
              <div className={`stat ${delta != null && delta > 0 ? "good" : ""}`}>
                <div className="stat-num">{delta == null ? "—" : delta > 0 ? `+${delta}` : delta} kg</div>
                <div className="stat-lbl">since first log</div>
              </div>
              <div className="stat"><div className="stat-num">{withWeight.length}</div><div className="stat-lbl">sessions</div></div>
            </div>

            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={withWeight} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--ink-faint)" }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--ink-faint)" }} domain={["dataMin - 5", "dataMax + 5"]} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--hairline)", background: "var(--surface)", color: "var(--ink)" }}
                    formatter={(value: number) => [`${value} kg`, "Weight"]}
                  />
                  <Line type="monotone" dataKey="weight" stroke={selected.color} strokeWidth={2.5} dot={{ r: 3, fill: selected.color }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
      <style jsx>{`
        .scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: var(--surface); border: 1px solid var(--hairline); border-radius: 18px; padding: 22px; max-width: 420px; width: 100%; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
        .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .title { font-weight: 700; font-size: 16px; color: var(--ink); }
        .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--ink-dim); }
        .picker { width: 100%; height: 42px; border-radius: 10px; border: 1px solid var(--hairline); padding: 0 10px; font-size: 13px; margin-bottom: 16px; background: var(--surface-2); color: var(--ink); box-sizing: border-box; }
        .empty { text-align: center; padding: 36px 10px; color: var(--ink-faint); font-size: 13px; }
        .stat-row { display: flex; gap: 8px; margin-bottom: 16px; }
        .stat { flex: 1; background: var(--surface-2); border-radius: 12px; padding: 10px 8px; text-align: center; }
        .stat.good { background: color-mix(in srgb, var(--good) 16%, var(--surface)); }
        .stat.good .stat-num { color: var(--good); }
        .stat-num { font-size: 17px; font-weight: 700; color: var(--ink); }
        .stat-lbl { font-size: 9px; color: var(--ink-faint); font-weight: 700; text-transform: uppercase; }
        .chart-wrap { width: 100%; height: 200px; }
      `}</style>
    </div>
  );
}

// ─── CARDIO SESSION (live timer, logs speed/incline or resistance/cadence) ──

type CardioEntry = { atSec: number; speed: number | null; incline: number | null; resistance: number | null; cadence: number | null };

function CardioSession({ day, dayIdx, password, onFinish, onBack }: {
  day: any; dayIdx: number; password: string | null;
  onFinish: (streak: { current: number; longest: number }) => void; onBack: () => void;
}) {
  const [phase, setPhase] = useState<"setup" | "running" | "done">("setup");
  const [machine, setMachine] = useState<"treadmill" | "cycle">(day.cardio?.machine ?? "treadmill");
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [incline, setIncline] = useState(2);
  const [resistance, setResistance] = useState(8);
  const [cadence, setCadence] = useState(70);
  const entriesRef = useRef<CardioEntry[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const snapshot = (atSec: number, patch: Partial<{ speed: number; incline: number; resistance: number; cadence: number }> = {}): CardioEntry =>
    machine === "treadmill"
      ? { atSec, speed: patch.speed ?? speed, incline: patch.incline ?? incline, resistance: null, cadence: null }
      : { atSec, speed: null, incline: null, resistance: patch.resistance ?? resistance, cadence: patch.cadence ?? cadence };

  const start = () => {
    setPhase("running");
    setElapsed(0);
    entriesRef.current = [snapshot(0)];
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  const bump = (field: "speed" | "incline" | "resistance" | "cadence", delta: number, min = 0) => {
    const setters = { speed: setSpeed, incline: setIncline, resistance: setResistance, cadence: setCadence };
    const current = { speed, incline, resistance, cadence }[field];
    const next = Math.max(min, Math.round((current + delta) * 10) / 10);
    setters[field](next);
    entriesRef.current.push(snapshot(elapsed, { [field]: next } as any));
  };

  const finish = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    entriesRef.current.push(snapshot(elapsed));
    setPhase("done");
    fetch("/api/cardio", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-app-password": password || "" },
      body: JSON.stringify({ date: todayStr(), dayIdx, machine, durationSec: elapsed, entries: entriesRef.current }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.streak) onFinish(data.streak); })
      .catch(() => {});
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="wrap">
      <div className="topbar">
        <button className="back-btn" onClick={onBack} aria-label="Back to home">‹</button>
        <div className="title">Cardio</div>
        <div style={{ width: 34 }} />
      </div>

      {phase === "setup" && (
        <div className="body center">
          <div className="machine-toggle">
            <button className={`m-btn ${machine === "treadmill" ? "active" : ""}`} onClick={() => setMachine("treadmill")}>🏃 Treadmill</button>
            <button className={`m-btn ${machine === "cycle" ? "active" : ""}`} onClick={() => setMachine("cycle")}>🚴 Cycle</button>
          </div>
          {day.cardio && (
            <div className="guidance">
              <div className="g-row"><span>Duration</span><b>{day.cardio.duration}</b></div>
              <div className="g-row"><span>Target</span><b>{day.cardio.target}</b></div>
              <div className="g-note">{day.cardio.note}</div>
            </div>
          )}
          <button className="start-btn" onClick={start}>Start Session</button>
        </div>
      )}

      {phase === "running" && (
        <div className="body center">
          <div className="elapsed">{mm}:{ss}</div>
          <div className="elapsed-lbl">elapsed</div>

          {machine === "treadmill" ? (
            <div className="fields">
              <div className="field">
                <div className="f-label">Speed (km/h)</div>
                <div className="f-row">
                  <button className="f-btn" onClick={() => bump("speed", -0.5)}>−</button>
                  <div className="f-val">{speed}</div>
                  <button className="f-btn" onClick={() => bump("speed", 0.5)}>+</button>
                </div>
              </div>
              <div className="field">
                <div className="f-label">Incline (%)</div>
                <div className="f-row">
                  <button className="f-btn" onClick={() => bump("incline", -0.5)}>−</button>
                  <div className="f-val">{incline}</div>
                  <button className="f-btn" onClick={() => bump("incline", 0.5)}>+</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="fields">
              <div className="field">
                <div className="f-label">Resistance</div>
                <div className="f-row">
                  <button className="f-btn" onClick={() => bump("resistance", -1)}>−</button>
                  <div className="f-val">{resistance}</div>
                  <button className="f-btn" onClick={() => bump("resistance", 1)}>+</button>
                </div>
              </div>
              <div className="field">
                <div className="f-label">Cadence (rpm)</div>
                <div className="f-row">
                  <button className="f-btn" onClick={() => bump("cadence", -5)}>−</button>
                  <div className="f-val">{cadence}</div>
                  <button className="f-btn" onClick={() => bump("cadence", 5)}>+</button>
                </div>
              </div>
            </div>
          )}
          <div className="hint">Each ± tap logs a timestamped update — your pace curve shows up in Cardio Progress.</div>
          <button className="finish-btn" onClick={finish}>Finish Session</button>
        </div>
      )}

      {phase === "done" && (
        <div className="body center">
          <div className="done-emoji">🏁</div>
          <div className="done-title">Logged {mm}:{ss} on the {machine}</div>
          <div className="done-sub">Nice work — that keeps your cardio streak alive.</div>
          <button className="start-btn" onClick={onBack}>Back to Home</button>
        </div>
      )}

      <style jsx>{`
        .wrap { display: flex; flex-direction: column; height: 100dvh; background: var(--bg); }
        .topbar { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 10px; }
        .back-btn { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--hairline); background: var(--surface); color: var(--ink); font-size: 18px; cursor: pointer; }
        .title { font-weight: 800; font-size: 15px; color: var(--ink); }
        .body { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 24px calc(24px + env(safe-area-inset-bottom, 0px)); }
        .body.center { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 14px; }
        .machine-toggle { display: flex; gap: 8px; background: var(--surface-2); border-radius: 14px; padding: 4px; }
        .m-btn { padding: 10px 18px; border-radius: 10px; border: none; background: transparent; color: var(--ink-dim); font-size: 13.5px; font-weight: 700; cursor: pointer; }
        .m-btn.active { background: var(--brass); color: var(--brass-ink); }
        .guidance { width: 100%; max-width: 320px; background: var(--surface); border: 1px solid var(--hairline); border-radius: 16px; padding: 16px; text-align: left; }
        .g-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--ink-dim); margin-bottom: 8px; }
        .g-row b { color: var(--ink); font-weight: 700; }
        .g-note { font-size: 12px; color: var(--ink-faint); line-height: 1.5; margin-top: 8px; }
        .start-btn, .finish-btn { width: 100%; max-width: 320px; height: 52px; border-radius: 16px; border: none; font-size: 15px; font-weight: 800; cursor: pointer; touch-action: manipulation; }
        .start-btn { background: var(--brass); color: var(--brass-ink); }
        .finish-btn { background: var(--danger); color: #fff; margin-top: 6px; }
        .elapsed { font-size: 56px; font-weight: 800; font-variant-numeric: tabular-nums; font-family: ui-monospace, "SF Mono", "Cascadia Code", monospace; color: var(--ink); letter-spacing: -0.02em; }
        .elapsed-lbl { font-size: 11px; color: var(--ink-faint); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-top: -10px; }
        .fields { display: flex; gap: 14px; margin: 10px 0; }
        .field { background: var(--surface); border: 1px solid var(--hairline); border-radius: 16px; padding: 14px 16px; min-width: 130px; }
        .f-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-faint); margin-bottom: 8px; }
        .f-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .f-btn { width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--hairline); background: var(--surface-2); color: var(--ink); font-size: 16px; font-weight: 700; cursor: pointer; touch-action: manipulation; }
        .f-val { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--ink); }
        .hint { font-size: 11.5px; color: var(--ink-faint); max-width: 280px; line-height: 1.5; }
        .done-emoji { font-size: 40px; }
        .done-title { font-size: 17px; font-weight: 800; color: var(--ink); }
        .done-sub { font-size: 13px; color: var(--ink-dim); margin-bottom: 8px; }
      `}</style>
    </div>
  );
}

// ─── CARDIO INSIGHTS (separate speed/incline graph) ──────────────────────────

type CardioPoint = { date: string; durationSec: number; avgSpeed: number | null; maxIncline: number | null; avgResistance: number | null; avgCadence: number | null };

function CardioInsightsModal({ password, onClose }: { password: string; onClose: () => void }) {
  const [machine, setMachine] = useState<"treadmill" | "cycle">("treadmill");
  const [points, setPoints] = useState<CardioPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cardio/history?machine=${machine}`, { headers: { "x-app-password": password } })
      .then((r) => r.json())
      .then((data) => setPoints(data.points || []))
      .catch(() => setPoints([]))
      .finally(() => setLoading(false));
  }, [machine, password]);

  const dataKey = machine === "treadmill" ? "avgSpeed" : "avgResistance";
  const withData = points.filter((p) => p[dataKey] != null);
  const last = withData[withData.length - 1];
  const color = "#6b92b0";

  return (
    <div className="scrim">
      <div className="modal">
        <div className="head">
          <div className="title">Cardio Progress</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="machine-toggle">
          <button className={`m-btn ${machine === "treadmill" ? "active" : ""}`} onClick={() => setMachine("treadmill")}>🏃 Treadmill</button>
          <button className={`m-btn ${machine === "cycle" ? "active" : ""}`} onClick={() => setMachine("cycle")}>🚴 Cycle</button>
        </div>

        {withData.length === 0 ? (
          <div className="empty">{loading ? "Loading…" : `No ${machine} sessions logged yet.`}</div>
        ) : (
          <>
            <div className="stat-row">
              <div className="stat">
                <div className="stat-num">{machine === "treadmill" ? `${last.avgSpeed} km/h` : `${last.avgResistance}`}</div>
                <div className="stat-lbl">latest {machine === "treadmill" ? "speed" : "resistance"}</div>
              </div>
              {machine === "treadmill" && (
                <div className="stat"><div className="stat-num">{last.maxIncline ?? "—"}%</div><div className="stat-lbl">latest incline</div></div>
              )}
              {machine === "cycle" && (
                <div className="stat"><div className="stat-num">{last.avgCadence ?? "—"}</div><div className="stat-lbl">latest cadence</div></div>
              )}
              <div className="stat"><div className="stat-num">{withData.length}</div><div className="stat-lbl">sessions</div></div>
            </div>

            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={withData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--ink-faint)" }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--ink-faint)" }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--hairline)", background: "var(--surface)", color: "var(--ink)" }}
                  />
                  <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
      <style jsx>{`
        .scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: var(--surface); border: 1px solid var(--hairline); border-radius: 18px; padding: 22px; max-width: 420px; width: 100%; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
        .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .title { font-weight: 700; font-size: 16px; color: var(--ink); }
        .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--ink-dim); }
        .machine-toggle { display: flex; gap: 8px; background: var(--surface-2); border-radius: 14px; padding: 4px; margin-bottom: 16px; }
        .m-btn { flex: 1; padding: 10px; border-radius: 10px; border: none; background: transparent; color: var(--ink-dim); font-size: 13px; font-weight: 700; cursor: pointer; }
        .m-btn.active { background: var(--steel); color: #fff; }
        .empty { text-align: center; padding: 36px 10px; color: var(--ink-faint); font-size: 13px; }
        .stat-row { display: flex; gap: 8px; margin-bottom: 16px; }
        .stat { flex: 1; background: var(--surface-2); border-radius: 12px; padding: 10px 8px; text-align: center; }
        .stat-num { font-size: 17px; font-weight: 700; color: var(--ink); }
        .stat-lbl { font-size: 9px; color: var(--ink-faint); font-weight: 700; text-transform: uppercase; }
        .chart-wrap { width: 100%; height: 200px; }
      `}</style>
    </div>
  );
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────

function HomeScreen({ liftStreak, cardioStreak, onStartWorkout, onStartCardio, onOpenCalendar, onOpenInsights, onOpenCardioInsights, onOpenNotion }: {
  liftStreak: { current: number; longest: number }; cardioStreak: { current: number; longest: number };
  onStartWorkout: () => void; onStartCardio: () => void;
  onOpenCalendar: () => void; onOpenInsights: () => void; onOpenCardioInsights: () => void; onOpenNotion: () => void;
}) {
  const idx = todayDayIdx();
  const day = idx != null ? DAYS[idx] : null;

  return (
    <div className="home">
      <div className="top">
        <div className="brand">Aztec Body Trainer</div>
        <div className="tagline">Phase 3 · Gym Plan</div>
      </div>

      <div className="streaks">
        <button className="streak-card" onClick={onOpenCalendar}>
          <div className="streak-num">{liftStreak.current > 0 ? `🔥 ${liftStreak.current}` : "—"}</div>
          <div className="streak-lbl">lifting streak</div>
        </button>
        <button className="streak-card" onClick={onOpenCardioInsights}>
          <div className="streak-num">{cardioStreak.current > 0 ? `🏃 ${cardioStreak.current}` : "—"}</div>
          <div className="streak-lbl">cardio streak</div>
        </button>
      </div>

      <div className="launcher">
        <button className="start-btn workout" style={day ? ({ "--dc": day.color } as any) : undefined} onClick={onStartWorkout}>
          <div className="start-title">{day ? `Start ${day.label}` : "No plan today"}</div>
          <div className="start-sub">{day ? `${day.type} · ${day.exercises.length} exercises` : "Rest day — pick a day to review"}</div>
        </button>
        <button className="start-btn cardio" onClick={onStartCardio}>
          <div className="start-title">Start Cardio</div>
          <div className="start-sub">
            {day?.cardio ? `${day.cardio.machine === "treadmill" ? "🏃 Treadmill" : "🚴 Cycle"} · ${day.cardio.duration}` : "Treadmill or cycle, any day"}
          </div>
        </button>
      </div>

      <div className="icon-row">
        <button className="icon-btn" onClick={onOpenInsights}>📈 Lifting progress</button>
        <button className="icon-btn" onClick={onOpenCardioInsights}>🏃 Cardio progress</button>
        <button className="icon-btn" onClick={onOpenNotion}>📝 Export</button>
      </div>

      <style jsx>{`
        .home { display: flex; flex-direction: column; height: 100dvh; background: var(--bg); padding: calc(20px + env(safe-area-inset-top, 0px)) 20px calc(20px + env(safe-area-inset-bottom, 0px)); }
        .top { margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: 800; color: var(--ink); letter-spacing: -0.01em; }
        .tagline { font-size: 12px; color: var(--ink-faint); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }
        .streaks { display: flex; gap: 10px; margin-bottom: 20px; }
        .streak-card { flex: 1; background: var(--surface); border: 1px solid var(--hairline); border-radius: 16px; padding: 14px; text-align: center; cursor: pointer; touch-action: manipulation; }
        .streak-num { font-size: 22px; font-weight: 800; color: var(--ink); }
        .streak-lbl { font-size: 10px; color: var(--ink-faint); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 4px; }
        .launcher { display: flex; flex-direction: column; gap: 12px; flex: 1; justify-content: center; }
        .start-btn { text-align: left; border-radius: 20px; border: none; padding: 22px; cursor: pointer; touch-action: manipulation; }
        .start-btn.workout { background: var(--dc, var(--brass)); }
        .start-btn.cardio { background: var(--steel); }
        .start-title { font-size: 19px; font-weight: 800; color: #fff; }
        .start-sub { font-size: 12.5px; color: rgba(255,255,255,0.8); margin-top: 4px; font-weight: 600; }
        .icon-row { display: flex; gap: 8px; margin-top: 20px; }
        .icon-btn { flex: 1; height: 44px; border-radius: 14px; border: 1px solid var(--hairline); background: var(--surface); color: var(--ink-dim); font-size: 11.5px; font-weight: 700; cursor: pointer; touch-action: manipulation; }
      `}</style>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function WorkoutApp() {
  const [view, setView] = useState<"home" | "session" | "cardio">("home");
  const [dayIdx, setDayIdx] = useState(0);
  const [logs, setLogs] = useState<Record<string, Record<number, ExLogs>>>({});
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [cardioStreak, setCardioStreak] = useState({ current: 0, longest: 0 });
  // dayIdx → exIdx → weight (kg). Pre-filled from the last weight logged for
  // each exercise (server-computed), then edited freely per session from here.
  const [weights, setWeights] = useState<Record<string, Record<string, number>>>({});
  const [showNotion, setShowNotion] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showCardioInsights, setShowCardioInsights] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [restFor, setRestFor] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(0);
  const { timers, startTimer, skipTimer, addTime } = useRestTimer();

  // Whole app is gated behind one shared password. A password already saved
  // on this device is trusted immediately — no "checking…" round trip before
  // the UI shows up on every single visit, that's just for the first unlock.
  //
  // Both start out null/false unconditionally (never read localStorage here)
  // so the very first client render matches the server-rendered HTML exactly
  // — reading localStorage during useState's initializer made the server (no
  // window) and the client's first paint (has window) render different trees,
  // which is a hydration mismatch. The mount effect below checks localStorage
  // instead, since effects only ever run client-side, after hydration.
  const [password, setPassword] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadCardioStreak = useCallback((pw: string) => {
    fetch(`/api/cardio?date=${todayStr()}`, { headers: { "x-app-password": pw } })
      .then((r) => r.json())
      .then((data) => { if (data.streak) setCardioStreak(data.streak); })
      .catch(() => {});
  }, []);

  const loadData = useCallback((pw: string) => {
    fetch(`/api/progress?date=${todayStr()}`, { headers: { "x-app-password": pw } })
      .then(async (r) => {
        if (r.status === 401) {
          localStorage.removeItem("wp_password");
          setPassword(null);
          setUnlocked(false);
          return;
        }
        const data = await r.json();
        if (data.today) setLogs(data.today);
        if (data.streak) setStreak(data.streak);
        if (data.lastWeights) setWeights(data.lastWeights);
      })
      .catch(() => {});
    loadCardioStreak(pw);
  }, [loadCardioStreak]);

  const authenticate = useCallback((pw: string) => {
    setAuthLoading(true);
    setAuthError(null);
    fetch(`/api/progress?date=${todayStr()}`, { headers: { "x-app-password": pw } })
      .then(async (r) => {
        if (r.status === 401) {
          setAuthError("Wrong password");
          return;
        }
        const data = await r.json();
        localStorage.setItem("wp_password", pw);
        setPassword(pw);
        if (data.today) setLogs(data.today);
        if (data.streak) setStreak(data.streak);
        if (data.lastWeights) setWeights(data.lastWeights);
        setUnlocked(true);
        loadCardioStreak(pw);
      })
      .catch(() => setAuthError("Couldn't reach server — try again"))
      .finally(() => setAuthLoading(false));
  }, [loadCardioStreak]);

  useEffect(() => {
    const stored = localStorage.getItem("wp_password");
    if (stored) {
      setPassword(stored);
      setUnlocked(true);
      loadData(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const day = DAYS[dayIdx];
  const dayKey = `${dayIdx}`;
  const doneSetsForDay: Record<number, ExLogs> = logs[dayKey] || {};
  const sessionDone = day.exercises.every((ex, ei) => Object.keys(doneSetsForDay[ei] || {}).length >= ex.sets);

  // Auto-close the rest sheet once its countdown reaches zero.
  useEffect(() => {
    if (restFor == null) return;
    const val = timers[`${restFor}`];
    if (val != null && val <= 0) setRestFor(null);
  }, [timers, restFor]);

  const handleWeightChange = (exIdx: number, weight: number | null) => {
    setWeights((prev) => {
      const dayWeights = { ...(prev[dayKey] || {}) };
      if (weight == null) delete dayWeights[exIdx]; else dayWeights[exIdx] = weight;
      return { ...prev, [dayKey]: dayWeights };
    });
  };

  const handleConfirm = (exIdx: number, setIdx: number, reps: number | null, mode: "hold" | "tap") => {
    const dk = `${dayIdx}`;
    const weight = weights[dk]?.[exIdx] ?? null;
    setLogs((prev) => {
      const dayLogs = prev[dk] || {};
      const exLogs = dayLogs[exIdx] || {};
      return { ...prev, [dk]: { ...dayLogs, [exIdx]: { ...exLogs, [setIdx]: { reps, weight, mode } } } };
    });
    const restSec = day.exercises[exIdx].rest;
    if (restSec > 0) {
      startTimer(`${exIdx}`, restSec);
      setRestTotal(restSec);
      setRestFor(exIdx);
    }

    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-app-password": password || "" },
      body: JSON.stringify({ date: todayStr(), dayIdx, exIdx, setIdx, reps, weight, mode }),
    })
      .then(async (r) => {
        if (r.status === 401) {
          localStorage.removeItem("wp_password");
          setPassword(null);
          setUnlocked(false);
          return;
        }
        const data = await r.json();
        if (data.streak) setStreak(data.streak);
      })
      .catch(() => {});
  };

  const startWorkout = () => {
    const idx = todayDayIdx();
    if (idx == null) { setShowDayPicker(true); return; } // Sunday — no template, let them pick manually
    setDayIdx(idx);
    setView("session");
  };

  if (!unlocked) {
    return <LockScreen onSubmit={authenticate} error={authError} loading={authLoading} />;
  }

  if (view === "cardio") {
    return (
      <div className="app-root">
        <ThemeStyles />
        <CardioSession
          day={day}
          dayIdx={dayIdx}
          password={password}
          onFinish={(s) => { setCardioStreak(s); setView("home"); }}
          onBack={() => setView("home")}
        />
      </div>
    );
  }

  if (view === "home") {
    return (
      <div className="app-root">
        <ThemeStyles />
        <HomeScreen
          liftStreak={streak}
          cardioStreak={cardioStreak}
          onStartWorkout={startWorkout}
          onStartCardio={() => setView("cardio")}
          onOpenCalendar={() => setShowCalendar(true)}
          onOpenInsights={() => setShowInsights(true)}
          onOpenCardioInsights={() => setShowCardioInsights(true)}
          onOpenNotion={() => setShowNotion(true)}
        />
        {showDayPicker && (
          <div className="scrim" onClick={() => setShowDayPicker(false)}>
            <div className="day-picker" onClick={(e) => e.stopPropagation()}>
              <div className="dp-title">No plan for Sunday — pick a day</div>
              {DAYS.map((d, i) => (
                <button
                  key={d.key}
                  className="dp-row"
                  style={{ "--dc": d.color } as any}
                  onClick={() => { setDayIdx(i); setShowDayPicker(false); setView("session"); }}
                >
                  <span className="dp-label">{d.label} — {d.type}</span>
                  <span className="dp-sub">{d.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {showNotion && <NotionModal day={day} onClose={() => setShowNotion(false)} />}
        {showCalendar && password && <CalendarModal password={password} onClose={() => setShowCalendar(false)} />}
        {showInsights && password && <InsightsModal password={password} onClose={() => setShowInsights(false)} />}
        {showCardioInsights && password && <CardioInsightsModal password={password} onClose={() => setShowCardioInsights(false)} />}
        <style jsx>{`
          .scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000; display: flex; align-items: flex-end; justify-content: center; }
          .day-picker { background: var(--surface); border-radius: 22px 22px 0 0; padding: 18px 16px calc(20px + env(safe-area-inset-bottom, 0px)); width: 100%; max-width: 480px; }
          .dp-title { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 10px; padding: 0 4px; }
          .dp-row { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; width: 100%; text-align: left; padding: 12px 14px; border-radius: 14px; border: 1px solid transparent; background: transparent; cursor: pointer; margin-bottom: 4px; }
          .dp-label { font-size: 14px; font-weight: 700; color: var(--ink); }
          .dp-sub { font-size: 11.5px; color: var(--ink-faint); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="shell">
      <ThemeStyles />

      <div className="topbar">
        <div className="topbar-left">
          <button className="back-btn" onClick={() => setView("home")} aria-label="Back to home">‹</button>
          <button className="icon-btn" onClick={() => setShowDayPicker(true)}>
            <span className="day-dot" style={{ background: day.color }} />
            <span>{day.label.slice(0, 3)} · {day.type}</span>
            <span className="chev">⌄</span>
          </button>
        </div>
        <div className="topbar-actions">
          <button className="icon-btn small" onClick={() => setShowInsights(true)} aria-label="Progress graph">📈</button>
          <button className="icon-btn small" onClick={() => setShowNotion(true)} aria-label="Export to Notion">📝</button>
          <button className="icon-btn small streak" onClick={() => setShowCalendar(true)} aria-label="Calendar">
            {streak.current > 0 ? `🔥 ${streak.current}` : "📅"}
          </button>
        </div>
      </div>

      <SessionDeck
        day={day}
        dayIdx={dayIdx}
        logs={doneSetsForDay}
        onConfirm={handleConfirm}
        weights={weights[dayKey] || {}}
        onWeightChange={handleWeightChange}
        password={password}
        timerVal={restFor != null ? (timers[`${restFor}`] ?? 0) : null}
        timerTotal={restTotal}
        onSkipRest={() => { if (restFor != null) skipTimer(`${restFor}`); setRestFor(null); }}
        onAddRestTime={() => { if (restFor != null) addTime(`${restFor}`, 15); setRestTotal((t) => t + 15); }}
      />

      {sessionDone && (
        <div className="complete-banner">
          <span className="emoji">💪</span>
          <div>
            <div className="ct">Session complete!</div>
            <div className="cs">Eat within 45 min — protein + carbs. Sleep is when muscle is built.</div>
          </div>
        </div>
      )}

      {showDayPicker && (
        <div className="scrim" onClick={() => setShowDayPicker(false)}>
          <div className="day-picker" onClick={(e) => e.stopPropagation()}>
            <div className="dp-title">Choose a day</div>
            {DAYS.map((d, i) => (
              <button
                key={d.key}
                className={`dp-row ${i === dayIdx ? "active" : ""}`}
                style={{ "--dc": d.color } as any}
                onClick={() => { setDayIdx(i); setShowDayPicker(false); }}
              >
                <span className="dp-dot" />
                <span className="dp-label">{d.label} — {d.type}</span>
                <span className="dp-sub">{d.sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showNotion && <NotionModal day={day} onClose={() => setShowNotion(false)} />}
      {showCalendar && password && <CalendarModal password={password} onClose={() => setShowCalendar(false)} />}
      {showInsights && password && <InsightsModal password={password} onClose={() => setShowInsights(false)} />}

      <style jsx>{`
        .shell { display: flex; flex-direction: column; height: 100dvh; background: var(--bg); overflow: hidden; }
        .topbar { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 10px; }
        .topbar-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .back-btn { flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--hairline); background: var(--surface); color: var(--ink); font-size: 18px; cursor: pointer; touch-action: manipulation; }
        .icon-btn { display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border-radius: 20px; border: 1px solid var(--hairline); background: var(--surface); color: var(--ink); font-size: 12.5px; font-weight: 700; cursor: pointer; touch-action: manipulation; }
        .icon-btn.small { padding: 0; width: 34px; justify-content: center; font-size: 14px; }
        .icon-btn.streak { width: auto; padding: 0 10px; }
        .day-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .chev { color: var(--ink-faint); font-size: 12px; }
        .topbar-actions { display: flex; gap: 6px; flex-shrink: 0; }
        .complete-banner { flex-shrink: 0; display: flex; align-items: center; gap: 12px; margin: 0 16px calc(14px + env(safe-area-inset-bottom, 0px)); padding: 14px 16px; border-radius: 14px; background: color-mix(in srgb, var(--good) 16%, var(--surface)); border: 1px solid color-mix(in srgb, var(--good) 40%, transparent); }
        .emoji { font-size: 22px; }
        .ct { font-weight: 800; font-size: 14px; color: var(--good); }
        .cs { font-size: 11.5px; color: var(--ink-dim); margin-top: 2px; }
        .scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000; display: flex; align-items: flex-end; justify-content: center; }
        .day-picker { background: var(--surface); border-radius: 22px 22px 0 0; padding: 18px 16px calc(20px + env(safe-area-inset-bottom, 0px)); width: 100%; max-width: 480px; }
        .dp-title { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 10px; padding: 0 4px; }
        .dp-row { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; width: 100%; text-align: left; padding: 12px 14px; border-radius: 14px; border: 1px solid transparent; background: transparent; cursor: pointer; margin-bottom: 4px; }
        .dp-row.active { background: color-mix(in srgb, var(--dc) 14%, var(--surface)); border-color: color-mix(in srgb, var(--dc) 40%, transparent); }
        .dp-dot { display: none; }
        .dp-label { font-size: 14px; font-weight: 700; color: var(--ink); }
        .dp-row.active .dp-label { color: var(--dc); }
        .dp-sub { font-size: 11.5px; color: var(--ink-faint); }
      `}</style>
    </div>
  );
}
