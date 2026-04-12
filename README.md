# FitTrack Bodybuilder Pro

> Developed by **Sameer Application Production**

A professional, full-stack fitness tracking application built for serious bodybuilders. Features a 7-day PPL (Push / Pull / Legs) workout program, nutrition & diet tracking, water intake monitoring, and a personalized diet plan — all wrapped in a mobile-first responsive UI.

---

## ✨ Features

- **7-Day Workout Plan** — Morning + Evening sessions on weekends, Morning on weekdays
- **Exercise Demo Videos** — Embedded YouTube tutorials with error fallback for every exercise
- **Workout Logger** — Log sets, reps, and weight with a touch-friendly stepper UI
- **Nutrition Tracker** — Log meals across Breakfast, Lunch, Dinner, Snacks, Pre/Post-Workout
- **400+ Food Database** — Including Indian / local food items with full macro breakdown
- **Water Intake Tracker** — Daily hydration monitoring with quick-add buttons
- **Personalized Diet Plan** — Auto-generated from your body stats and goals
- **Progress Charts** — Weight and workout history visualized with Recharts
- **Cloud Sync** — MongoDB Atlas backend with JWT authentication
- **Offline-First** — All data is persisted locally; syncs to cloud when connected
- **PWA-Ready** — Add to Home Screen on iOS and Android

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v3 |
| Charts | Recharts |
| Routing | React Router v6 |
| HTTP | Axios |
| Icons | Lucide React |
| Toasts | react-hot-toast |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JSON Web Tokens (bcryptjs) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (free tier works)

### 1. Clone the repo

```bash
git clone https://github.com/sameer0208/fittrack-bodybuilder-pro.git
cd fittrack-bodybuilder-pro
```

### 2. Configure environment variables

```bash
cp .env.example server/.env
```

Edit `server/.env`:

```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_key
PORT=5001
```

### 3. Install dependencies

```bash
npm install          # root (concurrently)
cd client && npm install
cd ../server && npm install
```

### 4. Run in development

```bash
# From the root directory — starts both client and server
npm run dev
```

- Frontend → `http://localhost:5173`
- Backend API → `http://localhost:5001/api`

---

## 📁 Project Structure

```
fittrack-bodybuilder-pro/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # AppContext (global state)
│   │   ├── data/            # Exercise & food databases
│   │   └── pages/           # Dashboard, Nutrition, Progress, etc.
│   └── index.html
├── server/                  # Express backend
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API route handlers
│   └── index.js
├── .env.example
├── .gitignore
└── package.json
```

---

## 📄 License

© 2026 Sameer Application Production. All rights reserved.
