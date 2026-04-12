const mongoose = require('mongoose');

const foodEntrySchema = new mongoose.Schema({
  foodId: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String },
  servingLabel: { type: String }, // e.g. "1 cup", "100g"
  servingQty: { type: Number, default: 1 }, // multiplier
  calories: { type: Number, required: true },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 },
  addedAt: { type: Date, default: Date.now },
});

const mealSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snacks', 'pre_workout', 'post_workout'],
    required: true,
  },
  foods: [foodEntrySchema],
});

mealSchema.virtual('totalCalories').get(function () {
  return this.foods.reduce((s, f) => s + f.calories * f.servingQty, 0);
});

const nutritionLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    meals: [mealSchema],
    waterMl: { type: Number, default: 0 }, // total ml drunk today
    waterGoalMl: { type: Number, default: 3000 },
    notes: { type: String },
    bodyWeight: { type: Number },
  },
  { timestamps: true }
);

nutritionLogSchema.virtual('totals').get(function () {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  this.meals.forEach((meal) => {
    meal.foods.forEach((f) => {
      const qty = f.servingQty || 1;
      totals.calories += (f.calories || 0) * qty;
      totals.protein += (f.protein || 0) * qty;
      totals.carbs += (f.carbs || 0) * qty;
      totals.fat += (f.fat || 0) * qty;
      totals.fiber += (f.fiber || 0) * qty;
    });
  });
  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
    fiber: Math.round(totals.fiber * 10) / 10,
  };
});

module.exports = mongoose.model('NutritionLog', nutritionLogSchema);
