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
    sub: "Chest · Triceps · Shoulders (secondary)",
    phases: ["5 min warm-up", "35 min strength", "10 min cool-down + neck"],
    exercises: [
      { name: "Push-up Progression Set", sets: 4, reps: "3–5 floor → knee to 12", rest: 90, muscles: "Chest, Triceps, Shoulders", note: "Start each set with 3–5 full floor push-ups. When form breaks (hips sag, chest not reaching floor), drop immediately to knee push-ups and finish to 12 total reps. Hands slightly wider than shoulder-width, elbows 45° angle. 3 seconds down, 1 second up.", tip: "Count your floor reps every Monday and write them down. That number going from 3→4→5 over weeks IS your progress. When you hit 8 clean floor reps before dropping, graduate to full push-ups only.", link: "https://www.muscleandstrength.com/exercises/push-up.html" },
      { name: "DB Floor Chest Press (5 kg)", sets: 4, reps: "10–12", rest: 75, muscles: "Chest, Front delts, Triceps", note: "Lie on mat, knees bent, feet flat. Hold 5 kg DB in each hand at chest level, elbows at 45° angle. Press up until arms nearly straight. Lower slowly over 3 seconds until elbows lightly touch the mat — controlled touch, no bounce.", tip: "If 5 kg feels too heavy for clean reps, start with 3 kg. Ego lifts build nothing. 3 kg pressed perfectly beats 5 kg slammed around.", link: "https://www.muscleandstrength.com/exercises/dumbbell-floor-press.html" },
      { name: "Band Chest Fly", sets: 3, reps: "12–15", rest: 60, muscles: "Inner chest, Front delts", note: "Anchor band at chest height behind you. Step forward for tension. Arms slightly bent (soft elbow — never lock). Sweep both hands forward and together like hugging a tree. Squeeze chest 1 second at front. Return slowly over 3 seconds.", tip: "Do not let the band snap your arms back. The 3-second return is the work. If you cannot control it, step closer to reduce tension.", link: "https://www.muscleandstrength.com/exercises/resistance-band-chest-fly.html" },
      { name: "Tricep Dips — Chair", sets: 3, reps: "10–12", rest: 75, muscles: "Triceps, Lower chest", note: "Hands on stable chair edge, fingers forward. Feet flat on floor. Lower until elbows reach exactly 90° — not deeper. Press back up, stop 10° before lockout. Back stays close to chair. 3 seconds down, 1 second up.", tip: "If your wrists hurt with flat palms, make soft fists on the chair edge instead. The slow descent is where tricep tension lives.", link: "https://www.muscleandstrength.com/exercises/bench-dip.html" },
      { name: "DB Tricep Overhead Extension (3 kg)", sets: 3, reps: "12", rest: 60, muscles: "Long head of triceps", note: "Sit or stand. Hold one 3 kg DB with both hands (diamond grip). Raise overhead. Elbows point forward, pinned next to ears. Lower DB behind head until deep stretch in back of arm. Press back up. 3 seconds down, 1 second up.", tip: "If elbows flare outward at any point, the weight is too heavy — the flare is a tell. The long head only gets fully stretched overhead.", link: "https://www.muscleandstrength.com/exercises/dumbbell-overhead-tricep-extension.html" },
      { name: "Band Tricep Pushdown", sets: 3, reps: "15", rest: 45, muscles: "All three tricep heads", note: "Anchor band high (door frame). Upper arms pinned to sides — they do not move. Only forearms move. Push hands down until arms fully straight. Squeeze triceps 1 second. Return slowly, stop when forearms parallel to floor.", tip: "This is your isolation finisher — the triceps are already pumped. The band allows you to squeeze reps without joint stress. Resist the band on the way up.", link: "https://www.muscleandstrength.com/exercises/resistance-band-tricep-pushdown.html" },
      { name: "DB Pullover (5 kg) — FAT ZONE", sets: 3, reps: "12", rest: 60, muscles: "Chest, Serratus anterior, Lats", note: "Lie on mat. Hold one 5 kg DB with both hands, palms flat against inner plate. Press above chest. Keeping slight elbow bend, lower DB back behind head toward floor. Feel chest and rib cage stretch. Pull back over chest. 3 seconds each direction.", tip: "Do not go lower than comfortable shoulder range. The stretch should feel good — stop if it feels like a strain. This builds the serratus that creates chest definition.", link: "https://www.muscleandstrength.com/exercises/dumbbell-pullover.html" },
    ],
  },
  {
    key: "tue",
    label: "Tuesday",
    type: "Pull A",
    color: "#0DBD8B",
    bg: "#E1F5EE",
    sub: "Rear Delts FIRST → Back → Biceps",
    phases: ["5 min warm-up", "35 min pull", "10 min cool-down"],
    exercises: [
      { name: "Band Face Pull (4-sec tempo)", sets: 4, reps: "15", rest: 45, muscles: "Rear deltoids, Rotator cuff, Middle traps", note: "Anchor band at face height. Thumbs-up grip. Pull hands toward face — elbows travel HIGH and WIDE. At peak, hands beside ears, elbows flared like wings. Hold 1 second. Return over 3 seconds. Tempo: 1 sec pull, 1 sec hold, 3 sec return.", tip: "This is first because rear delts fatigue fast. Training them fresh ensures quality work. They also warm up the shoulder joint for everything that follows.", link: "https://www.muscleandstrength.com/exercises/band-face-pull.html" },
      { name: "Band Pull-Apart (2-sec squeeze)", sets: 3, reps: "20", rest: 45, muscles: "Rear delts, Rhomboids, Middle traps", note: "Hold band at shoulder width, arms straight out front. Pull apart until band touches chest — keep arms completely straight throughout. At full stretch, squeeze shoulder blades together and hold 2 full seconds. Return slowly.", tip: "The 2-second squeeze at the back contracts your rhomboids maximally. This is a posture-correcting exercise — it directly fixes rounded shoulders from hunched neck.", link: "https://www.muscleandstrength.com/exercises/band-pull-apart.html" },
      { name: "DB Bent-over Row (5 kg)", sets: 4, reps: "10–12", rest: 90, muscles: "Lats, Rhomboids, Biceps", note: "One hand on chair for support. Hinge at hip — torso nearly parallel to floor. Hold DB in free hand, arm hanging straight. Row elbow straight up toward ceiling. At top, elbow higher than back. Squeeze lat 1 second. Lower over 3 seconds.", tip: "Think 'elbow to ceiling' not 'hand to hip.' The elbow direction determines which muscle works. If your back rounds, the weight is too heavy — use 3 kg.", link: "https://www.muscleandstrength.com/exercises/one-arm-dumbbell-row.html" },
      { name: "Band Straight-Arm Pulldown", sets: 3, reps: "15", rest: 60, muscles: "Lats, Serratus", note: "Anchor band high (above head). Hold one end in each hand, arms straight. Keeping arms straight the entire movement, pull both hands down to hips by squeezing lats. Imagine pinching a pencil in your armpits. Return slowly overhead.", tip: "When arms are straight, biceps cannot help — only lats pull. This is pure lat isolation. Resist the band on the way up.", link: "https://www.muscleandstrength.com/exercises/band-lat-pulldown.html" },
      { name: "DB Bicep Curl (5 kg) — Slow Negative", sets: 3, reps: "10–12", rest: 75, muscles: "Biceps", note: "Stand tall. Hold 5 kg DB in each hand, palms up. Curl both together — 2 seconds up. At top, squeeze 1 second. Lower over 3 full seconds — this slow lowering is where the muscle grows. Zero body swing.", tip: "The 5 kg will feel significantly heavier than 3 kg. If you cannot do 8 reps with zero swing, do 3 kg for one more week then retry. Rocking your back means the weight is too heavy.", link: "https://www.muscleandstrength.com/exercises/dumbbell-bicep-curl.html" },
      { name: "Band Hammer Curl", sets: 3, reps: "15", rest: 45, muscles: "Brachialis, Biceps, Forearm", note: "Step on band centre. Hold both ends with palms facing each other (thumbs-up grip — must not change throughout). Curl to shoulder height. 2 seconds up, 3 seconds down. Elbows pinned at sides.", tip: "The brachialis sits under the bicep. When developed, it pushes the bicep up and makes your arm look thicker from the front. Standard curls barely touch it — hammer curls hit it directly.", link: "https://www.muscleandstrength.com/exercises/resistance-band-hammer-curl.html" },
      { name: "Band Woodchop (FAT ZONE)", sets: 3, reps: "12 each side", rest: 45, muscles: "Obliques, Rotational core", note: "Anchor band HIGH. Stand sideways to anchor. Hold both ends with hands clasped. In one smooth rotation, pull band diagonally downward across body — from high anchor side to low opposite hip. Feet planted; rotation in torso. Return slowly with control.", tip: "The power comes from your torso rotation — not your arms. Arms just hold the band. Think of your belly button rotating toward the anchor. Slow return = more oblique work.", link: "https://www.muscleandstrength.com/exercises/cable-wood-chop.html" },
    ],
  },
  {
    key: "wed",
    label: "Wednesday",
    type: "Legs A",
    color: "#FF6B35",
    bg: "#FAECE7",
    sub: "Quads · VMO · Knee Strengthening",
    phases: ["8 min warm-up + knee prep", "30 min legs", "10 min cool-down"],
    exercises: [
      { name: "Terminal Knee Extension — Band (KNEE FIX)", sets: 3, reps: "15 each leg", rest: 30, muscles: "VMO, Knee stabilisers", note: "Anchor band at knee height behind you. Loop around back of one knee. Stand on that leg, slight bend. Straighten knee against band resistance — STOP 5–10° before fully straight. Hold 1 second. Return to bent.", tip: "You will barely feel this initially — that is normal. It is neuromuscular activation work, not burn work. Over weeks you will feel it clearly. Do this before every leg session.", link: "https://www.muscleandstrength.com/exercises/terminal-knee-extension.html" },
      { name: "Wall Sit with 5 kg DB", sets: 4, reps: "45–60 sec", rest: 75, muscles: "VMO, Quads, Glutes", note: "Back completely flat on wall. Thighs parallel to floor. Hold one 5 kg DB on each thigh. CRITICAL: Stop 10–15° before knees fully extend — never lock out. VMO under continuous tension the entire hold.", tip: "When 60 seconds feels comfortable, add the second 5 kg dumbbell across both legs (10 kg total). The partial stop protects hyperextending knees.", link: "https://www.muscleandstrength.com/exercises/wall-sit.html" },
      { name: "Single-leg Glute Bridge", sets: 4, reps: "12 each leg", rest: 60, muscles: "Glutes, Hamstrings, Hip stabilisers", note: "Lie on mat. One leg bent with foot flat, other leg extended straight or raised to 45°. Drive hips up using only bent leg — squeeze glutes maximally at top for 1 second. Lower slowly over 2 seconds. Complete all 12 on one leg before switching.", tip: "Single-leg reveals and corrects left/right imbalances. Imbalances in glute strength are a direct cause of knee tracking problems on longer walks.", link: "https://www.muscleandstrength.com/exercises/single-leg-glute-bridge.html" },
      { name: "Band Lateral Walk", sets: 3, reps: "20 steps each direction", rest: 45, muscles: "Hip abductors, Glute medius", note: "Band just above knees. Slight squat position — maintain it the entire time. Take controlled steps sideways. Do not let feet come together between steps. Keep constant tension. 20 steps right, 20 steps left = 1 set.", tip: "Weak hip abductors cause knees to cave inward during walking. When they fatigue at high step counts, tracking worsens. This directly builds the muscle that keeps knees aligned.", link: "https://www.muscleandstrength.com/exercises/resistance-band-lateral-walk.html" },
      { name: "Step-up with 5 kg DB", sets: 3, reps: "10 each leg", rest: 75, muscles: "Quads, Glutes", note: "Hold one 5 kg DB on same side as working leg. Use stable low step (15–20 cm). Step up pressing through entire foot — not just toes. At top, straighten leg but STOP before locking knee. Lower opposite foot slowly over 3 seconds.", tip: "Track your knee directly over your 2nd and 3rd toe throughout. If it caves inward, reduce the DB weight or step height.", link: "https://www.muscleandstrength.com/exercises/dumbbell-step-up.html" },
      { name: "Pallof Press — Band (FAT ZONE)", sets: 3, reps: "12 each side", rest: 45, muscles: "Deep core, Transverse abdominis, Obliques", note: "Anchor band at chest height. Stand sideways to anchor. Hold band at chest with both hands. Press both arms straight out — fully extended. Hold 2 seconds. Return to chest. The challenge is preventing your body from rotating toward the band.", tip: "The Pallof press works the deep transverse abdominis — the natural corset around your waist. Use enough tension that you have to work to stay still. Too light = easy to cheat.", link: "https://www.muscleandstrength.com/exercises/pallof-press.html" },
      { name: "Calf Raise — Two-leg on Step", sets: 3, reps: "20", rest: 45, muscles: "Gastrocnemius, Soleus", note: "Stand on edge of step, heels hanging. Lower heels completely below step level — full stretch. Rise onto toes — full contraction. 2 seconds up, 2 seconds down. No bouncing. Feel both full stretch at bottom and full squeeze at top.", tip: "Strong calves absorb ground impact during walking. Building them reduces the load transmitted up to the knee on every step.", link: "https://www.muscleandstrength.com/exercises/standing-calf-raise.html" },
    ],
  },
  {
    key: "thu",
    label: "Thursday",
    type: "Push B",
    color: "#6C63FF",
    bg: "#EEEDFE",
    sub: "Shoulders FIRST · Chest · Triceps",
    phases: ["5 min warm-up", "35 min push", "10 min cool-down + neck"],
    exercises: [
      { name: "DB Shoulder Press (5 kg)", sets: 4, reps: "10–12", rest: 90, muscles: "All three deltoid heads, Triceps", note: "Sit on chair with back support or stand. Hold 5 kg DB in each hand at shoulder height, palms forward. Press overhead — stop 10° before elbows lock out. Lower slowly over 3 seconds back to start.", tip: "Do not shrug shoulders toward ears. Keep neck long. Think of pressing shoulders DOWN into sockets as arms press UP. This protects the rotator cuff.", link: "https://www.muscleandstrength.com/exercises/seated-dumbbell-press.html" },
      { name: "DB Lateral Raise (3 kg) — 4-sec lowering", sets: 4, reps: "15", rest: 60, muscles: "Lateral deltoid", note: "Hold 3 kg in each hand, arms slightly in front of body (20° forward, not exactly to sides). Raise arms to shoulder height only — going higher disengages deltoid. Raise takes 1 second. Lowering takes 4 full seconds.", tip: "A slight forward lean (10°) at the hip increases deltoid activation. The slow 4-second descent is the entire exercise — that is where width is built.", link: "https://www.muscleandstrength.com/exercises/dumbbell-lateral-raise.html" },
      { name: "Pike Push-up", sets: 3, reps: "8–10", rest: 90, muscles: "Shoulders (front + side), Triceps", note: "Start in downward-dog position — hips raised high, body forming inverted V. Hands slightly wider than shoulder-width. Bend elbows, lower head toward floor BETWEEN hands. Press back up until arms straight. Head moves down and slightly forward.", tip: "This is a shoulder-dominant pushing pattern. Unlike regular push-ups (chest dominant), this hits deltoids from above — building the rounded shoulder look.", link: "https://www.muscleandstrength.com/exercises/pike-push-up.html" },
      { name: "DB Arnold Press (3 kg)", sets: 3, reps: "12", rest: 60, muscles: "All three deltoid heads, Rotator cuff", note: "Start with DBs at chin height, palms facing YOU. As you press up, rotate hands so palms face AWAY at top. Reverse rotation on way down. 2 seconds up with rotation, 1 second at top, 3 seconds down with rotation.", tip: "The rotation activates front and middle deltoid heads through different ranges in one movement. Do not rush past the rotation — it is the point of this exercise.", link: "https://www.muscleandstrength.com/exercises/arnold-dumbbell-press.html" },
      { name: "Push-up Progression Set", sets: 3, reps: "3–5 floor → knee to 12", rest: 75, muscles: "Chest, Triceps, Shoulders", note: "Same technique as Monday. By Thursday the shoulder work will make these slightly harder — that is the intent. Your chest and triceps must work without fresh shoulders helping. 3 seconds down, 1 second up.", tip: "If you get fewer floor reps than Monday, that is expected after shoulder work. Focus on quality knee push-ups to finish the set.", link: "https://www.muscleandstrength.com/exercises/push-up.html" },
      { name: "Decline Push-up (feet on chair)", sets: 3, reps: "6–8", rest: 90, muscles: "Upper chest, Front delts", note: "Feet elevated on chair (30 cm). Hands on floor, slightly wider than shoulder-width. Body forms straight line from feet to head. Lower chest toward floor over 3 seconds. Press back up. Elevated feet shift angle to upper chest.", tip: "This is harder than it looks on day one. If you cannot do 5 clean reps, bring feet lower (smaller angle) until you build strength.", link: "https://www.muscleandstrength.com/exercises/decline-push-up.html" },
      { name: "DB Around-the-World (3 kg) — FAT ZONE", sets: 3, reps: "10 each direction", rest: 60, muscles: "Chest (full pec), Shoulders, Serratus", note: "Lie on mat. Hold 3 kg DB in each hand, arms extended above chest. Move both arms simultaneously in wide circle — from overhead, out to sides, down to hips, and back. Full controlled arc. 3 seconds per half circle. Reverse direction after all reps.", tip: "The full arc loads the pec at every angle — especially outer chest and serratus. These create chest definition and reduce the soft chest appearance.", link: "https://www.muscleandstrength.com/exercises/dumbbell-around-the-world.html" },
    ],
  },
  {
    key: "fri",
    label: "Friday",
    type: "Pull B",
    color: "#0DBD8B",
    bg: "#E1F5EE",
    sub: "Rear Delts FIRST → Back → Biceps (Variation)",
    phases: ["5 min warm-up", "35 min pull", "10 min cool-down"],
    exercises: [
      { name: "Band Reverse Fly (paused at peak)", sets: 4, reps: "15", rest: 45, muscles: "Rear deltoids, Rhomboids", note: "Hold band in front with both hands, arms straight. Hinge forward 30–45° at hip. Open both arms wide like wings until in line with body. At full open position, hold 2 seconds. Return slowly over 3 seconds.", tip: "The 2-second pause removes all momentum and keeps rear delt under tension. The muscle is small — slow, controlled, paused reps beat fast reps every time.", link: "https://www.muscleandstrength.com/exercises/band-reverse-fly.html" },
      { name: "Band Pull-Apart (3-sec return)", sets: 3, reps: "15", rest: 45, muscles: "Rear delts, Rhomboids, Middle traps", note: "Hold band at shoulder width, arms straight out front. Pull apart until band touches chest. Squeeze shoulder blades together at peak. Return over 3 full seconds — resist the band pulling your hands back together.", tip: "Same movement as Tuesday but with 3-second slow return instead of 2-second squeeze. Different tempo = different stimulus on the same muscles.", link: "https://www.muscleandstrength.com/exercises/band-pull-apart.html" },
      { name: "DB Chest-supported Row (5 kg each)", sets: 4, reps: "10–12", rest: 90, muscles: "Lats, Rhomboids, Rear delts, Biceps", note: "Lie face-down on steeply inclined chair or firm stacked pillows (30–40° angle). Hold 5 kg DB in each hand, arms hanging. Row both DBs upward — elbows back and slightly out. Squeeze shoulder blades 1 second. Lower over 3 seconds.", tip: "Zero lower back involvement — the incline takes it out completely. On Friday your lower back may be tired from the week. This lets you train back intensely without spinal fatigue.", link: "https://www.muscleandstrength.com/exercises/incline-dumbbell-row.html" },
      { name: "Band High Row (2-sec pause)", sets: 3, reps: "12–15", rest: 60, muscles: "Upper traps, Rear delts", note: "Anchor band at forehead height. Pull toward chin with elbows flaring high and wide. At top — elbows high, hands near chin — hold 2 full seconds. Lower slowly.", tip: "Targets upper traps and rear delts from a different angle than face pulls — both are needed for full back development.", link: "https://www.muscleandstrength.com/exercises/band-upright-row.html" },
      { name: "DB Concentration Curl (5 kg)", sets: 3, reps: "12 each arm", rest: 75, muscles: "Bicep peak (short head)", note: "Sit on chair edge, legs apart. Rest elbow on INSIDE of thigh (not knee — on thigh, lower). Hold 5 kg DB. Curl slowly over 2 seconds. At peak, supinate wrist (rotate palm toward shoulder) and squeeze 1 second. Lower over 4 seconds.", tip: "With elbow braced on thigh, swinging is physically impossible. Every rep is pure bicep. The 4-second lowering is where the muscle tears and regrows.", link: "https://www.muscleandstrength.com/exercises/concentration-curl.html" },
      { name: "Band Supinated Curl (midpoint pause)", sets: 3, reps: "15", rest: 45, muscles: "Biceps", note: "Step on band. Palms FULLY facing up entire movement — do not let them rotate. Curl to shoulder height. Pause 1 second when arms at 90° (halfway up) — this is the hardest point. Continue to top. Lower slowly.", tip: "The midpoint pause creates an isometric contraction at the weakest point of the curl. This eliminates momentum and makes a light band genuinely difficult.", link: "https://www.muscleandstrength.com/exercises/resistance-band-bicep-curl.html" },
      { name: "Russian Twist — Seated (FAT ZONE)", sets: 3, reps: "20 total (10 each side)", rest: 45, muscles: "Obliques, Rotational core", note: "Sit on chair edge or mat. Knees bent, feet flat. Hold 3 kg DB with both hands. Lean back slightly (30°) so core engaged. Rotate DB from side to side, touching near hip each time. Chest up, facing forward — only arms and upper torso rotate. 2 seconds to each side.", tip: "Moving the dumbbell fast makes it easier (momentum). Slow it down — the rotation is the work. Done seated on chair edge, this requires about 60 cm of space.", link: "https://www.muscleandstrength.com/exercises/russian-twist.html" },
    ],
  },
  {
    key: "sat",
    label: "Saturday",
    type: "Legs B",
    color: "#FF6B35",
    bg: "#FAECE7",
    sub: "Hamstrings · Calves · Knee Strengthening",
    phases: ["8 min warm-up + knee prep", "30 min legs", "10 min cool-down"],
    exercises: [
      { name: "Terminal Knee Extension — Band (KNEE FIX)", sets: 3, reps: "15 each leg", rest: 30, muscles: "VMO, Knee stabilisers", note: "Anchor band at knee height behind you. Loop around back of one knee. Stand on that leg, slight bend. Straighten knee against band resistance — STOP 5–10° before fully straight. Hold 1 second. Return to bent. This starts every leg session.", tip: "Non-negotiable exercise 1 on both leg days. The VMO is the last muscle to activate in the quad chain and the first to weaken. Every knee pain issue traces back here.", link: "https://www.muscleandstrength.com/exercises/terminal-knee-extension.html" },
      { name: "Romanian DB Deadlift (5 kg each)", sets: 4, reps: "10–12", rest: 90, muscles: "Hamstrings, Glutes, Lower back", note: "Hold 5 kg DB in each hand (10 kg total). Stand tall, slight knee bend — maintain throughout. Hinge at HIP by pushing hips backward. Torso lowers as hips go back. DBs slide down legs (touching thighs). When max stretch at mid-shin, drive hips FORWARD to stand.", tip: "A hip hinge keeps spine neutral and uses hamstrings/glutes. Bending at the waist rounds the spine. They look similar but are very different. Practice without weight first.", link: "https://www.muscleandstrength.com/exercises/romanian-deadlift.html" },
      { name: "Single-leg Calf Raise (step edge)", sets: 4, reps: "15 each leg", rest: 45, muscles: "Gastrocnemius, Soleus", note: "Stand on edge of step on ONE foot. Hold wall for balance only — do not push off. Lower heel fully below step. Raise onto toes fully. 2 seconds up, 2 seconds down. At bottom, pause 1 second in stretched position.", tip: "The 1-second pause at the bottom increases Achilles tendon strength which directly reduces walking/running knee stress.", link: "https://www.muscleandstrength.com/exercises/standing-one-leg-calf-raise.html" },
      { name: "Band Squat — Goblet Hold (5 kg)", sets: 3, reps: "12–15", rest: 75, muscles: "Quads, Glutes, Hip abductors", note: "Band just above knees. Hold one 5 kg DB at chest (goblet position — both hands cupping one end). Feet shoulder-width, toes out 20–30°. Squat pushing knees OUT against band while hips go back and down. Rise pressing floor away. Stop 10–15° before lockout.", tip: "The band forcing knees out trains hip abductors to resist knee caving. The goblet hold keeps torso upright, reducing knee stress.", link: "https://www.muscleandstrength.com/exercises/goblet-squat.html" },
      { name: "Clamshell — Band", sets: 3, reps: "20 each side", rest: 45, muscles: "Glute medius, Hip external rotators", note: "Lie on side. Band just above knees. Knees bent at 90°. Keeping feet together and hips stacked vertically, rotate top knee upward like a clamshell opening. Stop when hips start to rotate backward. Lower. Hip must not tilt.", tip: "The glute medius is the primary muscle preventing knee valgus (caving inward) during walking. This is the isolated exercise that directly targets it.", link: "https://www.muscleandstrength.com/exercises/clamshell.html" },
      { name: "Wall Sit — Single Leg", sets: 3, reps: "20–25 sec each leg", rest: 60, muscles: "VMO, Quads", note: "Wall sit position (back flat, thigh parallel). Lift one foot off floor. Hold on one leg only. Start with 15 seconds if 20 is too much. Knee NEVER locks out.", tip: "This is very hard — it is designed to be. Elite VMO strength = no knee pain on long walks. Progress from 15 to 25 seconds over weeks.", link: "https://www.muscleandstrength.com/exercises/wall-sit.html" },
      { name: "DB Side Bend (5 kg) — FAT ZONE", sets: 3, reps: "15 each side", rest: 45, muscles: "Obliques, Quadratus lumborum", note: "Stand tall. Hold 5 kg DB in right hand. Left hand on hip. Keeping hips completely square and still, bend sideways to right — DB slides down right leg. Feel LEFT oblique stretching. Return upright by contracting left oblique. Complete all 15, then switch.", tip: "Hips must not tilt. The movement is pure lateral spine flexion. If your hips shift, you are not training obliques — you are just moving. The obliques sit directly under the love handle area.", link: "https://www.muscleandstrength.com/exercises/dumbbell-side-bend.html" },
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
  t += `---\n*Phase 2 Recomp — 80 kg, 5'8–9 · Dumbbells 2/3/5 kg + Bands + Mat · Late night sessions*\n`;
  return t;
}

// ─── LOCAL EXERCISEDB GIF LOOKUP ─────────────────────────────────────────────

const g = (f: string) => `/gifs/${f}`;

const WORKOUT_GIF_MAP: Record<string, string> = {
  // PUSH A (Monday)
  "push-up progression set":        g("05Cf2v8.gif"),
  "db floor chest press":           g("5v7KYld.gif"),
  "band chest fly":                 g("7saC5zz.gif"),
  "tricep dips — chair":            g("05Cf2v8.gif"),
  "db tricep overhead extension":   g("5uFK1xr.gif"),
  "band tricep pushdown":           g("6MfS53i.gif"),
  "db pullover":                    g("3TZduzM.gif"),

  // PULL A (Tuesday)
  "band face pull":                 g("7F1DVzn.gif"),
  "band pull-apart":                g("7I6LNUG.gif"),
  "db bent-over row":               g("7I6LNUG.gif"),
  "band straight-arm pulldown":     g("7F1DVzn.gif"),
  "db bicep curl":                  g("8oYqOt9.gif"),
  "band hammer curl":               g("4dF3maG.gif"),
  "band woodchop":                  g("6bOA1Oi.gif"),

  // LEGS A (Wednesday)
  "terminal knee extension":        g("5bpPTHv.gif"),
  "wall sit":                       g("5bpPTHv.gif"),
  "single-leg glute bridge":        g("6sYyrRX.gif"),
  "band lateral walk":              g("2Qh2J1e.gif"),
  "step-up":                        g("5bpPTHv.gif"),
  "pallof press":                   g("8xUv4J7.gif"),
  "calf raise":                     g("2ORFMoR.gif"),

  // PUSH B (Thursday)
  "db shoulder press":              g("6cKQC5E.gif"),
  "db lateral raise":               g("3eGE2JC.gif"),
  "pike push-up":                   g("05Cf2v8.gif"),
  "db arnold press":                g("6cKQC5E.gif"),
  "decline push-up":                g("3TZduzM.gif"),
  "db around-the-world":            g("7saC5zz.gif"),

  // PULL B (Friday)
  "band reverse fly":               g("7saC5zz.gif"),
  "db chest-supported row":         g("7I6LNUG.gif"),
  "band high row":                  g("6cKQC5E.gif"),
  "db concentration curl":          g("7inpWch.gif"),
  "band supinated curl":            g("4dUn2iv.gif"),
  "russian twist":                  g("6bOA1Oi.gif"),

  // LEGS B (Saturday)
  "romanian db deadlift":           g("8urJS9b.gif"),
  "single-leg calf raise":         g("2ORFMoR.gif"),
  "band squat":                     g("5bpPTHv.gif"),
  "clamshell":                      g("6sYyrRX.gif"),
  "wall sit — single leg":          g("5bpPTHv.gif"),
  "db side bend":                   g("6bOA1Oi.gif"),
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

// ─── EXERCISE CARD ───────────────────────────────────────────────────────────

function ExerciseCard({ ex, exIdx, dayColor, doneSets, onSetDone, timerVal, onSkip }: {
  ex: any; exIdx: number; dayColor: string;
  doneSets: number[]; onSetDone: (ei: number, si: number, rest: number) => void;
  timerVal: number; onSkip: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const allDone = doneSets.length >= ex.sets;

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
                ExerciseDB · local dataset animation
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
        <div style={{ fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Phase 2 · Recomp Plan</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>Aztec Body Trainer</div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>80 kg · Dumbbells 2/3/5 kg + Bands + Mat · Late night sessions</div>
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
          <div style={{ fontSize: 13, color: "#0F6E56", marginTop: 4 }}>Great work. Eat within 45 min — protein + carbs. Sleep is when muscle is built.</div>
        </div>
      )}

      {/* Notion modal */}
      {showNotion && <NotionModal day={day} onClose={() => setShowNotion(false)} />}

      {/* Footer */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #F0F0F0", fontSize: 11, color: "#CCC", textAlign: "center", lineHeight: 1.6 }}>
        Phase 2 Recomp · Protein: 90g+ daily · No caffeine after 4pm · 10-min cool-down is not optional<br />
        Knee: never lock out · VMO + hip abductors every leg day · Neck protocol every push/pull day
      </div>
    </div>
  );
}
