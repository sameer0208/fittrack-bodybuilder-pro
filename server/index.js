const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// In production: restrict CORS to the deployed frontend URL (set CLIENT_URL env var on Render)
// In development: allow all origins
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Render health checks)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

const path = require('path');

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const userRoutes = require('./routes/users');
const workoutRoutes = require('./routes/workouts');
const nutritionRoutes = require('./routes/nutrition');
const agentRoutes = require('./routes/agent');
const bodyRoutes = require('./routes/body');
const healthLogRoutes = require('./routes/healthLog');
const achievementRoutes = require('./routes/achievements');
const socialRoutes = require('./routes/social');
const analyticsRoutes = require('./routes/analytics');
const pushRoutes = require('./routes/push');
const challengeRoutes = require('./routes/challenges');
const customWorkoutRoutes = require('./routes/customWorkout');

app.use('/api/users', userRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/body', bodyRoutes);
app.use('/api/health-log', healthLogRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/custom-workout', customWorkoutRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FitTrack API is running' });
});

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness-tracker';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Please set MONGODB_URI in server/.env file');
    // Start server anyway so frontend can still run
    app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on http://localhost:${PORT} (no DB)`));
  });
