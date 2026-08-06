"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
    exercises: [
      { name: "Smith Machine Flat Bench Press", sets: 4, reps: "8–10", rest: 90, muscles: "Chest, Front delts, Triceps", note: "Bar set at a height you can unrack without shrugging. Grip slightly wider than shoulders. Lower to mid-chest under control, press up without slamming elbows to full lockout. The fixed bar path means your only job is driving the weight — no balancing.", tip: "Because the smith rail removes stabiliser work, you can push closer to failure safely here than on a free bar. Add 2.5 kg once all 4 sets hit 10 clean reps.", link: "https://www.muscleandstrength.com/exercises/smith-machine-bench-press.html" },
      { name: "Smith Machine Incline Bench Press (30°)", sets: 3, reps: "10–12", rest: 90, muscles: "Upper chest, Front delts", note: "Bench at 30°, not steeper — steeper turns it into a shoulder press. Bar path is vertical so keep the bench positioned so the bar lowers to your upper chest, not your neck.", tip: "Upper chest is the region that visually tightens the chest — but the fat itself only comes off through the calorie deficit your diet + these cardio finishers create, not from targeting it with reps.", link: "https://www.muscleandstrength.com/exercises/incline-bench-press.html" },
      { name: "Cable Crossover", sets: 3, reps: "12–15", rest: 60, muscles: "Inner chest, Outer chest", note: "Set both pulleys above head height on the crossover tower. Step forward into a slight lean, soft elbow bend held constant. Sweep both handles down and together in front of your hips, squeeze 1 second, return under control.", tip: "This is your stretch-and-squeeze finisher for chest — the smith presses build strength, this builds the pump and definition.", link: "https://www.muscleandstrength.com/exercises/cable-crossover.html" },
      { name: "Machine Shoulder Press", sets: 3, reps: "10–12", rest: 75, muscles: "All three deltoid heads, Triceps", note: "Seat height so handles start level with shoulders. Press up without shrugging — shoulders stay pressed down into the pads throughout. Stop just short of elbow lockout.", tip: "Machine path protects the rotator cuff while you build pressing strength — good choice while chest/shoulders are still adapting to gym loads.", link: "https://www.muscleandstrength.com/exercises/machine-shoulder-press.html" },
      { name: "Cable Lateral Raise (single arm, low pulley)", sets: 3, reps: "15 each arm", rest: 45, muscles: "Lateral deltoid", note: "Stand side-on to the low pulley, handle in far hand crossing in front of body. Raise arm out to shoulder height only, 4-second controlled lowering back down.", tip: "Cables keep tension on the delt through the whole range, unlike dumbbells which go slack at the bottom — this is the better width builder of the two.", link: "https://www.muscleandstrength.com/exercises/cable-lateral-raise.html" },
      { name: "Cable Tricep Pushdown (rope)", sets: 3, reps: "12–15", rest: 60, muscles: "All three tricep heads", note: "High pulley, rope attachment. Elbows pinned to sides the entire set — only forearms move. Push down until arms straight, split the rope ends apart at the bottom, squeeze 1 second.", tip: "If your elbows drift forward as you push, you're using shoulders to cheat the weight down — drop the pin a plate.", link: "https://www.muscleandstrength.com/exercises/triceps-pushdown.html" },
      { name: "Cable Overhead Tricep Extension (rope)", sets: 3, reps: "12", rest: 60, muscles: "Long head of triceps", note: "Face away from a low pulley, rope overhead, elbows pointing forward and pinned next to ears. Extend forward and up until arms straight, lower behind head to a deep stretch.", tip: "The long head only gets a full stretch in the overhead position — this is the one tricep move your pushdown doesn't cover.", link: "https://www.muscleandstrength.com/exercises/cable-overhead-triceps-extension.html" },
      { name: "Treadmill Incline Walk — Fat Loss Finisher", sets: 1, reps: "12–15 min @ 8–12% incline, brisk pace", rest: 0, muscles: "Full body, cardio / fat loss", note: "Straight after lifting, glycogen is already partly used — this is when steady incline walking leans hardest on stored fat for fuel. Pace where you can still talk in short sentences, not a jog.", tip: "This finisher is the actual fat-loss engine of the plan — the lifting builds the muscle underneath, this is what uncovers it. Skipping it slows the belly/love-handle/chest fat loss more than skipping any single exercise above.", link: "https://www.muscleandstrength.com/exercises/treadmill-walking.html" },
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
    exercises: [
      { name: "Rear Delt Machine Fly", sets: 4, reps: "15", rest: 45, muscles: "Rear deltoids, Rhomboids, Middle traps", note: "Sit facing INTO the pec-deck pad (reverse-fly position), handles at chest height. Open arms wide and back, squeeze shoulder blades together 1 second at the back, return slowly.", tip: "First on the day because rear delts fatigue fast and posture-correcting muscle needs to be trained fresh, not as a tired afterthought.", link: "https://www.muscleandstrength.com/exercises/reverse-machine-fly.html" },
      { name: "Lat Pulldown (wide grip)", sets: 4, reps: "10–12", rest: 90, muscles: "Lats, Biceps, Middle back", note: "Wide overhand grip, slight lean back. Pull the bar to upper chest by driving elbows down and back, not by yanking with arms. Squeeze lats 1 second at the bottom, control the return to a full stretch.", tip: "Think 'elbows to back pockets,' not 'bar to chest.' The elbow path decides whether your lats or your biceps do the work.", link: "https://www.muscleandstrength.com/exercises/lat-pulldown.html" },
      { name: "Seated Cable Row", sets: 4, reps: "10–12", rest: 90, muscles: "Lats, Rhomboids, Middle back, Biceps", note: "Neutral-grip handle, knees soft, chest tall. Row to your lower ribs while keeping torso still — no swinging back to add momentum. Squeeze shoulder blades together 1 second, return to a full stretch with arms extended.", tip: "If your torso is rocking to move the weight, drop the pin — the back muscles should do 100% of the pulling.", link: "https://www.muscleandstrength.com/exercises/seated-cable-rows.html" },
      { name: "Cable Face Pull (rope, high pulley)", sets: 3, reps: "15", rest: 60, muscles: "Rear deltoids, Rotator cuff, Middle traps", note: "Rope at head height. Pull toward your face with elbows travelling high and wide, hands finishing beside your ears. Hold 1 second, return slowly.", tip: "This is rotator-cuff insurance for every heavy press you do this week — never skip it just because rear delts already got Fly work above.", link: "https://www.muscleandstrength.com/exercises/cable-face-pull.html" },
      { name: "Preacher Curl Machine", sets: 3, reps: "10–12", rest: 75, muscles: "Biceps (short head)", note: "Chest against the pad, upper arms flat on the preacher bench, full stretch at the bottom. Curl up over 2 seconds, squeeze 1 second at top, lower over 3 seconds — no swinging is possible here, use that.", tip: "The bench physically blocks cheating with your back or shoulders. This is where your heaviest, strictest bicep work should live.", link: "https://www.muscleandstrength.com/exercises/preacher-curl.html" },
      { name: "Seated Dumbbell Preacher Curl", sets: 3, reps: "10–12 each arm", rest: 60, muscles: "Biceps (peak)", note: "Same arm-support bench, one dumbbell, underhand grip. Rest your upper arm flat on the pad, curl up over 2 seconds, squeeze 1 second, lower over 3 — one arm at a time so each side gets full attention.", tip: "Dumbbells let you rotate the wrist slightly at the top (a small supination twist) for an extra peak squeeze a fixed machine bar can't give you — do one arm fully before switching.", link: "https://www.muscleandstrength.com/exercises/dumbbell-preacher-curl.html" },
      { name: "Cable Rope Hammer Curl", sets: 3, reps: "12–15", rest: 60, muscles: "Brachialis, Biceps, Forearms", note: "Low pulley, rope attachment, neutral (thumbs-up) grip held throughout. Curl to shoulder height, elbows pinned to sides, 3-second controlled lowering.", tip: "The brachialis sits under the bicep and pushes it up — developing it makes your arm look thicker from the front. Standard curls barely touch it.", link: "https://www.muscleandstrength.com/exercises/cable-hammer-curl.html" },
      { name: "Cable Woodchop (FAT ZONE)", sets: 3, reps: "12 each side", rest: 45, muscles: "Obliques, Rotational core", note: "High pulley, stand side-on. Pull the handle diagonally down across your body from high anchor side to low opposite hip, rotating through the torso, not the arms. Return slowly with control.", tip: "Power comes from torso rotation, not arms — the obliques sit directly under the love-handle area, but visible change here comes from the cardio finisher and diet, this exercise just builds the muscle shape underneath.", link: "https://www.muscleandstrength.com/exercises/cable-wood-chop.html" },
      { name: "Stationary Cycle Intervals — Fat Loss Finisher", sets: 1, reps: "12–15 min, alternating 1 min hard / 2 min easy", rest: 0, muscles: "Full body, cardio / fat loss", note: "Moderate-to-hard resistance on the hard minutes, easy spin on the recovery minutes. Cycling is fully seated, so it adds zero extra load to your legs the day before Legs A.", tip: "Interval cycling burns more in less time than steady pace once you're a few weeks in — but only push the hard minutes as hard as you can hold form.", link: "https://www.muscleandstrength.com/exercises/stationary-bike.html" },
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
    exercises: [
      { name: "Leg Extension Machine — Controlled Partial Reps (KNEE FIX)", sets: 3, reps: "15–20", rest: 45, muscles: "VMO (inner quad), Knee stabilisers", note: "Light-moderate weight. Do NOT extend to a hard lockout at the top — stop 5–10° short, hold 1 second, lower over 3 seconds. This does the same job the band terminal-knee-extension did at home, but with constant resistance through the full range.", tip: "This is your knee-pain insurance — do it before anything heavy, every single leg day, even on days your knee feels fine. Skipping it because it feels 'too easy' is the mistake that lets the pain come back.", link: "https://www.muscleandstrength.com/exercises/leg-extensions.html" },
      { name: "Sled Leg Press — Knee-Safe Depth", sets: 4, reps: "10–12", rest: 90, muscles: "Quads, Glutes, Hamstrings", note: "Feet shoulder-width, mid-platform. Lower only to where your knees stay pain-free — for most people that's roughly 90°, go less if it hurts sooner. Never lock knees out fully at the top; stop 10–15° short.", tip: "Leg press is safer than a free squat for a sore knee because the fixed sled path removes side-to-side stabiliser stress, so you can control depth precisely instead of your knee having to guess.", link: "https://www.muscleandstrength.com/exercises/leg-press.html" },
      { name: "Smith Machine Squat — Partial Depth", sets: 3, reps: "10", rest: 90, muscles: "Quads, Glutes", note: "Bar across upper traps, feet slightly forward of the bar's vertical path (the smith rail forces a straight line, so your foot position has to compensate). Squat only to a depth that stays pain-free, drive up without locking knees at the top.", tip: "If you feel any pain during the descent, stop the set and reduce depth further next set — never push through knee pain to hit a rep count.", link: "https://www.muscleandstrength.com/exercises/smith-machine-squat.html" },
      { name: "Hip Abductor Machine", sets: 3, reps: "15", rest: 45, muscles: "Glute medius, Hip stabilisers", note: "Seated, pads on outer thighs. Push knees apart against the resistance, hold 1 second at the widest point, return under control.", tip: "Weak hip abductors let your knees cave inward under load — that inward cave is a common, fixable source of knee pain. This is one of the more direct relief exercises in the whole plan.", link: "https://www.muscleandstrength.com/exercises/hip-abductor-machine.html" },
      { name: "Hip Adductor Machine", sets: 3, reps: "15", rest: 45, muscles: "Inner thigh, Hip stabilisers", note: "Seated, pads on inner thighs, start with knees apart. Squeeze knees together against the resistance, hold 1 second, return under control.", tip: "Balances the abductor work above — inner and outer hip strength together is what actually keeps the knee tracking straight over the toes.", link: "https://www.muscleandstrength.com/exercises/hip-adductor-machine.html" },
      { name: "Standing Calf Raise Machine", sets: 3, reps: "15–20", rest: 45, muscles: "Gastrocnemius, Soleus", note: "Balls of feet on the platform edge, shoulders under the pads. Lower heels to a full stretch below the platform, rise fully onto toes, 2 seconds each way, no bouncing.", tip: "Strong calves absorb ground impact on every step — building them reduces the load that reaches your knee when you walk.", link: "https://www.muscleandstrength.com/exercises/standing-calf-raise.html" },
      { name: "Cable Crunch (FAT ZONE)", sets: 3, reps: "15", rest: 45, muscles: "Rectus abdominis, Deep core", note: "Kneel facing a high pulley with rope behind your head. Curl your ribs down toward your hips by flexing the spine — hips stay still, this is not a hip-hinge movement. Squeeze 1 second, return under control.", tip: "Ab work does not remove belly fat directly — it builds the muscle that shows once diet and the cardio finishers bring body fat down.", link: "https://www.muscleandstrength.com/exercises/cable-crunch.html" },
      { name: "Stationary Cycle — Knee-Friendly Finisher", sets: 1, reps: "12–15 min, moderate resistance, steady cadence", rest: 0, muscles: "Full body, cardio / fat loss", note: "Cycling loads the knee far less than treadmill impact — use this finisher on leg days specifically so cardio never fights with knee recovery.", tip: "If the knee feels tender after squats/press today, drop resistance and just spin easy for the full 15 minutes — moving blood through the joint still helps recovery.", link: "https://www.muscleandstrength.com/exercises/stationary-bike.html" },
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
    exercises: [
      { name: "Cable Shoulder Press", sets: 4, reps: "8–10", rest: 90, muscles: "All three deltoid heads, Triceps", note: "Trained first while shoulders are completely fresh — same logic as rear delts first on pull days. Dual low pulleys (or a single-arm alternating set-up), press straight overhead, stop just short of elbow lockout.", tip: "Cables keep tension on the delt through the whole press, unlike a machine which unloads at the top — genuinely different stimulus from Monday's machine press, not just the same lift with a new name.", link: "https://www.muscleandstrength.com/exercises/cable-shoulder-press.html" },
      { name: "Cable One-Arm Lateral Raise", sets: 3, reps: "15 each arm", rest: 45, muscles: "Lateral deltoid", note: "Low pulley, stand side-on, handle in far hand crossing your body. Raise to shoulder height, 4-second controlled lowering, then switch arms.", tip: "Unilateral work exposes and fixes left/right delt imbalances that a bilateral raise like Monday's can hide — a real variation, not just a tempo tweak on the same set-up.", link: "https://www.muscleandstrength.com/exercises/cable-one-arm-lateral-raise.html" },
      { name: "Barbell Bench Press (Free Weight)", sets: 4, reps: "8–10", rest: 90, muscles: "Chest, Front delts, Triceps", note: "Use the rack with safety pins/spotter arms set just below chest level. Unlike Monday's smith press, the bar isn't locked to a rail — your stabiliser muscles have to control the path, which is a stronger overall growth stimulus.", tip: "Start a plate lighter than you think on your first few weeks of free-bar pressing — the balance demand alone will make it feel harder than the smith version at the same weight.", link: "https://www.muscleandstrength.com/exercises/barbell-bench-press.html" },
      { name: "Cable Front Raise", sets: 3, reps: "12–15", rest: 60, muscles: "Front deltoid", note: "Low pulley behind you, single handle. Raise straight out in front to shoulder height, slight bend in elbow, lower under control.", tip: "Front delts already get worked by every press — keep this one light and controlled rather than heavy, it's a finishing touch, not a main lift.", link: "https://www.muscleandstrength.com/exercises/cable-front-raise.html" },
      { name: "Cable Crossover — Low-to-High", sets: 3, reps: "12–15", rest: 60, muscles: "Upper/outer chest", note: "Set both pulleys at the LOW position this time (opposite of Monday). Sweep handles up and across in front of your face — this angle hits the upper chest fibres Monday's version misses.", tip: "Same tower, opposite pulley height — small setup change, different part of the chest trained.", link: "https://www.muscleandstrength.com/exercises/cable-crossover.html" },
      { name: "Close-Grip Barbell Bench Press", sets: 3, reps: "10–12", rest: 75, muscles: "Triceps, Inner chest", note: "Same bar and rack as your bench press, hands just inside shoulder-width. Lower to your lower chest, elbows tracking close to your sides rather than flaring out.", tip: "This is your compound tricep builder — heavier overall load than any cable pushdown, which is exactly what triceps need to keep growing.", link: "https://www.muscleandstrength.com/exercises/close-grip-bench-press.html" },
      { name: "Dumbbell Seated Triceps Extension", sets: 3, reps: "12", rest: 60, muscles: "Long head of triceps", note: "Sit on a bench, back straight. Hold one dumbbell with both hands, press it straight overhead. Bend elbows and lower the dumbbell behind your head, upper arms staying close to your ears, then press back up.", tip: "This is your only free-weight isolation move for triceps this week — the compound close-grip press above builds raw strength, this finishes the long head with a deep overhead stretch a cable can't quite replicate at this angle.", link: "https://www.muscleandstrength.com/exercises/seated-dumbbell-triceps-extension.html" },
      { name: "Treadmill Intervals — Fat Loss Finisher", sets: 1, reps: "6 rounds: 30 sec fast / 90 sec walk", rest: 0, muscles: "Full body, cardio / fat loss", note: "Push the 30-second efforts hard — near a jog or fast walk on incline. Full recovery walk between. This is your one higher-intensity cardio session of the week.", tip: "Save this interval version for a day you feel fresh — if legs are fried from yesterday's press/squat, swap it for the steady incline walk instead.", link: "https://www.muscleandstrength.com/exercises/treadmill-walking.html" },
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
    exercises: [
      { name: "Barbell Rear Delt Raise", sets: 4, reps: "15", rest: 45, muscles: "Rear deltoids, Rhomboids", note: "Bent over at the hips ~45°, barbell hanging at arm's length, palms facing you. Raise the bar out and up by driving elbows high and wide until arms are level with your torso, squeeze 1 second, lower slowly.", tip: "Free-bar bent-over raise instead of Tuesday's machine fly — different balance and stabiliser demand on the same small muscle, real variation rather than a paused rep on the same machine.", link: "https://www.muscleandstrength.com/exercises/bent-over-barbell-rear-delt-raise.html" },
      { name: "Cable Straight-Arm Pulldown", sets: 3, reps: "15", rest: 60, muscles: "Lats, Serratus", note: "High pulley, straight-bar or rope attachment, arms kept straight the whole movement. Pull down to your hips by squeezing your lats — imagine pinching a pencil in your armpits.", tip: "With arms straight, biceps physically can't help — this is pure lat isolation before the compound rows tire your arms out.", link: "https://www.muscleandstrength.com/exercises/straight-arm-pulldown.html" },
      { name: "Cable Lat Pulldown (Full Range)", sets: 4, reps: "10–12", rest: 90, muscles: "Lats, Biceps", note: "Different rig from Tuesday — a cable-stack pulldown station instead of the plate-loaded lever machine. Pull the bar to your upper chest through a deliberately full range, stretching all the way up at the top.", tip: "Same target muscle, different resistance curve — a cable stack loads the stretched position harder than a lever machine does, which the lever pulldown on Tuesday doesn't give you.", link: "https://www.muscleandstrength.com/exercises/cable-lat-pulldown.html" },
      { name: "Lever High Row", sets: 3, reps: "10–12", rest: 90, muscles: "Upper back, Rhomboids, Rear delts", note: "Plate-loaded row machine, handles set high. Row with elbows flaring wide and high toward your ears rather than tucked to your ribs — a different pulling angle from Tuesday's seated cable row.", tip: "High row hits the upper back and rear delts harder than a standard row — back width and back thickness need different pulling angles to both grow, and this is a genuinely different machine from Tuesday's.", link: "https://www.muscleandstrength.com/exercises/lever-high-row.html" },
      { name: "Barbell Preacher Curl", sets: 3, reps: "10–12", rest: 75, muscles: "Biceps (short head)", note: "Chest against the preacher pad, EZ or straight bar, full stretch at the bottom. Curl up in 1 second, lower over a full 4 seconds — free weight instead of Tuesday's cable stack.", tip: "Free weight on the preacher bench loads the bottom stretch differently than a cable, which keeps constant tension throughout — swapping the resistance type is what makes this a real second bicep stimulus, not just a tempo change on the same cable.", link: "https://www.muscleandstrength.com/exercises/preacher-curl.html" },
      { name: "Cable Concentration Curl (single arm, low pulley)", sets: 3, reps: "12 each arm", rest: 75, muscles: "Bicep peak", note: "Seated, elbow braced against the inside of your thigh (not your knee), single handle on a low pulley. Curl slowly, squeeze 1 second at the top, lower over 3 seconds.", tip: "With the elbow braced, swinging is physically impossible — every rep here is pure bicep, unlike a free curl where momentum can sneak in.", link: "https://www.muscleandstrength.com/exercises/concentration-curl.html" },
      { name: "Cable Side Bend (FAT ZONE)", sets: 3, reps: "15 each side", rest: 45, muscles: "Obliques, Quadratus lumborum", note: "Stand side-on to a low pulley, handle in the far hand. Keeping hips square and still, bend sideways toward the pulley, feel the far-side oblique stretch, return upright by contracting it.", tip: "Hips must not tilt — if they do, you're just swinging, not training obliques. These sit directly under the love-handle area, but they'll only show once overall body fat drops through diet and the cardio finishers.", link: "https://www.muscleandstrength.com/exercises/cable-side-bend.html" },
      { name: "Stationary Cycle Intervals — Fat Loss Finisher", sets: 1, reps: "12–15 min, alternating 1 min hard / 2 min easy", rest: 0, muscles: "Full body, cardio / fat loss", note: "Same protocol as Tuesday. Seated cycling adds no extra load before tomorrow's Legs B session.", tip: "By Friday you'll likely be a little tired — it's fine to keep resistance a notch lower and just complete the full 15 minutes.", link: "https://www.muscleandstrength.com/exercises/stationary-bike.html" },
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
    exercises: [
      { name: "Leg Extension Machine — Activation Sets (KNEE FIX)", sets: 3, reps: "15–20", rest: 45, muscles: "VMO (inner quad), Knee stabilisers", note: "Same protocol as Wednesday — light weight, stop short of lockout, controlled tempo. Non-negotiable on both leg days regardless of how the knee feels that day.", tip: "Skipping this on the days it feels fine is exactly how the pain comes back — consistency here is what builds lasting knee resilience, not intensity.", link: "https://www.muscleandstrength.com/exercises/leg-extensions.html" },
      { name: "Leg Curl Machine (lying or seated)", sets: 4, reps: "10–12", rest: 90, muscles: "Hamstrings", note: "Pad positioned just above the heel. Curl through a full range without lifting your hips off the pad, squeeze 1 second at the top, lower over 3 seconds.", tip: "Quad-dominant training (leg press, squats) without matching hamstring work creates a strength imbalance that itself stresses the knee joint — this exercise is what balances it out.", link: "https://www.muscleandstrength.com/exercises/lying-leg-curl.html" },
      { name: "Sled Leg Press — High Foot Placement", sets: 4, reps: "10–12", rest: 90, muscles: "Glutes, Hamstrings, Quads", note: "Same machine as Wednesday, feet moved higher on the platform this time — shifts emphasis from quads toward glutes and hamstrings. Same knee-safe depth rule applies: never lock out, stop where it's pain-free.", tip: "Foot position is the easiest way to change what a leg press trains — high and wide biases posterior chain, low and narrow biases quads.", link: "https://www.muscleandstrength.com/exercises/leg-press.html" },
      { name: "Side-Lying Hip Abduction — Burnout", sets: 3, reps: "20 each side", rest: 45, muscles: "Glute medius, Hip stabilisers", note: "Lie on your side, legs stacked and straight (or bottom knee bent for balance). Raise the top leg straight up toward the ceiling, hold 1 second at the top, lower under control without letting the hip roll back.", tip: "Bodyweight instead of Wednesday's machine — this is one of the two most directly knee-relief-focused exercises in the whole week, and doing it unloaded lets you feel (and fix) any rolling-hip cheat the machine's pad hides.", link: "https://www.muscleandstrength.com/exercises/side-lying-hip-abduction.html" },
      { name: "Smith Machine Romanian Deadlift", sets: 3, reps: "10–12", rest: 90, muscles: "Hamstrings, Glutes, Lower back", note: "Bar in the smith rail, feet hip-width. Hinge at the hips with a soft, fixed knee bend — the bar travels straight down close to your shins as your hips push back. Drive hips forward to stand.", tip: "This is a hip-hinge, not a knee-bend movement — it loads hamstrings and glutes hard while asking almost nothing of the knee joint itself, a good compound on a day the knee needs a break from bending.", link: "https://www.muscleandstrength.com/exercises/smith-machine-romanian-deadlift.html" },
      { name: "Seated / Cable Calf Raise Machine", sets: 3, reps: "15–20", rest: 45, muscles: "Soleus, Gastrocnemius", note: "Pads on thighs (seated machine) or handle at floor level (cable calf press). Full stretch at the bottom, full contraction at the top, 2 seconds each way.", tip: "The seated position isolates the soleus (the deep calf muscle) better than standing raises — pair it with Wednesday's standing version for full calf development.", link: "https://www.muscleandstrength.com/exercises/seated-calf-raise.html" },
      { name: "Hanging Leg Raise (Smith Rack) — FAT ZONE", sets: 3, reps: "12–15", rest: 60, muscles: "Lower abs, Hip flexors, Deep core", note: "Hang from the smith rack's pull-up bar or a dip station. Raise knees (or straight legs if strong enough) toward your chest by curling the pelvis under, don't just swing legs up from the hips.", tip: "The curl-the-pelvis detail is what makes this an ab exercise instead of a hip-flexor swing — control the descent just as much as the raise.", link: "https://www.muscleandstrength.com/exercises/hanging-leg-raise.html" },
      { name: "Treadmill Incline Walk — Fat Loss Finisher", sets: 1, reps: "12–15 min @ 8–12% incline, brisk pace", rest: 0, muscles: "Full body, cardio / fat loss", note: "Same protocol as Monday — steady incline walk to close the week's cardio volume.", tip: "Six of these finishers a week, done consistently, will move belly/love-handle/chest fat loss faster than any single extra exercise you could add to the lifting.", link: "https://www.muscleandstrength.com/exercises/treadmill-walking.html" },
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

// ─── SET LOGGING (hold 3s = full reps, tap = enter actual reps) ─────────────

type SetLog = { reps: number | null; weight: number | null; mode: "hold" | "tap" };
type ExLogs = Record<number, SetLog>;

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
  // (which lands wherever the popover now sits) doesn't instantly close it
  // again. Without the delay this closed the popover the instant it opened,
  // which looked like the keyboard flickering open then shut on mobile.
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
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.45)", padding: 24,
    }}>
      <div ref={rootRef} style={{
        background: "#fff", border: "1px solid #E8E8E8", borderRadius: 14,
        padding: 16, width: "100%", maxWidth: 260,
        boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#AAA", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Actual reps</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, justifyContent: "center" }}>
          {chips.map((n) => (
            <button key={n} onClick={() => onPick(n)} style={{
              width: 44, height: 44, borderRadius: 10, border: `1.5px solid ${dayColor}`,
              background: `${dayColor}14`, color: dayColor, fontSize: 16, fontWeight: 700, cursor: "pointer",
              touchAction: "manipulation",
            }}>{n}</button>
          ))}
          <button onClick={() => onPick(0)} style={{
            height: 44, padding: "0 14px", borderRadius: 10, border: "1.5px solid #EEE",
            background: "#F8F8F8", color: "#999", fontSize: 13, fontWeight: 600, cursor: "pointer",
            touchAction: "manipulation",
          }}>Skip</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number" inputMode="numeric" value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Custom #"
            style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 10, border: "1px solid #E8E8E8", padding: "0 12px", fontSize: 15, boxSizing: "border-box" }}
          />
          <button
            onClick={() => { const n = parseInt(custom, 10); if (!Number.isNaN(n)) onPick(n); }}
            style={{ width: 44, height: 44, borderRadius: 10, border: "none", background: dayColor, color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", flexShrink: 0, touchAction: "manipulation" }}
          >✓</button>
        </div>
      </div>
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

  const size = 34;
  return (
    <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
      <button
        onPointerDown={start}
        onPointerUp={release}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: "relative", width: size, height: size, borderRadius: "50%",
          border: `1.5px solid ${done ? dayColor : "#DDD"}`,
          background: done ? dayColor : "#fff",
          color: done ? "#fff" : "#999",
          fontSize: 11, fontWeight: 700, padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", cursor: "pointer", flexShrink: 0,
          WebkitTapHighlightColor: "transparent", WebkitTouchCallout: "none",
          WebkitUserSelect: "none", userSelect: "none", touchAction: "manipulation",
        }}
      >
        <div
          onTransitionEnd={(e) => { if (e.propertyName === "transform") onFillDone(); }}
          style={{
            position: "absolute", inset: 0, borderRadius: "50%", background: dayColor,
            transform: holding ? "scale(1)" : "scale(0)",
            transition: holding ? "transform 3000ms linear" : "transform 150ms ease-out",
          }}
        />
        <span style={{ position: "relative", zIndex: 1 }}>{done ? (log!.reps ?? "✓") : setIdx + 1}</span>
      </button>

      {pickerOpen && (
        <RepsPopover
          dayColor={dayColor}
          repsRange={repsRange}
          onPick={(reps) => { setPickerOpen(false); onConfirm(setIdx, reps, "tap"); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function SetPipRow({ ex, exIdx, dayColor, logs, onConfirm }: {
  ex: any; exIdx: number; dayColor: string; logs: ExLogs;
  onConfirm: (exIdx: number, setIdx: number, reps: number | null, mode: "hold" | "tap") => void;
}) {
  const repsRange = parseRepsRange(ex.reps);
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {Array.from({ length: ex.sets }, (_, si) => (
        <SetPip
          key={si} setIdx={si} dayColor={dayColor} log={logs[si]} repsRange={repsRange}
          onConfirm={(setIdx, reps, mode) => onConfirm(exIdx, setIdx, reps, mode)}
        />
      ))}
    </div>
  );
}

// ─── WEIGHT TRACKING ─────────────────────────────────────────────────────────

function WeightPopover({ dayColor, current, onSave, onClose }: {
  dayColor: string; current: number | null;
  onSave: (weight: number | null) => void; onClose: () => void;
}) {
  const [value, setValue] = useState(current != null ? String(current) : "");
  const rootRef = useRef<HTMLDivElement>(null);

  // Same delayed-outside-tap-to-close as RepsPopover — avoids the trailing
  // synthetic click from the tap that opened this instantly closing it again.
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

  const bump = (delta: number) => setValue((v) => String(Math.max(0, (parseFloat(v) || 0) + delta)));
  const save = () => {
    const n = parseFloat(value);
    onSave(Number.isNaN(n) ? null : n);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.45)", padding: 24,
    }}>
      <div ref={rootRef} style={{
        background: "#fff", border: "1px solid #E8E8E8", borderRadius: 14,
        padding: 18, width: "100%", maxWidth: 260,
        boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#AAA", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Weight (kg)</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <button onClick={() => bump(-2.5)} style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid #E8E8E8", background: "#F8F8F8", fontSize: 16, fontWeight: 700, color: "#555", cursor: "pointer", flexShrink: 0, touchAction: "manipulation" }}>−</button>
          <input
            type="number" inputMode="decimal" value={value} autoFocus={false}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 10, border: "1px solid #E8E8E8", padding: "0 8px", fontSize: 18, fontWeight: 700, textAlign: "center", boxSizing: "border-box" }}
          />
          <button onClick={() => bump(2.5)} style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid #E8E8E8", background: "#F8F8F8", fontSize: 16, fontWeight: 700, color: "#555", cursor: "pointer", flexShrink: 0, touchAction: "manipulation" }}>+</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, justifyContent: "center" }}>
          {[-5, -1, +1, +5].map((d) => (
            <button key={d} onClick={() => bump(d)} style={{
              padding: "5px 10px", borderRadius: 8, border: "1px solid #EEE", background: "#F8F8F8",
              color: "#888", fontSize: 11, fontWeight: 600, cursor: "pointer", touchAction: "manipulation",
            }}>{d > 0 ? `+${d}` : d}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onSave(null)} style={{
            flex: 1, height: 40, borderRadius: 10, border: "1px solid #EEE", background: "#F8F8F8",
            color: "#999", fontSize: 13, fontWeight: 600, cursor: "pointer", touchAction: "manipulation",
          }}>Clear</button>
          <button onClick={save} style={{
            flex: 2, height: 40, borderRadius: 10, border: "none", background: dayColor,
            color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", touchAction: "manipulation",
          }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function WeightChip({ dayColor, weight, onChange }: {
  dayColor: string; weight: number | null; onChange: (weight: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 4, height: 26, padding: "0 10px",
          borderRadius: 20, border: `1.5px solid ${weight != null ? dayColor : "#E8E8E8"}`,
          background: weight != null ? `${dayColor}14` : "#F8F8F8",
          color: weight != null ? dayColor : "#999", fontSize: 12, fontWeight: 700,
          cursor: "pointer", whiteSpace: "nowrap", touchAction: "manipulation",
        }}
      >
        🏋 {weight != null ? `${weight} kg` : "Add weight"}
      </button>
      {open && (
        <WeightPopover
          dayColor={dayColor}
          current={weight}
          onSave={(w) => { onChange(w); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ─── EXERCISE CARD ───────────────────────────────────────────────────────────

function ExerciseCard({ ex, exIdx, dayColor, logs, onConfirm, weight, onWeightChange, timerVal, onSkip }: {
  ex: any; exIdx: number; dayColor: string;
  logs: ExLogs; onConfirm: (exIdx: number, setIdx: number, reps: number | null, mode: "hold" | "tap") => void;
  weight: number | null; onWeightChange: (exIdx: number, weight: number | null) => void;
  timerVal: number; onSkip: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const allDone = Object.keys(logs).length >= ex.sets;

  const gifUrl = findLocalGif(ex.name);

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
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer", flexWrap: "wrap" }}
      >
        <div style={{
          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
          background: allDone ? dayColor : "#F3F3F3",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 600,
          color: allDone ? "#fff" : "#888",
        }}>
          {allDone ? "✓" : exIdx + 1}
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{ex.name}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            {ex.muscles} · {ex.sets} sets · {ex.reps} · {ex.rest}s rest
          </div>
          <div style={{ marginTop: 6 }}>
            <WeightChip dayColor={dayColor} weight={weight} onChange={(w) => onWeightChange(exIdx, w)} />
          </div>
        </div>
        <SetPipRow ex={ex} exIdx={exIdx} dayColor={dayColor} logs={logs} onConfirm={onConfirm} />
        <div style={{ fontSize: 18, color: "#CCC", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</div>
      </div>

      {/* Body */}
      {open && (
        <div style={{ borderTop: "1px solid #F0F0F0", padding: 16 }}>
          {/* Exercise Animation Preview */}
          {gifUrl && (
            <div style={{
              marginBottom: 14, borderRadius: 12, overflow: "hidden",
              border: "1px solid #E8E8E8", background: "#F0F0F0",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}>
              <img
                src={gifUrl}
                alt={`${ex.name} animation`}
                style={{
                  objectFit: "contain",
                  display: "block",
                }}
              />
              <div style={{ fontSize: 10, color: "#AAA", padding: "4px 0 6px", textAlign: "center" }}>
                © Gym visual — gymvisual.com
              </div>
            </div>
          )}

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
          <SetPipRow ex={ex} exIdx={exIdx} dayColor={dayColor} logs={logs} onConfirm={onConfirm} />
          <div style={{ fontSize: 11, color: "#AAA", marginTop: 8, lineHeight: 1.5 }}>
            Hold ~3s on a set → logs it as full {ex.reps} done. Quick tap → pick or type the reps you actually got.
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

// ─── LOCK SCREEN ─────────────────────────────────────────────────────────────

function LockScreen({ onSubmit, error, loading }: {
  onSubmit: (pw: string) => void; error?: string | null; loading?: boolean;
}) {
  const [pw, setPw] = useState("");
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#FAFAFA", padding: 20, fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: 16, padding: 28, maxWidth: 320, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
        <div style={{ fontWeight: 700, fontSize: 17, color: "#111", marginBottom: 4 }}>Aztec Body Trainer</div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 18 }}>Enter the password to view and log your plan.</div>
        <input
          type="password" value={pw} autoFocus
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && pw) onSubmit(pw); }}
          placeholder="Password"
          style={{
            width: "100%", height: 46, borderRadius: 10, boxSizing: "border-box",
            border: error ? "1.5px solid #E33355" : "1px solid #E8E8E8",
            padding: "0 14px", fontSize: 15, marginBottom: 10,
          }}
        />
        {error && <div style={{ fontSize: 12, color: "#D33355", marginBottom: 10 }}>{error}</div>}
        <button
          onClick={() => pw && onSubmit(pw)}
          disabled={!pw || loading}
          style={{
            width: "100%", height: 46, borderRadius: 10, border: "none",
            background: !pw || loading ? "#DDD" : "#111", color: "#fff",
            fontWeight: 600, fontSize: 15, cursor: !pw || loading ? "default" : "pointer",
            touchAction: "manipulation",
          }}
        >
          {loading ? "Checking…" : "Unlock"}
        </button>
      </div>
    </div>
  );
}

// ─── CALENDAR ────────────────────────────────────────────────────────────────

const HEAT_COLORS = ["#F0F0F0", "rgba(255,107,53,0.28)", "rgba(255,107,53,0.62)", "rgba(255,107,53,0.95)"];
const HEAT_TEXT = ["#BBB", "#A4460B", "#7A3200", "#fff"];
function heatLevel(setsLogged: number) {
  if (!setsLogged) return 0;
  if (setsLogged <= 15) return 1; // low
  if (setsLogged <= 30) return 2; // med
  return 3; // high
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
  const navBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: "1px solid #E8E8E8", background: "#fff", cursor: "pointer", fontSize: 14, color: "#555", touchAction: "manipulation" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 22, maxWidth: 380, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>Calendar</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: "#FFF4E5", border: "1px solid #FFD9A0", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 20 }}>🔥 {streak.current}</div>
            <div style={{ fontSize: 10, color: "#B8701A", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>current streak</div>
          </div>
          <div style={{ flex: 1, background: "#F3F3F3", border: "1px solid #E8E8E8", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 20, color: "#111" }}>{streak.longest}</div>
            <div style={{ fontSize: 10, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>longest streak</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button onClick={() => setMonthOffset((m) => m - 1)} style={navBtn}>‹</button>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>{monthLabel}</div>
          <button onClick={() => setMonthOffset((m) => m + 1)} disabled={monthOffset >= 0} style={{ ...navBtn, opacity: monthOffset >= 0 ? 0.3 : 1, cursor: monthOffset >= 0 ? "default" : "pointer" }}>›</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 10, color: "#AAA", fontWeight: 600 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, opacity: loading ? 0.4 : 1, transition: "opacity 0.15s" }}>
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const iso = `${monthStr}-${String(d).padStart(2, "0")}`;
            const count = days[iso] || 0;
            const lv = heatLevel(count);
            const isToday = iso === todayIso;
            return (
              <div key={i} title={count ? `${count} sets logged` : "No activity"} style={{
                aspectRatio: "1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                background: HEAT_COLORS[lv], color: HEAT_TEXT[lv], fontSize: 11, fontWeight: 600,
                border: isToday ? "2px solid #111" : "1px solid transparent",
              }}>
                {d}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14, fontSize: 10, color: "#999", alignItems: "center", justifyContent: "center" }}>
          <span>Low</span>
          {HEAT_COLORS.map((c, i) => <div key={i} style={{ width: 14, height: 14, borderRadius: 4, background: c, border: i === 0 ? "1px solid #E8E8E8" : "none" }} />)}
          <span>High</span>
        </div>
      </div>
    </div>
  );
}

// ─── INSIGHTS (weight progression graph) ─────────────────────────────────────

type HistoryPoint = { date: string; weight: number | null; sets: number; reps: number };

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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 22, maxWidth: 420, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>Progress</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>
        </div>

        <select
          value={`${selected.dayIdx}-${selected.exIdx}`}
          onChange={(e) => {
            const [d, x] = e.target.value.split("-").map(Number);
            const next = exerciseOptions.find((o) => o.dayIdx === d && o.exIdx === x);
            if (next) setSelected(next);
          }}
          style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid #E8E8E8", padding: "0 10px", fontSize: 13, marginBottom: 16, background: "#fff", color: "#111", boxSizing: "border-box" }}
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
          <div style={{ textAlign: "center", padding: "36px 10px", color: "#AAA", fontSize: 13 }}>
            {loading ? "Loading…" : "No weight logged for this exercise yet — add one from its weight chip on the plan."}
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, background: "#F8F8F8", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#111" }}>{last} kg</div>
                <div style={{ fontSize: 9, color: "#999", fontWeight: 700, textTransform: "uppercase" }}>latest</div>
              </div>
              <div style={{ flex: 1, background: delta != null && delta > 0 ? "#F0FFF8" : "#F8F8F8", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: delta != null && delta > 0 ? "#0DBD8B" : "#111" }}>
                  {delta == null ? "—" : delta > 0 ? `+${delta}` : delta} kg
                </div>
                <div style={{ fontSize: 9, color: "#999", fontWeight: 700, textTransform: "uppercase" }}>since first log</div>
              </div>
              <div style={{ flex: 1, background: "#F8F8F8", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#111" }}>{withWeight.length}</div>
                <div style={{ fontSize: 9, color: "#999", fontWeight: 700, textTransform: "uppercase" }}>sessions</div>
              </div>
            </div>

            <div style={{ width: "100%", height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={withWeight} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#AAA" }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: "#AAA" }} domain={["dataMin - 5", "dataMax + 5"]} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E8E8E8" }}
                    formatter={(value: number) => [`${value} kg`, "Weight"]}
                  />
                  <Line type="monotone" dataKey="weight" stroke={selected.color} strokeWidth={2.5} dot={{ r: 3, fill: selected.color }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function WorkoutApp() {
  const [dayIdx, setDayIdx] = useState(0);
  const [logs, setLogs] = useState<Record<string, Record<number, ExLogs>>>({});
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  // dayIdx → exIdx → weight (kg). Pre-filled from the last weight logged for
  // each exercise (server-computed), then edited freely per session from here.
  const [weights, setWeights] = useState<Record<string, Record<string, number>>>({});
  const [showNotion, setShowNotion] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const { timers, startTimer, skipTimer } = useRestTimer();

  // Whole app is gated behind one shared password. A password already saved
  // on this device is trusted immediately — no "checking…" round trip before
  // the UI shows up on every single visit, that's just for the first unlock.
  const [password, setPassword] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("wp_password") : null
  );
  const [unlocked, setUnlocked] = useState(() => !!password);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Fetches today's logs + streak — runs quietly in the background on every
  // load, doesn't gate the UI. If the server says the saved password is no
  // longer valid (e.g. it was changed), that's the one case it relocks.
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
      .catch(() => {}); // offline-safe — just keep whatever's already shown
  }, []);

  // First-ever unlock on this device — this one DOES need to verify before
  // granting access, since there's no saved password to trust yet.
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
      })
      .catch(() => setAuthError("Couldn't reach server — try again"))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (password) loadData(password);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const day = DAYS[dayIdx];
  const dayKey = `${dayIdx}`;

  const doneSetsForDay: Record<number, ExLogs> = logs[dayKey] || {};
  const totalSets = day.exercises.reduce((a, e) => a + e.sets, 0);
  const completedSets = Object.values(doneSetsForDay).reduce((a, exLogs) => a + Object.keys(exLogs).length, 0);
  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  const sessionDone = day.exercises.every((ex, ei) => Object.keys(doneSetsForDay[ei] || {}).length >= ex.sets);

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
    startTimer(`${exIdx}`, day.exercises[exIdx].rest);

    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-app-password": password || "" },
      body: JSON.stringify({ date: todayStr(), dayIdx, exIdx, setIdx, reps, weight, mode }),
    })
      .then(async (r) => {
        if (r.status === 401) {
          // Password changed server-side mid-session — relock rather than
          // silently keep failing to save.
          localStorage.removeItem("wp_password");
          setPassword(null);
          setUnlocked(false);
          return;
        }
        const data = await r.json();
        if (data.streak) setStreak(data.streak);
      })
      .catch(() => {}); // offline-safe — local state already updated
  };

  const getTimerVal = (exIdx) => timers[`${exIdx}`] || 0;

  if (!unlocked) {
    return <LockScreen onSubmit={authenticate} error={authError} loading={authLoading} />;
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px", fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: "#FAFAFA" }}>

      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Phase 3 · Gym Plan</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>Aztec Body Trainer</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>6 days/wk · Smith Machine + Bench + Leg Press + Cables · Treadmill + Cycle finisher every session</div>
        </div>
        <button
          onClick={() => setShowCalendar(true)}
          style={{
            flexShrink: 0, textAlign: "center", cursor: "pointer", touchAction: "manipulation",
            background: streak.current > 0 ? "#FFF4E5" : "#F3F3F3",
            border: streak.current > 0 ? "1px solid #FFD9A0" : "1px solid #E8E8E8",
            borderRadius: 14, padding: "6px 12px",
          }}
        >
          <div style={{ fontSize: 18, lineHeight: 1.2 }}>{streak.current > 0 ? `🔥 ${streak.current}` : "📅"}</div>
          <div style={{ fontSize: 8, color: streak.current > 0 ? "#B8701A" : "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {streak.current > 0 ? "day streak" : "calendar"}
          </div>
        </button>
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
          <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 10 }}>
            <button
              onClick={() => setShowInsights(true)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "1.5px solid #E8E8E8",
                background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#555",
              }}
            >
              📈 Progress
            </button>
            <button
              onClick={() => setShowNotion(true)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "1.5px solid #E8E8E8",
                background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#555",
              }}
            >
              Notion ↗
            </button>
          </div>
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
          { val: "50 min", lbl: "Est. duration" },
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
          logs={doneSetsForDay[ei] || {}}
          onConfirm={handleConfirm}
          weight={weights[dayKey]?.[ei] ?? null}
          onWeightChange={handleWeightChange}
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
          <div style={{ fontSize: 13, color: "#0F6E56", marginTop: 4 }}>Great work. Eat within 45 min — protein + carbs. Sleep is when muscle is built.</div>
        </div>
      )}

      {/* Notion modal */}
      {showNotion && <NotionModal day={day} onClose={() => setShowNotion(false)} />}
      {showCalendar && password && <CalendarModal password={password} onClose={() => setShowCalendar(false)} />}
      {showInsights && password && <InsightsModal password={password} onClose={() => setShowInsights(false)} />}

      {/* Footer */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #F0F0F0", fontSize: 11, color: "#CCC", textAlign: "center", lineHeight: 1.6 }}>
        Phase 3 Gym Recomp · Protein: 1.6g+ per kg bodyweight daily · Calorie deficit for fat loss, not below maintenance-500 · Sleep 7-8h<br />
        Knee: never lock out on press/squat · Leg Extension + Hip Abductor every leg day · Fat loss is diet + cardio, not spot reduction — the finishers matter
      </div>
    </div>
  );
}
