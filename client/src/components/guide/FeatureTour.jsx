import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_SEEN_KEY = 'ft_tour_seen';

const TOUR_STEPS = [
  {
    popover: {
      title: '🔥 Welcome, Warrior!',
      description: 'You just stepped into the most powerful fitness app ever built. Let\'s gear you up — this takes 30 seconds!',
      side: 'over',
      align: 'center',
    },
  },
  {
    element: '[data-tour="nav-home"]',
    popover: {
      title: '🏠 Your Command Center',
      description: 'Your Dashboard — today\'s workout, nutrition snapshot, daily challenges, workout calendar, and buddy activity. Everything starts here.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-nutrition"]',
    popover: {
      title: '🍗 Fuel Your Gains',
      description: '500+ foods, 6 meal categories, auto calorie tracking, and hydration monitoring. You can\'t out-train a bad diet — so we track it all.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-progress"]',
    popover: {
      title: '📈 Watch Yourself Grow',
      description: 'Weight trends, volume charts, and muscle hit maps. Every week shows your transformation — this is where motivation lives.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-analytics"]',
    popover: {
      title: '📊 Train Smarter',
      description: 'Muscle balance radar, consistency scores, and volume breakdowns. Data-driven bodybuilding for maximum gains.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-profile"]',
    popover: {
      title: '⚙️ Your Battle Settings',
      description: 'Customize your workout split, pair with buddies, manage push notifications, and fine-tune your goals. Your app, your rules.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="samai-btn"]',
    popover: {
      title: '🤖 SamAI — Your 24/7 Coach',
      description: 'Ask anything about workouts, nutrition, or supplements. Say "I ate chicken and rice" to auto-log food. Powered by AI, built for gains.',
      side: 'left',
      align: 'end',
    },
  },
  {
    popover: {
      title: '💪 You\'re Locked & Loaded!',
      description: 'Check out the Feature Guide from the menu anytime for a complete tour. Now go crush it — no excuses, no limits!',
      side: 'over',
      align: 'center',
    },
  },
];

export default function FeatureTour() {
  const location = useLocation();
  const tourStarted = useRef(false);
  const [shouldRun, setShouldRun] = useState(false);

  useEffect(() => {
    if (location.pathname !== '/dashboard') return;
    if (localStorage.getItem(TOUR_SEEN_KEY)) return;
    const timer = setTimeout(() => setShouldRun(true), 1500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    if (!shouldRun || tourStarted.current) return;
    tourStarted.current = true;

    const d = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.8)',
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: 'ft-tour-popover',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'LET\'S GO! 🔥',
      progressText: '{{current}} of {{total}}',
      onDestroyed: () => {
        localStorage.setItem(TOUR_SEEN_KEY, '1');
      },
      steps: TOUR_STEPS,
    });

    d.drive();

    return () => {
      try { d.destroy(); } catch {}
    };
  }, [shouldRun]);

  return null;
}
