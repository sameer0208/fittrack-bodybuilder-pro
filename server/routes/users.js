const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

// Check if email is already registered (lightweight, no auth needed)
router.get('/check-email', async (req, res) => {
  try {
    const email = (req.query.email || '').trim().toLowerCase();
    if (!email) return res.json({ exists: false });
    const user = await User.findOne({ email }).select('_id').lean();
    res.json({ exists: !!user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, currentWeight, height, targetWeight, age, gender, fitnessLevel } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name, email, password: hashed,
      currentWeight, height, targetWeight,
      age, gender, fitnessLevel,
      weightHistory: [{ weight: currentWeight, date: new Date() }],
    });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        currentWeight: user.currentWeight, height: user.height,
        targetWeight: user.targetWeight, age: user.age,
        gender: user.gender, fitnessLevel: user.fitnessLevel,
        bmi: user.bmi, dailyCalories: user.dailyCalories,
        proteinTarget: user.proteinTarget, streak: user.streak,
        totalWorkouts: user.totalWorkouts, programStartDate: user.programStartDate,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        currentWeight: user.currentWeight, height: user.height,
        targetWeight: user.targetWeight, age: user.age,
        gender: user.gender, fitnessLevel: user.fitnessLevel,
        bmi: user.bmi, dailyCalories: user.dailyCalories,
        proteinTarget: user.proteinTarget, streak: user.streak,
        totalWorkouts: user.totalWorkouts, programStartDate: user.programStartDate,
        weightHistory: user.weightHistory,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: user._id, name: user.name, email: user.email,
      currentWeight: user.currentWeight, height: user.height,
      targetWeight: user.targetWeight, age: user.age,
      gender: user.gender, fitnessLevel: user.fitnessLevel,
      bmi: user.bmi, dailyCalories: user.dailyCalories,
      proteinTarget: user.proteinTarget, streak: user.streak,
      totalWorkouts: user.totalWorkouts, programStartDate: user.programStartDate,
      weightHistory: user.weightHistory,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile / log weight
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { currentWeight, targetWeight, height, age, gender, fitnessLevel, name } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (height) user.height = height;
    if (targetWeight) user.targetWeight = targetWeight;
    if (age) user.age = age;
    if (gender) user.gender = gender;
    if (fitnessLevel) user.fitnessLevel = fitnessLevel;
    if (currentWeight && currentWeight !== user.currentWeight) {
      user.currentWeight = currentWeight;
      user.weightHistory.push({ weight: currentWeight, date: new Date() });
    }

    await user.save();
    res.json({
      id: user._id, name: user.name, email: user.email,
      currentWeight: user.currentWeight, height: user.height,
      targetWeight: user.targetWeight, age: user.age,
      gender: user.gender, fitnessLevel: user.fitnessLevel,
      bmi: user.bmi, dailyCalories: user.dailyCalories,
      proteinTarget: user.proteinTarget, streak: user.streak,
      totalWorkouts: user.totalWorkouts, programStartDate: user.programStartDate,
      weightHistory: user.weightHistory,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
