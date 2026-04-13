const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');

const JWT_SECRET = process.env.JWT_SECRET || 'fittrack_secret_2024';

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

function buildSystemPrompt(user) {
  return `You are FitTrack AI — a professional fitness, nutrition, and health assistant built into the FitTrack Bodybuilder Pro app.

USER PROFILE:
- Name: ${user.name || 'Athlete'}
- Current Weight: ${user.currentWeight || '—'}kg, Height: ${user.height || '—'}cm
- Target Weight: ${user.targetWeight || '—'}kg
- BMI: ${user.bmi || '—'}
- Daily Calorie Goal: ${user.dailyCalories || 2500} kcal (bulk surplus)
- Protein Target: ${user.proteinTarget || 150}g/day (2.2g per kg bodyweight)
- Fitness Level: ${user.fitnessLevel || 'intermediate'}
- Program: 7-day PPL bodybuilding split (Push/Pull/Legs, twice per week, with weekend full-body and mobility sessions)

INSTRUCTIONS:
- Answer concisely with practical, actionable advice.
- Use bullet points for lists and keep paragraphs short.
- When asked about exercises, include sets, reps, and rest periods.
- When asked about nutrition, reference the user's calorie and protein targets.
- For supplement questions, recommend only evidence-based options.
- If the user asks about injuries or medical conditions, advise them to consult a doctor while providing general guidance.
- If the question is completely outside health/fitness/nutrition, politely redirect: "I'm your fitness assistant — I can help with workouts, nutrition, supplements, and health questions!"
- Be motivational and supportive. This user is on a bulking program.`;
}

async function callGemini(systemPrompt, recentMessages, userMessage) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured. Add it to your environment variables.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const history = recentMessages.map((m) => ({
    role: m.role === 'agent' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({
    history,
    systemInstruction: { parts: [{ text: systemPrompt }] },
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

// POST /api/agent/chat — send a message, get AI reply
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const recentMessages = await ChatMessage.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    recentMessages.reverse();

    const systemPrompt = buildSystemPrompt(user);

    let reply;
    try {
      reply = await callGemini(systemPrompt, recentMessages, message.trim());
    } catch (err) {
      console.error('Gemini API error:', err.message);
      return res.status(503).json({
        message: 'AI service temporarily unavailable. Please try again later.',
        error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
      });
    }

    const userMsg = new ChatMessage({ userId: user._id, role: 'user', content: message.trim() });
    const agentMsg = new ChatMessage({ userId: user._id, role: 'agent', content: reply });
    await Promise.all([userMsg.save(), agentMsg.save()]);

    res.json({
      reply,
      timestamp: agentMsg.createdAt,
    });
  } catch (err) {
    console.error('Agent chat error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/agent/history — last 50 messages
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    messages.reverse();
    res.json(messages);
  } catch (err) {
    console.error('Agent history error:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/agent/history — clear chat history
router.delete('/history', authMiddleware, async (req, res) => {
  try {
    await ChatMessage.deleteMany({ userId: req.user.id });
    res.json({ message: 'Chat history cleared' });
  } catch (err) {
    console.error('Agent clear error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
