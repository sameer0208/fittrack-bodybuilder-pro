// ─────────────────────────────────────────────────────────────────────────────
// FitTrack Food Database — 400+ items
// Values per listed serving: calories (kcal), protein (g), carbs (g), fat (g), fiber (g)
// Includes Indian regional foods, gym nutrition, common global foods
// ─────────────────────────────────────────────────────────────────────────────

export const foodCategories = [
  'All', 'Breakfast', 'Indian Breakfast', 'Lunch & Dinner',
  'Indian Mains', 'Indian Snacks', 'Street Food',
  'Proteins', 'Grains & Carbs', 'Dairy & Eggs',
  'Fruits', 'Vegetables', 'Nuts & Seeds',
  'Pre-Workout', 'Post-Workout', 'Supplements',
  'Beverages', 'Sweets & Desserts', 'Snacks & Fast Food',
];

// Meal-type default categories for quick suggestions
export const mealSuggestions = {
  breakfast:    ['Breakfast', 'Indian Breakfast', 'Dairy & Eggs', 'Fruits', 'Grains & Carbs'],
  lunch:        ['Lunch & Dinner', 'Indian Mains', 'Proteins', 'Grains & Carbs'],
  dinner:       ['Lunch & Dinner', 'Indian Mains', 'Proteins', 'Vegetables'],
  snacks:       ['Indian Snacks', 'Street Food', 'Snacks & Fast Food', 'Fruits', 'Nuts & Seeds'],
  pre_workout:  ['Pre-Workout', 'Fruits', 'Grains & Carbs', 'Beverages'],
  post_workout: ['Post-Workout', 'Supplements', 'Proteins', 'Dairy & Eggs', 'Fruits'],
};

export const foods = [

  // ══════════════════════════════════════════════════════════
  //  BREAKFAST (Global)
  // ══════════════════════════════════════════════════════════
  { id: 'oatmeal_milk', name: 'Oatmeal with Milk', category: 'Breakfast', serving: '1 bowl (300ml)', calories: 280, protein: 11, carbs: 40, fat: 8, fiber: 4 },
  { id: 'oatmeal_banana', name: 'Oatmeal with Banana & Honey', category: 'Breakfast', serving: '1 bowl (350g)', calories: 380, protein: 10, carbs: 68, fat: 6, fiber: 6 },
  { id: 'muesli_milk', name: 'Muesli with Milk', category: 'Breakfast', serving: '1 bowl (250ml)', calories: 310, protein: 9, carbs: 52, fat: 7, fiber: 5 },
  { id: 'cornflakes_milk', name: 'Cornflakes with Milk', category: 'Breakfast', serving: '1 bowl (250ml)', calories: 220, protein: 7, carbs: 40, fat: 4, fiber: 1 },
  { id: 'wheat_flakes', name: 'Wheat Flakes with Milk', category: 'Breakfast', serving: '1 bowl (250ml)', calories: 240, protein: 8, carbs: 44, fat: 4, fiber: 4 },
  { id: 'bread_butter', name: 'Bread with Butter (2 slices)', category: 'Breakfast', serving: '2 slices (70g)', calories: 220, protein: 5.5, carbs: 26, fat: 11, fiber: 1.5 },
  { id: 'bread_peanut_butter', name: 'Bread with Peanut Butter', category: 'Breakfast', serving: '2 slices + 2 tbsp (90g)', calories: 340, protein: 14, carbs: 32, fat: 18, fiber: 3 },
  { id: 'avocado_toast', name: 'Avocado Toast (2 slices)', category: 'Breakfast', serving: '2 slices (150g)', calories: 320, protein: 8, carbs: 32, fat: 18, fiber: 8 },
  { id: 'scrambled_eggs_3', name: 'Scrambled Eggs (3 eggs)', category: 'Breakfast', serving: '3 eggs (150g)', calories: 280, protein: 19, carbs: 2, fat: 21, fiber: 0 },
  { id: 'omelette_veg', name: 'Vegetable Omelette (2 eggs)', category: 'Breakfast', serving: '1 omelette (180g)', calories: 220, protein: 15, carbs: 6, fat: 15, fiber: 1.5 },
  { id: 'french_toast', name: 'French Toast (2 slices)', category: 'Breakfast', serving: '2 slices (120g)', calories: 290, protein: 11, carbs: 34, fat: 12, fiber: 1.5 },
  { id: 'pancakes_3', name: 'Pancakes (3 medium)', category: 'Breakfast', serving: '3 pancakes (200g)', calories: 380, protein: 10, carbs: 62, fat: 10, fiber: 2 },
  { id: 'greek_yogurt_granola', name: 'Greek Yogurt with Granola', category: 'Breakfast', serving: '1 bowl (250g)', calories: 340, protein: 18, carbs: 42, fat: 9, fiber: 3 },
  { id: 'smoothie_protein', name: 'Protein Smoothie (banana + whey)', category: 'Breakfast', serving: '1 glass (400ml)', calories: 340, protein: 28, carbs: 42, fat: 4, fiber: 3 },
  { id: 'egg_sandwich', name: 'Egg Sandwich (2 eggs)', category: 'Breakfast', serving: '1 sandwich (180g)', calories: 350, protein: 18, carbs: 35, fat: 14, fiber: 2 },
  { id: 'boiled_eggs_2', name: '2 Boiled Eggs', category: 'Breakfast', serving: '2 eggs (100g)', calories: 155, protein: 13, carbs: 1, fat: 11, fiber: 0 },
  { id: 'boiled_eggs_4', name: '4 Boiled Eggs', category: 'Breakfast', serving: '4 eggs (200g)', calories: 310, protein: 26, carbs: 2, fat: 22, fiber: 0 },
  { id: 'banana_oats', name: 'Banana & Oats Smoothie', category: 'Breakfast', serving: '1 glass (350ml)', calories: 290, protein: 8, carbs: 55, fat: 4, fiber: 5 },

  // ══════════════════════════════════════════════════════════
  //  INDIAN BREAKFAST
  // ══════════════════════════════════════════════════════════
  { id: 'idli_2', name: 'Idli (2 pieces)', category: 'Indian Breakfast', serving: '2 idli (100g)', calories: 116, protein: 3.9, carbs: 24, fat: 0.4, fiber: 1 },
  { id: 'idli_4', name: 'Idli (4 pieces) with Sambar', category: 'Indian Breakfast', serving: '4 idli + sambar (350g)', calories: 350, protein: 12, carbs: 65, fat: 2, fiber: 5 },
  { id: 'masala_dosa', name: 'Masala Dosa (potato filling)', category: 'Indian Breakfast', serving: '1 large (250g)', calories: 380, protein: 8, carbs: 60, fat: 12, fiber: 4 },
  { id: 'plain_dosa', name: 'Plain Dosa', category: 'Indian Breakfast', serving: '1 large (85g)', calories: 168, protein: 4, carbs: 33, fat: 3, fiber: 1.5 },
  { id: 'rava_dosa', name: 'Rava Dosa', category: 'Indian Breakfast', serving: '1 large (100g)', calories: 190, protein: 4.5, carbs: 35, fat: 5, fiber: 1 },
  { id: 'set_dosa', name: 'Set Dosa (3 pieces)', category: 'Indian Breakfast', serving: '3 pieces (210g)', calories: 300, protein: 7, carbs: 52, fat: 8, fiber: 2 },
  { id: 'medu_vada', name: 'Medu Vada (2 pieces)', category: 'Indian Breakfast', serving: '2 vadas (100g)', calories: 240, protein: 6, carbs: 30, fat: 11, fiber: 3 },
  { id: 'uttapam_tomato', name: 'Tomato Uttapam', category: 'Indian Breakfast', serving: '1 large (200g)', calories: 210, protein: 6, carbs: 36, fat: 5, fiber: 2.5 },
  { id: 'upma', name: 'Upma (rava)', category: 'Indian Breakfast', serving: '1 cup (200g)', calories: 245, protein: 6, carbs: 42, fat: 7, fiber: 3 },
  { id: 'rava_upma', name: 'Rava Upma with Vegetables', category: 'Indian Breakfast', serving: '1 plate (250g)', calories: 290, protein: 7, carbs: 48, fat: 8, fiber: 4 },
  { id: 'poha', name: 'Poha (flattened rice)', category: 'Indian Breakfast', serving: '1 bowl (150g)', calories: 244, protein: 4.5, carbs: 49, fat: 4.5, fiber: 2 },
  { id: 'kanda_poha', name: 'Kanda Poha (with onion)', category: 'Indian Breakfast', serving: '1 bowl (180g)', calories: 280, protein: 5, carbs: 55, fat: 5.5, fiber: 2.5 },
  { id: 'batata_poha', name: 'Batata Poha (with potato)', category: 'Indian Breakfast', serving: '1 bowl (200g)', calories: 320, protein: 5.5, carbs: 62, fat: 6, fiber: 3 },
  { id: 'daliya_porridge', name: 'Daliya Porridge (broken wheat)', category: 'Indian Breakfast', serving: '1 bowl (250g)', calories: 240, protein: 8, carbs: 48, fat: 2, fiber: 6 },
  { id: 'daliya_khichdi', name: 'Daliya Khichdi', category: 'Indian Breakfast', serving: '1 bowl (250g)', calories: 260, protein: 9, carbs: 50, fat: 3, fiber: 6 },
  { id: 'besan_cheela', name: 'Besan Cheela (gram flour pancake)', category: 'Indian Breakfast', serving: '2 cheela (160g)', calories: 260, protein: 12, carbs: 36, fat: 8, fiber: 5 },
  { id: 'moong_dal_cheela', name: 'Moong Dal Cheela', category: 'Indian Breakfast', serving: '2 cheela (160g)', calories: 240, protein: 14, carbs: 32, fat: 7, fiber: 5 },
  { id: 'paratha_plain', name: 'Paratha (plain)', category: 'Indian Breakfast', serving: '1 medium (70g)', calories: 261, protein: 5, carbs: 37, fat: 11, fiber: 3 },
  { id: 'aloo_paratha', name: 'Aloo Paratha', category: 'Indian Breakfast', serving: '1 large (130g)', calories: 340, protein: 7, carbs: 55, fat: 11, fiber: 4 },
  { id: 'gobi_paratha', name: 'Gobi Paratha', category: 'Indian Breakfast', serving: '1 large (130g)', calories: 310, protein: 7, carbs: 50, fat: 10, fiber: 4.5 },
  { id: 'methi_paratha', name: 'Methi Paratha', category: 'Indian Breakfast', serving: '1 medium (80g)', calories: 250, protein: 6, carbs: 38, fat: 9, fiber: 4 },
  { id: 'thepla', name: 'Thepla (fenugreek flatbread)', category: 'Indian Breakfast', serving: '2 pieces (120g)', calories: 310, protein: 9, carbs: 46, fat: 10, fiber: 6 },
  { id: 'missi_roti', name: 'Missi Roti (gram flour)', category: 'Indian Breakfast', serving: '2 pieces (100g)', calories: 270, protein: 11, carbs: 42, fat: 7, fiber: 6 },
  { id: 'puri', name: 'Puri (fried)', category: 'Indian Breakfast', serving: '3 pieces (90g)', calories: 320, protein: 6, carbs: 42, fat: 15, fiber: 2 },
  { id: 'puri_aloo', name: 'Puri Aloo (3 puri + aloo bhaji)', category: 'Indian Breakfast', serving: '1 plate (300g)', calories: 520, protein: 9, carbs: 75, fat: 22, fiber: 5 },
  { id: 'pesarattu', name: 'Pesarattu (green moong dosa)', category: 'Indian Breakfast', serving: '2 pieces (150g)', calories: 200, protein: 10, carbs: 32, fat: 4, fiber: 4 },
  { id: 'anda_bhurji', name: 'Anda Bhurji (3 eggs)', category: 'Indian Breakfast', serving: '1 plate (200g)', calories: 310, protein: 20, carbs: 8, fat: 22, fiber: 1.5 },
  { id: 'sabudana_khichdi', name: 'Sabudana Khichdi', category: 'Indian Breakfast', serving: '1 bowl (200g)', calories: 380, protein: 5, carbs: 68, fat: 10, fiber: 1.5 },
  { id: 'sheera', name: 'Rava Sheera / Halwa', category: 'Indian Breakfast', serving: '1 bowl (150g)', calories: 360, protein: 5, carbs: 58, fat: 13, fiber: 1 },
  { id: 'sattu_paratha', name: 'Sattu Paratha', category: 'Indian Breakfast', serving: '1 large (120g)', calories: 320, protein: 12, carbs: 48, fat: 10, fiber: 5 },

  // ══════════════════════════════════════════════════════════
  //  LUNCH & DINNER (Global)
  // ══════════════════════════════════════════════════════════
  { id: 'chicken_rice_bowl', name: 'Chicken & Rice Bowl', category: 'Lunch & Dinner', serving: '1 bowl (400g)', calories: 520, protein: 42, carbs: 55, fat: 10, fiber: 2 },
  { id: 'tuna_salad', name: 'Tuna Salad', category: 'Lunch & Dinner', serving: '1 bowl (300g)', calories: 280, protein: 32, carbs: 10, fat: 12, fiber: 3 },
  { id: 'grilled_chicken_veggies', name: 'Grilled Chicken with Vegetables', category: 'Lunch & Dinner', serving: '1 plate (400g)', calories: 380, protein: 42, carbs: 20, fat: 12, fiber: 5 },
  { id: 'egg_rice', name: 'Egg Fried Rice (2 eggs)', category: 'Lunch & Dinner', serving: '1 plate (350g)', calories: 440, protein: 16, carbs: 65, fat: 14, fiber: 2 },
  { id: 'pasta_chicken', name: 'Pasta with Chicken', category: 'Lunch & Dinner', serving: '1 bowl (400g)', calories: 510, protein: 35, carbs: 60, fat: 12, fiber: 4 },
  { id: 'salmon_rice', name: 'Salmon with Rice', category: 'Lunch & Dinner', serving: '1 plate (350g)', calories: 520, protein: 36, carbs: 50, fat: 14, fiber: 1.5 },
  { id: 'sandwich_chicken', name: 'Grilled Chicken Sandwich', category: 'Lunch & Dinner', serving: '1 sandwich (220g)', calories: 420, protein: 35, carbs: 40, fat: 12, fiber: 3 },
  { id: 'omelette_3egg', name: '3-Egg Omelette with Cheese', category: 'Lunch & Dinner', serving: '1 omelette (200g)', calories: 390, protein: 27, carbs: 3, fat: 30, fiber: 0 },
  { id: 'caesar_salad_chicken', name: 'Caesar Salad with Chicken', category: 'Lunch & Dinner', serving: '1 large bowl (350g)', calories: 420, protein: 36, carbs: 18, fat: 22, fiber: 4 },
  { id: 'stir_fry_chicken', name: 'Chicken Stir-Fry with Veggies', category: 'Lunch & Dinner', serving: '1 plate (380g)', calories: 380, protein: 38, carbs: 22, fat: 14, fiber: 5 },
  { id: 'beef_tacos_2', name: 'Beef Tacos (2)', category: 'Lunch & Dinner', serving: '2 tacos (240g)', calories: 480, protein: 26, carbs: 46, fat: 20, fiber: 5 },
  { id: 'lentil_soup', name: 'Lentil Soup', category: 'Lunch & Dinner', serving: '1 bowl (300ml)', calories: 190, protein: 12, carbs: 28, fat: 3, fiber: 8 },

  // ══════════════════════════════════════════════════════════
  //  INDIAN MAINS
  // ══════════════════════════════════════════════════════════
  { id: 'dal_tadka', name: 'Dal Tadka', category: 'Indian Mains', serving: '1 cup (240ml)', calories: 198, protein: 11, carbs: 33, fat: 4, fiber: 7 },
  { id: 'dal_makhani', name: 'Dal Makhani', category: 'Indian Mains', serving: '1 cup (240ml)', calories: 280, protein: 12, carbs: 35, fat: 11, fiber: 9 },
  { id: 'dal_fry', name: 'Dal Fry (arhar/toor)', category: 'Indian Mains', serving: '1 cup (240ml)', calories: 220, protein: 12, carbs: 34, fat: 5, fiber: 8 },
  { id: 'moong_dal', name: 'Moong Dal (yellow)', category: 'Indian Mains', serving: '1 cup (240ml)', calories: 180, protein: 13, carbs: 28, fat: 2, fiber: 7 },
  { id: 'chana_dal', name: 'Chana Dal', category: 'Indian Mains', serving: '1 cup (200g)', calories: 284, protein: 17, carbs: 49, fat: 5, fiber: 14 },
  { id: 'masoor_dal', name: 'Masoor Dal (red lentil)', category: 'Indian Mains', serving: '1 cup (240ml)', calories: 195, protein: 14, carbs: 32, fat: 2, fiber: 8 },
  { id: 'rajma', name: 'Rajma (kidney bean curry)', category: 'Indian Mains', serving: '1 cup (240ml)', calories: 267, protein: 15, carbs: 44, fat: 4, fiber: 11 },
  { id: 'chole', name: 'Chole (chickpea curry)', category: 'Indian Mains', serving: '1 cup (240ml)', calories: 286, protein: 12, carbs: 45, fat: 7, fiber: 12 },
  { id: 'sambar', name: 'Sambar', category: 'Indian Mains', serving: '1 cup (240ml)', calories: 130, protein: 6, carbs: 20, fat: 3, fiber: 6 },
  { id: 'rasam', name: 'Rasam', category: 'Indian Mains', serving: '1 cup (240ml)', calories: 60, protein: 2, carbs: 10, fat: 2, fiber: 2 },
  { id: 'basmati_rice', name: 'Basmati Rice (cooked)', category: 'Indian Mains', serving: '1 cup (195g)', calories: 238, protein: 4.9, carbs: 52, fat: 0.5, fiber: 0.7 },
  { id: 'white_rice', name: 'White Rice (cooked)', category: 'Indian Mains', serving: '1 cup (186g)', calories: 242, protein: 4.4, carbs: 53, fat: 0.4, fiber: 0.6 },
  { id: 'jeera_rice', name: 'Jeera Rice', category: 'Indian Mains', serving: '1 cup (200g)', calories: 280, protein: 5, carbs: 55, fat: 5, fiber: 1 },
  { id: 'roti', name: 'Roti / Chapati (whole wheat)', category: 'Indian Mains', serving: '1 medium (40g)', calories: 120, protein: 3.5, carbs: 22, fat: 2.5, fiber: 2.5 },
  { id: 'roti_2', name: 'Roti / Chapati (2 pieces)', category: 'Indian Mains', serving: '2 pieces (80g)', calories: 240, protein: 7, carbs: 44, fat: 5, fiber: 5 },
  { id: 'roti_3', name: 'Roti / Chapati (3 pieces)', category: 'Indian Mains', serving: '3 pieces (120g)', calories: 360, protein: 10.5, carbs: 66, fat: 7.5, fiber: 7.5 },
  { id: 'tandoori_roti', name: 'Tandoori Roti', category: 'Indian Mains', serving: '1 piece (50g)', calories: 135, protein: 4, carbs: 26, fat: 2, fiber: 2.5 },
  { id: 'naan', name: 'Butter Naan', category: 'Indian Mains', serving: '1 piece (90g)', calories: 295, protein: 8, carbs: 46, fat: 9, fiber: 2 },
  { id: 'chicken_curry', name: 'Chicken Curry (home style)', category: 'Indian Mains', serving: '1 cup (240g)', calories: 320, protein: 28, carbs: 10, fat: 18, fiber: 1.5 },
  { id: 'chicken_masala', name: 'Chicken Masala (dry)', category: 'Indian Mains', serving: '1 plate (200g)', calories: 340, protein: 32, carbs: 8, fat: 20, fiber: 1.5 },
  { id: 'chicken_tikka', name: 'Chicken Tikka (grilled)', category: 'Indian Mains', serving: '6 pieces (200g)', calories: 320, protein: 38, carbs: 6, fat: 15, fiber: 1 },
  { id: 'chicken_biryani', name: 'Chicken Biryani', category: 'Indian Mains', serving: '1 plate (300g)', calories: 510, protein: 25, carbs: 65, fat: 18, fiber: 2 },
  { id: 'mutton_biryani', name: 'Mutton Biryani', category: 'Indian Mains', serving: '1 plate (300g)', calories: 580, protein: 28, carbs: 64, fat: 24, fiber: 2 },
  { id: 'veg_biryani', name: 'Veg Biryani', category: 'Indian Mains', serving: '1 plate (300g)', calories: 420, protein: 9, carbs: 72, fat: 12, fiber: 4 },
  { id: 'paneer_butter_masala', name: 'Paneer Butter Masala', category: 'Indian Mains', serving: '1 cup (250g)', calories: 380, protein: 18, carbs: 18, fat: 26, fiber: 2 },
  { id: 'palak_paneer', name: 'Palak Paneer', category: 'Indian Mains', serving: '1 cup (250g)', calories: 325, protein: 16, carbs: 12, fat: 24, fiber: 4 },
  { id: 'paneer_bhurji', name: 'Paneer Bhurji', category: 'Indian Mains', serving: '1 cup (200g)', calories: 380, protein: 22, carbs: 8, fat: 29, fiber: 1 },
  { id: 'matar_paneer', name: 'Matar Paneer', category: 'Indian Mains', serving: '1 cup (250g)', calories: 300, protein: 15, carbs: 22, fat: 18, fiber: 5 },
  { id: 'shahi_paneer', name: 'Shahi Paneer', category: 'Indian Mains', serving: '1 cup (250g)', calories: 420, protein: 17, carbs: 16, fat: 32, fiber: 1.5 },
  { id: 'fish_curry', name: 'Fish Curry', category: 'Indian Mains', serving: '1 cup (250g)', calories: 280, protein: 28, carbs: 8, fat: 15, fiber: 1 },
  { id: 'mutton_curry', name: 'Mutton Curry', category: 'Indian Mains', serving: '1 cup (250g)', calories: 380, protein: 30, carbs: 8, fat: 25, fiber: 1.5 },
  { id: 'egg_curry', name: 'Egg Curry (2 eggs)', category: 'Indian Mains', serving: '1 bowl (250g)', calories: 290, protein: 16, carbs: 12, fat: 20, fiber: 2 },
  { id: 'dum_aloo', name: 'Dum Aloo', category: 'Indian Mains', serving: '1 cup (250g)', calories: 280, protein: 5, carbs: 38, fat: 13, fiber: 4 },
  { id: 'aloo_matar', name: 'Aloo Matar', category: 'Indian Mains', serving: '1 cup (250g)', calories: 220, protein: 7, carbs: 34, fat: 7, fiber: 5 },
  { id: 'aloo_gobi', name: 'Aloo Gobi', category: 'Indian Mains', serving: '1 cup (250g)', calories: 190, protein: 5, carbs: 28, fat: 8, fiber: 5 },
  { id: 'bhindi_masala', name: 'Bhindi Masala (okra)', category: 'Indian Mains', serving: '1 cup (200g)', calories: 160, protein: 4, carbs: 18, fat: 8, fiber: 6 },
  { id: 'baingan_bharta', name: 'Baingan Bharta (brinjal)', category: 'Indian Mains', serving: '1 cup (200g)', calories: 120, protein: 3, carbs: 15, fat: 6, fiber: 5 },
  { id: 'kadhi_pakoda', name: 'Kadhi Pakoda', category: 'Indian Mains', serving: '1 bowl (300g)', calories: 320, protein: 10, carbs: 35, fat: 16, fiber: 3 },
  { id: 'khichdi', name: 'Dal Khichdi', category: 'Indian Mains', serving: '1 bowl (300g)', calories: 310, protein: 13, carbs: 56, fat: 4, fiber: 5 },
  { id: 'pulao_veg', name: 'Veg Pulao', category: 'Indian Mains', serving: '1 plate (300g)', calories: 380, protein: 8, carbs: 68, fat: 9, fiber: 4 },
  { id: 'curd_rice', name: 'Curd Rice', category: 'Indian Mains', serving: '1 bowl (300g)', calories: 280, protein: 8, carbs: 48, fat: 6, fiber: 1 },
  { id: 'sambar_rice', name: 'Sambar Rice', category: 'Indian Mains', serving: '1 bowl (350g)', calories: 350, protein: 11, carbs: 65, fat: 4, fiber: 5 },
  { id: 'rajma_chawal', name: 'Rajma Chawal', category: 'Indian Mains', serving: '1 plate (400g)', calories: 500, protein: 18, carbs: 92, fat: 6, fiber: 13 },
  { id: 'chole_bhature', name: 'Chole Bhature', category: 'Indian Mains', serving: '1 plate (350g)', calories: 650, protein: 16, carbs: 88, fat: 28, fiber: 12 },
  { id: 'butter_chicken', name: 'Butter Chicken', category: 'Indian Mains', serving: '1 cup (250g)', calories: 380, protein: 30, carbs: 14, fat: 22, fiber: 1.5 },
  { id: 'pav_bhaji', name: 'Pav Bhaji (2 pav)', category: 'Indian Mains', serving: '1 plate (350g)', calories: 480, protein: 11, carbs: 72, fat: 18, fiber: 8 },
  { id: 'bhel_puri', name: 'Bhel Puri', category: 'Indian Mains', serving: '1 cup (100g)', calories: 175, protein: 4, carbs: 32, fat: 4, fiber: 3 },
  { id: 'thali_veg', name: 'Veg Thali (dal + rice + roti + sabzi)', category: 'Indian Mains', serving: '1 full thali', calories: 700, protein: 22, carbs: 115, fat: 18, fiber: 12 },
  { id: 'thali_nonveg', name: 'Non-Veg Thali (chicken + rice + roti)', category: 'Indian Mains', serving: '1 full thali', calories: 850, protein: 48, carbs: 110, fat: 24, fiber: 10 },
  { id: 'dosa_sambar', name: 'Dosa + Sambar + Chutney', category: 'Indian Mains', serving: '1 set (300g)', calories: 320, protein: 9, carbs: 55, fat: 7, fiber: 4 },

  // ══════════════════════════════════════════════════════════
  //  INDIAN SNACKS
  // ══════════════════════════════════════════════════════════
  { id: 'roasted_chana', name: 'Roasted Chana (gram)', category: 'Indian Snacks', serving: '1 cup (50g)', calories: 180, protein: 10, carbs: 28, fat: 3, fiber: 8 },
  { id: 'moong_dal_sprouts', name: 'Moong Dal Sprouts', category: 'Indian Snacks', serving: '1 cup (100g)', calories: 62, protein: 4.5, carbs: 11, fat: 0.4, fiber: 4 },
  { id: 'sprouts_salad', name: 'Sprouts Salad (mixed)', category: 'Indian Snacks', serving: '1 bowl (200g)', calories: 130, protein: 9, carbs: 22, fat: 1, fiber: 8 },
  { id: 'makhana', name: 'Makhana (fox nuts, roasted)', category: 'Indian Snacks', serving: '1 cup (30g)', calories: 106, protein: 3.8, carbs: 20, fat: 0.5, fiber: 0.5 },
  { id: 'makhana_ghee', name: 'Makhana with Ghee & Spices', category: 'Indian Snacks', serving: '1 cup (40g)', calories: 160, protein: 4, carbs: 24, fat: 5, fiber: 0.5 },
  { id: 'roasted_peanuts', name: 'Roasted Peanuts', category: 'Indian Snacks', serving: '¼ cup (35g)', calories: 206, protein: 9.5, carbs: 6, fat: 18, fiber: 2.5 },
  { id: 'chivda', name: 'Chivda (murmura mix)', category: 'Indian Snacks', serving: '1 cup (50g)', calories: 180, protein: 4, carbs: 30, fat: 5, fiber: 2 },
  { id: 'murukku', name: 'Murukku', category: 'Indian Snacks', serving: '3-4 pieces (30g)', calories: 145, protein: 2.5, carbs: 20, fat: 6, fiber: 1 },
  { id: 'mathri', name: 'Mathri', category: 'Indian Snacks', serving: '4 pieces (40g)', calories: 190, protein: 3.5, carbs: 24, fat: 9, fiber: 1.5 },
  { id: 'namak_para', name: 'Namak Para', category: 'Indian Snacks', serving: '1 small bowl (40g)', calories: 185, protein: 4, carbs: 25, fat: 8, fiber: 1 },
  { id: 'dhokla', name: 'Dhokla (steamed)', category: 'Indian Snacks', serving: '3-4 pieces (100g)', calories: 160, protein: 6, carbs: 27, fat: 3.5, fiber: 2 },
  { id: 'khandvi', name: 'Khandvi', category: 'Indian Snacks', serving: '8 pieces (100g)', calories: 145, protein: 7, carbs: 20, fat: 4, fiber: 2 },
  { id: 'ragi_biscuits', name: 'Ragi / Finger Millet Biscuits', category: 'Indian Snacks', serving: '4 pieces (60g)', calories: 260, protein: 4.5, carbs: 38, fat: 10, fiber: 3.5 },
  { id: 'biscuits_marie', name: 'Marie Biscuits (5 pieces)', category: 'Indian Snacks', serving: '5 biscuits (35g)', calories: 145, protein: 2.5, carbs: 25, fat: 3.5, fiber: 0.5 },
  { id: 'nimki', name: 'Nimki', category: 'Indian Snacks', serving: '1 small bowl (40g)', calories: 195, protein: 3.5, carbs: 23, fat: 10, fiber: 1 },
  { id: 'chakli', name: 'Chakli', category: 'Indian Snacks', serving: '3 pieces (40g)', calories: 185, protein: 3, carbs: 25, fat: 8, fiber: 1.5 },
  { id: 'fruit_chaat', name: 'Fruit Chaat', category: 'Indian Snacks', serving: '1 bowl (200g)', calories: 130, protein: 2, carbs: 32, fat: 0.5, fiber: 4 },
  { id: 'aloo_tikki', name: 'Aloo Tikki (2 pieces)', category: 'Indian Snacks', serving: '2 pieces (140g)', calories: 290, protein: 5, carbs: 42, fat: 12, fiber: 4 },
  { id: 'samosa', name: 'Samosa (potato)', category: 'Indian Snacks', serving: '1 piece (75g)', calories: 252, protein: 3.5, carbs: 31, fat: 13, fiber: 2 },
  { id: 'samosa_2', name: 'Samosa (2 pieces)', category: 'Indian Snacks', serving: '2 pieces (150g)', calories: 504, protein: 7, carbs: 62, fat: 26, fiber: 4 },
  { id: 'kachori', name: 'Kachori', category: 'Indian Snacks', serving: '1 piece (80g)', calories: 290, protein: 6, carbs: 38, fat: 13, fiber: 3 },
  { id: 'momos_steamed', name: 'Momos (steamed, 6 pieces)', category: 'Indian Snacks', serving: '6 pieces (180g)', calories: 280, protein: 12, carbs: 42, fat: 7, fiber: 3 },
  { id: 'momos_fried', name: 'Momos (fried, 6 pieces)', category: 'Indian Snacks', serving: '6 pieces (180g)', calories: 420, protein: 12, carbs: 45, fat: 22, fiber: 3 },

  // ══════════════════════════════════════════════════════════
  //  STREET FOOD
  // ══════════════════════════════════════════════════════════
  { id: 'pani_puri', name: 'Pani Puri (6 pieces)', category: 'Street Food', serving: '6 pieces (120g)', calories: 200, protein: 3.5, carbs: 38, fat: 5, fiber: 2 },
  { id: 'sev_puri', name: 'Sev Puri (4 pieces)', category: 'Street Food', serving: '4 pieces (120g)', calories: 240, protein: 4, carbs: 36, fat: 9, fiber: 3 },
  { id: 'dahi_puri', name: 'Dahi Puri (4 pieces)', category: 'Street Food', serving: '4 pieces (150g)', calories: 260, protein: 7, carbs: 40, fat: 7, fiber: 2.5 },
  { id: 'vada_pav', name: 'Vada Pav', category: 'Street Food', serving: '1 piece (150g)', calories: 290, protein: 7, carbs: 43, fat: 10, fiber: 3 },
  { id: 'misal_pav', name: 'Misal Pav', category: 'Street Food', serving: '1 plate (350g)', calories: 420, protein: 14, carbs: 62, fat: 14, fiber: 10 },
  { id: 'chaat_papdi', name: 'Papdi Chaat', category: 'Street Food', serving: '1 plate (200g)', calories: 310, protein: 8, carbs: 48, fat: 10, fiber: 4 },
  { id: 'dabeli', name: 'Dabeli', category: 'Street Food', serving: '1 piece (120g)', calories: 270, protein: 6, carbs: 40, fat: 10, fiber: 3 },
  { id: 'frankie', name: 'Chicken Frankie / Kathi Roll', category: 'Street Food', serving: '1 roll (200g)', calories: 380, protein: 22, carbs: 48, fat: 12, fiber: 3 },
  { id: 'shawarma', name: 'Chicken Shawarma (wrap)', category: 'Street Food', serving: '1 wrap (250g)', calories: 440, protein: 28, carbs: 48, fat: 16, fiber: 3 },
  { id: 'dahi_bhalla', name: 'Dahi Bhalla (2 pieces)', category: 'Street Food', serving: '1 plate (200g)', calories: 300, protein: 11, carbs: 44, fat: 9, fiber: 4 },
  { id: 'aloo_chaat', name: 'Aloo Chaat', category: 'Street Food', serving: '1 plate (200g)', calories: 260, protein: 5, carbs: 42, fat: 9, fiber: 5 },

  // ══════════════════════════════════════════════════════════
  //  PROTEINS (Meat, Fish, Eggs)
  // ══════════════════════════════════════════════════════════
  { id: 'chicken_breast_100', name: 'Chicken Breast (grilled, 100g)', category: 'Proteins', serving: '100g', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  { id: 'chicken_breast_150', name: 'Chicken Breast (grilled, 150g)', category: 'Proteins', serving: '150g', calories: 248, protein: 46.5, carbs: 0, fat: 5.4, fiber: 0 },
  { id: 'chicken_breast_200', name: 'Chicken Breast (grilled, 200g)', category: 'Proteins', serving: '200g', calories: 330, protein: 62, carbs: 0, fat: 7.2, fiber: 0 },
  { id: 'chicken_leg', name: 'Chicken Leg (grilled)', category: 'Proteins', serving: '1 leg (175g)', calories: 290, protein: 36, carbs: 0, fat: 16, fiber: 0 },
  { id: 'whole_chicken', name: 'Whole Chicken (roasted, 1/4)', category: 'Proteins', serving: '1/4 chicken (200g)', calories: 320, protein: 38, carbs: 0, fat: 18, fiber: 0 },
  { id: 'beef_mince', name: 'Lean Beef Mince (cooked)', category: 'Proteins', serving: '100g', calories: 215, protein: 26, carbs: 0, fat: 12, fiber: 0 },
  { id: 'beef_steak', name: 'Beef Steak (sirloin)', category: 'Proteins', serving: '150g', calories: 310, protein: 39, carbs: 0, fat: 16.5, fiber: 0 },
  { id: 'lamb_150', name: 'Lamb (grilled, 150g)', category: 'Proteins', serving: '150g', calories: 340, protein: 36, carbs: 0, fat: 22, fiber: 0 },
  { id: 'pork_tenderloin', name: 'Pork Tenderloin (lean)', category: 'Proteins', serving: '150g', calories: 215, protein: 39, carbs: 0, fat: 5.3, fiber: 0 },
  { id: 'salmon_150', name: 'Salmon Fillet (baked, 150g)', category: 'Proteins', serving: '150g', calories: 312, protein: 30, carbs: 0, fat: 19.5, fiber: 0 },
  { id: 'tuna_canned', name: 'Tuna (canned in water)', category: 'Proteins', serving: '1 can (170g)', calories: 197, protein: 43, carbs: 0, fat: 1.4, fiber: 0 },
  { id: 'sardines', name: 'Sardines (canned in oil)', category: 'Proteins', serving: '1 can (90g)', calories: 191, protein: 22, carbs: 0, fat: 11, fiber: 0 },
  { id: 'mackerel', name: 'Mackerel (grilled)', category: 'Proteins', serving: '150g', calories: 298, protein: 30, carbs: 0, fat: 20, fiber: 0 },
  { id: 'tilapia', name: 'Tilapia (baked)', category: 'Proteins', serving: '150g', calories: 192, protein: 39, carbs: 0, fat: 4, fiber: 0 },
  { id: 'egg_1', name: 'Egg (whole, 1)', category: 'Proteins', serving: '1 large (50g)', calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, fiber: 0 },
  { id: 'egg_2', name: 'Eggs (2 whole)', category: 'Proteins', serving: '2 eggs (100g)', calories: 144, protein: 12.6, carbs: 0.8, fat: 9.6, fiber: 0 },
  { id: 'egg_3', name: 'Eggs (3 whole)', category: 'Proteins', serving: '3 eggs (150g)', calories: 216, protein: 18.9, carbs: 1.2, fat: 14.4, fiber: 0 },
  { id: 'egg_4', name: 'Eggs (4 whole)', category: 'Proteins', serving: '4 eggs (200g)', calories: 288, protein: 25.2, carbs: 1.6, fat: 19.2, fiber: 0 },
  { id: 'egg_6', name: 'Eggs (6 whole)', category: 'Proteins', serving: '6 eggs (300g)', calories: 432, protein: 37.8, carbs: 2.4, fat: 28.8, fiber: 0 },
  { id: 'egg_whites_3', name: 'Egg Whites (3)', category: 'Proteins', serving: '3 whites (99g)', calories: 51, protein: 10.8, carbs: 0.6, fat: 0.3, fiber: 0 },
  { id: 'shrimp_150', name: 'Shrimp (cooked, 150g)', category: 'Proteins', serving: '150g', calories: 149, protein: 36, carbs: 0, fat: 0.5, fiber: 0 },
  { id: 'turkey_breast', name: 'Turkey Breast (sliced, 100g)', category: 'Proteins', serving: '100g', calories: 135, protein: 30, carbs: 0, fat: 1, fiber: 0 },
  { id: 'paneer_100', name: 'Paneer (100g)', category: 'Proteins', serving: '100g', calories: 265, protein: 18, carbs: 1.2, fat: 21, fiber: 0 },
  { id: 'tofu_firm', name: 'Firm Tofu', category: 'Proteins', serving: '150g', calories: 120, protein: 14, carbs: 3.6, fat: 7.5, fiber: 0.5 },
  { id: 'soya_chunks', name: 'Soya Chunks (cooked)', category: 'Proteins', serving: '1 cup (100g)', calories: 112, protein: 18, carbs: 8, fat: 0.5, fiber: 3 },

  // ══════════════════════════════════════════════════════════
  //  GRAINS & CARBS
  // ══════════════════════════════════════════════════════════
  { id: 'oats_dry', name: 'Rolled Oats (dry)', category: 'Grains & Carbs', serving: '½ cup (40g)', calories: 150, protein: 5, carbs: 27, fat: 2.5, fiber: 4 },
  { id: 'oats_1cup', name: 'Rolled Oats (1 cup dry)', category: 'Grains & Carbs', serving: '1 cup (80g)', calories: 300, protein: 10, carbs: 54, fat: 5, fiber: 8 },
  { id: 'brown_rice', name: 'Brown Rice (cooked)', category: 'Grains & Carbs', serving: '1 cup (195g)', calories: 216, protein: 5, carbs: 45, fat: 1.8, fiber: 3.5 },
  { id: 'sweet_potato', name: 'Sweet Potato (baked)', category: 'Grains & Carbs', serving: '1 medium (130g)', calories: 112, protein: 2, carbs: 26, fat: 0.1, fiber: 3.8 },
  { id: 'sweet_potato_2', name: 'Sweet Potato (large, 200g)', category: 'Grains & Carbs', serving: '1 large (200g)', calories: 172, protein: 3.1, carbs: 40, fat: 0.2, fiber: 5.9 },
  { id: 'potato_boiled', name: 'Potato (boiled, medium)', category: 'Grains & Carbs', serving: '1 medium (150g)', calories: 130, protein: 3, carbs: 30, fat: 0.1, fiber: 2.2 },
  { id: 'quinoa', name: 'Quinoa (cooked)', category: 'Grains & Carbs', serving: '1 cup (185g)', calories: 222, protein: 8, carbs: 39, fat: 3.5, fiber: 5 },
  { id: 'pasta_100', name: 'Pasta (cooked, 100g)', category: 'Grains & Carbs', serving: '100g', calories: 157, protein: 5.7, carbs: 31, fat: 0.9, fiber: 1.8 },
  { id: 'pasta_200', name: 'Pasta (cooked, 200g)', category: 'Grains & Carbs', serving: '200g', calories: 314, protein: 11.4, carbs: 62, fat: 1.8, fiber: 3.6 },
  { id: 'wheat_bread_2', name: 'Whole Wheat Bread (2 slices)', category: 'Grains & Carbs', serving: '2 slices (56g)', calories: 138, protein: 7.2, carbs: 24, fat: 2, fiber: 3.8 },
  { id: 'multigrain_bread', name: 'Multigrain Bread (2 slices)', category: 'Grains & Carbs', serving: '2 slices (60g)', calories: 155, protein: 7, carbs: 26, fat: 2.5, fiber: 4 },
  { id: 'brown_bread', name: 'Brown Bread (2 slices)', category: 'Grains & Carbs', serving: '2 slices (56g)', calories: 132, protein: 5.6, carbs: 24, fat: 1.8, fiber: 2.4 },
  { id: 'corn_on_cob', name: 'Corn on the Cob (bhutta)', category: 'Grains & Carbs', serving: '1 medium (160g)', calories: 132, protein: 4.9, carbs: 29, fat: 1.8, fiber: 3.3 },
  { id: 'jowar_roti', name: 'Jowar / Sorghum Roti', category: 'Grains & Carbs', serving: '2 pieces (80g)', calories: 200, protein: 6, carbs: 42, fat: 2, fiber: 4.5 },
  { id: 'bajra_roti', name: 'Bajra / Pearl Millet Roti', category: 'Grains & Carbs', serving: '2 pieces (80g)', calories: 215, protein: 5.6, carbs: 44, fat: 2.4, fiber: 3.8 },
  { id: 'maize_roti', name: 'Makki di Roti (corn)', category: 'Grains & Carbs', serving: '1 large (80g)', calories: 210, protein: 5, carbs: 44, fat: 3, fiber: 3.5 },
  { id: 'ragi_roti', name: 'Ragi / Nachni Roti', category: 'Grains & Carbs', serving: '2 pieces (80g)', calories: 205, protein: 6, carbs: 40, fat: 3, fiber: 5 },
  { id: 'rice_cakes', name: 'Rice Cakes (plain, 3)', category: 'Grains & Carbs', serving: '3 cakes (27g)', calories: 105, protein: 2.1, carbs: 21.9, fat: 0.8, fiber: 0.6 },

  // ══════════════════════════════════════════════════════════
  //  DAIRY & EGGS
  // ══════════════════════════════════════════════════════════
  { id: 'whole_milk_300', name: 'Full Fat Milk (1 glass)', category: 'Dairy & Eggs', serving: '1 glass (300ml)', calories: 195, protein: 10, carbs: 14.4, fat: 10, fiber: 0 },
  { id: 'skim_milk_300', name: 'Skim Milk (1 glass)', category: 'Dairy & Eggs', serving: '1 glass (300ml)', calories: 102, protein: 10.2, carbs: 15, fat: 0.3, fiber: 0 },
  { id: 'greek_yogurt_full', name: 'Greek Yogurt (full fat, 170g)', category: 'Dairy & Eggs', serving: '170g', calories: 170, protein: 17, carbs: 6, fat: 9, fiber: 0 },
  { id: 'greek_yogurt_nonfat', name: 'Greek Yogurt (non-fat, 170g)', category: 'Dairy & Eggs', serving: '170g', calories: 100, protein: 17, carbs: 6, fat: 0.7, fiber: 0 },
  { id: 'curd_dahi', name: 'Curd / Dahi (homemade)', category: 'Dairy & Eggs', serving: '1 cup (200g)', calories: 118, protein: 8, carbs: 9, fat: 5, fiber: 0 },
  { id: 'curd_low_fat', name: 'Low Fat Dahi', category: 'Dairy & Eggs', serving: '1 cup (200g)', calories: 80, protein: 8, carbs: 9, fat: 1.5, fiber: 0 },
  { id: 'paneer_50', name: 'Paneer (50g)', category: 'Dairy & Eggs', serving: '50g', calories: 133, protein: 9, carbs: 0.6, fat: 10.5, fiber: 0 },
  { id: 'cottage_cheese', name: 'Cottage Cheese / Chhena (100g)', category: 'Dairy & Eggs', serving: '100g', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0 },
  { id: 'cheddar_cheese', name: 'Cheddar Cheese (1 slice)', category: 'Dairy & Eggs', serving: '1 slice (28g)', calories: 113, protein: 7, carbs: 0.4, fat: 9.3, fiber: 0 },
  { id: 'mozzarella', name: 'Mozzarella Cheese (30g)', category: 'Dairy & Eggs', serving: '30g', calories: 85, protein: 6.3, carbs: 0.6, fat: 6.3, fiber: 0 },
  { id: 'khoya_mawa', name: 'Khoya / Mawa (100g)', category: 'Dairy & Eggs', serving: '100g', calories: 421, protein: 15, carbs: 34, fat: 26, fiber: 0 },
  { id: 'butter_1tbsp', name: 'Butter (1 tbsp)', category: 'Dairy & Eggs', serving: '1 tbsp (14g)', calories: 102, protein: 0.1, carbs: 0, fat: 11.5, fiber: 0 },
  { id: 'ghee_1tsp', name: 'Ghee (1 tsp)', category: 'Dairy & Eggs', serving: '1 tsp (5g)', calories: 45, protein: 0, carbs: 0, fat: 5, fiber: 0 },
  { id: 'ghee_1tbsp', name: 'Ghee (1 tbsp)', category: 'Dairy & Eggs', serving: '1 tbsp (15g)', calories: 135, protein: 0, carbs: 0, fat: 15, fiber: 0 },

  // ══════════════════════════════════════════════════════════
  //  FRUITS
  // ══════════════════════════════════════════════════════════
  { id: 'banana_1', name: 'Banana (1 medium)', category: 'Fruits', serving: '1 medium (118g)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1 },
  { id: 'banana_2', name: 'Banana (2 medium)', category: 'Fruits', serving: '2 medium (236g)', calories: 210, protein: 2.6, carbs: 54, fat: 0.8, fiber: 6.2 },
  { id: 'apple', name: 'Apple (1 medium)', category: 'Fruits', serving: '1 medium (182g)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4 },
  { id: 'orange', name: 'Orange (1 medium)', category: 'Fruits', serving: '1 medium (131g)', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, fiber: 3.1 },
  { id: 'mango_1', name: 'Mango (1 cup sliced)', category: 'Fruits', serving: '1 cup (165g)', calories: 99, protein: 1.4, carbs: 25, fat: 0.6, fiber: 2.6 },
  { id: 'mango_half', name: 'Mango (½ medium)', category: 'Fruits', serving: '½ mango (130g)', calories: 80, protein: 1, carbs: 20, fat: 0.5, fiber: 2.2 },
  { id: 'guava', name: 'Guava (1 medium)', category: 'Fruits', serving: '1 medium (90g)', calories: 60, protein: 1.4, carbs: 14, fat: 0.5, fiber: 5.4 },
  { id: 'papaya', name: 'Papaya (1 cup)', category: 'Fruits', serving: '1 cup (145g)', calories: 62, protein: 0.7, carbs: 16, fat: 0.4, fiber: 2.5 },
  { id: 'watermelon', name: 'Watermelon (2 cups)', category: 'Fruits', serving: '2 cups (280g)', calories: 85, protein: 1.7, carbs: 21, fat: 0.4, fiber: 1.1 },
  { id: 'grapes', name: 'Grapes (1 cup)', category: 'Fruits', serving: '1 cup (92g)', calories: 62, protein: 0.6, carbs: 16, fat: 0.3, fiber: 0.8 },
  { id: 'pear', name: 'Pear (1 medium)', category: 'Fruits', serving: '1 medium (178g)', calories: 101, protein: 0.6, carbs: 27, fat: 0.2, fiber: 5.5 },
  { id: 'pomegranate', name: 'Pomegranate (½ medium)', category: 'Fruits', serving: '½ fruit (100g)', calories: 83, protein: 1.7, carbs: 19, fat: 1.2, fiber: 4 },
  { id: 'strawberries', name: 'Strawberries (1 cup)', category: 'Fruits', serving: '1 cup (152g)', calories: 49, protein: 1, carbs: 11.7, fat: 0.5, fiber: 3 },
  { id: 'blueberries', name: 'Blueberries (1 cup)', category: 'Fruits', serving: '1 cup (148g)', calories: 84, protein: 1.1, carbs: 21, fat: 0.5, fiber: 3.6 },
  { id: 'avocado_half', name: 'Avocado (½ medium)', category: 'Fruits', serving: '½ medium (68g)', calories: 114, protein: 1.3, carbs: 6, fat: 10.5, fiber: 4.6 },
  { id: 'dates_2', name: 'Dates (2 Medjool)', category: 'Fruits', serving: '2 dates (48g)', calories: 133, protein: 0.8, carbs: 36, fat: 0.1, fiber: 3.2 },
  { id: 'dates_4', name: 'Dates (4 pieces)', category: 'Fruits', serving: '4 dates (96g)', calories: 266, protein: 1.6, carbs: 72, fat: 0.2, fiber: 6.4 },
  { id: 'kiwi', name: 'Kiwi (1 medium)', category: 'Fruits', serving: '1 medium (76g)', calories: 46, protein: 0.9, carbs: 11, fat: 0.4, fiber: 2.1 },
  { id: 'pineapple', name: 'Pineapple (1 cup)', category: 'Fruits', serving: '1 cup (165g)', calories: 83, protein: 0.9, carbs: 21.6, fat: 0.2, fiber: 2.3 },

  // ══════════════════════════════════════════════════════════
  //  VEGETABLES
  // ══════════════════════════════════════════════════════════
  { id: 'broccoli', name: 'Broccoli (1 cup steamed)', category: 'Vegetables', serving: '1 cup (91g)', calories: 31, protein: 2.6, carbs: 6, fat: 0.3, fiber: 2.4 },
  { id: 'spinach', name: 'Spinach / Palak (2 cups raw)', category: 'Vegetables', serving: '2 cups (60g)', calories: 14, protein: 1.7, carbs: 2.2, fat: 0.2, fiber: 1.3 },
  { id: 'cauliflower', name: 'Cauliflower / Gobi (1 cup)', category: 'Vegetables', serving: '1 cup (100g)', calories: 25, protein: 1.9, carbs: 5, fat: 0.3, fiber: 2.5 },
  { id: 'capsicum', name: 'Capsicum / Bell Pepper', category: 'Vegetables', serving: '1 medium (120g)', calories: 38, protein: 1.2, carbs: 7, fat: 0.4, fiber: 2.5 },
  { id: 'tomato', name: 'Tomato (1 medium)', category: 'Vegetables', serving: '1 medium (123g)', calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2, fiber: 1.5 },
  { id: 'cucumber', name: 'Cucumber (1 cup)', category: 'Vegetables', serving: '1 cup (119g)', calories: 16, protein: 0.7, carbs: 3.8, fat: 0.1, fiber: 0.6 },
  { id: 'carrot', name: 'Carrot (1 medium)', category: 'Vegetables', serving: '1 medium (61g)', calories: 25, protein: 0.6, carbs: 5.8, fat: 0.1, fiber: 1.7 },
  { id: 'onion', name: 'Onion (½ cup)', category: 'Vegetables', serving: '½ cup (80g)', calories: 32, protein: 0.7, carbs: 7.5, fat: 0.1, fiber: 1.4 },
  { id: 'mushrooms', name: 'Mushrooms (1 cup cooked)', category: 'Vegetables', serving: '1 cup (156g)', calories: 44, protein: 3, carbs: 8.2, fat: 0.7, fiber: 3.4 },
  { id: 'peas', name: 'Green Peas (matar, ½ cup)', category: 'Vegetables', serving: '½ cup (80g)', calories: 67, protein: 4.3, carbs: 12, fat: 0.2, fiber: 4.4 },
  { id: 'beans', name: 'Green Beans (1 cup cooked)', category: 'Vegetables', serving: '1 cup (125g)', calories: 44, protein: 2.4, carbs: 9.9, fat: 0.4, fiber: 4 },
  { id: 'lady_finger', name: 'Lady Finger / Bhindi (1 cup)', category: 'Vegetables', serving: '1 cup (100g)', calories: 33, protein: 1.9, carbs: 7.5, fat: 0.2, fiber: 3.2 },
  { id: 'beetroot', name: 'Beetroot (1 medium)', category: 'Vegetables', serving: '1 medium (82g)', calories: 35, protein: 1.3, carbs: 8, fat: 0.1, fiber: 2.3 },
  { id: 'cabbage', name: 'Cabbage / Patta Gobi (1 cup)', category: 'Vegetables', serving: '1 cup (89g)', calories: 22, protein: 1.1, carbs: 5.2, fat: 0.1, fiber: 2.2 },
  { id: 'mixed_veg_salad', name: 'Mixed Vegetable Salad', category: 'Vegetables', serving: '1 bowl (200g)', calories: 60, protein: 2.5, carbs: 12, fat: 0.5, fiber: 4 },

  // ══════════════════════════════════════════════════════════
  //  NUTS & SEEDS
  // ══════════════════════════════════════════════════════════
  { id: 'almonds_10', name: 'Almonds (10 pieces)', category: 'Nuts & Seeds', serving: '10 almonds (12g)', calories: 70, protein: 2.6, carbs: 2.6, fat: 6, fiber: 1.5 },
  { id: 'almonds_handful', name: 'Almonds (1 handful / 23 nuts)', category: 'Nuts & Seeds', serving: '28g', calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 3.5 },
  { id: 'peanuts_handful', name: 'Peanuts (roasted, handful)', category: 'Nuts & Seeds', serving: '30g', calories: 176, protein: 8, carbs: 5, fat: 15, fiber: 2 },
  { id: 'peanut_butter_1tbsp', name: 'Peanut Butter (1 tbsp)', category: 'Nuts & Seeds', serving: '1 tbsp (16g)', calories: 94, protein: 4, carbs: 3.4, fat: 8, fiber: 1 },
  { id: 'peanut_butter_2tbsp', name: 'Peanut Butter (2 tbsp)', category: 'Nuts & Seeds', serving: '2 tbsp (32g)', calories: 188, protein: 8, carbs: 6.9, fat: 16, fiber: 1.9 },
  { id: 'walnuts', name: 'Walnuts (1 oz / 14 halves)', category: 'Nuts & Seeds', serving: '28g', calories: 185, protein: 4.3, carbs: 3.9, fat: 18.5, fiber: 1.9 },
  { id: 'cashews', name: 'Cashews (1 oz)', category: 'Nuts & Seeds', serving: '28g', calories: 157, protein: 5.2, carbs: 8.6, fat: 12.4, fiber: 0.9 },
  { id: 'chia_seeds', name: 'Chia Seeds (1 tbsp)', category: 'Nuts & Seeds', serving: '12g', calories: 58, protein: 2, carbs: 5, fat: 3.7, fiber: 4.1 },
  { id: 'flax_seeds', name: 'Flaxseeds / Alsi (1 tbsp)', category: 'Nuts & Seeds', serving: '10g', calories: 55, protein: 1.9, carbs: 2.9, fat: 4.3, fiber: 2.8 },
  { id: 'sunflower_seeds', name: 'Sunflower Seeds (¼ cup)', category: 'Nuts & Seeds', serving: '35g', calories: 207, protein: 7.3, carbs: 7, fat: 18, fiber: 3 },
  { id: 'pumpkin_seeds', name: 'Pumpkin Seeds / Pepitas (¼ cup)', category: 'Nuts & Seeds', serving: '35g', calories: 197, protein: 9, carbs: 5.3, fat: 16, fiber: 1.8 },
  { id: 'sesame_seeds', name: 'Sesame Seeds / Til (1 tbsp)', category: 'Nuts & Seeds', serving: '9g', calories: 52, protein: 1.6, carbs: 2.1, fat: 4.5, fiber: 1.1 },
  { id: 'mixed_nuts_30', name: 'Mixed Nuts (30g)', category: 'Nuts & Seeds', serving: '30g', calories: 187, protein: 5, carbs: 6.6, fat: 17, fiber: 2 },
  { id: 'trail_mix', name: 'Trail Mix (nuts + dried fruit)', category: 'Nuts & Seeds', serving: '¼ cup (40g)', calories: 220, protein: 5, carbs: 26, fat: 12, fiber: 3 },

  // ══════════════════════════════════════════════════════════
  //  PRE-WORKOUT
  // ══════════════════════════════════════════════════════════
  { id: 'pre_banana', name: 'Banana (pre-workout)', category: 'Pre-Workout', serving: '1 large (136g)', calories: 121, protein: 1.5, carbs: 31, fat: 0.5, fiber: 3.5 },
  { id: 'pre_dates_3', name: 'Dates (3 pieces, quick energy)', category: 'Pre-Workout', serving: '3 dates (72g)', calories: 200, protein: 1.2, carbs: 54, fat: 0.2, fiber: 4.8 },
  { id: 'pre_oats_banana', name: 'Oats + Banana Bowl', category: 'Pre-Workout', serving: '1 bowl (300g)', calories: 380, protein: 10, carbs: 72, fat: 5, fiber: 7 },
  { id: 'pre_rice_chicken', name: 'Rice + Chicken (pre-workout meal)', category: 'Pre-Workout', serving: '1 bowl (350g)', calories: 480, protein: 36, carbs: 55, fat: 8, fiber: 1.5 },
  { id: 'pre_toast_pb', name: 'Whole Wheat Toast + Peanut Butter', category: 'Pre-Workout', serving: '2 slices + 2 tbsp (90g)', calories: 340, protein: 14, carbs: 32, fat: 18, fiber: 4 },
  { id: 'pre_sweet_potato', name: 'Sweet Potato (pre-workout carb)', category: 'Pre-Workout', serving: '1 medium (150g)', calories: 130, protein: 2.4, carbs: 30, fat: 0.1, fiber: 4.4 },
  { id: 'pre_coffee', name: 'Black Coffee (pre-workout)', category: 'Pre-Workout', serving: '1 cup (240ml)', calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0 },
  { id: 'pre_workout_supp', name: 'Pre-Workout Supplement', category: 'Pre-Workout', serving: '1 scoop (10g)', calories: 15, protein: 0, carbs: 4, fat: 0, fiber: 0 },
  { id: 'pre_bcaa', name: 'BCAA Drink', category: 'Pre-Workout', serving: '1 serving (10g)', calories: 10, protein: 5, carbs: 0, fat: 0, fiber: 0 },
  { id: 'pre_fruit_rice', name: 'Fruit + Rice Cakes', category: 'Pre-Workout', serving: '1 banana + 3 rice cakes', calories: 226, protein: 3.6, carbs: 52.9, fat: 1.3, fiber: 3.7 },
  { id: 'pre_roti_egg', name: 'Roti + Egg (pre-workout meal)', category: 'Pre-Workout', serving: '2 roti + 2 eggs (180g)', calories: 384, protein: 19.6, carbs: 44.8, fat: 14.6, fiber: 5 },
  { id: 'pre_poha', name: 'Poha (light pre-workout meal)', category: 'Pre-Workout', serving: '1 bowl (150g)', calories: 244, protein: 4.5, carbs: 49, fat: 4.5, fiber: 2 },
  { id: 'pre_mango_shake', name: 'Mango Banana Shake', category: 'Pre-Workout', serving: '1 glass (350ml)', calories: 310, protein: 4, carbs: 66, fat: 2.5, fiber: 4 },
  { id: 'pre_energy_bar', name: 'Energy / Granola Bar', category: 'Pre-Workout', serving: '1 bar (45g)', calories: 185, protein: 3.5, carbs: 32, fat: 5, fiber: 2 },

  // ══════════════════════════════════════════════════════════
  //  POST-WORKOUT
  // ══════════════════════════════════════════════════════════
  { id: 'post_whey_shake', name: 'Whey Protein Shake (1 scoop)', category: 'Post-Workout', serving: '1 scoop + water (300ml)', calories: 120, protein: 24, carbs: 3, fat: 2, fiber: 0 },
  { id: 'post_whey_milk', name: 'Whey Protein with Milk', category: 'Post-Workout', serving: '1 scoop + 300ml milk', calories: 315, protein: 34, carbs: 17.4, fat: 12, fiber: 0 },
  { id: 'post_mass_gainer', name: 'Mass Gainer Shake', category: 'Post-Workout', serving: '2 scoops + milk (600ml)', calories: 730, protein: 35, carbs: 110, fat: 10, fiber: 3 },
  { id: 'post_chicken_rice', name: 'Chicken + Rice (post-workout)', category: 'Post-Workout', serving: '150g chicken + 1 cup rice', calories: 490, protein: 48, carbs: 53, fat: 7, fiber: 1 },
  { id: 'post_eggs_toast', name: '3 Boiled Eggs + Toast', category: 'Post-Workout', serving: '3 eggs + 2 slices (230g)', calories: 390, protein: 27, carbs: 25.2, fat: 22, fiber: 3.8 },
  { id: 'post_greek_yogurt_banana', name: 'Greek Yogurt + Banana', category: 'Post-Workout', serving: '170g + 1 banana', calories: 275, protein: 18.3, carbs: 33, fat: 9.4, fiber: 3.1 },
  { id: 'post_chocolate_milk', name: 'Chocolate Milk (post-workout)', category: 'Post-Workout', serving: '1 glass (300ml)', calories: 270, protein: 9, carbs: 43, fat: 7, fiber: 1 },
  { id: 'post_paneer_roti', name: 'Paneer + Roti (2 roti)', category: 'Post-Workout', serving: '100g paneer + 2 roti (180g)', calories: 505, protein: 25, carbs: 45.2, fat: 24.5, fiber: 5 },
  { id: 'post_egg_rice', name: '3 Egg Omelette + Rice', category: 'Post-Workout', serving: '3 eggs + 1 cup rice (330g)', calories: 460, protein: 23, carbs: 55, fat: 16, fiber: 0.8 },
  { id: 'post_tuna_rice', name: 'Tuna + Rice Bowl', category: 'Post-Workout', serving: '1 can tuna + 1 cup rice', calories: 439, protein: 47.4, carbs: 53, fat: 1.8, fiber: 0.6 },
  { id: 'post_banana_pbutter', name: 'Banana + Peanut Butter', category: 'Post-Workout', serving: '1 banana + 2 tbsp PB', calories: 293, protein: 9.3, carbs: 33.9, fat: 16.4, fiber: 5 },
  { id: 'post_casein', name: 'Casein Protein Shake (night)', category: 'Post-Workout', serving: '1 scoop + milk (350ml)', calories: 287, protein: 31, carbs: 19, fat: 8, fiber: 0 },
  { id: 'post_cottage_cheese', name: 'Cottage Cheese + Fruit', category: 'Post-Workout', serving: '200g + ½ cup fruit (250g)', calories: 225, protein: 23, carbs: 18, fat: 5, fiber: 2 },
  { id: 'post_salmon_sweet_potato', name: 'Salmon + Sweet Potato', category: 'Post-Workout', serving: '150g salmon + 1 medium SP', calories: 442, protein: 32, carbs: 30, fat: 19.6, fiber: 3.9 },
  { id: 'post_ragi_shake', name: 'Ragi Milk Shake', category: 'Post-Workout', serving: '1 glass (400ml)', calories: 280, protein: 9, carbs: 48, fat: 6, fiber: 4 },
  { id: 'post_sattu', name: 'Sattu Shake (roasted gram)', category: 'Post-Workout', serving: '2 tbsp sattu + milk (350ml)', calories: 285, protein: 15, carbs: 42, fat: 7, fiber: 4 },

  // ══════════════════════════════════════════════════════════
  //  SUPPLEMENTS
  // ══════════════════════════════════════════════════════════
  { id: 'supp_whey', name: 'Whey Protein (1 scoop)', category: 'Supplements', serving: '1 scoop (30g)', calories: 120, protein: 24, carbs: 3, fat: 2, fiber: 0 },
  { id: 'supp_whey_isolate', name: 'Whey Isolate (1 scoop)', category: 'Supplements', serving: '1 scoop (32g)', calories: 115, protein: 27, carbs: 1, fat: 0.5, fiber: 0 },
  { id: 'supp_casein', name: 'Casein Protein (1 scoop)', category: 'Supplements', serving: '1 scoop (34g)', calories: 120, protein: 24, carbs: 4, fat: 1, fiber: 0 },
  { id: 'supp_mass_gainer', name: 'Mass Gainer (1 serving)', category: 'Supplements', serving: '100g', calories: 380, protein: 20, carbs: 65, fat: 5, fiber: 2 },
  { id: 'supp_creatine', name: 'Creatine Monohydrate (5g)', category: 'Supplements', serving: '1 tsp (5g)', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  { id: 'supp_bcaa', name: 'BCAA (1 serving)', category: 'Supplements', serving: '10g', calories: 10, protein: 5, carbs: 0, fat: 0, fiber: 0 },
  { id: 'supp_pre_workout', name: 'Pre-Workout (1 scoop)', category: 'Supplements', serving: '10g', calories: 15, protein: 0, carbs: 4, fat: 0, fiber: 0 },
  { id: 'supp_protein_bar', name: 'Protein Bar', category: 'Supplements', serving: '1 bar (60g)', calories: 220, protein: 20, carbs: 25, fat: 6, fiber: 3 },
  { id: 'supp_omega3', name: 'Fish Oil / Omega-3 (1 capsule)', category: 'Supplements', serving: '1 capsule (1g)', calories: 9, protein: 0, carbs: 0, fat: 1, fiber: 0 },
  { id: 'supp_multivitamin', name: 'Multivitamin Tablet', category: 'Supplements', serving: '1 tablet', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },

  // ══════════════════════════════════════════════════════════
  //  BEVERAGES
  // ══════════════════════════════════════════════════════════
  { id: 'bev_black_coffee', name: 'Black Coffee', category: 'Beverages', serving: '1 cup (240ml)', calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0 },
  { id: 'bev_coffee_milk', name: 'Coffee with Milk (no sugar)', category: 'Beverages', serving: '1 cup (240ml)', calories: 55, protein: 2.8, carbs: 5.5, fat: 2.8, fiber: 0 },
  { id: 'bev_cutting_chai', name: 'Cutting Chai (½ milk)', category: 'Beverages', serving: '1 cup (120ml)', calories: 55, protein: 2, carbs: 6, fat: 2.5, fiber: 0 },
  { id: 'bev_masala_chai', name: 'Masala Chai (full milk)', category: 'Beverages', serving: '1 cup (200ml)', calories: 95, protein: 3.5, carbs: 10, fat: 4, fiber: 0 },
  { id: 'bev_green_tea', name: 'Green Tea', category: 'Beverages', serving: '1 cup (240ml)', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  { id: 'bev_oj', name: 'Orange Juice (fresh)', category: 'Beverages', serving: '1 glass (250ml)', calories: 115, protein: 1.7, carbs: 27, fat: 0.5, fiber: 0.5 },
  { id: 'bev_coconut_water', name: 'Coconut Water / Nariyal Pani', category: 'Beverages', serving: '1 glass (240ml)', calories: 46, protein: 1.7, carbs: 8.9, fat: 0.5, fiber: 2.6 },
  { id: 'bev_lassi_sweet', name: 'Sweet Lassi', category: 'Beverages', serving: '1 glass (250ml)', calories: 193, protein: 5.5, carbs: 30, fat: 6.5, fiber: 0 },
  { id: 'bev_salted_lassi', name: 'Salted Lassi (Namkeen)', category: 'Beverages', serving: '1 glass (250ml)', calories: 100, protein: 5, carbs: 9, fat: 4.5, fiber: 0 },
  { id: 'bev_buttermilk', name: 'Chaas / Buttermilk', category: 'Beverages', serving: '1 glass (250ml)', calories: 63, protein: 4, carbs: 6, fat: 2.5, fiber: 0 },
  { id: 'bev_sattu_drink', name: 'Sattu Sharbat', category: 'Beverages', serving: '1 glass (250ml)', calories: 198, protein: 8.5, carbs: 36, fat: 2, fiber: 3.5 },
  { id: 'bev_banana_milk', name: 'Banana Milk Shake', category: 'Beverages', serving: '1 glass (350ml)', calories: 300, protein: 9, carbs: 53, fat: 7, fiber: 3.1 },
  { id: 'bev_mango_shake', name: 'Mango Shake', category: 'Beverages', serving: '1 glass (350ml)', calories: 290, protein: 7, carbs: 52, fat: 6, fiber: 2.5 },
  { id: 'bev_sports', name: 'Sports Drink (Gatorade)', category: 'Beverages', serving: '500ml bottle', calories: 130, protein: 0, carbs: 34, fat: 0, fiber: 0 },
  { id: 'bev_water', name: 'Water', category: 'Beverages', serving: '1 glass (250ml)', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },

  // ══════════════════════════════════════════════════════════
  //  SNACKS & FAST FOOD
  // ══════════════════════════════════════════════════════════
  { id: 'snack_dark_choc', name: 'Dark Chocolate (70%+)', category: 'Snacks & Fast Food', serving: '2 squares (20g)', calories: 120, protein: 1.8, carbs: 10, fat: 8.8, fiber: 1.4 },
  { id: 'snack_oat_cookie', name: 'Oat Cookies (2 pieces)', category: 'Snacks & Fast Food', serving: '2 cookies (40g)', calories: 185, protein: 3, carbs: 28, fat: 7, fiber: 2 },
  { id: 'snack_popcorn', name: 'Popcorn (air-popped, 3 cups)', category: 'Snacks & Fast Food', serving: '3 cups (24g)', calories: 93, protein: 3, carbs: 19, fat: 1.1, fiber: 3.6 },
  { id: 'snack_chips', name: 'Potato Chips (small bag)', category: 'Snacks & Fast Food', serving: '30g', calories: 162, protein: 2, carbs: 15, fat: 10.5, fiber: 1.2 },
  { id: 'snack_mixed_nuts', name: 'Mixed Nuts (¼ cup)', category: 'Snacks & Fast Food', serving: '35g', calories: 219, protein: 5.9, carbs: 7.7, fat: 20, fiber: 2.4 },
  { id: 'snack_pizza', name: 'Pizza (1 slice, cheese)', category: 'Snacks & Fast Food', serving: '1 slice (107g)', calories: 272, protein: 12, carbs: 34, fat: 10, fiber: 2 },
  { id: 'snack_burger', name: 'Beef Burger (fast food)', category: 'Snacks & Fast Food', serving: '1 burger (220g)', calories: 540, protein: 28, carbs: 43, fat: 28, fiber: 2 },
  { id: 'snack_sub', name: 'Subway Chicken Sandwich (6 inch)', category: 'Snacks & Fast Food', serving: '1 sub (240g)', calories: 330, protein: 23, carbs: 40, fat: 7, fiber: 4 },
  { id: 'snack_boiled_corn', name: 'Boiled Corn (bhutta, no butter)', category: 'Snacks & Fast Food', serving: '1 cob (140g)', calories: 112, protein: 4.2, carbs: 25, fat: 1.6, fiber: 2.9 },
  { id: 'snack_banana_chips', name: 'Banana Chips', category: 'Snacks & Fast Food', serving: '½ cup (40g)', calories: 218, protein: 1.1, carbs: 29, fat: 13, fiber: 2.8 },

  // ══════════════════════════════════════════════════════════
  //  SWEETS & DESSERTS
  // ══════════════════════════════════════════════════════════
  { id: 'sweet_gulab_jamun', name: 'Gulab Jamun (2 pieces)', category: 'Sweets & Desserts', serving: '2 pieces (100g)', calories: 318, protein: 4.5, carbs: 56, fat: 9, fiber: 0.5 },
  { id: 'sweet_jalebi', name: 'Jalebi (2 pieces)', category: 'Sweets & Desserts', serving: '2 pieces (60g)', calories: 228, protein: 1.5, carbs: 50, fat: 3.5, fiber: 0.5 },
  { id: 'sweet_rasgulla', name: 'Rasgulla (2 pieces)', category: 'Sweets & Desserts', serving: '2 pieces (120g)', calories: 204, protein: 6, carbs: 40, fat: 2.5, fiber: 0 },
  { id: 'sweet_barfi', name: 'Barfi / Burfi (2 pieces)', category: 'Sweets & Desserts', serving: '2 pieces (60g)', calories: 260, protein: 5, carbs: 38, fat: 10, fiber: 0.5 },
  { id: 'sweet_kheer', name: 'Rice Kheer', category: 'Sweets & Desserts', serving: '1 cup (200g)', calories: 285, protein: 7, carbs: 50, fat: 7, fiber: 0.5 },
  { id: 'sweet_halwa', name: 'Suji / Rava Halwa', category: 'Sweets & Desserts', serving: '1 bowl (150g)', calories: 360, protein: 5, carbs: 58, fat: 13, fiber: 1 },
  { id: 'sweet_ladoo_besan', name: 'Besan Ladoo (1 piece)', category: 'Sweets & Desserts', serving: '1 piece (50g)', calories: 215, protein: 4.5, carbs: 28, fat: 10, fiber: 2 },
  { id: 'sweet_ladoo_boondi', name: 'Boondi Ladoo (1 piece)', category: 'Sweets & Desserts', serving: '1 piece (50g)', calories: 200, protein: 3, carbs: 32, fat: 7, fiber: 1 },
  { id: 'sweet_ice_cream', name: 'Ice Cream (1 scoop)', category: 'Sweets & Desserts', serving: '1 scoop (66g)', calories: 137, protein: 2.3, carbs: 16, fat: 7.3, fiber: 0.5 },
  { id: 'sweet_chocolate_brownie', name: 'Chocolate Brownie', category: 'Sweets & Desserts', serving: '1 piece (60g)', calories: 243, protein: 3.5, carbs: 33, fat: 12, fiber: 1.5 },
];

// Quick search helper
export const searchFoods = (query, category = 'All') => {
  const q = query.toLowerCase().trim();
  return foods.filter((f) => {
    const matchesQuery = !q || f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
    const matchesCat = category === 'All' || f.category === category;
    return matchesQuery && matchesCat;
  });
};

// Get foods for a specific meal's suggested categories (top picks)
export const getSuggestedFoods = (mealKey) => {
  const cats = mealSuggestions[mealKey] || [];
  return foods.filter((f) => cats.includes(f.category)).slice(0, 30);
};

export default foods;
