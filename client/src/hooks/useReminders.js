import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { weekSchedule } from '../data/workoutPlan';
import { requestNotificationPermission } from '../utils/notifications';

const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const WATER_GOAL_DEFAULT = 3000; // ml

const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function firedKey() {
  return `ft_reminders_${todayKey()}`;
}

function getAlreadyFired() {
  try { return JSON.parse(localStorage.getItem(firedKey()) || '[]'); } catch { return []; }
}

function markFired(id) {
  const list = getAlreadyFired();
  if (!list.includes(id)) {
    list.push(id);
    localStorage.setItem(firedKey(), JSON.stringify(list));
  }
}

export default function useReminders() {
  const { user, getNutritionLog, getWorkoutLog, addNotification } = useApp();
  const permAsked = useRef(false);

  // Ask for browser notification permission once
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
      const fired = getAlreadyFired();
      const today = todayKey();

      const nutrition = getNutritionLog(today);
      const totalCalories = (nutrition?.meals
        ? Object.values(nutrition.meals).flat().reduce((s, f) => s + (f.calories || 0), 0)
        : 0);
      const totalProtein = (nutrition?.meals
        ? Object.values(nutrition.meals).flat().reduce((s, f) => s + (f.protein || 0), 0)
        : 0);
      const waterMl = nutrition?.waterMl || 0;
      const waterGoal = nutrition?.waterGoalMl || WATER_GOAL_DEFAULT;
      const calorieGoal = user.dailyCalories || 2500;
      const proteinGoal = user.proteinTarget || 150;

      function fire(id, type, message) {
        if (fired.includes(id)) return;
        markFired(id);
        addNotification(type, message);
      }

      // --- Water reminders ---
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

      // --- Calorie reminders ---
      if (hour >= 13 && hour < 17 && totalCalories < calorieGoal * 0.4) {
        fire('cal_lunch', 'calories',
          `You've logged only ${totalCalories} kcal so far — that's below 40% of your ${calorieGoal} kcal goal. Time for a meal!`);
      }
      if (hour >= 19 && totalCalories < calorieGoal * 0.7) {
        fire('cal_dinner', 'calories',
          `Calorie intake is ${totalCalories} kcal — still ${calorieGoal - totalCalories} kcal short. Don't skip dinner!`);
      }

      // --- Protein reminder ---
      if (hour >= 17 && totalProtein < proteinGoal * 0.5) {
        fire('protein_evening', 'protein',
          `Protein so far: ${Math.round(totalProtein)}g of ${proteinGoal}g. Have a protein-rich meal or shake!`);
      }

      // --- Workout reminder ---
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

      // --- Daily Briefing (8-10 AM) ---
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
  }, [user, getNutritionLog, getWorkoutLog, addNotification]);
}
