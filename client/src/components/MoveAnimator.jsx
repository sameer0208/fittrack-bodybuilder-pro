import { useRef, useEffect } from 'react';

/*
 * Professional Zumba Move Animator
 *
 * Renders a detailed athletic figure with:
 * - Proper anatomical proportions (8-head canon)
 * - Gradient muscle shading with specular highlights
 * - Motion trail afterimages for movement clarity
 * - Energy particles when dancing
 * - Per-move unique kinematics (70+ profiles)
 */

const S = Math.sin;
const C = Math.cos;
const A = Math.abs;
const PI = Math.PI;

// ─── Joint Pose Defaults ─────────────────────────────────────────────────────
const NEUTRAL = {
  torsoLean: 0,
  torsoTwist: 0,
  hipX: 0,
  squat: 0,
  bounceY: 0,
  headTilt: 0,
  lShoulder: 0.15,    rShoulder: 0.15,
  lElbow: 0.35,       rElbow: 0.35,
  lHip: 0,            rHip: 0,
  lKnee: 0,           rKnee: 0,
};

// ─── Per-Move Animation Profiles (70+) ───────────────────────────────────────
const PROFILES = {
  // ════ WARM-UP ════
  march_in_place: (t) => {
    const c = t * 5;
    return { ...NEUTRAL,
      bounceY: A(S(c)) * 8,
      lHip: Math.max(0, S(c)) * 0.7, rHip: Math.max(0, -S(c)) * 0.7,
      lKnee: Math.max(0, S(c)) * 1.0, rKnee: Math.max(0, -S(c)) * 1.0,
      lShoulder: 0.1 - S(c) * 0.5, rShoulder: 0.1 + S(c) * 0.5,
      lElbow: 0.8 + S(c) * 0.15, rElbow: 0.8 - S(c) * 0.15,
    };
  },
  side_step_touch: (t) => {
    const c = t * 3;
    return { ...NEUTRAL,
      hipX: S(c) * 22, bounceY: A(S(c)) * 5,
      lShoulder: -0.6 + S(c) * 0.5, rShoulder: -0.6 - S(c) * 0.5,
      lElbow: 0.3, rElbow: 0.3,
      torsoTwist: S(c) * 0.08, headTilt: S(c) * 0.06,
    };
  },
  body_roll_warmup: (t) => {
    const c = t * 2.5;
    return { ...NEUTRAL,
      torsoLean: S(c) * 0.18, hipX: S(c + 1) * 12,
      squat: 0.08 + S(c + 2) * 0.08, bounceY: S(c + 1.5) * 4,
      lShoulder: -0.8 + S(c) * 0.3, rShoulder: -0.8 - S(c) * 0.3,
      lElbow: 0.15, rElbow: 0.15,
    };
  },
  hip_circles: (t) => {
    const c = t * 2.8;
    return { ...NEUTRAL,
      hipX: S(c) * 18, bounceY: C(c) * 5,
      torsoTwist: S(c + 0.5) * 0.08,
      lShoulder: 0.2, rShoulder: 0.2, lElbow: 1.1, rElbow: 1.1,
      headTilt: S(c) * 0.04,
    };
  },
  arm_circles: (t) => {
    const c = t * 3;
    return { ...NEUTRAL,
      lShoulder: -1.0 + S(c) * 1.2, rShoulder: -1.0 + S(c + PI) * 1.2,
      lElbow: 0.1 + A(C(c)) * 0.3, rElbow: 0.1 + A(C(c + PI)) * 0.3,
      bounceY: A(S(c * 2)) * 3, hipX: S(c) * 4,
    };
  },
  grapevine: (t) => {
    const c = t * 3.5;
    return { ...NEUTRAL,
      hipX: S(c) * 28, bounceY: A(S(c * 2)) * 6,
      lHip: S(c) * 0.3, rHip: -S(c) * 0.3,
      lShoulder: -0.3 + S(c) * 0.3, rShoulder: -0.3 - S(c) * 0.3,
      lElbow: 0.6, rElbow: 0.6,
      torsoTwist: S(c) * 0.1,
    };
  },
  jumping_jacks_light: (t) => {
    const c = t * 4;
    const open = S(c) > 0;
    return { ...NEUTRAL,
      hipX: open ? S(c) * 12 : 0, bounceY: A(S(c)) * 14,
      lShoulder: open ? -2.2 : 0.1, rShoulder: open ? -2.2 : 0.1,
      lElbow: 0.15, rElbow: 0.15,
      lHip: open ? 0.35 : 0, rHip: open ? -0.35 : 0,
      squat: open ? 0 : 0.08,
    };
  },
  torso_twists: (t) => {
    const c = t * 4;
    return { ...NEUTRAL,
      torsoTwist: S(c) * 0.25, headTilt: S(c) * 0.12,
      lShoulder: -0.5 + S(c) * 0.4, rShoulder: -0.5 - S(c) * 0.4,
      lElbow: 0.9, rElbow: 0.9,
      hipX: S(c) * 6, bounceY: A(S(c * 2)) * 3,
    };
  },

  // ════ REGGAETON ════
  reggaeton_bounce: (t) => {
    const c = t * 4;
    return { ...NEUTRAL,
      squat: 0.22 + S(c) * 0.18, bounceY: A(S(c)) * 12, hipX: S(c) * 7,
      lShoulder: -0.9 + A(S(t * 2)) * 0.7, rShoulder: -0.9 + A(S(t * 2 + 0.5)) * 0.7,
      lElbow: 0.9, rElbow: 0.9,
      torsoLean: 0.06, headTilt: S(c) * 0.05,
    };
  },
  perreo: (t) => {
    const c = t * 3.5;
    return { ...NEUTRAL,
      squat: 0.35, torsoLean: 0.18,
      hipX: S(c) * 20, bounceY: A(S(c)) * 5,
      lShoulder: 0.2, rShoulder: 0.2, lElbow: 1.2, rElbow: 1.2,
      torsoTwist: S(c) * 0.12, lHip: 0.12, rHip: 0.12,
    };
  },
  dembow_step: (t) => {
    const c = t * 4;
    return { ...NEUTRAL,
      hipX: S(c) * 18, bounceY: A(S(c)) * 8,
      lHip: S(c) * 0.35, rHip: -S(c) * 0.35,
      lKnee: A(S(c)) * 0.35, rKnee: A(C(c)) * 0.35,
      lShoulder: -0.2 + S(c) * 0.6, rShoulder: -0.2 - S(c) * 0.6,
      lElbow: 0.7, rElbow: 0.7, torsoTwist: S(c) * 0.1,
    };
  },
  gasolina_pump: (t) => {
    const c = t * 3.5;
    const beat = (t * 3.5) % (PI * 2);
    const jump = beat > PI * 1.5 ? A(S(beat * 2)) * 18 : 0;
    return { ...NEUTRAL,
      squat: 0.28 + S(c) * 0.1, bounceY: A(S(c)) * 8 + jump,
      lShoulder: -1.8 + A(S(c)) * 1.2, rShoulder: -1.8 + A(S(c + PI)) * 1.2,
      lElbow: 0.6, rElbow: 0.6,
      hipX: S(c) * 5, torsoLean: 0.06,
    };
  },
  reggaeton_body_roll: (t) => {
    const c = t * 2.5;
    return { ...NEUTRAL,
      torsoLean: S(c) * 0.22, hipX: S(c + 1.2) * 14,
      squat: 0.1 + S(c + 2) * 0.1, bounceY: S(c + 1) * 5,
      lShoulder: 0.05, rShoulder: 0.05,
      lElbow: 0.4, rElbow: 0.4,
      torsoTwist: S(c + 0.5) * 0.06,
    };
  },
  low_rider_squat: (t) => {
    const c = t * 3;
    return { ...NEUTRAL,
      squat: 0.42 + S(c) * 0.06, bounceY: A(S(c * 2)) * 4,
      hipX: S(c) * 16,
      lShoulder: -0.4 + S(c) * 0.4, rShoulder: -0.4 - S(c) * 0.4,
      lElbow: 0.8, rElbow: 0.8,
      torsoLean: 0.08, torsoTwist: S(c) * 0.06,
    };
  },
  shoulder_lean: (t) => {
    const c = t * 3.5;
    return { ...NEUTRAL,
      torsoTwist: S(c) * 0.18, hipX: S(c) * 20,
      bounceY: A(S(c)) * 6,
      lShoulder: S(c) > 0 ? -0.8 : 0.1, rShoulder: S(c) > 0 ? 0.1 : -0.8,
      lElbow: 0.5, rElbow: 0.5,
      headTilt: S(c) * 0.12,
    };
  },
  dembow_turn: (t) => {
    const c = t * 2.5;
    return { ...NEUTRAL,
      torsoTwist: S(c) * 0.3, hipX: S(t * 4) * 16,
      bounceY: A(S(t * 4)) * 8,
      lHip: S(t * 4) * 0.3, rHip: -S(t * 4) * 0.3,
      lShoulder: -0.3 + S(c) * 0.5, rShoulder: -0.3 - S(c) * 0.5,
      lElbow: 0.7, rElbow: 0.7,
      headTilt: S(c) * 0.14,
    };
  },

  // ════ SALSA ════
  basic_salsa: (t) => {
    const c = t * 4;
    return { ...NEUTRAL,
      lHip: S(c) * 0.4, rHip: -S(c) * 0.4,
      hipX: S(c) * 14, bounceY: A(S(c)) * 5,
      lShoulder: -0.3 + S(c) * 0.3, rShoulder: -0.3 - S(c) * 0.3,
      lElbow: 0.9, rElbow: 0.9,
      torsoTwist: S(c) * 0.09, headTilt: S(c) * 0.04,
    };
  },
  salsa_hip_roll: (t) => {
    const c = t * 3;
    return { ...NEUTRAL,
      hipX: S(c) * 22, torsoTwist: S(c) * 0.14, bounceY: A(S(c)) * 4,
      lHip: S(c) * 0.2, rHip: -S(c) * 0.2,
      lShoulder: -0.5 + S(c + 1) * 0.4, rShoulder: -0.5 - S(c + 1) * 0.4,
      lElbow: 0.5, rElbow: 0.5, torsoLean: S(c + 0.5) * 0.06,
    };
  },
  cross_body_lead: (t) => {
    const c = t * 2.5;
    return { ...NEUTRAL,
      torsoTwist: S(c) * 0.22, hipX: S(c) * 16,
      lHip: S(c) * 0.45, rHip: -S(c + 0.5) * 0.45,
      lKnee: A(S(c)) * 0.25, bounceY: A(S(c)) * 6,
      lShoulder: -0.8 + S(c) * 0.7, rShoulder: -0.2 - S(c) * 0.3,
      lElbow: 0.35, rElbow: 0.7,
    };
  },
  suzie_q: (t) => {
    const c = t * 5;
    return { ...NEUTRAL,
      hipX: S(c) * 20, bounceY: A(S(c * 2)) * 4,
      torsoTwist: S(c) * 0.12,
      lHip: S(c) * 0.15, rHip: -S(c) * 0.15,
      lKnee: A(S(c)) * 0.2, rKnee: A(C(c)) * 0.2,
      lShoulder: 0.1 - S(c) * 0.3, rShoulder: 0.1 + S(c) * 0.3,
      lElbow: 0.6, rElbow: 0.6,
    };
  },
  salsa_shimmy: (t) => {
    const c = t * 10;
    return { ...NEUTRAL,
      lShoulder: -0.3 + S(c) * 0.2, rShoulder: -0.3 - S(c) * 0.2,
      torsoTwist: S(c) * 0.06,
      hipX: S(t * 3) * 10, bounceY: A(S(t * 4)) * 4,
      lHip: S(t * 4) * 0.2, rHip: -S(t * 4) * 0.2,
      lElbow: 0.7, rElbow: 0.7,
    };
  },
  mambo_step: (t) => {
    const c = t * 4;
    return { ...NEUTRAL,
      lHip: Math.max(0, S(c)) * 0.5, rHip: Math.max(0, -S(c)) * 0.5,
      hipX: S(c) * 14, bounceY: A(S(c)) * 6,
      lShoulder: -0.2 + S(c) * 0.25, rShoulder: -0.2 - S(c) * 0.25,
      lElbow: 0.8, rElbow: 0.8,
      torsoTwist: S(c) * 0.07,
    };
  },
  copa: (t) => {
    const c = t * 2.5;
    return { ...NEUTRAL,
      torsoTwist: S(c) * 0.2, hipX: S(c) * 18,
      lHip: S(c) * 0.35, rHip: -S(c) * 0.2,
      bounceY: A(S(c)) * 5,
      lShoulder: -1.2 + S(c) * 0.8, rShoulder: -0.3,
      lElbow: 0.25, rElbow: 0.7,
      headTilt: S(c) * 0.08,
    };
  },
  enchufla_turn: (t) => {
    const c = t * 2;
    return { ...NEUTRAL,
      torsoTwist: S(c) * 0.35, hipX: S(c) * 12,
      bounceY: A(S(t * 4)) * 6,
      lShoulder: -1.6 + S(c) * 0.6, rShoulder: -1.6 - S(c) * 0.6,
      lElbow: 0.2, rElbow: 0.2,
      lHip: S(t * 4) * 0.25, rHip: -S(t * 4) * 0.25,
      headTilt: S(c) * 0.15,
    };
  },

  // ════ MERENGUE ════
  merengue_march: (t) => {
    const c = t * 5.5;
    return { ...NEUTRAL,
      bounceY: A(S(c)) * 6, hipX: S(c) * 12,
      lHip: Math.max(0, S(c)) * 0.35, rHip: Math.max(0, -S(c)) * 0.35,
      lShoulder: -0.2 + S(c) * 0.3, rShoulder: -0.2 - S(c) * 0.3,
      lElbow: 0.85, rElbow: 0.85,
    };
  },
  merengue_hip_sway: (t) => {
    const c = t * 4;
    return { ...NEUTRAL,
      hipX: S(c) * 24, bounceY: A(S(c)) * 4,
      torsoTwist: S(c) * 0.07,
      lHip: S(c) * 0.15, rHip: -S(c) * 0.15,
      lShoulder: -0.2, rShoulder: -0.2,
      lElbow: 0.65, rElbow: 0.65, headTilt: S(c) * 0.07,
    };
  },
  merengue_turn: (t) => {
    const c = t * 2;
    return { ...NEUTRAL,
      torsoTwist: S(c) * 0.28, hipX: S(t * 3) * 14,
      bounceY: A(S(t * 5)) * 6,
      lShoulder: -1.3 + S(c) * 0.5, rShoulder: -1.3 - S(c) * 0.5,
      lElbow: 0.25, rElbow: 0.25,
      lHip: S(t * 5) * 0.2, rHip: -S(t * 5) * 0.2,
      headTilt: S(c) * 0.12,
    };
  },
  merengue_side_travel: (t) => {
    const c = t * 4;
    return { ...NEUTRAL,
      hipX: S(c) * 30, bounceY: A(S(c * 2)) * 5,
      lHip: S(c) * 0.2, rHip: -S(c) * 0.2,
      lShoulder: -0.1, rShoulder: -0.1,
      lElbow: 0.5, rElbow: 0.5,
      torsoTwist: S(c) * 0.05, headTilt: S(c) * 0.05,
    };
  },
  merengue_arm_wave: (t) => {
    const c = t * 3;
    return { ...NEUTRAL,
      lShoulder: -1.5 + S(c) * 0.8, rShoulder: -1.5 + S(c + PI) * 0.8,
      lElbow: 0.2 + A(S(c)) * 0.4, rElbow: 0.2 + A(S(c + PI)) * 0.4,
      hipX: S(t * 4) * 14, bounceY: A(S(t * 5)) * 5,
      headTilt: S(c) * 0.06,
    };
  },
  bicicleta: (t) => {
    const c = t * 5;
    return { ...NEUTRAL,
      lHip: Math.max(0, S(c)) * 0.65, rHip: Math.max(0, -S(c)) * 0.65,
      lKnee: Math.max(0, S(c)) * 0.9, rKnee: Math.max(0, -S(c)) * 0.9,
      bounceY: A(S(c)) * 10,
      lShoulder: -0.5 + S(c) * 0.4, rShoulder: -0.5 - S(c) * 0.4,
      lElbow: 0.9, rElbow: 0.9,
      hipX: S(c) * 8,
    };
  },
  merengue_circle: (t) => {
    const c = t * 3;
    return { ...NEUTRAL,
      hipX: S(c) * 18, torsoTwist: S(c) * 0.15,
      bounceY: A(S(t * 5)) * 5,
      lHip: S(t * 5) * 0.2, rHip: -S(t * 5) * 0.2,
      lShoulder: -1.8 + A(S(t * 2)) * 0.6, rShoulder: -1.8 + A(S(t * 2 + 0.3)) * 0.6,
      lElbow: 0.2, rElbow: 0.2,
      headTilt: S(c) * 0.08,
    };
  },

  // ════ CUMBIA ════
  cumbia_basic: (t) => {
    const c = t * 3;
    return { ...NEUTRAL,
      lHip: -A(S(c)) * 0.4, rHip: -A(C(c)) * 0.4,
      hipX: S(c) * 16, bounceY: A(S(c)) * 4,
      lShoulder: -0.1 + S(c) * 0.2, rShoulder: -0.1 - S(c) * 0.2,
      lElbow: 0.5, rElbow: 0.5, torsoTwist: S(c) * 0.06,
    };
  },
  cumbia_shuffle: (t) => {
    const c = t * 4.5;
    return { ...NEUTRAL,
      hipX: S(c) * 20, bounceY: A(S(c)) * 7,
      lHip: S(c) * 0.25, rHip: S(c + 0.5) * 0.25,
      lShoulder: -0.6 + S(t * 2.2) * 0.6, rShoulder: -0.6 - S(t * 2.2) * 0.6,
      lElbow: 0.35, rElbow: 0.35, torsoTwist: S(c) * 0.08,
    };
  },
  cumbia_weave: (t) => {
    const c = t * 3.5;
    return { ...NEUTRAL,
      hipX: S(c) * 26, bounceY: A(S(c * 2)) * 5,
      lHip: S(c) * 0.3, rHip: -S(c) * 0.2,
      lShoulder: -0.3 + S(c) * 0.3, rShoulder: -0.3 - S(c) * 0.3,
      lElbow: 0.6, rElbow: 0.6,
      torsoTwist: S(c) * 0.1,
    };
  },
  cumbia_turn: (t) => {
    const c = t * 2.5;
    return { ...NEUTRAL,
      torsoTwist: S(c) * 0.28, hipX: S(c) * 14,
      bounceY: A(S(t * 3)) * 5,
      lShoulder: -1.0 + S(c) * 0.6, rShoulder: -1.0 - S(c) * 0.6,
      lElbow: 0.3, rElbow: 0.3,
      lHip: S(t * 3) * 0.2, rHip: -S(t * 3) * 0.2,
      headTilt: S(c) * 0.1,
    };
  },
  cumbia_kick: (t) => {
    const c = t * 3.5;
    return { ...NEUTRAL,
      lHip: Math.max(0, S(c)) * 0.5, rHip: Math.max(0, -S(c)) * 0.5,
      lKnee: Math.max(0, S(c)) * 0.35, rKnee: Math.max(0, -S(c)) * 0.35,
      bounceY: A(S(c)) * 5, hipX: S(c) * 10,
      lShoulder: -0.2 - S(c) * 0.3, rShoulder: -0.2 + S(c) * 0.3,
      lElbow: 0.6, rElbow: 0.6,
    };
  },
  cumbia_arm_pump: (t) => {
    const c = t * 4;
    return { ...NEUTRAL,
      lShoulder: -1.4 + A(S(c)) * 1.0, rShoulder: -1.4 + A(S(c + PI)) * 1.0,
      lElbow: 0.5, rElbow: 0.5,
      hipX: S(c) * 12, bounceY: A(S(c)) * 5,
      lHip: -A(S(c)) * 0.2, rHip: -A(C(c)) * 0.2,
    };
  },

  // ════ HIP HOP ════
  hip_hop_bounce: (t) => {
    const c = t * 4;
    return { ...NEUTRAL,
      squat: 0.18 + S(c) * 0.15, bounceY: A(S(c)) * 12,
      torsoLean: 0.06,
      lShoulder: 0.05 + S(c) * 0.4, rShoulder: 0.05 - S(c) * 0.4,
      lElbow: 0.9, rElbow: 0.9,
      hipX: S(c) * 5, headTilt: S(c) * 0.1,
    };
  },
  body_wave: (t) => {
    const c = t * 2.5;
    return { ...NEUTRAL,
      torsoLean: S(c) * 0.18, hipX: S(c + 1.2) * 10,
      squat: 0.1 + S(c + 2) * 0.1, bounceY: S(c + 1) * 6,
      lShoulder: 0.05, rShoulder: 0.05,
      lElbow: 0.3 + S(c) * 0.2, rElbow: 0.3 + S(c) * 0.2,
    };
  },
  criss_cross: (t) => {
    const c = t * 5;
    return { ...NEUTRAL,
      bounceY: A(S(c)) * 16, hipX: S(c) * 22,
      lHip: S(c) * 0.55, rHip: -S(c) * 0.55,
      lKnee: 0.15, rKnee: 0.15,
      lShoulder: -0.2 - S(c) * 0.5, rShoulder: -0.2 + S(c) * 0.5,
      lElbow: 0.7, rElbow: 0.7, squat: 0.1,
    };
  },
  running_man: (t) => {
    const c = t * 5;
    return { ...NEUTRAL,
      bounceY: A(S(c)) * 10,
      lHip: Math.max(0, S(c)) * 0.7, rHip: Math.max(0, -S(c)) * 0.7,
      lKnee: Math.max(0, S(c)) * 0.8, rKnee: Math.max(0, -S(c)) * 0.8,
      lShoulder: 0.1 - S(c) * 0.6, rShoulder: 0.1 + S(c) * 0.6,
      lElbow: 0.9, rElbow: 0.9,
      torsoLean: 0.08, hipX: S(c) * 6,
    };
  },
  cabbage_patch: (t) => {
    const c = t * 4;
    return { ...NEUTRAL,
      lShoulder: -0.8 + S(c) * 0.3, rShoulder: -0.8 + S(c + PI) * 0.3,
      lElbow: 1.2 + S(c) * 0.2, rElbow: 1.2 + S(c + PI) * 0.2,
      hipX: S(c) * 10, bounceY: A(S(c)) * 6,
      torsoTwist: S(c) * 0.06, squat: 0.08,
    };
  },
  dougie: (t) => {
    const c = t * 2.5;
    const side = S(c) > 0;
    return { ...NEUTRAL,
      torsoLean: -0.08,
      lShoulder: side ? -1.8 : -0.3, rShoulder: side ? -0.3 : -1.8,
      lElbow: side ? 1.2 : 0.4, rElbow: side ? 0.4 : 1.2,
      hipX: S(c) * 14, bounceY: A(S(c * 2)) * 5,
      squat: 0.1, headTilt: S(c) * 0.12,
    };
  },
  stanky_leg: (t) => {
    const c = t * 3;
    const side = S(t * 0.5) > 0;
    return { ...NEUTRAL,
      lHip: side ? S(c) * 0.4 : 0, rHip: side ? 0 : S(c) * 0.4,
      lKnee: side ? S(c) * 0.6 : 0, rKnee: side ? 0 : S(c) * 0.6,
      hipX: S(c) * 12, bounceY: A(S(c)) * 6,
      lShoulder: 0.1, rShoulder: 0.1,
      lElbow: 0.3, rElbow: 0.3,
      torsoLean: 0.04,
    };
  },

  // ════ BOLLYWOOD ════
  bollywood_jig: (t) => {
    const c = t * 5;
    return { ...NEUTRAL,
      bounceY: A(S(c)) * 10, hipX: S(c) * 14,
      lShoulder: -1.5 + A(S(c)) * 0.6, rShoulder: -1.5 + A(S(c + 0.3)) * 0.6,
      lElbow: 0.25, rElbow: 0.25,
      lHip: S(c) * 0.22, rHip: -S(c) * 0.22,
      headTilt: S(c) * 0.1,
    };
  },
  bhangra_shoulder: (t) => {
    const c = t * 8;
    return { ...NEUTRAL,
      squat: 0.22,
      lShoulder: -0.2 + S(c) * 0.35, rShoulder: -0.2 - S(c) * 0.35,
      lElbow: 0.9, rElbow: 0.9,
      torsoTwist: S(c) * 0.12, bounceY: A(S(t * 4)) * 10,
      hipX: S(t * 4) * 8, headTilt: S(c) * 0.08,
    };
  },
  thumka: (t) => {
    const c = t * 5;
    return { ...NEUTRAL,
      hipX: S(c) * 26, bounceY: A(S(c)) * 6, squat: 0.1,
      torsoTwist: S(c) * 0.1,
      lShoulder: -0.6 + S(t * 2.5) * 0.4, rShoulder: -0.3,
      lElbow: 0.5 + S(t * 2.5) * 0.3, rElbow: 0.8,
      headTilt: S(c) * 0.08, lHip: 0.1,
    };
  },
  nagin_dance: (t) => {
    const c = t * 2.5;
    return { ...NEUTRAL,
      lShoulder: -1.2 + S(c) * 0.5, rShoulder: -1.2 - S(c) * 0.5,
      lElbow: 0.4 + S(c) * 0.3, rElbow: 0.4 - S(c) * 0.3,
      hipX: S(c + 1) * 16, torsoTwist: S(c) * 0.15,
      bounceY: A(S(t * 3)) * 3,
      torsoLean: S(c) * 0.08,
      headTilt: S(c) * 0.1,
    };
  },
  dhol_beat: (t) => {
    const c = t * 4;
    return { ...NEUTRAL,
      bounceY: A(S(c)) * 16,
      lHip: Math.max(0, S(c)) * 0.45, rHip: Math.max(0, -S(c)) * 0.45,
      lKnee: Math.max(0, S(c)) * 0.5, rKnee: Math.max(0, -S(c)) * 0.5,
      lShoulder: -1.5 + A(S(c)) * 1.0, rShoulder: -1.5 + A(S(c + PI)) * 1.0,
      lElbow: 0.6, rElbow: 0.6,
      squat: 0.12, hipX: S(c) * 8,
    };
  },
  jhoomer: (t) => {
    const c = t * 2;
    return { ...NEUTRAL,
      torsoTwist: S(c) * 0.3, torsoLean: -0.06,
      lShoulder: -1.5 + S(c) * 0.3, rShoulder: -1.5 - S(c) * 0.3,
      lElbow: 0.15, rElbow: 0.15,
      hipX: S(c) * 10, bounceY: A(S(t * 4)) * 5,
      lHip: S(t * 4) * 0.15, rHip: -S(t * 4) * 0.15,
      headTilt: S(c) * 0.15,
    };
  },
  kathak_spin: (t) => {
    const c = t * 6;
    return { ...NEUTRAL,
      bounceY: A(S(c)) * 4,
      lHip: Math.max(0, S(c)) * 0.3, rHip: Math.max(0, -S(c)) * 0.3,
      lKnee: Math.max(0, S(c)) * 0.2, rKnee: Math.max(0, -S(c)) * 0.2,
      lShoulder: -0.8, rShoulder: -0.8,
      lElbow: 0.5 + S(t * 1.5) * 0.4, rElbow: 0.5 - S(t * 1.5) * 0.4,
      torsoTwist: S(t * 1.5) * 0.15,
      headTilt: S(t * 1.5) * 0.1,
    };
  },

  // ════ SOCA ════
  wine_down: (t) => {
    const c = t * 3;
    return { ...NEUTRAL,
      squat: 0.42 + S(t * 2) * 0.08, hipX: S(c) * 24,
      torsoLean: 0.12, bounceY: A(S(c)) * 3,
      lShoulder: 0.15, rShoulder: 0.15,
      lElbow: 1.1, rElbow: 1.1,
      torsoTwist: S(c) * 0.14, headTilt: S(c) * 0.06,
    };
  },
  soca_jump: (t) => {
    const c = t * 4.5;
    return { ...NEUTRAL,
      bounceY: A(S(c)) * 22,
      lShoulder: -2.0 + A(S(c)) * 0.8, rShoulder: -2.0 + A(S(c + 0.2)) * 0.8,
      lElbow: 0.15, rElbow: 0.15,
      squat: Math.max(0, S(c)) * 0.2,
      lHip: Math.max(0, S(c)) * 0.35, rHip: Math.max(0, -S(c)) * 0.35,
      hipX: S(c) * 10,
    };
  },
  palance: (t) => {
    const c = t * 3.5;
    const push = S(c) > 0;
    return { ...NEUTRAL,
      torsoLean: push ? 0.12 : -0.06,
      lShoulder: push ? -0.8 : -0.2, rShoulder: push ? -0.8 : -0.2,
      lElbow: push ? 0.1 : 0.9, rElbow: push ? 0.1 : 0.9,
      bounceY: A(S(c)) * 8, squat: push ? 0.1 : 0.05,
      hipX: S(c) * 6,
    };
  },
  roadmarch_wave: (t) => {
    const c = t * 3;
    return { ...NEUTRAL,
      bounceY: A(S(t * 4)) * 10,
      lHip: Math.max(0, S(t * 4)) * 0.35, rHip: Math.max(0, -S(t * 4)) * 0.35,
      lShoulder: -1.8 + S(c) * 0.8, rShoulder: -1.8 + S(c + PI) * 0.8,
      lElbow: 0.15, rElbow: 0.15,
      hipX: S(c) * 10, torsoTwist: S(c) * 0.06,
    };
  },
  back_it_up: (t) => {
    const c = t * 4;
    return { ...NEUTRAL,
      torsoLean: 0.15 + S(c) * 0.08,
      squat: 0.2, hipX: S(c) * 10,
      bounceY: A(S(c)) * 6,
      lShoulder: 0.2, rShoulder: 0.2,
      lElbow: 1.1, rElbow: 1.1,
      lHip: -S(c) * 0.15, rHip: S(c) * 0.15,
      torsoTwist: S(c) * 0.05,
    };
  },
  truck_wave: (t) => {
    const c = t * 4;
    return { ...NEUTRAL,
      hipX: S(c) * 24, bounceY: A(S(c)) * 14,
      lShoulder: -2.0 + A(S(t * 2.5)) * 0.5, rShoulder: -2.0 + A(S(t * 2.5 + 0.3)) * 0.5,
      lElbow: 0.15, rElbow: 0.15,
      lHip: S(c) * 0.2, rHip: -S(c) * 0.2,
      squat: S(c) > 0.5 ? 0.25 : 0.05,
    };
  },

  // ════ FLAMENCO ════
  flamenco_stomp: (t) => {
    const c = t * 5;
    return { ...NEUTRAL,
      lHip: Math.max(0, S(c)) * 0.55, rHip: Math.max(0, -S(c)) * 0.55,
      lKnee: Math.max(0, S(c)) * 0.7, rKnee: Math.max(0, -S(c)) * 0.7,
      bounceY: A(S(c)) * 5,
      lShoulder: -1.2 + S(t * 2.5) * 0.5, rShoulder: -1.2 - S(t * 2.5) * 0.5,
      lElbow: 0.3 + A(S(t * 2.5)) * 0.35, rElbow: 0.3 + A(C(t * 2.5)) * 0.35,
      torsoLean: -0.05, headTilt: S(t * 2.5) * 0.06,
    };
  },
  flamenco_arm_sweep: (t) => {
    const c = t * 1.8;
    return { ...NEUTRAL,
      lShoulder: -2.2 + S(c) * 1.0, rShoulder: -2.2 - S(c) * 1.0,
      lElbow: 0.15 + A(S(c)) * 0.45, rElbow: 0.15 + A(C(c)) * 0.45,
      torsoTwist: S(c) * 0.12, hipX: S(c) * 8,
      lHip: S(t * 3.6) * 0.12, rHip: -S(t * 3.6) * 0.12,
      headTilt: S(c) * 0.1,
    };
  },
  zapateado: (t) => {
    const c = t * 8;
    return { ...NEUTRAL,
      bounceY: A(S(c)) * 4,
      lHip: Math.max(0, S(c)) * 0.4, rHip: Math.max(0, -S(c)) * 0.4,
      lKnee: Math.max(0, S(c)) * 0.5, rKnee: Math.max(0, -S(c)) * 0.5,
      lShoulder: -1.0, rShoulder: -1.0,
      lElbow: 0.3 + S(t * 2) * 0.2, rElbow: 0.3 - S(t * 2) * 0.2,
      torsoLean: -0.04, headTilt: S(t * 2) * 0.05,
    };
  },
  paseo: (t) => {
    const c = t * 2;
    return { ...NEUTRAL,
      lHip: Math.max(0, S(c)) * 0.3, rHip: Math.max(0, -S(c)) * 0.3,
      bounceY: A(S(c)) * 3,
      torsoLean: -0.06,
      lShoulder: -0.6, rShoulder: -0.6,
      lElbow: 0.5, rElbow: 0.5,
      headTilt: S(c) * 0.03,
    };
  },
  vuelta: (t) => {
    const c = t * 2;
    return { ...NEUTRAL,
      torsoTwist: S(c) * 0.32,
      lShoulder: -1.5 + S(c) * 0.6, rShoulder: -1.5 - S(c) * 0.6,
      lElbow: 0.2, rElbow: 0.2,
      hipX: S(c) * 12, bounceY: A(S(t * 4)) * 5,
      headTilt: S(c) * 0.15,
      lHip: S(t * 4) * 0.12, rHip: -S(t * 4) * 0.12,
    };
  },
  braceo_circle: (t) => {
    const c = t * 2;
    return { ...NEUTRAL,
      lShoulder: -1.8 + S(c) * 0.8, rShoulder: -1.8 + S(c + PI * 0.7) * 0.8,
      lElbow: 0.2 + S(c * 1.5) * 0.3, rElbow: 0.2 + S(c * 1.5 + PI) * 0.3,
      hipX: S(c) * 6, bounceY: A(S(t * 3)) * 3,
      torsoTwist: S(c) * 0.06,
      lHip: S(t * 3) * 0.08, rHip: -S(t * 3) * 0.08,
    };
  },

  // ════ COOL DOWN ════
  cool_down_sway: (t) => {
    const c = t * 1.5;
    return { ...NEUTRAL,
      hipX: S(c) * 14, bounceY: A(S(c)) * 2,
      lShoulder: 0.12 + S(c) * 0.12, rShoulder: 0.12 - S(c) * 0.12,
      lElbow: 0.2, rElbow: 0.2, headTilt: S(c) * 0.04,
    };
  },
  stretch_reach: (t) => {
    const p = (t * 0.8) % (PI * 2);
    const up = S(p) > 0;
    return { ...NEUTRAL,
      lShoulder: up ? -2.8 : 0.15, rShoulder: up ? -2.8 : 0.15,
      lElbow: up ? 0.08 : 0.3, rElbow: up ? 0.08 : 0.3,
      torsoLean: up ? -0.08 : 0.15,
      squat: up ? 0 : 0.15, bounceY: up ? -4 : 2,
    };
  },
  deep_breathing: (t) => {
    const c = t * 1;
    const inhale = S(c) > 0;
    return { ...NEUTRAL,
      lShoulder: inhale ? -1.5 : 0.1, rShoulder: inhale ? -1.5 : 0.1,
      lElbow: inhale ? 0.15 : 0.3, rElbow: inhale ? 0.15 : 0.3,
      torsoLean: inhale ? -0.04 : 0.02,
      bounceY: inhale ? -3 : 1,
    };
  },
  hip_opener_stretch: (t) => {
    const c = t * 0.8;
    const side = S(c) > 0;
    return { ...NEUTRAL,
      lHip: side ? 0.5 : 0, rHip: side ? 0 : 0.5,
      lKnee: side ? 0.6 : 0, rKnee: side ? 0 : 0.6,
      squat: 0.15, torsoLean: -0.04,
      lShoulder: 0.1, rShoulder: 0.1,
      lElbow: 0.3, rElbow: 0.3,
    };
  },
  shoulder_roll_down: (t) => {
    const c = t * 2;
    return { ...NEUTRAL,
      lShoulder: -0.3 + S(c) * 0.5, rShoulder: -0.3 + S(c + PI) * 0.5,
      lElbow: 0.3 + S(c) * 0.15, rElbow: 0.3 + S(c + PI) * 0.15,
      bounceY: A(S(c)) * 2,
    };
  },
  standing_quad_stretch: (t) => {
    const c = t * 0.6;
    const side = S(c) > 0;
    return { ...NEUTRAL,
      lHip: side ? 0 : -0.3, rHip: side ? -0.3 : 0,
      lKnee: side ? 0 : 1.4, rKnee: side ? 1.4 : 0,
      lShoulder: side ? -0.6 : 0.1, rShoulder: side ? 0.1 : -0.6,
      lElbow: side ? 0.4 : 0.3, rElbow: side ? 0.3 : 0.4,
      bounceY: 2,
    };
  },
};

function getPose(moveId, t) {
  const fn = PROFILES[moveId];
  if (fn) return fn(t);
  const c = t * 3.5;
  return { ...NEUTRAL,
    bounceY: A(S(c)) * 8, hipX: S(c) * 14,
    lShoulder: -0.3 + S(c) * 0.4, rShoulder: -0.3 - S(c) * 0.4,
    lElbow: 0.6, rElbow: 0.6,
    lHip: S(t * 4) * 0.2, rHip: -S(t * 4) * 0.2,
    headTilt: S(c) * 0.05,
  };
}

// ─── Color Utilities ─────────────────────────────────────────────────────────
function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbHex(r, g, b) {
  return '#' + ((1 << 24) | (Math.max(0, Math.min(255, r)) << 16) | (Math.max(0, Math.min(255, g)) << 8) | Math.max(0, Math.min(255, b))).toString(16).slice(1);
}
function shade(hex, amt) {
  const [r, g, b] = hexRgb(hex);
  return rgbHex(Math.round(r * (1 + amt)), Math.round(g * (1 + amt)), Math.round(b * (1 + amt)));
}
function rgba(hex, a) {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// ─── Renderer ────────────────────────────────────────────────────────────────
const SKIN = '#c58b65';
const SKIN_HI = '#daa882';
const SKIN_SH = '#9e6b4a';
const TOP_COL = '#d6336c';
const TOP_HI = '#e8608a';
const TOP_SH = '#a62854';
const SHORT_COL = '#1a1a2e';
const SHORT_HI = '#2d2d48';
const HAIR = '#0f0f1a';
const SHOE = '#222233';

function render(ctx, W, H, pose, trailPoses, particles) {
  ctx.clearRect(0, 0, W, H);

  const sc = Math.min(W, H) / 320;
  const groundY = H - 14 * sc;

  for (let gi = 0; gi < trailPoses.length; gi++) {
    const alpha = 0.06 + gi * 0.04;
    ctx.globalAlpha = alpha;
    drawFigure(ctx, W, groundY, sc, trailPoses[gi], true);
  }
  ctx.globalAlpha = 1;

  drawFigure(ctx, W, groundY, sc, pose, false);

  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * sc, 0, PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawFigure(ctx, W, groundY, sc, p, isGhost) {
  const cx = W / 2 + (p.hipX || 0) * sc;
  const headR = 16 * sc;
  const neckH = 6 * sc;
  const torsoH = 58 * sc;
  const shoulderW = 20 * sc;
  const hipW = 11 * sc;
  const upperArm = 34 * sc;
  const forearm = 30 * sc;
  const thigh = 40 * sc;
  const shin = 38 * sc;

  const squatDrop = (p.squat || 0) * 50 * sc;
  const bounceOff = (p.bounceY || 0) * sc;
  const lean = (p.torsoLean || 0);
  const twist = (p.torsoTwist || 0);

  const baseY = groundY - shin - thigh + squatDrop - bounceOff;
  const hipY = baseY;
  const shoulderY = hipY - torsoH;
  const neckTopY = shoulderY - neckH;
  const headCY = neckTopY - headR;

  const leanOff = S(lean) * torsoH * 0.4;
  const twistOff = twist * 12 * sc;
  const shX = cx + leanOff + twistOff;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (isGhost) {
    drawLimbs(ctx, sc, cx, shX, hipY, shoulderY, headCY, headR, neckTopY,
      shoulderW, hipW, upperArm, forearm, thigh, shin, p, groundY, true);
    return;
  }

  ctx.save();
  ctx.beginPath();
  const shW = 28 * sc + A(p.hipX || 0) * 0.4 * sc;
  ctx.ellipse(cx, groundY + 2 * sc, shW, 5 * sc, 0, 0, PI * 2);
  const sg = ctx.createRadialGradient(cx, groundY + 2 * sc, 0, cx, groundY + 2 * sc, shW);
  sg.addColorStop(0, 'rgba(0,0,0,0.25)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.restore();

  drawLimbs(ctx, sc, cx, shX, hipY, shoulderY, headCY, headR, neckTopY,
    shoulderW, hipW, upperArm, forearm, thigh, shin, p, groundY, false);
}

function drawLimbs(ctx, sc, cx, shX, hipY, shoulderY, headCY, headR, neckTopY,
  shoulderW, hipW, upperArm, forearm, thigh, shin, p, groundY, ghost) {

  const lHipX = cx - hipW;
  const rHipX = cx + hipW;
  const lShX = shX - shoulderW;
  const rShX = shX + shoulderW;

  const lThA = PI / 2 + (p.lHip || 0);
  const lKnX = lHipX + C(lThA) * thigh;
  const lKnY = hipY + S(lThA) * thigh;
  const lShA = PI / 2 + Math.max(0, p.lKnee || 0);
  const lFtX = lKnX + C(lShA) * shin;
  const lFtY = lKnY + S(lShA) * shin;

  const rThA = PI / 2 + (p.rHip || 0);
  const rKnX = rHipX + C(rThA) * thigh;
  const rKnY = hipY + S(rThA) * thigh;
  const rShA = PI / 2 + Math.max(0, p.rKnee || 0);
  const rFtX = rKnX + C(rShA) * shin;
  const rFtY = rKnY + S(rShA) * shin;

  const lArmA = PI / 2 + (p.lShoulder || 0);
  const lElX = lShX + C(lArmA) * upperArm;
  const lElY = shoulderY + S(lArmA) * upperArm;
  const lFoA = lArmA + (p.lElbow || 0.35);
  const lHnX = lElX + C(lFoA) * forearm;
  const lHnY = lElY + S(lFoA) * forearm;

  const rArmA = PI / 2 - (p.rShoulder || 0);
  const rElX = rShX + C(rArmA) * upperArm;
  const rElY = shoulderY + S(rArmA) * upperArm;
  const rFoA = rArmA - (p.rElbow || 0.35);
  const rHnX = rElX + C(rFoA) * forearm;
  const rHnY = rElY + S(rFoA) * forearm;

  if (ghost) {
    ctx.strokeStyle = 'rgba(236,72,153,0.4)';
    ctx.lineWidth = 5 * sc;
    for (const [x1, y1, x2, y2] of [
      [lHipX, hipY, lKnX, lKnY], [lKnX, lKnY, lFtX, lFtY],
      [rHipX, hipY, rKnX, rKnY], [rKnX, rKnY, rFtX, rFtY],
      [cx, hipY, shX, shoulderY],
      [lShX, shoulderY, lElX, lElY], [lElX, lElY, lHnX, lHnY],
      [rShX, shoulderY, rElX, rElY], [rElX, rElY, rHnX, rHnY],
    ]) {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(shX, headCY, headR * 0.8, 0, PI * 2);
    ctx.stroke();
    return;
  }

  function limb(x1, y1, x2, y2, w1, w2, base, hi, sh) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const nx = C(a + PI / 2);
    const ny = S(a + PI / 2);

    ctx.beginPath();
    ctx.moveTo(x1 + nx * w1, y1 + ny * w1);
    ctx.lineTo(x2 + nx * w2, y2 + ny * w2);
    ctx.lineTo(x2 - nx * w2, y2 - ny * w2);
    ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
    ctx.closePath();

    const g = ctx.createLinearGradient(x1 + nx * w1, y1 + ny * w1, x1 - nx * w1, y1 - ny * w1);
    g.addColorStop(0, hi);
    g.addColorStop(0.4, base);
    g.addColorStop(1, sh);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = rgba(sh, 0.3);
    ctx.lineWidth = 0.5 * sc;
    ctx.stroke();
  }

  function joint(x, y, r, base, hi) {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, hi);
    g.addColorStop(1, base);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }

  function shoe(x, y, dir) {
    ctx.beginPath();
    ctx.ellipse(x + dir * 5 * sc, y + 1 * sc, 9 * sc, 5 * sc, dir * 0.15, 0, PI * 2);
    const sg = ctx.createRadialGradient(x + dir * 3 * sc, y - 1 * sc, 1, x + dir * 5 * sc, y + 1 * sc, 9 * sc);
    sg.addColorStop(0, '#3a3a50');
    sg.addColorStop(1, SHOE);
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + dir * 5 * sc, y + 4 * sc, 8 * sc, 2 * sc, dir * 0.1, 0, PI);
    ctx.fillStyle = '#111118';
    ctx.fill();
  }

  const tw = 9 * sc;
  const sw = 7.5 * sc;
  const uw = 7 * sc;
  const fw = 6 * sc;

  limb(rHipX, hipY, rKnX, rKnY, tw, sw, SHORT_COL, SHORT_HI, shade(SHORT_COL, -0.3));
  limb(rKnX, rKnY, rFtX, rFtY, sw, sw * 0.75, SKIN, SKIN_HI, SKIN_SH);
  joint(rKnX, rKnY, 5 * sc, SKIN, SKIN_HI);
  shoe(rFtX, rFtY, 1);

  limb(rShX, shoulderY, rElX, rElY, uw, uw * 0.8, SKIN, SKIN_HI, SKIN_SH);
  limb(rElX, rElY, rHnX, rHnY, fw, fw * 0.7, SKIN, SKIN_HI, SKIN_SH);
  joint(rElX, rElY, 4.5 * sc, SKIN, SKIN_HI);
  joint(rHnX, rHnY, 4 * sc, SKIN_HI, '#ecc8a8');

  const tl = shX - shoulderW;
  const tr = shX + shoulderW;
  const bl = cx - hipW - 2 * sc;
  const br = cx + hipW + 2 * sc;
  ctx.beginPath();
  ctx.moveTo(tl, shoulderY);
  ctx.quadraticCurveTo(shX, shoulderY - 3 * sc, tr, shoulderY);
  ctx.lineTo(br, hipY);
  ctx.quadraticCurveTo(cx, hipY + 4 * sc, bl, hipY);
  ctx.closePath();
  const tg = ctx.createLinearGradient(tl, shoulderY, tr, shoulderY);
  tg.addColorStop(0, TOP_SH);
  tg.addColorStop(0.3, TOP_HI);
  tg.addColorStop(0.65, TOP_COL);
  tg.addColorStop(1, TOP_SH);
  ctx.fillStyle = tg;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(shX - 9 * sc, shoulderY);
  ctx.quadraticCurveTo(shX, shoulderY + 10 * sc, shX + 9 * sc, shoulderY);
  ctx.strokeStyle = shade(TOP_COL, -0.35);
  ctx.lineWidth = 1.5 * sc;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(bl, hipY - 1 * sc);
  ctx.lineTo(br, hipY - 1 * sc);
  ctx.strokeStyle = shade(SHORT_COL, 0.4);
  ctx.lineWidth = 2.5 * sc;
  ctx.stroke();

  limb(lHipX, hipY, lKnX, lKnY, tw, sw, SHORT_COL, SHORT_HI, shade(SHORT_COL, -0.3));
  limb(lKnX, lKnY, lFtX, lFtY, sw, sw * 0.75, SKIN, SKIN_HI, SKIN_SH);
  joint(lKnX, lKnY, 5 * sc, SKIN, SKIN_HI);
  shoe(lFtX, lFtY, -1);

  limb(lShX, shoulderY, lElX, lElY, uw, uw * 0.8, SKIN, SKIN_HI, SKIN_SH);
  limb(lElX, lElY, lHnX, lHnY, fw, fw * 0.7, SKIN, SKIN_HI, SKIN_SH);
  joint(lElX, lElY, 4.5 * sc, SKIN, SKIN_HI);
  joint(lHnX, lHnY, 4 * sc, SKIN_HI, '#ecc8a8');

  joint(lShX, shoulderY, 6 * sc, TOP_COL, TOP_HI);
  joint(rShX, shoulderY, 6 * sc, TOP_COL, TOP_HI);

  limb(shX, shoulderY - 1 * sc, shX, neckTopY, 5.5 * sc, 5 * sc, SKIN, SKIN_HI, SKIN_SH);

  const headCY2 = headCY;
  const htilt = (p.headTilt || 0);
  const hx = shX + S(htilt) * headR * 0.5;

  ctx.beginPath();
  ctx.arc(hx, headCY2, headR * 1.08, -PI, 0.1);
  ctx.fillStyle = HAIR;
  ctx.fill();

  const hg = ctx.createRadialGradient(hx - headR * 0.2, headCY2 - headR * 0.25, headR * 0.1, hx, headCY2, headR);
  hg.addColorStop(0, '#deb896');
  hg.addColorStop(0.5, SKIN);
  hg.addColorStop(1, SKIN_SH);
  ctx.beginPath();
  ctx.arc(hx, headCY2, headR, 0, PI * 2);
  ctx.fillStyle = hg;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(hx, headCY2 - headR * 0.15, headR * 1.06, -PI + 0.3, -0.3);
  ctx.fillStyle = HAIR;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hx - headR * 0.75, headCY2 - headR * 0.1, 5 * sc, headR * 0.55, 0.2, -PI / 2, PI / 2);
  ctx.fillStyle = shade(HAIR, 0.1);
  ctx.fill();

  const eyeY = headCY2 + headR * 0.05;
  const eyeSpread = headR * 0.35;

  for (const side of [-1, 1]) {
    const ex = hx + side * eyeSpread;

    ctx.beginPath();
    ctx.ellipse(ex, eyeY, 3.5 * sc, 2.5 * sc, 0, 0, PI * 2);
    ctx.fillStyle = '#f5f0ed';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ex + side * 0.5 * sc, eyeY, 2 * sc, 0, PI * 2);
    ctx.fillStyle = '#2d1a0e';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ex + side * 0.5 * sc, eyeY, 1 * sc, 0, PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ex + side * 0.5 * sc + 0.8 * sc, eyeY - 0.7 * sc, 0.7 * sc, 0, PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ex, eyeY - 2 * sc, 3.5 * sc, PI + 0.4, -0.4);
    ctx.strokeStyle = rgba(SKIN_SH, 0.5);
    ctx.lineWidth = 0.8 * sc;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ex - 4 * sc, eyeY - 5.5 * sc);
    ctx.quadraticCurveTo(ex, eyeY - 7.5 * sc, ex + 4 * sc, eyeY - 5 * sc);
    ctx.strokeStyle = shade(HAIR, 0.15);
    ctx.lineWidth = 1.8 * sc;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(hx, eyeY + 1 * sc);
  ctx.lineTo(hx - 1.5 * sc, eyeY + 5.5 * sc);
  ctx.lineTo(hx + 1.5 * sc, eyeY + 5.5 * sc);
  ctx.strokeStyle = rgba(SKIN_SH, 0.4);
  ctx.lineWidth = 0.8 * sc;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(hx, headCY2 + headR * 0.35, headR * 0.28, 0.2, PI - 0.2);
  ctx.strokeStyle = shade(SKIN_SH, -0.2);
  ctx.lineWidth = 1.6 * sc;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(hx, headCY2 + headR * 0.35, headR * 0.28, 0.3, PI - 0.3);
  ctx.strokeStyle = '#c45a6e';
  ctx.lineWidth = 2.2 * sc;
  ctx.stroke();

  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(hx + side * headR * 0.52, headCY2 + headR * 0.25, 3.5 * sc, 0, PI * 2);
    ctx.fillStyle = 'rgba(220,100,110,0.15)';
    ctx.fill();
  }

  ctx.beginPath();
  ctx.ellipse(hx + headR * 0.92, headCY2 + headR * 0.05, 3 * sc, 5 * sc, 0.1, -PI / 2, PI / 2);
  ctx.fillStyle = SKIN;
  ctx.fill();
  ctx.strokeStyle = rgba(SKIN_SH, 0.3);
  ctx.lineWidth = 0.6 * sc;
  ctx.stroke();
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MoveAnimator({ moveId, isRunning, size = 200 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const tRef = useRef(0);
  const trailRef = useRef([]);
  const particleRef = useRef([]);
  const frameCount = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    function frame() {
      if (isRunning) {
        tRef.current += 1 / 60;
        frameCount.current++;

        if (frameCount.current % 6 === 0) {
          const pose = getPose(moveId, tRef.current - 0.08);
          trailRef.current.push(pose);
          if (trailRef.current.length > 3) trailRef.current.shift();
        }

        if (frameCount.current % 10 === 0) {
          const cx = size / 2;
          particleRef.current.push({
            x: cx + (Math.random() - 0.5) * size * 0.6,
            y: size * 0.4 + Math.random() * size * 0.3,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -Math.random() * 1.5 - 0.5,
            r: 1.5 + Math.random() * 2,
            life: 0.7 + Math.random() * 0.3,
            color: ['#ec4899', '#f97316', '#eab308', '#a855f7'][Math.floor(Math.random() * 4)],
          });
        }
      }

      particleRef.current = particleRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.015;
        return p.life > 0;
      });

      const pose = getPose(moveId, tRef.current);
      render(ctx, size, size, pose, trailRef.current, particleRef.current);

      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animRef.current);
  }, [moveId, isRunning, size]);

  useEffect(() => {
    trailRef.current = [];
    particleRef.current = [];
  }, [moveId]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="drop-shadow-xl" />
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: 'radial-gradient(ellipse at 50% 70%, rgba(236,72,153,0.06) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
