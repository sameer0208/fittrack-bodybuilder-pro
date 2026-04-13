import { useState, useEffect, useRef } from 'react';
import { X, Search, Plus, Star } from 'lucide-react';
import { foods, foodCategories, searchFoods, getSuggestedFoods, mealSuggestions } from '../data/foods';

export default function FoodSearchModal({ meal, onAdd, onClose }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const inputRef = useRef(null);
  const showSuggested = !query && category === 'All';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (showSuggested) {
      setResults(getSuggestedFoods(meal));
    } else {
      setResults(searchFoods(query, category).slice(0, 100));
    }
    setSelected(null);
  }, [query, category, showSuggested]);

  const handleAdd = () => {
    if (!selected) return;
    onAdd({
      foodId: selected.id,
      name: selected.name,
      category: selected.category,
      servingLabel: selected.serving,
      servingQty: qty,
      calories: Math.round(selected.calories * qty),
      protein: Math.round(selected.protein * qty * 10) / 10,
      carbs: Math.round(selected.carbs * qty * 10) / 10,
      fat: Math.round(selected.fat * qty * 10) / 10,
      fiber: Math.round(selected.fiber * qty * 10) / 10,
    });
    // Reset for next addition
    setSelected(null);
    setQuery('');
    setQty(1);
    onClose();
  };

  const mealLabel = {
    breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner',
    snacks: '🍎 Snacks', pre_workout: '⚡ Pre-Workout', post_workout: '💪 Post-Workout',
  }[meal] || meal;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-700 shrink-0">
          <div>
            <h3 className="font-bold text-white text-lg">Add Food</h3>
            <p className="text-xs text-slate-400 mt-0.5">→ {mealLabel}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search food (e.g. chicken, roti, oats...)"
              className="input-field pl-10 text-sm"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="px-4 pb-2 shrink-0 overflow-hidden">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none w-full">
            {foodCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  category === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-1.5">
          {showSuggested && results.length > 0 && (
            <div className="flex items-center gap-2 py-1.5 text-xs text-amber-400 font-semibold">
              <Star size={12} fill="currentColor" /> Suggested for {mealLabel.replace(/^[^ ]+ /, '')}
            </div>
          )}
          {results.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No foods found for "{query}"
            </div>
          ) : (
            results.map((food) => {
              const isSelected = selected?.id === food.id;
              return (
                <div
                  key={food.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => { setSelected(isSelected ? null : food); setQty(1); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(isSelected ? null : food); setQty(1); }}}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-600/15'
                      : 'border-slate-700/50 bg-slate-700/20 hover:border-slate-600 hover:bg-slate-700/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white leading-tight truncate">{food.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{food.serving}</div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <span className="text-amber-400 font-semibold">{food.calories} kcal</span>
                        <span className="text-blue-400">P: {food.protein}g</span>
                        <span className="text-orange-400">C: {food.carbs}g</span>
                        <span className="text-yellow-400">F: {food.fat}g</span>
                      </div>
                    </div>
                    <span className={`badge shrink-0 text-xs ${
                      food.category === 'Proteins' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      food.category === 'Indian Foods' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      food.category === 'Supplements' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      'bg-slate-600/50 text-slate-400'
                    }`}>{food.category}</span>
                  </div>

                  {/* Quantity selector — shown when selected */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-indigo-500/20 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs text-slate-400 font-medium">Servings:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQty((q) => Math.max(0.5, q - 0.5))}
                          className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 font-bold text-lg leading-none"
                        >−</button>
                        <span className="w-10 text-center font-bold text-white text-sm">{qty}×</span>
                        <button
                          onClick={() => setQty((q) => Math.min(10, q + 0.5))}
                          className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 font-bold text-lg leading-none"
                        >+</button>
                      </div>
                      <div className="ml-auto text-sm font-bold text-amber-400">
                        {Math.round(food.calories * qty)} kcal
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Add Button */}
        <div className="p-4 border-t border-slate-700 shrink-0">
          <button
            onClick={handleAdd}
            disabled={!selected}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            {selected ? `Add ${selected.name} (${Math.round(selected.calories * qty)} kcal)` : 'Select a food item'}
          </button>
        </div>
      </div>
    </div>
  );
}
