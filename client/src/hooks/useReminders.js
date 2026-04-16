import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import useWorkoutPlan from './useWorkoutPlan';
import { requestNotificationPermission } from '../utils/notifications';

const INTERVAL_MS = 30 * 60 * 1000;
const WATER_GOAL_DEFAULT = 3000;

const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// In-memory set — resets on page reload, which is fine for daily reminders
const firedSet = new Set();

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function hasFired(id) {
  return firedSet.has(`${todayStr()}_${id}`);
}

function markFired(id) {
  firedSet.add(`${todayStr()}_${id}`);
}

export default function useReminders() {
  const { user, getNutritionLog, getWorkoutLog, addNotification } = useApp();
  const { weekSchedule } = useWorkoutPlan();
  const permAsked = useRef(false);

  useEffect(() => {
    if (user && !permAsked.current) {
      permAsked.current = true;
      requestNotificationPermission();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    function runChecks() {
      const now = new Date();
      const hour = now.getHours();
      const today = todayStr();

      const nutrition = getNutritionLog(today);
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

      if (hour >= 10 && hour < 14 && waterMl < waterGoal * 0.3) {
        fire('water_morning', 'water',
          `You've only had ${waterMl}ml of water. Aim for at least ${Math.round(waterGoal * 0.5)}ml by noon!`);
      }
      if (hour >= 14 && hour < 18 && waterMl < waterGoal * 0.5) {
        fire('water_afternoon', 'water',
          `Water intake is ${waterMl}ml — still below 50% of your ${waterGoal}ml goal. Drink up!`);
      }
      if (hour >= 18 && waterMl < waterGoal * 0.75) {
        fire('water_evening', 'water',
          `Only ${waterMl}ml of ${waterGoal}ml water consumed today. Try to finish your goal before bed.`);
      }

      if (hour >= 13 && hour < 17 && totalCalories < calorieGoal * 0.4) {
        fire('cal_lunch', 'calories',
          `You've logged only ${totalCalories} kcal so far — that's below 40% of your ${calorieGoal} kcal goal. Time for a meal!`);
      }
      if (hour >= 19 && totalCalories < calorieGoal * 0.7) {
        fire('cal_dinner', 'calories',
          `Calorie intake is ${totalCalories} kcal — still ${calorieGoal - totalCalories} kcal short. Don't skip dinner!`);
      }

      if (hour >= 17 && totalProtein < proteinGoal * 0.5) {
        fire('protein_evening', 'protein',
          `Protein so far: ${Math.round(totalProtein)}g of ${proteinGoal}g. Have a protein-rich meal or shake!`);
      }

      if (hour >= 9 && hour < 20) {
        const jsDay = now.getDay();
        const dayKey = dayKeys[jsDay];
        const schedule = weekSchedule.find((d) => d.key === dayKey);
        if (schedule) {
          const allDone = schedule.sessions.every((s) => {
            const log = getWorkoutLog(s);
            return log?.completed;
          });
          if (!allDone) {
            fire('workout_reminder', 'workout',
              `You haven't completed today's workout yet. Stay consistent — every session counts!`);
          }
        }
      }

      if (hour >= 8 && hour < 10) {
        const jsDay = now.getDay();
        const dayKey = dayKeys[jsDay];
        const schedule = weekSchedule.find((d) => d.key === dayKey);
        const sessionName = schedule?.sessions?.[0]?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Rest Day';
        const streak = user.streak || 0;
        fire('daily_briefing', 'info',
          `Good morning! Today is ${sessionName}. Calorie target: ${calorieGoal} kcal. Protein goal: ${proteinGoal}g. ${streak > 0 ? `You're on a ${streak}-day streak — keep it up!` : 'Start your streak today!'}`);
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
  }, [user, getNutritionLog, getWorkoutLog, addNotification, weekSchedule]);
}
