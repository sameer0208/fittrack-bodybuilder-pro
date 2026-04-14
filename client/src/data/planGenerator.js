/**
 * Dynamic workout plan generator.
 *
 * Generates a personalized weekly plan from the user profile:
 *   - fitnessGoal: bulk | cut | maintain | strength | endurance
 *   - gymDays: ['monday', 'wednesday', 'friday', …]
 *   - preferredSplit: push_pull_legs | upper_lower | full_body | bro_split | auto
 *   - fitnessLevel: beginner | intermediate | advanced
 *   - weekendDoubles: boolean (allow AM+PM on weekends)
 *   - sessionDuration: '30-45' | '45-60' | '60-75' | '75-90'
 *
 * Returns { workoutPlan, weekSchedule } in the same shape the app already uses.
 */

// ── Session templates ──────────────────────────────────────────────────────
// Each template defines a session type with exercises, focus areas, etc.
// Exercises reference IDs from exercises.js / exerciseLibrary.js.

const PUSH_A = {
  name: 'Push A', subtitle: 'Chest · Shoulders · Triceps',
  focus: ['Chest', 'Front Delts', 'Side Delts', 'Triceps'],
  muscleEmoji: '💪', colorClass: 'from-blue-600 to-indigo-700', accentColor: '#6366f1',
  exercises: ['barbell_bench_press', 'incline_db_press', 'cable_flyes', 'overhead_press', 'lateral_raises', 'tricep_pushdown', 'skull_crushers'],
};

const PUSH_B = {
  name: 'Push B', subtitle: 'Chest · Shoulders · Triceps (Variation)',
  focus: ['Upper Chest', 'Shoulders', 'Triceps'],
  muscleEmoji: '💪', colorClass: 'from-blue-500 to-cyan-600', accentColor: '#06b6d4',
  exercises: ['incline_barbell_press', 'db_shoulder_press', 'chest_flyes', 'cable_lateral_raises', 'weighted_dips', 'close_grip_bench', 'overhead_tricep_ext'],
};

const PULL_A = {
  name: 'Pull A', subtitle: 'Back · Biceps · Rear Delts',
  focus: ['Lats', 'Mid-Back', 'Traps', 'Biceps', 'Rear Delts'],
  muscleEmoji: '🏋️', colorClass: 'from-emerald-600 to-teal-700', accentColor: '#10b981',
  exercises: ['deadlift', 'lat_pulldown', 'bent_over_row', 'seated_cable_row', 'barbell_curl', 'hammer_curls', 'face_pulls'],
};

const PULL_B = {
  name: 'Pull B', subtitle: 'Back · Biceps · Traps (Variation)',
  focus: ['Lats', 'Mid-Back', 'Upper Traps', 'Biceps'],
  muscleEmoji: '🏋️', colorClass: 'from-purple-600 to-violet-700', accentColor: '#8b5cf6',
  exercises: ['pullups', 'tbar_row', 'single_arm_row', 'seated_cable_row', 'preacher_curl', 'concentration_curl', 'barbell_shrug'],
};

const LEGS_A = {
  name: 'Legs A', subtitle: 'Quads · Hamstrings · Calves',
  focus: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  muscleEmoji: '🦵', colorClass: 'from-orange-600 to-amber-700', accentColor: '#f59e0b',
  exercises: ['barbell_squat', 'leg_press', 'romanian_deadlift', 'leg_extension', 'seated_leg_curl', 'standing_calf_raise', 'seated_calf_raise'],
};

const LEGS_B = {
  name: 'Legs B', subtitle: 'Quads · Glutes · Hamstrings (Variation)',
  focus: ['Quads', 'Glutes', 'Hamstrings', 'Calves'],
  muscleEmoji: '🦵', colorClass: 'from-red-600 to-rose-700', accentColor: '#ef4444',
  exercises: ['front_squat', 'bulgarian_split_squat', 'hack_squat', 'hip_thrust', 'nordic_curl', 'donkey_calf_raise'],
};

const UPPER_A = {
  name: 'Upper Body A', subtitle: 'Chest · Back · Shoulders · Arms',
  focus: ['Chest', 'Lats', 'Shoulders', 'Biceps', 'Triceps'],
  muscleEmoji: '💪', colorClass: 'from-blue-600 to-indigo-700', accentColor: '#6366f1',
  exercises: ['barbell_bench_press', 'bent_over_row', 'overhead_press', 'lat_pulldown', 'barbell_curl', 'tricep_pushdown'],
};

const UPPER_B = {
  name: 'Upper Body B', subtitle: 'Chest · Back · Shoulders · Arms (Variation)',
  focus: ['Upper Chest', 'Mid-Back', 'Shoulders', 'Biceps', 'Triceps'],
  muscleEmoji: '💪', colorClass: 'from-purple-600 to-violet-700', accentColor: '#8b5cf6',
  exercises: ['incline_db_press', 'tbar_row', 'db_shoulder_press', 'cable_flyes', 'hammer_curls', 'skull_crushers'],
};

const LOWER_A = {
  name: 'Lower Body A', subtitle: 'Quads · Hamstrings · Glutes',
  focus: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  muscleEmoji: '🦵', colorClass: 'from-orange-600 to-amber-700', accentColor: '#f59e0b',
  exercises: ['barbell_squat', 'romanian_deadlift', 'leg_press', 'seated_leg_curl', 'standing_calf_raise'],
};

const LOWER_B = {
  name: 'Lower Body B', subtitle: 'Glutes · Hamstrings · Quads (Variation)',
  focus: ['Glutes', 'Hamstrings', 'Quads', 'Calves'],
  muscleEmoji: '🦵', colorClass: 'from-red-600 to-rose-700', accentColor: '#ef4444',
  exercises: ['front_squat', 'hip_thrust', 'bulgarian_split_squat', 'leg_extension', 'donkey_calf_raise'],
};

const FULL_BODY_A = {
  name: 'Full Body A', subtitle: 'Compounds · Total Body Stimulus',
  focus: ['Chest', 'Lats', 'Quads', 'Shoulders', 'Core'],
  muscleEmoji: '⚡', colorClass: 'from-yellow-500 to-orange-600', accentColor: '#f97316',
  exercises: ['barbell_bench_press', 'bent_over_row', 'barbell_squat', 'overhead_press', 'barbell_curl', 'plank'],
};

const FULL_BODY_B = {
  name: 'Full Body B', subtitle: 'Compounds · Variation Day',
  focus: ['Upper Chest', 'Mid-Back', 'Hamstrings', 'Triceps', 'Core'],
  muscleEmoji: '⚡', colorClass: 'from-emerald-500 to-teal-600', accentColor: '#14b8a6',
  exercises: ['incline_db_press', 'lat_pulldown', 'romanian_deadlift', 'db_shoulder_press', 'tricep_pushdown', 'cable_crunches'],
};

const FULL_BODY_C = {
  name: 'Full Body C', subtitle: 'Power & Athletic Performance',
  focus: ['Full Body', 'Power', 'Athletic Performance'],
  muscleEmoji: '⚡', colorClass: 'from-pink-500 to-fuchsia-600', accentColor: '#ec4899',
  exercises: ['deadlift', 'pullups', 'weighted_dips', 'front_squat', 'face_pulls', 'russian_twists'],
};

const CHEST_BACK = {
  name: 'Chest & Back', subtitle: 'Antagonist Supersets',
  focus: ['Chest', 'Lats', 'Mid-Back', 'Upper Chest'],
  muscleEmoji: '💪', colorClass: 'from-blue-600 to-indigo-700', accentColor: '#6366f1',
  exercises: ['barbell_bench_press', 'bent_over_row', 'incline_db_press', 'lat_pulldown', 'cable_flyes', 'seated_cable_row'],
};

const SHOULDERS_ARMS = {
  name: 'Shoulders & Arms', subtitle: 'Delts · Biceps · Triceps',
  focus: ['Front Delts', 'Side Delts', 'Rear Delts', 'Biceps', 'Triceps'],
  muscleEmoji: '💪', colorClass: 'from-pink-600 to-fuchsia-700', accentColor: '#ec4899',
  exercises: ['overhead_press', 'lateral_raises', 'face_pulls', 'barbell_curl', 'skull_crushers', 'hammer_curls', 'rope_pushdown'],
};

const ARMS_CORE = {
  name: 'Arms & Core', subtitle: 'Biceps · Triceps · Abs',
  focus: ['Biceps', 'Triceps', 'Abs', 'Obliques'],
  muscleEmoji: '💪', colorClass: 'from-pink-600 to-fuchsia-700', accentColor: '#ec4899',
  exercises: ['barbell_curl', 'incline_db_curl', 'bench_tricep_dip', 'rope_pushdown', 'cable_curl', 'plank', 'cable_crunches', 'russian_twists'],
};

const FULL_BODY_POWER = {
  name: 'Full Body Power', subtitle: 'Compound Lifts · Weak-Point Training',
  focus: ['Full Body', 'Power', 'Athletic Performance'],
  muscleEmoji: '⚡', colorClass: 'from-yellow-500 to-orange-600', accentColor: '#f97316',
  exercises: ['power_clean', 'pullups', 'weighted_dips', 'bent_over_row', 'walking_lunges', 'arnold_press'],
};

const MOBILITY = {
  name: 'Mobility & Recovery', subtitle: 'Flexibility · Active Recovery',
  focus: ['Flexibility', 'Recovery', 'Injury Prevention'],
  muscleEmoji: '🧘', colorClass: 'from-teal-500 to-cyan-700', accentColor: '#14b8a6',
  exercises: ['foam_rolling', 'hip_flexor_stretch', 'lat_stretch', 'light_cardio'],
};

const CARDIO_CORE = {
  name: 'Cardio & Core', subtitle: 'HIIT · Ab Circuit · Conditioning',
  focus: ['Cardio', 'Abs', 'Obliques', 'Endurance'],
  muscleEmoji: '🔥', colorClass: 'from-red-500 to-orange-600', accentColor: '#ef4444',
  exercises: ['light_cardio', 'plank', 'cable_crunches', 'russian_twists', 'walking_lunges'],
};

// ── Split rotations ────────────────────────────────────────────────────────
const SPLIT_ROTATIONS = {
  push_pull_legs: [PUSH_A, PULL_A, LEGS_A, PUSH_B, PULL_B, LEGS_B, ARMS_CORE],
  upper_lower: [UPPER_A, LOWER_A, UPPER_B, LOWER_B, FULL_BODY_A, UPPER_A, LOWER_B],
  full_body: [FULL_BODY_A, FULL_BODY_B, FULL_BODY_C, FULL_BODY_A, FULL_BODY_B, FULL_BODY_C, MOBILITY],
  bro_split: [CHEST_BACK, LEGS_A, SHOULDERS_ARMS, PULL_A, LEGS_B, PUSH_A, ARMS_CORE],
};

// ── Duration adjustments ───────────────────────────────────────────────────
function trimForDuration(exercises, duration) {
  if (duration === '30-45') return exercises.slice(0, 4);
  if (duration === '45-60') return exercises.slice(0, 5);
  if (duration === '60-75') return exercises.slice(0, 6);
  return exercises; // 75-90: full list
}

const DURATION_LABELS = {
  '30-45': '30–45 min', '45-60': '45–60 min',
  '60-75': '60–75 min', '75-90': '75–90 min',
};

// ── Auto split selection ───────────────────────────────────────────────────
function autoSelectSplit(gymDaysCount, fitnessLevel, goal) {
  if (gymDaysCount <= 3) return 'full_body';
  if (gymDaysCount === 4) return 'upper_lower';
  if (fitnessLevel === 'beginner') return gymDaysCount >= 5 ? 'upper_lower' : 'full_body';
  if (goal === 'endurance') return 'full_body';
  return 'push_pull_legs';
}

// ── Day metadata ───────────────────────────────────────────────────────────
const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };
const DAY_SHORT = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
const WEEKENDS = new Set(['saturday', 'sunday']);

// ── Main generator ─────────────────────────────────────────────────────────
export function generatePlan(userProfile) {
  const {
    fitnessGoal = 'bulk',
    gymDays = ALL_DAYS,
    preferredSplit = 'auto',
    fitnessLevel = 'beginner',
    weekendDoubles = true,
    sessionDuration = '75-90',
  } = userProfile || {};

  const activeDays = ALL_DAYS.filter((d) => gymDays.includes(d));
  const split = preferredSplit === 'auto'
    ? autoSelectSplit(activeDays.length, fitnessLevel, fitnessGoal)
    : preferredSplit;

  const rotation = [...SPLIT_ROTATIONS[split]];

  const plan = {};
  const schedule = [];
  let rotIdx = 0;

  for (const day of ALL_DAYS) {
    const isGymDay = activeDays.includes(day);
    const isWeekend = WEEKENDS.has(day);
    const sessions = [];

    if (isGymDay) {
      const template = rotation[rotIdx % rotation.length];
      rotIdx++;
      const sessionKey = isWeekend && weekendDoubles ? `${day}_am` : day;
      const exercises = trimForDuration([...template.exercises], sessionDuration);

      plan[sessionKey] = {
        dayKey: day,
        dayLabel: DAY_LABELS[day],
        session: 'morning',
        sessionKey,
        time: '🌅 Morning',
        name: template.name,
        subtitle: template.subtitle,
        focus: [...template.focus],
        muscleEmoji: template.muscleEmoji,
        colorClass: template.colorClass,
        accentColor: template.accentColor,
        duration: DURATION_LABELS[sessionDuration] || '75–90 min',
        exercises,
      };
      sessions.push(sessionKey);

      if (isWeekend && weekendDoubles) {
        const pmKey = `${day}_pm`;
        const pmTemplate = (fitnessGoal === 'cut' || fitnessGoal === 'endurance')
          ? CARDIO_CORE
          : (rotIdx < rotation.length ? rotation[rotIdx % rotation.length] : MOBILITY);
        if (pmTemplate !== CARDIO_CORE) rotIdx++;

        const pmExercises = trimForDuration([...pmTemplate.exercises], sessionDuration);
        plan[pmKey] = {
          dayKey: day,
          dayLabel: DAY_LABELS[day],
          session: 'evening',
          sessionKey: pmKey,
          time: '🌇 Evening',
          name: pmTemplate.name,
          subtitle: pmTemplate.subtitle,
          focus: [...pmTemplate.focus],
          muscleEmoji: pmTemplate.muscleEmoji,
          colorClass: pmTemplate.colorClass,
          accentColor: pmTemplate.accentColor,
          duration: DURATION_LABELS[sessionDuration] || '75–90 min',
          exercises: pmExercises,
        };
        sessions.push(pmKey);
      }
    } else {
      // Rest day — no sessions but still appears in the weekly schedule
    }

    schedule.push({ day: DAY_SHORT[day], key: day, sessions, isRest: !isGymDay });
  }

  return { workoutPlan: plan, weekSchedule: schedule };
}

/**
 * Generate a muscle-frequency analysis from a generated plan.
 */
export function buildMuscleFrequency(plan) {
  const freq = {};
  for (const [key, session] of Object.entries(plan)) {
    for (const muscle of session.focus || []) {
      if (!freq[muscle]) freq[muscle] = [];
      freq[muscle].push(`${key} (${session.name})`);
    }
  }
  return freq;
}

/**
 * Default plan for existing/legacy users who have no personalization fields.
 * Returns the original hardcoded 7-day program.
 */
export function isLegacyUser(user) {
  return !user?.fitnessGoal && !user?.gymDays;
}
