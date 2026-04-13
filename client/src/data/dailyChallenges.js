import dayjs from 'dayjs';

const CHALLENGE_POOL = [
  // Nutrition challenges
  { id: 'protein_goal', text: 'Hit your protein goal today', xp: 30, category: 'nutrition', check: (ctx) => ctx.totalProtein >= ctx.proteinGoal },
  { id: 'calorie_goal', text: 'Reach your calorie target', xp: 25, category: 'nutrition', check: (ctx) => ctx.totalCalories >= ctx.calorieGoal },
  { id: 'half_cal', text: 'Log at least 50% of your calories by 2pm', xp: 15, category: 'nutrition', check: (ctx) => ctx.totalCalories >= ctx.calorieGoal * 0.5 },
  { id: 'log_breakfast', text: 'Log your breakfast', xp: 10, category: 'nutrition', check: (ctx) => (ctx.meals?.breakfast?.length || 0) > 0 },
  { id: 'log_3_meals', text: 'Log 3 or more meals', xp: 20, category: 'nutrition', check: (ctx) => ctx.mealsLogged >= 3 },
  { id: 'protein_150', text: 'Get 150g+ protein today', xp: 35, category: 'nutrition', check: (ctx) => ctx.totalProtein >= 150 },

  // Water challenges
  { id: 'water_full', text: 'Drink your full water goal', xp: 25, category: 'water', check: (ctx) => ctx.waterMl >= ctx.waterGoal },
  { id: 'water_half', text: 'Drink at least half your water goal', xp: 10, category: 'water', check: (ctx) => ctx.waterMl >= ctx.waterGoal * 0.5 },
  { id: 'water_2L', text: 'Drink at least 2 litres of water', xp: 15, category: 'water', check: (ctx) => ctx.waterMl >= 2000 },

  // Workout challenges
  { id: 'complete_workout', text: 'Complete today\'s workout', xp: 40, category: 'workout', check: (ctx) => ctx.workoutCompleted },
  { id: 'volume_5k', text: 'Lift 5,000kg+ total volume', xp: 30, category: 'workout', check: (ctx) => ctx.totalVolume >= 5000 },
  { id: 'volume_10k', text: 'Lift 10,000kg+ total volume', xp: 50, category: 'workout', check: (ctx) => ctx.totalVolume >= 10000 },
  { id: 'all_sets', text: 'Complete every single set', xp: 35, category: 'workout', check: (ctx) => ctx.allSetsCompleted },

  // Activity / general
  { id: 'log_something', text: 'Log at least one food item', xp: 5, category: 'activity', check: (ctx) => ctx.totalFoodItems > 0 },
  { id: 'track_water', text: 'Log your water intake', xp: 5, category: 'activity', check: (ctx) => ctx.waterMl > 0 },
  { id: 'pushups_50', text: 'Do 50 pushups throughout the day', xp: 20, category: 'bonus', check: () => false },
  { id: 'stretch_5', text: 'Do a 5-minute stretch session', xp: 15, category: 'bonus', check: () => false },
  { id: 'no_junk', text: 'Avoid junk food today', xp: 20, category: 'bonus', check: () => false },
];

/**
 * Pick 3-4 challenges for today using date as seed so they're consistent
 * throughout the day but change daily.
 */
export function getTodayChallenges() {
  const seed = parseInt(dayjs().format('YYYYMMDD'), 10);
  const shuffled = [...CHALLENGE_POOL].sort((a, b) => {
    const ha = ((seed * 31 + a.id.charCodeAt(0)) % 997);
    const hb = ((seed * 31 + b.id.charCodeAt(0)) % 997);
    return ha - hb;
  });

  // Pick 1 auto-checkable from each main category, + 1 bonus
  const picks = [];
  const cats = ['workout', 'nutrition', 'water'];
  for (const cat of cats) {
    const match = shuffled.find((c) => c.category === cat && !picks.includes(c));
    if (match) picks.push(match);
  }
  const bonus = shuffled.find((c) => (c.category === 'bonus' || c.category === 'activity') && !picks.includes(c));
  if (bonus) picks.push(bonus);

  return picks;
}

export function getXPForLevel(level) {
  return level * 100;
}

export function getLevelFromXP(xp) {
  let level = 1;
  let needed = 100;
  let cumulative = 0;
  while (cumulative + needed <= xp) {
    cumulative += needed;
    level++;
    needed = level * 100;
  }
  return { level, currentXP: xp - cumulative, nextLevelXP: needed };
}

export const CATEGORY_COLORS = {
  workout: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
  nutrition: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
  water: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
  bonus: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
  activity: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
};

export const CATEGORY_ICONS = {
  workout: '💪',
  nutrition: '🥗',
  water: '💧',
  bonus: '⭐',
  activity: '📝',
};
