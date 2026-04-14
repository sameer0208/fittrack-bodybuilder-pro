/** Client-side badge metadata (keys must match server `server/routes/achievements.js`). */

export const BADGE_DEFS = [
  { key: 'first_workout', name: 'First Workout', description: 'Complete your first workout', icon: 'Dumbbell', tier: 'bronze' },
  { key: 'workouts_10', name: 'Getting Serious', description: 'Complete 10 workouts', icon: 'Dumbbell', tier: 'bronze' },
  { key: 'workouts_25', name: 'Committed', description: 'Complete 25 workouts', icon: 'Medal', tier: 'silver' },
  { key: 'workouts_50', name: 'Half Century', description: 'Complete 50 workouts', icon: 'Medal', tier: 'silver' },
  { key: 'workouts_100', name: 'Centurion', description: 'Complete 100 workouts', icon: 'Trophy', tier: 'gold' },
  { key: 'workouts_200', name: 'Iron Veteran', description: 'Complete 200 workouts', icon: 'Crown', tier: 'platinum' },
  { key: 'streak_3', name: 'Hat Trick', description: '3-day workout streak', icon: 'Flame', tier: 'bronze' },
  { key: 'streak_7', name: 'Week Warrior', description: '7-day workout streak', icon: 'Flame', tier: 'bronze' },
  { key: 'streak_14', name: 'Fortnight Fire', description: '14-day workout streak', icon: 'Flame', tier: 'silver' },
  { key: 'streak_30', name: 'Monthly Beast', description: '30-day workout streak', icon: 'Flame', tier: 'gold' },
  { key: 'streak_100', name: 'Unstoppable', description: '100-day workout streak', icon: 'Flame', tier: 'platinum' },
  { key: 'weight_gained_5', name: 'Bulk Started', description: 'Gain 5kg from starting weight', icon: 'TrendingUp', tier: 'silver' },
  { key: 'weight_gained_10', name: 'Mass Monster', description: 'Gain 10kg from starting weight', icon: 'Scale', tier: 'gold' },
  { key: 'weight_lost_5', name: 'Cutting Progress', description: 'Lose 5kg from starting weight', icon: 'TrendingDown', tier: 'silver' },
  { key: 'weight_lost_10', name: 'Lean Machine', description: 'Lose 10kg from starting weight', icon: 'Scale', tier: 'gold' },
  { key: 'target_reached', name: 'Goal Crusher', description: 'Reach your target weight', icon: 'Target', tier: 'platinum' },
  { key: 'volume_10k', name: 'Volume Beast', description: 'Lift 10,000kg total volume in a single workout', icon: 'Zap', tier: 'silver' },
  { key: 'volume_50k', name: 'Iron Mountain', description: 'Lift 50,000kg total volume in a single workout', icon: 'Zap', tier: 'gold' },
  { key: 'logged_food_7', name: 'Nutrition Tracker', description: 'Log food for 7 different days', icon: 'Apple', tier: 'bronze' },
  { key: 'logged_food_30', name: 'Diet Devotee', description: 'Log food for 30 different days', icon: 'Apple', tier: 'silver' },
  { key: 'first_measurement', name: 'Measured Up', description: 'Log your first body measurement', icon: 'Scale', tier: 'bronze' },
  { key: 'first_photo', name: 'Say Cheese', description: 'Upload your first progress photo', icon: 'Camera', tier: 'bronze' },
  { key: 'buddy_paired', name: 'Gym Buddy', description: 'Pair up with a workout buddy', icon: 'Users', tier: 'bronze' },
];

export const TIER_COLORS = {
  bronze: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
  },
  silver: {
    text: 'text-slate-200',
    bg: 'bg-slate-400/15',
    border: 'border-slate-400/45',
  },
  gold: {
    text: 'text-yellow-400',
    bg: 'bg-yellow-400/12',
    border: 'border-yellow-400/45',
  },
  platinum: {
    text: 'text-cyan-300',
    bg: 'bg-cyan-400/12',
    border: 'border-cyan-400/45',
  },
};

export function getBadgeDef(key) {
  return BADGE_DEFS.find((b) => b.key === key);
}
