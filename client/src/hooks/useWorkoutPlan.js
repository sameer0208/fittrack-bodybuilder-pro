import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generatePlan, buildMuscleFrequency, isLegacyUser } from '../data/planGenerator';
import { workoutPlan as defaultPlan, weekSchedule as defaultSchedule, muscleFrequency as defaultFrequency } from '../data/workoutPlan';

/**
 * Returns the user's personalized { workoutPlan, weekSchedule, muscleFrequency }.
 * Falls back to the original hardcoded plan for legacy users or when not logged in.
 */
export default function useWorkoutPlan() {
  const { user } = useApp();

  return useMemo(() => {
    if (!user || isLegacyUser(user)) {
      return {
        workoutPlan: defaultPlan,
        weekSchedule: defaultSchedule,
        muscleFrequency: defaultFrequency,
      };
    }

    const { workoutPlan, weekSchedule } = generatePlan({
      fitnessGoal: user.fitnessGoal,
      gymDays: user.gymDays,
      preferredSplit: user.preferredSplit,
      fitnessLevel: user.fitnessLevel,
      weekendDoubles: user.weekendDoubles,
      sessionDuration: user.sessionDuration,
    });

    return {
      workoutPlan,
      weekSchedule,
      muscleFrequency: buildMuscleFrequency(workoutPlan),
    };
  }, [user]);
}
