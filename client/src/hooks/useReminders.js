import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import useWorkoutPlan from './useWorkoutPlan';
import { requestNotificationPermission } from '../utils/notifications';

const INTERVAL_MS = 30 * 60 * 1000;
const WATER_GOAL_DEFAULT = 3000;
const FIRED_STORAGE_KEY = 'ft_reminder_fired';

const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function loadFiredSet() {
  try {
    const raw = localStorage.getItem(FIRED_STORAGE_KEY);
    if (!raw) return new Set();
    const { date, ids } = JSON.parse(raw);
    if (date !== todayStr()) {
      localStorage.removeItem(FIRED_STORAGE_KEY);
      return new Set();
    }
    return new Set(ids);
  } catch {
    return new Set();
  }
}

function saveFiredSet(set) {
  try {
    localStorage.setItem(FIRED_STORAGE_KEY, JSON.stringify({
      date: todayStr(),
      ids: [...set],
    }));
  } catch {}
}

const firedSet = loadFiredSet();

function hasFired(id) {
  return firedSet.has(id);
}

function markFired(id) {
  firedSet.add(id);
  saveFiredSet(firedSet);
}

export default function useReminders() {
  const { user, fetchNutritionLog, fetchWorkoutLog, addNotification } = useApp();
  const { weekSchedule } = useWorkoutPlan();
  const permAsked = useRef(false);
  const running = useRef(false);

  useEffect(() => {
    if (user && !permAsked.current) {
      permAsked.current = true;
      requestNotificationPermission();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    async function runChecks() {
      if (running.current) return;
      running.current = true;

      try {
        const now = new Date();
        const hour = now.getHours();
        const today = todayStr();

        let nutrition = null;
        try {
          nutrition = await fetchNutritionLog(today);
        } catch {}

        let totalCalories = 0;
        let totalProtein = 0;
        if (Array.isArray(nutrition?.meals)) {
          for (const meal of nutrition.meals) {
            for (const f of (meal.foods || [])) {
              totalCalories += f.calories || 0;
              totalProtein += f.protein || 0;
            }
          }
        }
        const waterMl = nutrition?.waterMl || 0;
        const waterGoal = nutrition?.waterGoalMl || WATER_GOAL_DEFAULT;
        const calorieGoal = user.dailyCalories || 2500;
        const proteinGoal = user.proteinTarget || 150;

        function fire(id, type, message) {
          if (hasFired(id)) return;
          markFired(id);
          addNotification(type, message);
        }

        // Water reminders — only if user actually has logged something today (app is in use)
        const hasLoggedAnything = nutrition != null;

        if (hour >= 10 && hour < 14 && waterMl < waterGoal * 0.3) {
          fire('water_morning', 'water',
            `You've only had ${waterMl}ml of water so far. Aim for at least ${Math.round(waterGoal * 0.5)}ml by noon!`);
        }
        if (hour >= 14 && hour < 18 && waterMl < waterGoal * 0.5) {
          fire('water_afternoon', 'water',
            `Water intake: ${waterMl}ml — that's below 50% of your ${waterGoal}ml goal. Drink up!`);
        }
        if (hour >= 18 && waterMl < waterGoal * 0.75) {
          fire('water_evening', 'water',
            `${waterMl}ml of ${waterGoal}ml water consumed today. Try to finish your goal before bed.`);
        }

        // Calorie reminders — only if user has started logging food today
        if (hasLoggedAnything && hour >= 13 && hour < 17 && totalCalories < calorieGoal * 0.4) {
          fire('cal_lunch', 'calories',
            `Only ${totalCalories} kcal logged so far — that's below 40% of your ${calorieGoal} kcal target. Time for a solid meal!`);
        }
        if (hasLoggedAnything && hour >= 19 && totalCalories < calorieGoal * 0.7) {
          const remaining = calorieGoal - totalCalories;
          fire('cal_dinner', 'calories',
            `Calorie intake: ${totalCalories} kcal — still ${remaining} kcal to go. Don't skip dinner!`);
        }

        // Protein reminder
        if (hasLoggedAnything && hour >= 17 && totalProtein < proteinGoal * 0.5) {
          fire('protein_evening', 'protein',
            `Protein: ${Math.round(totalProtein)}g of ${proteinGoal}g target. Consider a protein-rich meal or shake.`);
        }

        // Workout reminder — fetch fresh completion status
        if (hour >= 9 && hour < 20) {
          const jsDay = now.getDay();
          const dayKey = dayKeys[jsDay];
          const schedule = weekSchedule.find((d) => d.key === dayKey);
          if (schedule && schedule.sessions.length > 0) {
            const logs = await Promise.all(
              schedule.sessions.map((s) => fetchWorkoutLog(s).catch(() => null))
            );
            const allDone = logs.every((log) => log?.completed);
            const someDone = logs.some((log) => log?.completed);
            if (!allDone) {
              if (someDone) {
                const remaining = logs.filter((l) => !l?.completed).length;
                fire('workout_reminder', 'workout',
                  `${remaining} session${remaining > 1 ? 's' : ''} left for today. You're almost there — finish strong!`);
              } else if (hour >= 15) {
                fire('workout_reminder', 'workout',
                  `You haven't started today's workout yet. The day is slipping — get moving!`);
              } else {
                fire('workout_reminder', 'workout',
                  `Today's workout is still pending. Stay consistent — every session counts!`);
              }
            }
          }
        }

        // Morning briefing
        if (hour >= 7 && hour < 10) {
          const jsDay = now.getDay();
          const dayKey = dayKeys[jsDay];
          const schedule = weekSchedule.find((d) => d.key === dayKey);
          const sessions = schedule?.sessions || [];
          const sessionName = sessions.length > 0
            ? sessions.map((s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())).join(' + ')
            : 'Rest Day';
          const streak = user.streak || 0;
          const streakMsg = streak >= 7
            ? `${streak}-day streak — legendary!`
            : streak > 0
              ? `${streak}-day streak — keep it alive!`
              : 'Start building your streak today!';
          fire('daily_briefing', 'info',
            `Good morning! Today: ${sessionName}. Target: ${calorieGoal} kcal, ${proteinGoal}g protein. ${streakMsg}`);
        }
      } finally {
        running.current = false;
      }
    }

    runChecks();
    const interval = setInterval(runChecks, INTERVAL_MS);
    const onFocus = () => runChecks();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user, fetchNutritionLog, fetchWorkoutLog, addNotification, weekSchedule]);
}
