/**
 * Stretching & mobility routines (durations in seconds).
 */

export const routines = [
  {
    key: 'warmup',
    name: 'Pre-Workout Warmup',
    description:
      'Dynamic movements to raise heart rate, mobilize joints, and prime muscles before lifting or cardio.',
    totalMinutes: 10,
    exercises: [
      {
        id: 'arm_circles',
        name: 'Arm Circles',
        duration: 30,
        description:
          'Stand with arms extended to the sides. Make small forward circles, gradually widen; then reverse.',
        muscleGroup: 'Shoulders',
      },
      {
        id: 'leg_swings_front',
        name: 'Front-to-Back Leg Swings',
        duration: 30,
        description:
          'Hold a wall for balance. Swing one leg forward and back in a controlled arc. Switch legs halfway.',
        muscleGroup: 'Hips / Glutes',
      },
      {
        id: 'leg_swings_side',
        name: 'Lateral Leg Swings',
        duration: 30,
        description:
          'Face the wall, swing leg across the body and out to the side. Keep torso tall. Switch legs halfway.',
        muscleGroup: 'Hips / Adductors',
      },
      {
        id: 'torso_twists',
        name: 'Standing Torso Twists',
        duration: 40,
        description:
          'Feet shoulder-width, arms bent at 90°. Rotate shoulders left and right, letting hips follow slightly.',
        muscleGroup: 'Core / T-Spine',
      },
      {
        id: 'walking_knee_hugs',
        name: 'Walking Knee Hugs',
        duration: 40,
        description:
          'Step forward, pull knee to chest, alternate. Keep core engaged and stand tall between steps.',
        muscleGroup: 'Hips / Glutes',
      },
      {
        id: 'walking_quad_pull',
        name: 'Walking Quad Stretch',
        duration: 40,
        description:
          'Grab ankle behind you, knee points down, stretch quad for a second per step. Alternate legs.',
        muscleGroup: 'Quadriceps',
      },
      {
        id: 'inchworms',
        name: 'Inchworms',
        duration: 45,
        description:
          'Hinge at hips, walk hands to plank, optional push-up, walk feet toward hands. Repeat slowly.',
        muscleGroup: 'Hamstrings / Core',
      },
      {
        id: 'bodyweight_squats',
        name: 'Bodyweight Squats',
        duration: 45,
        description:
          'Feet hip-width, sit hips back and down, knees track over toes. Smooth tempo, full depth if comfortable.',
        muscleGroup: 'Legs',
      },
      {
        id: 'high_knees',
        name: 'High Knees',
        duration: 30,
        description:
          'Light jog in place, drive knees toward chest. Land softly on the balls of the feet.',
        muscleGroup: 'Hips / Cardio',
      },
      {
        id: 'shoulder_pass_through',
        name: 'Band or Towel Pass-Throughs',
        duration: 40,
        description:
          'Hold band/towel wide in front, pass overhead and behind with straight arms, then return.',
        muscleGroup: 'Shoulders / Chest',
      },
    ],
  },
  {
    key: 'cooldown',
    name: 'Post-Workout Cooldown',
    description:
      'Static stretches to lower heart rate gradually and improve flexibility after training.',
    totalMinutes: 12,
    exercises: [
      {
        id: 'hamstring_stretch_standing',
        name: 'Standing Hamstring Stretch',
        duration: 45,
        description:
          'Heel on low step or ground, hinge forward with a flat back until you feel a mild stretch. Switch legs.',
        muscleGroup: 'Hamstrings',
      },
      {
        id: 'quad_stretch_standing',
        name: 'Standing Quad Stretch',
        duration: 45,
        description:
          'Pull ankle toward glute, knees together, slight tuck of pelvis. Use wall for balance. Switch sides.',
        muscleGroup: 'Quadriceps',
      },
      {
        id: 'figure_four_stretch',
        name: 'Figure-Four Stretch',
        duration: 50,
        description:
          'Lie on back, cross ankle over opposite knee, pull thigh toward chest. Breathe deeply. Switch sides.',
        muscleGroup: 'Glutes / Piriformis',
      },
      {
        id: 'pigeon_pose',
        name: 'Pigeon Pose (Modified)',
        duration: 60,
        description:
          'Shin forward, back leg extended. Square hips, fold slightly forward if comfortable. Switch sides.',
        muscleGroup: 'Hips',
      },
      {
        id: 'seated_straddle',
        name: 'Seated Straddle Fold',
        duration: 50,
        description:
          'Sit with legs wide, hinge at hips, walk hands forward. Keep spine long; avoid forcing depth.',
        muscleGroup: 'Adductors / Hamstrings',
      },
      {
        id: 'calf_stretch_wall',
        name: 'Wall Calf Stretch',
        duration: 45,
        description:
          'Hands on wall, back leg straight, heel down. Lean until calf stretches. Repeat with knee bent for soleus.',
        muscleGroup: 'Calves',
      },
      {
        id: 'doorway_chest_stretch',
        name: 'Doorway Chest Stretch',
        duration: 45,
        description:
          'Forearm on door frame, step through until chest opens. Switch arms; try two angles (high and low).',
        muscleGroup: 'Chest / Anterior Shoulder',
      },
      {
        id: 'cross_body_shoulder',
        name: 'Cross-Body Shoulder Stretch',
        duration: 40,
        description:
          'Bring arm across chest, gently press with opposite hand. Keep shoulder down. Switch arms.',
        muscleGroup: 'Posterior Shoulder',
      },
      {
        id: 'childs_pose',
        name: "Child's Pose",
        duration: 60,
        description:
          'Knees wide or together, sit back toward heels, arms extended or at sides. Breathe into the back.',
        muscleGroup: 'Back / Lats',
      },
      {
        id: 'neck_stretch',
        name: 'Upper Trap / Neck Stretch',
        duration: 40,
        description:
          'Gently tilt ear toward shoulder; optionally add light hand pressure. Repeat both sides slowly.',
        muscleGroup: 'Neck / Upper Traps',
      },
    ],
  },
  {
    key: 'rest_day_mobility',
    name: 'Rest Day Mobility',
    description:
      'Foam rolling and controlled mobility work for recovery, posture, and joint health on non-training days.',
    totalMinutes: 15,
    exercises: [
      {
        id: 'foam_upper_back',
        name: 'Foam Roll — Upper Back',
        duration: 60,
        description:
          'Roll from mid-back to just below shoulders, hands supporting head, small extensions over the roller.',
        muscleGroup: 'Thoracic Spine',
      },
      {
        id: 'foam_lats',
        name: 'Foam Roll — Lats',
        duration: 50,
        description:
          'Lie on side, roller under armpit/ribs, slow strokes along the lat. Switch sides.',
        muscleGroup: 'Lats',
      },
      {
        id: 'foam_quads',
        name: 'Foam Roll — Quads',
        duration: 60,
        description:
          'Face down, roller under thighs from hip to just above knee. Rotate leg slightly in and out.',
        muscleGroup: 'Quadriceps',
      },
      {
        id: 'foam_it_band',
        name: 'Foam Roll — IT Band (Side)',
        duration: 50,
        description:
          'Side-lying, roller on outer thigh from hip to just above knee. Support with top leg; go slow.',
        muscleGroup: 'IT Band / Lateral Thigh',
      },
      {
        id: 'foam_calves',
        name: 'Foam Roll — Calves',
        duration: 50,
        description:
          'Sit on roller under calves, lift hips, roll ankle to toe. Cross one leg for extra pressure if needed.',
        muscleGroup: 'Calves',
      },
      {
        id: 'cat_cow',
        name: 'Cat-Cow',
        duration: 45,
        description:
          'On hands and knees, alternate rounding and arching the spine slowly with the breath.',
        muscleGroup: 'Spine',
      },
      {
        id: 'worlds_greatest_stretch',
        name: "World's Greatest Stretch",
        duration: 60,
        description:
          'Lunge with elbow to instep, rotate arm up, then straighten back leg for a hip flexor line. Switch sides.',
        muscleGroup: 'Hips / T-Spine',
      },
      {
        id: '9090_hips',
        name: '90/90 Hip Transitions',
        duration: 60,
        description:
          'Seated 90/90 legs, rotate knees side to side with control, hands behind for support if needed.',
        muscleGroup: 'Hips',
      },
      {
        id: 'ankle_mobility',
        name: 'Knee-to-Wall Ankle Mobility',
        duration: 45,
        description:
          'Toes a few inches from wall, drive knee forward without heel lifting. Switch legs; adjust distance.',
        muscleGroup: 'Ankles',
      },
      {
        id: 'breathing_wall_slides',
        name: 'Wall Slides + Breathing',
        duration: 45,
        description:
          'Back flat to wall, arms in W, slide up while keeping ribs down. Inhale low, exhale as you slide.',
        muscleGroup: 'Shoulders / Posture',
      },
    ],
  },
];
