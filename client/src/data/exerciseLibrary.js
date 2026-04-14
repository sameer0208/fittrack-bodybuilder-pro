/**
 * Extended exercise library — exercises NOT already in exercises.js.
 * Same shape as exercises.js entries so they plug directly into ExerciseCard.
 */
export const extraExercises = {
  // ═══ CHEST ═══════════════════════════════════════════════════════════════
  flat_db_press: {
    id: 'flat_db_press', name: 'Dumbbell Flat Bench Press',
    primaryMuscles: ['Chest'], secondaryMuscles: ['Front Delts', 'Triceps'],
    equipment: 'Dumbbells + Bench', category: 'compound', difficulty: 'beginner',
    sets: 4, reps: '8–12', rest: '90 sec',
    image: 'https://img.youtube.com/vi/VmB1G1K7v94/mqdefault.jpg',
    videoSearch: 'dumbbell flat bench press form', videoId: 'VmB1G1K7v94',
    instructions: ['Lie flat with a dumbbell in each hand at chest level.', 'Press upward until arms are extended.', 'Lower slowly to chest level.'],
    tips: 'Dumbbells allow a deeper stretch at the bottom than a barbell.', muscleMap: 'chest',
  },
  decline_bench_press: {
    id: 'decline_bench_press', name: 'Decline Barbell Bench Press',
    primaryMuscles: ['Lower Chest'], secondaryMuscles: ['Triceps', 'Front Delts'],
    equipment: 'Barbell + Decline Bench', category: 'compound', difficulty: 'intermediate',
    sets: 4, reps: '8–10', rest: '90–120 sec',
    image: 'https://img.youtube.com/vi/LfyQBUKR8SE/mqdefault.jpg',
    videoSearch: 'decline bench press form', videoId: 'LfyQBUKR8SE',
    instructions: ['Secure feet, lie on decline bench.', 'Unrack bar and lower to lower chest.', 'Press up explosively.'],
    tips: 'Great for lower chest definition.', muscleMap: 'chest',
  },
  pushup: {
    id: 'pushup', name: 'Push-Up',
    primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Core', 'Front Delts'],
    equipment: 'Bodyweight', category: 'compound', difficulty: 'beginner',
    sets: 3, reps: '15–25', rest: '60 sec',
    image: 'https://img.youtube.com/vi/IODxDxX7oi4/mqdefault.jpg',
    videoSearch: 'proper pushup form tutorial', videoId: 'IODxDxX7oi4',
    instructions: ['Hands shoulder-width apart on the floor.', 'Lower your body until chest nearly touches the ground.', 'Push back up to full extension.'],
    tips: 'Keep core tight and body in a straight line throughout.', muscleMap: 'chest',
  },
  pec_deck: {
    id: 'pec_deck', name: 'Pec Deck Machine Fly',
    primaryMuscles: ['Chest'], secondaryMuscles: ['Front Delts'],
    equipment: 'Pec Deck Machine', category: 'isolation', difficulty: 'beginner',
    sets: 3, reps: '12–15', rest: '60 sec',
    image: 'https://img.youtube.com/vi/Z57CtFmRMxA/mqdefault.jpg',
    videoSearch: 'pec deck machine fly form', videoId: 'Z57CtFmRMxA',
    instructions: ['Adjust seat so handles are at chest height.', 'Bring handles together in front of chest.', 'Slowly return to start.'],
    tips: 'Squeeze hard at the peak contraction for 1 second.', muscleMap: 'chest',
  },
  landmine_press: {
    id: 'landmine_press', name: 'Landmine Press',
    primaryMuscles: ['Upper Chest'], secondaryMuscles: ['Front Delts', 'Triceps', 'Core'],
    equipment: 'Barbell + Landmine', category: 'compound', difficulty: 'intermediate',
    sets: 3, reps: '10–12', rest: '90 sec',
    image: 'https://img.youtube.com/vi/Oy7FsPBFGOs/mqdefault.jpg',
    videoSearch: 'landmine press tutorial', videoId: 'Oy7FsPBFGOs',
    instructions: ['Stand facing the landmine, hold the end of the bar at chest height.', 'Press up and forward.', 'Control the descent.'],
    tips: 'Angle targets upper chest effectively with less shoulder stress.', muscleMap: 'chest',
  },

  // ═══ BACK ════════════════════════════════════════════════════════════════
  wide_grip_pullup: {
    id: 'wide_grip_pullup', name: 'Wide-Grip Pull-Up',
    primaryMuscles: ['Lats'], secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: 'Pull-Up Bar', category: 'compound', difficulty: 'intermediate',
    sets: 4, reps: '6–10', rest: '90 sec',
    image: 'https://img.youtube.com/vi/eGo4IYlbE5g/mqdefault.jpg',
    videoSearch: 'wide grip pullup form', videoId: 'eGo4IYlbE5g',
    instructions: ['Grip bar wider than shoulder width.', 'Pull up until chin clears bar.', 'Lower with control.'],
    tips: 'Focus on pulling elbows down, not hands up.', muscleMap: 'back',
  },
  chinup: {
    id: 'chinup', name: 'Chin-Up',
    primaryMuscles: ['Lats', 'Biceps'], secondaryMuscles: ['Core'],
    equipment: 'Pull-Up Bar', category: 'compound', difficulty: 'intermediate',
    sets: 4, reps: '6–10', rest: '90 sec',
    image: 'https://img.youtube.com/vi/brhRXlOhsAM/mqdefault.jpg',
    videoSearch: 'chin up proper form', videoId: 'brhRXlOhsAM',
    instructions: ['Grip bar underhand, shoulder width.', 'Pull yourself up until chin clears bar.', 'Lower slowly.'],
    tips: 'Great for building both back and biceps simultaneously.', muscleMap: 'back',
  },
  pendlay_row: {
    id: 'pendlay_row', name: 'Pendlay Row',
    primaryMuscles: ['Mid-Back', 'Lats'], secondaryMuscles: ['Biceps', 'Lower Back'],
    equipment: 'Barbell', category: 'compound', difficulty: 'advanced',
    sets: 4, reps: '5–8', rest: '120 sec',
    image: 'https://img.youtube.com/vi/ZlRrIsoDpKg/mqdefault.jpg',
    videoSearch: 'pendlay row form', videoId: 'ZlRrIsoDpKg',
    instructions: ['Bar starts on the floor each rep.', 'Hinge at hips, pull bar explosively to lower chest.', 'Lower bar to floor.'],
    tips: 'Reset on the floor each rep — no momentum.', muscleMap: 'back',
  },
  meadows_row: {
    id: 'meadows_row', name: 'Meadows Row',
    primaryMuscles: ['Lats'], secondaryMuscles: ['Rear Delts', 'Biceps'],
    equipment: 'Barbell + Landmine', category: 'compound', difficulty: 'intermediate',
    sets: 3, reps: '10–12', rest: '60 sec',
    image: 'https://img.youtube.com/vi/uLJowSx_3B4/mqdefault.jpg',
    videoSearch: 'meadows row form', videoId: 'uLJowSx_3B4',
    instructions: ['Stand perpendicular to the landmine.', 'Overhand grip on the end of the barbell.', 'Row upward and slightly back.'],
    tips: 'A John Meadows classic — amazing lat stretch at the bottom.', muscleMap: 'back',
  },
  cable_pullover: {
    id: 'cable_pullover', name: 'Cable Pullover',
    primaryMuscles: ['Lats'], secondaryMuscles: ['Chest', 'Core'],
    equipment: 'Cable Machine', category: 'isolation', difficulty: 'beginner',
    sets: 3, reps: '12–15', rest: '60 sec',
    image: 'https://img.youtube.com/vi/OGKjByTO8_Y/mqdefault.jpg',
    videoSearch: 'cable pullover for lats', videoId: 'OGKjByTO8_Y',
    instructions: ['Set cable high, use rope or straight bar.', 'Arms slightly bent, pull down in an arc to thighs.', 'Return slowly.'],
    tips: 'Great isolation move that targets lats without bicep involvement.', muscleMap: 'back',
  },
  chest_supported_row: {
    id: 'chest_supported_row', name: 'Chest-Supported Dumbbell Row',
    primaryMuscles: ['Mid-Back'], secondaryMuscles: ['Rear Delts', 'Biceps'],
    equipment: 'Dumbbells + Incline Bench', category: 'compound', difficulty: 'beginner',
    sets: 3, reps: '10–12', rest: '60 sec',
    image: 'https://img.youtube.com/vi/H3gGWfMotms/mqdefault.jpg',
    videoSearch: 'chest supported dumbbell row', videoId: 'H3gGWfMotms',
    instructions: ['Lie chest-down on an incline bench.', 'Row dumbbells up, squeezing shoulder blades.', 'Lower with control.'],
    tips: 'Eliminates lower back fatigue so you can focus purely on mid-back.', muscleMap: 'back',
  },

  // ═══ SHOULDERS ═══════════════════════════════════════════════════════════
  military_press: {
    id: 'military_press', name: 'Standing Military Press',
    primaryMuscles: ['Shoulders'], secondaryMuscles: ['Triceps', 'Core'],
    equipment: 'Barbell', category: 'compound', difficulty: 'intermediate',
    sets: 4, reps: '6–8', rest: '120 sec',
    image: 'https://img.youtube.com/vi/_RlRDWO2jfg/mqdefault.jpg',
    videoSearch: 'standing military press form', videoId: '_RlRDWO2jfg',
    instructions: ['Stand with bar at shoulder height.', 'Press overhead to lockout.', 'Lower to chin level.'],
    tips: 'Brace your core and squeeze your glutes for stability.', muscleMap: 'shoulders',
  },
  rear_delt_fly: {
    id: 'rear_delt_fly', name: 'Rear Delt Dumbbell Fly',
    primaryMuscles: ['Rear Delts'], secondaryMuscles: ['Mid-Back'],
    equipment: 'Dumbbells', category: 'isolation', difficulty: 'beginner',
    sets: 3, reps: '12–15', rest: '60 sec',
    image: 'https://img.youtube.com/vi/EA7u4Q_8HQ0/mqdefault.jpg',
    videoSearch: 'rear delt fly dumbbell form', videoId: 'EA7u4Q_8HQ0',
    instructions: ['Bend at the hips, arms hanging down.', 'Raise dumbbells out to sides.', 'Lower slowly.'],
    tips: 'Use light weight — rear delts respond better to high reps.', muscleMap: 'shoulders',
  },
  upright_row: {
    id: 'upright_row', name: 'Upright Row',
    primaryMuscles: ['Side Delts', 'Traps'], secondaryMuscles: ['Biceps'],
    equipment: 'Barbell or Dumbbells', category: 'compound', difficulty: 'intermediate',
    sets: 3, reps: '10–12', rest: '60 sec',
    image: 'https://img.youtube.com/vi/amCU-ziHITM/mqdefault.jpg',
    videoSearch: 'upright row safe form', videoId: 'amCU-ziHITM',
    instructions: ['Hold bar with narrow grip.', 'Pull up along your body to chin height.', 'Lower with control.'],
    tips: 'Wide grip variation is safer for shoulder impingement.', muscleMap: 'shoulders',
  },
  machine_shoulder_press: {
    id: 'machine_shoulder_press', name: 'Machine Shoulder Press',
    primaryMuscles: ['Shoulders'], secondaryMuscles: ['Triceps'],
    equipment: 'Shoulder Press Machine', category: 'compound', difficulty: 'beginner',
    sets: 3, reps: '10–12', rest: '90 sec',
    image: 'https://img.youtube.com/vi/Wol0JhPNnNM/mqdefault.jpg',
    videoSearch: 'machine shoulder press form', videoId: 'Wol0JhPNnNM',
    instructions: ['Adjust seat height.', 'Press handles overhead.', 'Lower to starting position.'],
    tips: 'Machines are great for isolating shoulders without stabilizer fatigue.', muscleMap: 'shoulders',
  },
  cable_front_raise: {
    id: 'cable_front_raise', name: 'Cable Front Raise',
    primaryMuscles: ['Front Delts'], secondaryMuscles: ['Side Delts'],
    equipment: 'Cable Machine', category: 'isolation', difficulty: 'beginner',
    sets: 3, reps: '12–15', rest: '60 sec',
    image: 'https://img.youtube.com/vi/sOPKUhmRHbs/mqdefault.jpg',
    videoSearch: 'cable front raise', videoId: 'sOPKUhmRHbs',
    instructions: ['Stand facing away from low cable.', 'Raise handle forward to eye level.', 'Lower slowly.'],
    tips: 'Constant tension from cable makes this superior to dumbbell version.', muscleMap: 'shoulders',
  },

  // ═══ BICEPS ══════════════════════════════════════════════════════════════
  ez_bar_curl: {
    id: 'ez_bar_curl', name: 'EZ-Bar Curl',
    primaryMuscles: ['Biceps'], secondaryMuscles: ['Forearms'],
    equipment: 'EZ-Bar', category: 'isolation', difficulty: 'beginner',
    sets: 3, reps: '10–12', rest: '60 sec',
    image: 'https://img.youtube.com/vi/zG2xJ0Q5QtI/mqdefault.jpg',
    videoSearch: 'ez bar curl form', videoId: 'zG2xJ0Q5QtI',
    instructions: ['Grip EZ-bar on inner angles.', 'Curl up to shoulder height.', 'Lower slowly.'],
    tips: 'Angled grip reduces wrist strain vs straight barbell.', muscleMap: 'biceps',
  },
  spider_curl: {
    id: 'spider_curl', name: 'Spider Curl',
    primaryMuscles: ['Biceps (Short Head)'], secondaryMuscles: ['Brachialis'],
    equipment: 'Dumbbells + Incline Bench', category: 'isolation', difficulty: 'intermediate',
    sets: 3, reps: '10–12', rest: '60 sec',
    image: 'https://img.youtube.com/vi/Wq0oyRyua_I/mqdefault.jpg',
    videoSearch: 'spider curl form tutorial', videoId: 'Wq0oyRyua_I',
    instructions: ['Lie chest-down on incline bench.', 'Curl dumbbells with arms hanging straight down.', 'Squeeze at top.'],
    tips: 'Eliminates all cheating — pure bicep isolation.', muscleMap: 'biceps',
  },
  bayesian_curl: {
    id: 'bayesian_curl', name: 'Bayesian Cable Curl',
    primaryMuscles: ['Biceps (Long Head)'], secondaryMuscles: [],
    equipment: 'Cable Machine', category: 'isolation', difficulty: 'intermediate',
    sets: 3, reps: '10–12', rest: '60 sec',
    image: 'https://img.youtube.com/vi/KVVCx2MHp1k/mqdefault.jpg',
    videoSearch: 'bayesian cable curl', videoId: 'KVVCx2MHp1k',
    instructions: ['Stand facing away from low cable.', 'Arm behind body, curl forward.', 'Squeeze at top.'],
    tips: 'One of the best exercises for the long head of the bicep.', muscleMap: 'biceps',
  },
  drag_curl: {
    id: 'drag_curl', name: 'Barbell Drag Curl',
    primaryMuscles: ['Biceps'], secondaryMuscles: ['Brachialis'],
    equipment: 'Barbell', category: 'isolation', difficulty: 'intermediate',
    sets: 3, reps: '10–12', rest: '60 sec',
    image: 'https://img.youtube.com/vi/nJEvQnD9jN0/mqdefault.jpg',
    videoSearch: 'barbell drag curl form', videoId: 'nJEvQnD9jN0',
    instructions: ['Hold barbell, curl by dragging it up your torso.', 'Elbows go behind the body.', 'Lower same path.'],
    tips: 'Targets the long head more than standard curls.', muscleMap: 'biceps',
  },

  // ═══ TRICEPS ═════════════════════════════════════════════════════════════
  diamond_pushup: {
    id: 'diamond_pushup', name: 'Diamond Push-Up',
    primaryMuscles: ['Triceps'], secondaryMuscles: ['Chest', 'Core'],
    equipment: 'Bodyweight', category: 'compound', difficulty: 'intermediate',
    sets: 3, reps: '10–15', rest: '60 sec',
    image: 'https://img.youtube.com/vi/J0DnG1_S92I/mqdefault.jpg',
    videoSearch: 'diamond pushup form', videoId: 'J0DnG1_S92I',
    instructions: ['Hands together under chest forming a diamond.', 'Lower chest to hands.', 'Push back up.'],
    tips: 'One of the most effective bodyweight tricep exercises according to EMG studies.', muscleMap: 'triceps',
  },
  french_press: {
    id: 'french_press', name: 'French Press (EZ-Bar)',
    primaryMuscles: ['Triceps (Long Head)'], secondaryMuscles: [],
    equipment: 'EZ-Bar + Bench', category: 'isolation', difficulty: 'intermediate',
    sets: 3, reps: '10–12', rest: '60 sec',
    image: 'https://img.youtube.com/vi/AwPWCzr16CE/mqdefault.jpg',
    videoSearch: 'french press tricep form', videoId: 'AwPWCzr16CE',
    instructions: ['Lie on bench, hold EZ-bar overhead.', 'Lower behind the head keeping upper arms still.', 'Extend back up.'],
    tips: 'Going behind the head gives a deeper long head stretch than skull crushers.', muscleMap: 'triceps',
  },
  tricep_kickback: {
    id: 'tricep_kickback', name: 'Dumbbell Tricep Kickback',
    primaryMuscles: ['Triceps (Lateral Head)'], secondaryMuscles: [],
    equipment: 'Dumbbells', category: 'isolation', difficulty: 'beginner',
    sets: 3, reps: '12–15', rest: '60 sec',
    image: 'https://img.youtube.com/vi/6SS6K3lAwZ8/mqdefault.jpg',
    videoSearch: 'tricep kickback form', videoId: '6SS6K3lAwZ8',
    instructions: ['Hinge at hips, upper arm parallel to floor.', 'Extend forearm back to lockout.', 'Lower slowly.'],
    tips: 'Squeeze for a full second at peak contraction.', muscleMap: 'triceps',
  },
  cable_overhead_ext: {
    id: 'cable_overhead_ext', name: 'Cable Overhead Tricep Extension',
    primaryMuscles: ['Triceps (Long Head)'], secondaryMuscles: [],
    equipment: 'Cable Machine + Rope', category: 'isolation', difficulty: 'beginner',
    sets: 3, reps: '12–15', rest: '60 sec',
    image: 'https://img.youtube.com/vi/bFj-FhPVIWA/mqdefault.jpg',
    videoSearch: 'cable overhead tricep extension', videoId: 'bFj-FhPVIWA',
    instructions: ['Face away from cable, rope behind head.', 'Extend arms forward and up.', 'Return slowly.'],
    tips: 'The overhead position gives maximum long head stretch.', muscleMap: 'triceps',
  },

  // ═══ QUADS ═══════════════════════════════════════════════════════════════
  goblet_squat: {
    id: 'goblet_squat', name: 'Goblet Squat',
    primaryMuscles: ['Quads'], secondaryMuscles: ['Glutes', 'Core'],
    equipment: 'Dumbbell or Kettlebell', category: 'compound', difficulty: 'beginner',
    sets: 3, reps: '12–15', rest: '60 sec',
    image: 'https://img.youtube.com/vi/MeIiIdhvXT4/mqdefault.jpg',
    videoSearch: 'goblet squat form', videoId: 'MeIiIdhvXT4',
    instructions: ['Hold dumbbell at chest.', 'Squat down keeping torso upright.', 'Drive through heels to stand.'],
    tips: 'Perfect for learning squat mechanics before loading a barbell.', muscleMap: 'quads',
  },
  sissy_squat: {
    id: 'sissy_squat', name: 'Sissy Squat',
    primaryMuscles: ['Quads (Isolation)'], secondaryMuscles: ['Core'],
    equipment: 'Bodyweight', category: 'isolation', difficulty: 'advanced',
    sets: 3, reps: '10–15', rest: '60 sec',
    image: 'https://img.youtube.com/vi/Bqj_MMdTjWk/mqdefault.jpg',
    videoSearch: 'sissy squat form tutorial', videoId: 'Bqj_MMdTjWk',
    instructions: ['Hold a post for balance.', 'Lean back and bend knees, keeping hips extended.', 'Rise back up.'],
    tips: 'Extreme quad isolation — start with bodyweight only.', muscleMap: 'quads',
  },
  smith_squat: {
    id: 'smith_squat', name: 'Smith Machine Squat',
    primaryMuscles: ['Quads'], secondaryMuscles: ['Glutes', 'Hamstrings'],
    equipment: 'Smith Machine', category: 'compound', difficulty: 'beginner',
    sets: 4, reps: '8–12', rest: '90 sec',
    image: 'https://img.youtube.com/vi/IfAko1gzewA/mqdefault.jpg',
    videoSearch: 'smith machine squat form', videoId: 'IfAko1gzewA',
    instructions: ['Position bar on upper traps.', 'Feet slightly forward.', 'Squat to parallel or below.'],
    tips: 'Feet forward shifts emphasis to quads.', muscleMap: 'quads',
  },
  step_up: {
    id: 'step_up', name: 'Dumbbell Step-Up',
    primaryMuscles: ['Quads'], secondaryMuscles: ['Glutes', 'Hamstrings'],
    equipment: 'Dumbbells + Box', category: 'compound', difficulty: 'beginner',
    sets: 3, reps: '10–12 each leg', rest: '60 sec',
    image: 'https://img.youtube.com/vi/dQqApCGd5Ag/mqdefault.jpg',
    videoSearch: 'dumbbell step up form', videoId: 'dQqApCGd5Ag',
    instructions: ['Hold dumbbells at sides.', 'Step up onto box with one leg.', 'Drive through heel, bring other foot up.'],
    tips: 'Use a high enough box so your thigh reaches parallel.', muscleMap: 'quads',
  },

  // ═══ HAMSTRINGS & GLUTES ═════════════════════════════════════════════════
  stiff_leg_deadlift: {
    id: 'stiff_leg_deadlift', name: 'Stiff-Leg Deadlift',
    primaryMuscles: ['Hamstrings'], secondaryMuscles: ['Glutes', 'Lower Back'],
    equipment: 'Barbell', category: 'compound', difficulty: 'intermediate',
    sets: 4, reps: '8–10', rest: '90 sec',
    image: 'https://img.youtube.com/vi/CN_7cz3P-1U/mqdefault.jpg',
    videoSearch: 'stiff leg deadlift form', videoId: 'CN_7cz3P-1U',
    instructions: ['Hold barbell, legs nearly straight.', 'Hinge at hips, lower bar along legs.', 'Return to standing.'],
    tips: 'Keep a slight knee bend to protect the joints.', muscleMap: 'hamstrings',
  },
  glute_bridge: {
    id: 'glute_bridge', name: 'Barbell Glute Bridge',
    primaryMuscles: ['Glutes'], secondaryMuscles: ['Hamstrings'],
    equipment: 'Barbell', category: 'compound', difficulty: 'beginner',
    sets: 4, reps: '10–12', rest: '90 sec',
    image: 'https://img.youtube.com/vi/OUgsJ8-Vi0E/mqdefault.jpg',
    videoSearch: 'barbell glute bridge form', videoId: 'OUgsJ8-Vi0E',
    instructions: ['Sit on floor, barbell over hips.', 'Drive hips up squeezing glutes.', 'Lower with control.'],
    tips: 'Hold the top position for 2 seconds for maximum activation.', muscleMap: 'glutes',
  },
  cable_pull_through: {
    id: 'cable_pull_through', name: 'Cable Pull-Through',
    primaryMuscles: ['Glutes'], secondaryMuscles: ['Hamstrings'],
    equipment: 'Cable Machine + Rope', category: 'compound', difficulty: 'beginner',
    sets: 3, reps: '12–15', rest: '60 sec',
    image: 'https://img.youtube.com/vi/MBcke0S9Z5I/mqdefault.jpg',
    videoSearch: 'cable pull through form', videoId: 'MBcke0S9Z5I',
    instructions: ['Face away from cable, rope between legs.', 'Hinge at hips, let weight pull you back.', 'Drive hips forward to stand.'],
    tips: 'Great hip hinge learning tool before heavy deadlifts.', muscleMap: 'glutes',
  },
  reverse_lunge: {
    id: 'reverse_lunge', name: 'Reverse Lunge',
    primaryMuscles: ['Glutes', 'Quads'], secondaryMuscles: ['Hamstrings', 'Core'],
    equipment: 'Dumbbells', category: 'compound', difficulty: 'beginner',
    sets: 3, reps: '10–12 each leg', rest: '60 sec',
    image: 'https://img.youtube.com/vi/xrPteyQLGAo/mqdefault.jpg',
    videoSearch: 'reverse lunge form', videoId: 'xrPteyQLGAo',
    instructions: ['Step backward into a lunge.', 'Lower until back knee nearly touches ground.', 'Push through front foot to return.'],
    tips: 'Easier on knees than forward lunges and more glute activation.', muscleMap: 'glutes',
  },
  good_morning: {
    id: 'good_morning', name: 'Good Morning',
    primaryMuscles: ['Hamstrings', 'Lower Back'], secondaryMuscles: ['Glutes'],
    equipment: 'Barbell', category: 'compound', difficulty: 'intermediate',
    sets: 3, reps: '10–12', rest: '90 sec',
    image: 'https://img.youtube.com/vi/vKPGe8zb2S4/mqdefault.jpg',
    videoSearch: 'barbell good morning form', videoId: 'vKPGe8zb2S4',
    instructions: ['Bar on upper back.', 'Hinge at hips, lowering torso.', 'Return to upright.'],
    tips: 'Start light — this exercise demands good hamstring flexibility.', muscleMap: 'hamstrings',
  },

  // ═══ CALVES ══════════════════════════════════════════════════════════════
  smith_calf_raise: {
    id: 'smith_calf_raise', name: 'Smith Machine Calf Raise',
    primaryMuscles: ['Calves'], secondaryMuscles: [],
    equipment: 'Smith Machine + Block', category: 'isolation', difficulty: 'beginner',
    sets: 4, reps: '12–15', rest: '45 sec',
    image: 'https://img.youtube.com/vi/hh5x5HMfB_o/mqdefault.jpg',
    videoSearch: 'smith machine calf raise', videoId: 'hh5x5HMfB_o',
    instructions: ['Stand on a block under the Smith bar.', 'Rise onto toes.', 'Lower heels below the block for full stretch.'],
    tips: 'Pause at bottom for a deep stretch and top for a hard squeeze.', muscleMap: 'calves',
  },
  single_leg_calf_raise: {
    id: 'single_leg_calf_raise', name: 'Single-Leg Calf Raise',
    primaryMuscles: ['Calves'], secondaryMuscles: ['Balance'],
    equipment: 'Bodyweight + Step', category: 'isolation', difficulty: 'beginner',
    sets: 3, reps: '15–20 each leg', rest: '30 sec',
    image: 'https://img.youtube.com/vi/OOR7OhSFkMs/mqdefault.jpg',
    videoSearch: 'single leg calf raise', videoId: 'OOR7OhSFkMs',
    instructions: ['Stand on edge of step on one foot.', 'Rise up onto toes.', 'Lower heel below step level.'],
    tips: 'Unilateral work fixes calf imbalances.', muscleMap: 'calves',
  },

  // ═══ CORE ════════════════════════════════════════════════════════════════
  hanging_leg_raise: {
    id: 'hanging_leg_raise', name: 'Hanging Leg Raise',
    primaryMuscles: ['Abs'], secondaryMuscles: ['Hip Flexors'],
    equipment: 'Pull-Up Bar', category: 'isolation', difficulty: 'intermediate',
    sets: 3, reps: '10–15', rest: '60 sec',
    image: 'https://img.youtube.com/vi/Pr1ieGZ5aFM/mqdefault.jpg',
    videoSearch: 'hanging leg raise form', videoId: 'Pr1ieGZ5aFM',
    instructions: ['Hang from a bar.', 'Raise legs to 90 degrees.', 'Lower slowly.'],
    tips: 'Curl your pelvis up at the top for maximum ab activation.', muscleMap: 'core',
  },
  ab_wheel_rollout: {
    id: 'ab_wheel_rollout', name: 'Ab Wheel Rollout',
    primaryMuscles: ['Abs', 'Core'], secondaryMuscles: ['Shoulders', 'Lats'],
    equipment: 'Ab Wheel', category: 'compound', difficulty: 'intermediate',
    sets: 3, reps: '8–12', rest: '60 sec',
    image: 'https://img.youtube.com/vi/rqiTPVjIOCE/mqdefault.jpg',
    videoSearch: 'ab wheel rollout form', videoId: 'rqiTPVjIOCE',
    instructions: ['Kneel with hands on wheel.', 'Roll forward extending body.', 'Roll back using abs.'],
    tips: 'Start from knees. Progress to standing rollouts over time.', muscleMap: 'core',
  },
  woodchop: {
    id: 'woodchop', name: 'Cable Woodchop',
    primaryMuscles: ['Obliques'], secondaryMuscles: ['Core', 'Shoulders'],
    equipment: 'Cable Machine', category: 'compound', difficulty: 'beginner',
    sets: 3, reps: '12–15 each side', rest: '60 sec',
    image: 'https://img.youtube.com/vi/pAplQXk3dkU/mqdefault.jpg',
    videoSearch: 'cable woodchop form', videoId: 'pAplQXk3dkU',
    instructions: ['Set cable high.', 'Pull diagonally across body from high to low.', 'Control the return.'],
    tips: 'Rotate through the thoracic spine, not the lumbar.', muscleMap: 'core',
  },
  pallof_press: {
    id: 'pallof_press', name: 'Pallof Press',
    primaryMuscles: ['Core'], secondaryMuscles: ['Obliques'],
    equipment: 'Cable Machine', category: 'isolation', difficulty: 'beginner',
    sets: 3, reps: '10–12 each side', rest: '45 sec',
    image: 'https://img.youtube.com/vi/AH_QZLm_0-s/mqdefault.jpg',
    videoSearch: 'pallof press form', videoId: 'AH_QZLm_0-s',
    instructions: ['Stand side-on to cable.', 'Press handle straight out from chest.', 'Resist rotation and bring back.'],
    tips: 'The king of anti-rotation core exercises.', muscleMap: 'core',
  },
  dead_bug: {
    id: 'dead_bug', name: 'Dead Bug',
    primaryMuscles: ['Core'], secondaryMuscles: ['Hip Flexors'],
    equipment: 'Bodyweight', category: 'isolation', difficulty: 'beginner',
    sets: 3, reps: '10 each side', rest: '45 sec',
    image: 'https://img.youtube.com/vi/I5xbsA71vdo/mqdefault.jpg',
    videoSearch: 'dead bug exercise form', videoId: 'I5xbsA71vdo',
    instructions: ['Lie on back, arms up, knees at 90°.', 'Extend opposite arm and leg.', 'Return and switch sides.'],
    tips: 'Press your lower back flat into the floor throughout.', muscleMap: 'core',
  },

  // ═══ TRAPS ═══════════════════════════════════════════════════════════════
  db_shrug: {
    id: 'db_shrug', name: 'Dumbbell Shrug',
    primaryMuscles: ['Traps'], secondaryMuscles: ['Neck'],
    equipment: 'Dumbbells', category: 'isolation', difficulty: 'beginner',
    sets: 4, reps: '12–15', rest: '60 sec',
    image: 'https://img.youtube.com/vi/cJRVVxmytaM/mqdefault.jpg',
    videoSearch: 'dumbbell shrug form', videoId: 'cJRVVxmytaM',
    instructions: ['Hold dumbbells at sides.', 'Shrug shoulders straight up toward ears.', 'Hold briefly, then lower.'],
    tips: 'Dumbbells allow a more natural range of motion than barbell.', muscleMap: 'traps',
  },
  farmers_walk: {
    id: 'farmers_walk', name: "Farmer's Walk",
    primaryMuscles: ['Traps', 'Forearms'], secondaryMuscles: ['Core', 'Shoulders'],
    equipment: 'Dumbbells or Kettlebells', category: 'compound', difficulty: 'beginner',
    sets: 3, reps: '40–60 sec walk', rest: '90 sec',
    image: 'https://img.youtube.com/vi/Fkzk_RqlYig/mqdefault.jpg',
    videoSearch: 'farmers walk form', videoId: 'Fkzk_RqlYig',
    instructions: ['Hold heavy weights at sides.', 'Walk with upright posture.', 'Maintain tight core.'],
    tips: 'Full-body builder and grip strength king.', muscleMap: 'traps',
  },

  // ═══ FOREARMS ════════════════════════════════════════════════════════════
  wrist_curl: {
    id: 'wrist_curl', name: 'Wrist Curl',
    primaryMuscles: ['Forearms'], secondaryMuscles: [],
    equipment: 'Barbell or Dumbbells', category: 'isolation', difficulty: 'beginner',
    sets: 3, reps: '15–20', rest: '45 sec',
    image: 'https://img.youtube.com/vi/L3M8X-u0pTQ/mqdefault.jpg',
    videoSearch: 'wrist curl form', videoId: 'L3M8X-u0pTQ',
    instructions: ['Rest forearms on thighs, palms up.', 'Curl the weight up with wrists only.', 'Lower slowly.'],
    tips: 'Let the bar roll to fingertips at the bottom for extra ROM.', muscleMap: 'forearms',
  },
  reverse_curl: {
    id: 'reverse_curl', name: 'Reverse Barbell Curl',
    primaryMuscles: ['Brachioradialis', 'Forearms'], secondaryMuscles: ['Biceps'],
    equipment: 'Barbell', category: 'isolation', difficulty: 'beginner',
    sets: 3, reps: '10–12', rest: '60 sec',
    image: 'https://img.youtube.com/vi/nRgxYX2Ve9w/mqdefault.jpg',
    videoSearch: 'reverse barbell curl form', videoId: 'nRgxYX2Ve9w',
    instructions: ['Hold barbell overhand grip.', 'Curl up keeping palms facing down.', 'Lower slowly.'],
    tips: 'Builds forearm size and improves grip strength.', muscleMap: 'forearms',
  },

  // ═══ FULL BODY / COMPOUND ════════════════════════════════════════════════
  clean_and_press: {
    id: 'clean_and_press', name: 'Clean and Press',
    primaryMuscles: ['Shoulders', 'Quads'], secondaryMuscles: ['Glutes', 'Traps', 'Core'],
    equipment: 'Barbell', category: 'compound', difficulty: 'advanced',
    sets: 4, reps: '5–6', rest: '120–180 sec',
    image: 'https://img.youtube.com/vi/U0K1apMTq2g/mqdefault.jpg',
    videoSearch: 'clean and press barbell form', videoId: 'U0K1apMTq2g',
    instructions: ['Clean barbell to shoulders.', 'Press overhead.', 'Lower to shoulders then floor.'],
    tips: 'Full-body power movement — start with light weight to nail form.', muscleMap: 'shoulders',
  },
  thruster: {
    id: 'thruster', name: 'Barbell Thruster',
    primaryMuscles: ['Quads', 'Shoulders'], secondaryMuscles: ['Glutes', 'Core', 'Triceps'],
    equipment: 'Barbell', category: 'compound', difficulty: 'intermediate',
    sets: 3, reps: '8–12', rest: '90 sec',
    image: 'https://img.youtube.com/vi/L219ltL15zk/mqdefault.jpg',
    videoSearch: 'barbell thruster form', videoId: 'L219ltL15zk',
    instructions: ['Front squat the bar down.', 'Drive up explosively and press overhead.', 'Lower and repeat.'],
    tips: 'Use the leg drive to power through the press — it should be one smooth motion.', muscleMap: 'quads',
  },
  burpee: {
    id: 'burpee', name: 'Burpee',
    primaryMuscles: ['Full Body (Explosive)'], secondaryMuscles: ['Cardiovascular System'],
    equipment: 'Bodyweight', category: 'cardio', difficulty: 'beginner',
    sets: 3, reps: '10–15', rest: '60 sec',
    image: 'https://img.youtube.com/vi/TU8QYVW0gDU/mqdefault.jpg',
    videoSearch: 'burpee proper form', videoId: 'TU8QYVW0gDU',
    instructions: ['Drop into a squat.', 'Kick feet back into push-up position.', 'Jump up explosively.'],
    tips: 'For more intensity, add a push-up at the bottom.', muscleMap: 'full_body',
  },
  kettlebell_swing: {
    id: 'kettlebell_swing', name: 'Kettlebell Swing',
    primaryMuscles: ['Glutes', 'Hamstrings'], secondaryMuscles: ['Core', 'Shoulders'],
    equipment: 'Kettlebell', category: 'compound', difficulty: 'beginner',
    sets: 3, reps: '15–20', rest: '60 sec',
    image: 'https://img.youtube.com/vi/YSxHifyI6s8/mqdefault.jpg',
    videoSearch: 'kettlebell swing form', videoId: 'YSxHifyI6s8',
    instructions: ['Hinge at hips with kettlebell between legs.', 'Drive hips forward to swing kettlebell to chest height.', 'Let it fall back through legs.'],
    tips: 'Power comes from the hips, not the arms.', muscleMap: 'glutes',
  },
  battle_rope: {
    id: 'battle_rope', name: 'Battle Rope Waves',
    primaryMuscles: ['Shoulders', 'Core'], secondaryMuscles: ['Cardiovascular System'],
    equipment: 'Battle Ropes', category: 'cardio', difficulty: 'beginner',
    sets: 3, reps: '30 sec', rest: '30 sec',
    image: 'https://img.youtube.com/vi/sP_wlbPngiE/mqdefault.jpg',
    videoSearch: 'battle rope waves tutorial', videoId: 'sP_wlbPngiE',
    instructions: ['Hold one end in each hand.', 'Alternating arms, create waves.', 'Maintain a slight squat.'],
    tips: 'Keep your core tight and breathe rhythmically.', muscleMap: 'shoulders',
  },
  box_jump: {
    id: 'box_jump', name: 'Box Jump',
    primaryMuscles: ['Quads', 'Glutes'], secondaryMuscles: ['Calves', 'Core'],
    equipment: 'Plyo Box', category: 'compound', difficulty: 'intermediate',
    sets: 3, reps: '8–10', rest: '90 sec',
    image: 'https://img.youtube.com/vi/52r_Ul5k03g/mqdefault.jpg',
    videoSearch: 'box jump form', videoId: '52r_Ul5k03g',
    instructions: ['Stand facing box.', 'Swing arms and jump onto box.', 'Stand fully, step back down.'],
    tips: 'Always step down (not jump) to protect your Achilles tendons.', muscleMap: 'quads',
  },

  // ═══ MOBILITY / STRETCHING ═══════════════════════════════════════════════
  pigeon_stretch: {
    id: 'pigeon_stretch', name: 'Pigeon Stretch',
    primaryMuscles: ['Hip Flexors', 'Glutes'], secondaryMuscles: [],
    equipment: 'Bodyweight', category: 'mobility', difficulty: 'beginner',
    sets: 2, reps: '30–60 sec each side', rest: '15 sec',
    image: 'https://img.youtube.com/vi/Zl5lpSBaCjM/mqdefault.jpg',
    videoSearch: 'pigeon stretch form', videoId: 'Zl5lpSBaCjM',
    instructions: ['From all fours, bring one knee forward.', 'Extend the other leg behind you.', 'Sink hips down and hold.'],
    tips: 'One of the best hip openers for lifters.', muscleMap: 'hips',
  },
  cat_cow: {
    id: 'cat_cow', name: 'Cat-Cow Stretch',
    primaryMuscles: ['Lower Back', 'Core'], secondaryMuscles: ['Neck'],
    equipment: 'Bodyweight', category: 'mobility', difficulty: 'beginner',
    sets: 2, reps: '10 cycles', rest: '15 sec',
    image: 'https://img.youtube.com/vi/kqnua4rHVVA/mqdefault.jpg',
    videoSearch: 'cat cow stretch', videoId: 'kqnua4rHVVA',
    instructions: ['On all fours, arch back upward (cat).', 'Then drop belly toward floor (cow).', 'Move slowly with breathing.'],
    tips: 'Perfect warm-up for the spine before any workout.', muscleMap: 'back',
  },
  band_pull_apart: {
    id: 'band_pull_apart', name: 'Band Pull-Apart',
    primaryMuscles: ['Rear Delts', 'Mid-Back'], secondaryMuscles: ['Rotator Cuff'],
    equipment: 'Resistance Band', category: 'mobility', difficulty: 'beginner',
    sets: 3, reps: '15–20', rest: '30 sec',
    image: 'https://img.youtube.com/vi/iEVMGSMxbJo/mqdefault.jpg',
    videoSearch: 'band pull apart form', videoId: 'iEVMGSMxbJo',
    instructions: ['Hold band at shoulder width.', 'Pull apart until band touches chest.', 'Return slowly.'],
    tips: 'Essential for shoulder health — do these every training day.', muscleMap: 'shoulders',
  },
};

/**
 * Merge base exercises + library into a single lookup.
 */
export function buildFullExerciseDb(baseExercises) {
  return { ...baseExercises, ...extraExercises };
}

/**
 * Grouped list for the exercise picker UI.
 */
export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quads', 'Hamstrings', 'Glutes', 'Calves',
  'Core', 'Traps', 'Forearms', 'Full Body', 'Mobility',
];

export function getExercisesByMuscleGroup(allExercises) {
  const grouped = {};
  MUSCLE_GROUPS.forEach((g) => { grouped[g] = []; });

  Object.values(allExercises).forEach((ex) => {
    const primary = (ex.primaryMuscles || []).join(' ').toLowerCase();
    let placed = false;

    for (const group of MUSCLE_GROUPS) {
      const gl = group.toLowerCase();
      if (primary.includes(gl) || (ex.muscleMap || '').toLowerCase().includes(gl)) {
        grouped[group].push(ex);
        placed = true;
        break;
      }
    }

    if (!placed) {
      if (primary.includes('lat') || primary.includes('mid-back') || primary.includes('erector')) grouped['Back'].push(ex);
      else if (primary.includes('delt') || primary.includes('rotator')) grouped['Shoulders'].push(ex);
      else if (primary.includes('brachialis') || primary.includes('brachioradialis')) grouped['Forearms'].push(ex);
      else if (primary.includes('hip flexor') || primary.includes('recovery') || primary.includes('flexibility') || ex.category === 'mobility') grouped['Mobility'].push(ex);
      else if (primary.includes('oblique') || primary.includes('abs')) grouped['Core'].push(ex);
      else if (primary.includes('full body') || primary.includes('cardio')) grouped['Full Body'].push(ex);
      else grouped['Full Body'].push(ex);
    }
  });

  return grouped;
}
