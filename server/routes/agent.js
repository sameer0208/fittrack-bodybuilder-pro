const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');

const JWT_SECRET = process.env.JWT_SECRET || 'fittrack_secret_2024';

// ── Auth middleware ─────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ── In-memory response cache (TTL: 1 hour, max 200 entries) ────────────────
const responseCache = new Map();
const CACHE_TTL = 60 * 60 * 1000;
const CACHE_MAX = 200;

function getCacheKey(userId, message) {
  return `${userId}:${message.toLowerCase().trim().replace(/\s+/g, ' ')}`;
}

function getCached(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    responseCache.delete(key);
    return null;
  }
  return entry.reply;
}

function setCache(key, reply) {
  if (responseCache.size >= CACHE_MAX) {
    const oldest = responseCache.keys().next().value;
    responseCache.delete(oldest);
  }
  responseCache.set(key, { reply, ts: Date.now() });
}

// ── System prompt (compact to save tokens) ─────────────────────────────────
function buildSystemPrompt(user) {
  return `You are SamAI — fitness, nutrition & health AI assistant in FitTrack Bodybuilder Pro (by Sameer Application Production). Be concise, motivational, actionable.

USER: ${user.name || 'Athlete'} | ${user.currentWeight || '?'}kg → ${user.targetWeight || '?'}kg | BMI ${user.bmi || '?'} | ${user.dailyCalories || 2500}kcal/day | ${user.proteinTarget || 150}g protein | 7-day PPL bodybuilding split

RULES: Bullet points for lists. Include sets/reps/rest for exercises. Reference user's calorie & protein targets for nutrition. Evidence-based supplements only. For injuries → suggest doctor. Off-topic → redirect to fitness. Keep answers under 250 words.`;
}

// ── Gemini API call with model fallback + retry ────────────────────────────
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRetryDelay(errMsg) {
  const match = errMsg?.match(/retry\s*(?:in|after)\s*(\d+(?:\.\d+)?)\s*s/i);
  return match ? Math.ceil(parseFloat(match[1]) * 1000) : null;
}

function isDailyQuotaExhausted(errMsg) {
  return errMsg?.includes('limit: 0') || errMsg?.includes('PerDay');
}

async function callGemini(systemPrompt, recentMessages, userMessage) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured. Add it to your environment variables.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const history = recentMessages.slice(-10).map((m) => ({
    role: m.role === 'agent' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  let lastError;
  let allDailyExhausted = true;

  for (const modelName of GEMINI_MODELS) {
    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const chat = model.startChat({
          history,
          systemInstruction: { parts: [{ text: systemPrompt }] },
        });
        const result = await chat.sendMessage(userMessage);
        return { text: result.response.text(), model: modelName };
      } catch (err) {
        lastError = err;
        const msg = err.message || '';
        const is429 = msg.includes('429') || msg.includes('quota') || msg.includes('rate');

        if (!is429) throw err;

        if (isDailyQuotaExhausted(msg)) {
          console.warn(`[SamAI] ${modelName}: daily quota exhausted, trying next model...`);
          break;
        }

        allDailyExhausted = false;

        if (attempt < MAX_RETRIES) {
          const retryMs = parseRetryDelay(msg) || (attempt + 1) * 5000;
          console.warn(`[SamAI] ${modelName}: rate limited, retrying in ${retryMs}ms (attempt ${attempt + 1})...`);
          await sleep(retryMs);
          continue;
        }

        console.warn(`[SamAI] ${modelName}: exhausted retries, trying next model...`);
        break;
      }
    }
  }

  if (allDailyExhausted) {
    const err = new Error('DAILY_QUOTA_EXHAUSTED');
    err.isDailyLimit = true;
    throw err;
  }

  throw lastError;
}

// ── POST /api/agent/chat ───────────────────────────────────────────────────
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const trimmed = message.trim();

    const cacheKey = getCacheKey(user._id, trimmed);
    const cached = getCached(cacheKey);
    if (cached) {
      const userMsg = new ChatMessage({ userId: user._id, role: 'user', content: trimmed });
      const agentMsg = new ChatMessage({ userId: user._id, role: 'agent', content: cached });
      await Promise.all([userMsg.save(), agentMsg.save()]);
      return res.json({ reply: cached, timestamp: agentMsg.createdAt, cached: true });
    }

    const recentMessages = await ChatMessage.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    recentMessages.reverse();

    const systemPrompt = buildSystemPrompt(user);

    let reply;
    try {
      const result = await callGemini(systemPrompt, recentMessages, trimmed);
      reply = result.text;
    } catch (err) {
      console.error('[SamAI] Gemini error:', err.message);

      if (err.isDailyLimit) {
        return res.status(429).json({
          message: 'Daily AI quota reached. Your free Gemini plan allows limited requests per day — the quota resets at midnight (Pacific Time). Try again tomorrow, or upgrade to a paid Google AI plan for unlimited usage.',
        });
      }

      return res.status(503).json({
        message: 'AI is temporarily busy. Please wait 30 seconds and try again.',
        retryAfterSec: 30,
      });
    }

    setCache(cacheKey, reply);

    const userMsg = new ChatMessage({ userId: user._id, role: 'user', content: trimmed });
    const agentMsg = new ChatMessage({ userId: user._id, role: 'agent', content: reply });
    await Promise.all([userMsg.save(), agentMsg.save()]);

    res.json({ reply, timestamp: agentMsg.createdAt });
  } catch (err) {
    console.error('[SamAI] Chat error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/agent/coaching (workout coaching suggestions) ─────────────────
router.get('/coaching', authMiddleware, async (req, res) => {
  try {
    const WorkoutLog = require('../models/WorkoutLog');
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const recentLogs = await WorkoutLog.find({ userId: req.user.id, completed: true })
      .sort({ date: -1 })
      .limit(14)
      .lean();

    if (recentLogs.length < 2) {
      return res.json({ suggestions: ['Complete at least 2 workouts to get personalized coaching tips!'] });
    }

    const exerciseMap = {};
    for (const log of recentLogs) {
      for (const ex of (log.exercises || [])) {
        if (!ex.sets?.length) continue;
        const key = ex.exerciseId || ex.exerciseName;
        if (!exerciseMap[key]) exerciseMap[key] = [];
        const maxWeight = Math.max(...ex.sets.filter((s) => s.completed).map((s) => s.weight || 0), 0);
        const maxReps = Math.max(...ex.sets.filter((s) => s.completed).map((s) => s.reps || 0), 0);
        exerciseMap[key].push({ date: log.date, maxWeight, maxReps });
      }
    }

    const suggestions = [];
    for (const [name, entries] of Object.entries(exerciseMap)) {
      if (entries.length < 2) continue;
      const latest = entries[0];
      const prev = entries[1];
      const displayName = name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      if (latest.maxWeight === prev.maxWeight && latest.maxReps === prev.maxReps) {
        suggestions.push(`${displayName}: Same weight (${latest.maxWeight}kg) and reps (${latest.maxReps}). Try adding 2.5kg or aiming for +2 reps.`);
      } else if (latest.maxReps >= 12 && latest.maxWeight > 0) {
        suggestions.push(`${displayName}: You hit ${latest.maxReps} reps at ${latest.maxWeight}kg — time to increase weight to ${latest.maxWeight + 2.5}kg!`);
      }
      if (suggestions.length >= 5) break;
    }

    if (!suggestions.length) suggestions.push('Great progress! Keep pushing — try to add weight or reps each session.');

    res.json({ suggestions });
  } catch (err) {
    console.error('[SamAI] Coaching error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/agent/food-log (AI-powered food parsing) ────────────────────
router.post('/food-log', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });

    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const foodParsePrompt = `You are a food nutrition parser. The user says: "${message.trim()}"

Parse this into a JSON array of food items. For each item extract:
- name (string)
- quantity (string, e.g. "2 pieces", "1 bowl", "200ml")
- calories (number, estimated kcal)
- protein (number, grams)
- carbs (number, grams)
- fat (number, grams)

Also determine the meal category: one of "breakfast", "lunch", "dinner", "snacks", "preWorkout", "postWorkout".

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{"meal":"lunch","foods":[{"name":"Dal","quantity":"1 bowl","calories":150,"protein":9,"carbs":20,"fat":3}]}`;

    let parsed;
    try {
      const result = await callGemini(foodParsePrompt, [], message.trim());
      const jsonStr = result.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('[SamAI] Food parse error:', parseErr.message);
      return res.json({
        reply: "I couldn't parse the food items. Could you try rephrasing? Example: \"I ate 2 rotis with dal and rice for lunch\"",
        parsedFoods: null,
      });
    }

    const foods = parsed.foods || [];
    const totalCal = foods.reduce((s, f) => s + (f.calories || 0), 0);
    const reply = `Got it! I found ${foods.length} item(s) totalling ~${totalCal} kcal:\n${foods.map((f) => `• ${f.name} (${f.quantity}) — ${f.calories} kcal`).join('\n')}\n\nTap "Log This" to add to your ${parsed.meal || 'snacks'} log.`;

    const userMsg = new ChatMessage({ userId: user._id, role: 'user', content: message.trim() });
    const agentMsg = new ChatMessage({ userId: user._id, role: 'agent', content: reply });
    await Promise.all([userMsg.save(), agentMsg.save()]);

    res.json({
      reply,
      parsedFoods: foods,
      meal: parsed.meal || 'snacks',
      timestamp: agentMsg.createdAt,
    });
  } catch (err) {
    console.error('[SamAI] Food-log error:', err);
    if (err.isDailyLimit) {
      return res.status(429).json({ message: 'Daily AI quota reached.' });
    }
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/agent/history ─────────────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    messages.reverse();
    res.json(messages);
  } catch (err) {
    console.error('[SamAI] History error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/agent/history ──────────────────────────────────────────────
router.delete('/history', authMiddleware, async (req, res) => {
  try {
    await ChatMessage.deleteMany({ userId: req.user.id });
    res.json({ message: 'Chat history cleared' });
  } catch (err) {
    console.error('[SamAI] Clear error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
