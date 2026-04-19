/**
 * Pump-Up / Activation exercises — quick warm-up movements to prime muscles
 * before the main workout. These are NOT part of the workout itself; they're
 * light, high-rep, low-rest activation drills (30-60 sec each).
 *
 * The system dynamically picks pump-up exercises based on which muscles the
 * user's workout (including customizations) will target.
 */

export const PUMP_UP_EXERCISES = {
  // ── CHEST ──────────────────────────────────────────────────────────────────
  chest_activation_pushup: {
    id: 'chest_activation_pushup',
    name: 'Wide Push-Ups (Slow)',
    targetMuscles: ['Chest', 'Upper Chest', 'Lower Chest'],
    equipment: 'Bodyweight',
    reps: '12–15',
    tempo: '2 sec down, 1 sec up',
    icon: '🫸',
    tip: 'Go slow — focus on the chest stretch at the bottom',
  },
  band_chest_fly: {
    id: 'band_chest_fly',
    name: 'Band Chest Fly',
    targetMuscles: ['Chest', 'Upper Chest'],
    equipment: 'Resistance Band',
    reps: '15–20',
    tempo: 'Squeeze at peak 2 sec',
    icon: '🔴',
    tip: 'Light band, focus on the squeeze not the resistance',
  },
  incline_plate_press: {
    id: 'incline_plate_press',
    name: 'Plate Squeeze Press',
    targetMuscles: ['Chest', 'Upper Chest'],
    equipment: '5–10kg Plate',
    reps: '15–20',
    tempo: 'Constant squeeze',
    icon: '🏋️',
    tip: 'Press two palms into the plate — isometric chest activation',
  },

  // ── BACK ───────────────────────────────────────────────────────────────────
  band_pull_apart_warmup: {
    id: 'band_pull_apart_warmup',
    name: 'Band Pull-Apart',
    targetMuscles: ['Lats', 'Mid-Back', 'Rear Delts'],
    equipment: 'Resistance Band',
    reps: '20–25',
    tempo: 'Controlled',
    icon: '🔴',
    tip: 'Pull to chest level, squeeze shoulder blades together',
  },
  cat_cow_warmup: {
    id: 'cat_cow_warmup',
    name: 'Cat-Cow Spinal Flow',
    targetMuscles: ['Lats', 'Mid-Back', 'Lower Back'],
    equipment: 'Bodyweight',
    reps: '10 cycles',
    tempo: 'Slow, with breath',
    icon: '🧘',
    tip: 'Breathe in on cow, breathe out on cat — mobilize the spine',
  },
  scapular_pullup: {
    id: 'scapular_pullup',
    name: 'Scapular Pull-Up',
    targetMuscles: ['Lats', 'Mid-Back', 'Upper Traps'],
    equipment: 'Pull-Up Bar',
    reps: '10–12',
    tempo: 'Hold top 2 sec',
    icon: '💪',
    tip: 'Dead hang → retract scapulae → hold — activates lats without full pull-up',
  },

  // ── SHOULDERS ──────────────────────────────────────────────────────────────
  arm_circles: {
    id: 'arm_circles',
    name: 'Arm Circles (Progressive)',
    targetMuscles: ['Front Delts', 'Side Delts', 'Shoulders'],
    equipment: 'Bodyweight',
    reps: '15 each direction',
    tempo: 'Small → Large',
    icon: '🔄',
    tip: 'Start small circles, progressively make them larger',
  },
  band_dislocate: {
    id: 'band_dislocate',
    name: 'Band Shoulder Dislocate',
    targetMuscles: ['Shoulders', 'Front Delts', 'Rear Delts', 'Side Delts'],
    equipment: 'Resistance Band',
    reps: '10–15',
    tempo: 'Slow arc',
    icon: '🔴',
    tip: 'Wide grip — arc the band from front to back over your head',
  },
  light_lateral_raise: {
    id: 'light_lateral_raise',
    name: 'Light Lateral Raise Hold',
    targetMuscles: ['Side Delts', 'Shoulders'],
    equipment: '2–3kg Dumbbells',
    reps: '15 + 10 sec hold',
    tempo: 'Hold at top',
    icon: '🏋️',
    tip: 'Raise to shoulder height and hold the last rep for 10 seconds',
  },

  // ── BICEPS ─────────────────────────────────────────────────────────────────
  band_curl: {
    id: 'band_curl',
    name: 'Band Curl (High Rep)',
    targetMuscles: ['Biceps', 'Biceps (Long Head)', 'Biceps (Short Head)'],
    equipment: 'Resistance Band',
    reps: '20–25',
    tempo: 'Squeeze at top',
    icon: '💪',
    tip: 'Light resistance, feel the blood rushing into the biceps',
  },
  wrist_rotation: {
    id: 'wrist_rotation',
    name: 'Wrist & Forearm Rotations',
    targetMuscles: ['Biceps', 'Forearms', 'Brachialis', 'Brachioradialis'],
    equipment: 'Bodyweight',
    reps: '15 each direction',
    tempo: 'Slow circles',
    icon: '🔄',
    tip: 'Warms up the elbow joint and forearm tendons',
  },

  // ── TRICEPS ────────────────────────────────────────────────────────────────
  band_pushdown_warmup: {
    id: 'band_pushdown_warmup',
    name: 'Band Tricep Pushdown',
    targetMuscles: ['Triceps', 'Triceps (Long Head)', 'Triceps (Lateral Head)'],
    equipment: 'Resistance Band',
    reps: '20–25',
    tempo: 'Squeeze at lockout',
    icon: '🔴',
    tip: 'Anchor band overhead, push down and lock out fully',
  },
  bodyweight_dip_pump: {
    id: 'bodyweight_dip_pump',
    name: 'Bench Dip (Partial ROM)',
    targetMuscles: ['Triceps'],
    equipment: 'Bench',
    reps: '12–15',
    tempo: 'Top half only',
    icon: '🪑',
    tip: 'Stay in the top half of the range — just pump blood into the triceps',
  },

  // ── QUADS ──────────────────────────────────────────────────────────────────
  bodyweight_squat: {
    id: 'bodyweight_squat',
    name: 'Bodyweight Squat (Deep)',
    targetMuscles: ['Quads', 'Quads (Isolation)'],
    equipment: 'Bodyweight',
    reps: '15–20',
    tempo: '3 sec down, pause at bottom',
    icon: '🦵',
    tip: 'Go as deep as you can — this mobilizes the ankles and hips too',
  },
  leg_swing_front: {
    id: 'leg_swing_front',
    name: 'Front/Back Leg Swings',
    targetMuscles: ['Quads', 'Hip Flexors'],
    equipment: 'Bodyweight',
    reps: '15 each leg',
    tempo: 'Dynamic',
    icon: '🦶',
    tip: 'Hold a wall for balance, swing through full range',
  },

  // ── HAMSTRINGS & GLUTES ────────────────────────────────────────────────────
  glute_bridge_warmup: {
    id: 'glute_bridge_warmup',
    name: 'Glute Bridge (Hold)',
    targetMuscles: ['Glutes', 'Hamstrings'],
    equipment: 'Bodyweight',
    reps: '12 + 10 sec hold',
    tempo: 'Squeeze at top',
    icon: '🍑',
    tip: 'Hold the top position — feel the glutes fire before you load them',
  },
  hip_circle: {
    id: 'hip_circle',
    name: 'Standing Hip Circles',
    targetMuscles: ['Glutes', 'Hip Flexors', 'Hamstrings'],
    equipment: 'Bodyweight',
    reps: '10 each direction, each leg',
    tempo: 'Controlled circles',
    icon: '🔄',
    tip: 'Opens up the hip capsule — essential before squats and deadlifts',
  },
  inchworm: {
    id: 'inchworm',
    name: 'Inchworm Walk-Out',
    targetMuscles: ['Hamstrings', 'Core', 'Shoulders'],
    equipment: 'Bodyweight',
    reps: '8–10',
    tempo: 'Slow walk out and back',
    icon: '🐛',
    tip: 'Walk hands out to plank, then walk feet to hands — full posterior chain activation',
  },

  // ── CALVES ─────────────────────────────────────────────────────────────────
  calf_bounce: {
    id: 'calf_bounce',
    name: 'Calf Bounces (Light)',
    targetMuscles: ['Calves'],
    equipment: 'Bodyweight',
    reps: '30 sec',
    tempo: 'Quick bounces on toes',
    icon: '🦶',
    tip: 'Stay on the balls of your feet — get blood flowing to the calves',
  },

  // ── CORE ───────────────────────────────────────────────────────────────────
  dead_bug_warmup: {
    id: 'dead_bug_warmup',
    name: 'Dead Bug (Activation)',
    targetMuscles: ['Abs', 'Core', 'Obliques'],
    equipment: 'Bodyweight',
    reps: '8 each side',
    tempo: 'Slow and controlled',
    icon: '🐞',
    tip: 'Press lower back into the floor — this "turns on" the deep core',
  },
  plank_shoulder_tap: {
    id: 'plank_shoulder_tap',
    name: 'Plank Shoulder Taps',
    targetMuscles: ['Core', 'Abs', 'Obliques'],
    equipment: 'Bodyweight',
    reps: '10 each side',
    tempo: 'Anti-rotation focus',
    icon: '🫱',
    tip: 'Keep hips square — resist the urge to rotate',
  },

  // ── TRAPS ──────────────────────────────────────────────────────────────────
  light_shrug: {
    id: 'light_shrug',
    name: 'Light DB Shrug (Squeeze)',
    targetMuscles: ['Traps', 'Upper Traps'],
    equipment: 'Light Dumbbells',
    reps: '15–20',
    tempo: 'Hold top 3 sec',
    icon: '🏋️',
    tip: 'Focus on the mind-muscle connection — feel the traps contracting',
  },

  // ── FULL BODY / POWER ──────────────────────────────────────────────────────
  jumping_jack: {
    id: 'jumping_jack',
    name: 'Jumping Jacks',
    targetMuscles: ['Full Body', 'Power', 'Athletic Performance', 'Cardiovascular System'],
    equipment: 'Bodyweight',
    reps: '30 sec',
    tempo: 'Moderate pace',
    icon: '⭐',
    tip: 'Gets the heart rate up and blood moving to all muscle groups',
  },
  high_knees: {
    id: 'high_knees',
    name: 'High Knees',
    targetMuscles: ['Full Body', 'Power', 'Athletic Performance', 'Endurance'],
    equipment: 'Bodyweight',
    reps: '20 sec',
    tempo: 'Fast',
    icon: '🏃',
    tip: 'Drive knees high — activates hip flexors, quads, and cardiovascular system',
  },

  // ── FLEXIBILITY / RECOVERY ─────────────────────────────────────────────────
  world_greatest_stretch: {
    id: 'world_greatest_stretch',
    name: "World's Greatest Stretch",
    targetMuscles: ['Flexibility', 'Recovery', 'Injury Prevention', 'Hip Flexors'],
    equipment: 'Bodyweight',
    reps: '5 each side',
    tempo: 'Hold each position 3 sec',
    icon: '🧘',
    tip: 'Lunge → rotate → reach — opens hips, thoracic spine, and hamstrings',
  },
  foam_roll_general: {
    id: 'foam_roll_general',
    name: 'Quick Foam Roll (Target Areas)',
    targetMuscles: ['Flexibility', 'Recovery', 'Injury Prevention'],
    equipment: 'Foam Roller',
    reps: '30 sec per area',
    tempo: 'Slow rolls',
    icon: '🧻',
    tip: 'Hit the muscle groups you are about to train — spend extra on tight spots',
  },
};

/**
 * Given an array of focus muscles (from the workout session + exercise primaryMuscles),
 * returns a curated list of pump-up exercises sorted by relevance.
 *
 * @param {string[]} targetMuscles - muscles that today's workout targets
 * @param {number} maxExercises - cap the list (default 5)
 * @returns {object[]} pump-up exercises
 */
export function getPumpUpExercises(targetMuscles, maxExercises = 5) {
  if (!targetMuscles?.length) return [];

  const normalised = new Set(targetMuscles.map((m) => m.toLowerCase()));

  const scored = Object.values(PUMP_UP_EXERCISES).map((ex) => {
    let score = 0;
    for (const m of ex.targetMuscles) {
      if (normalised.has(m.toLowerCase())) score += 2;
    }
    // Partial match bonus (e.g. "Quads" matches "Quads (Isolation)")
    for (const target of normalised) {
      for (const m of ex.targetMuscles) {
        if (m.toLowerCase().includes(target) || target.includes(m.toLowerCase())) {
          score += 1;
        }
      }
    }
    return { ...ex, _score: score };
  });

  return scored
    .filter((ex) => ex._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, maxExercises);
}
