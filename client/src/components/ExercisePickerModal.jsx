import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Check,
  Filter,
} from 'lucide-react';
import { MUSCLE_GROUPS, getExercisesByMuscleGroup } from '../data/exerciseLibrary';

const CATEGORY_COLORS = {
  compound: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  isolation: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  mobility: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cardio: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

const DIFFICULTY_COLORS = {
  beginner: 'text-emerald-400',
  intermediate: 'text-amber-400',
  advanced: 'text-red-400',
};

export default function ExercisePickerModal({ allExercises, currentIds, onAdd, onClose }) {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [justAdded, setJustAdded] = useState(new Set());

  const currentSet = useMemo(() => new Set(currentIds), [currentIds]);

  const grouped = useMemo(() => getExercisesByMuscleGroup(allExercises), [allExercises]);

  const allList = useMemo(() => Object.values(allExercises), [allExercises]);

  const filtered = useMemo(() => {
    let list = activeGroup === 'All' ? allList : (grouped[activeGroup] || []);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          (ex.primaryMuscles || []).some((m) => m.toLowerCase().includes(q)) ||
          (ex.equipment || '').toLowerCase().includes(q) ||
          (ex.category || '').toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      const aIn = currentSet.has(a.id) || justAdded.has(a.id);
      const bIn = currentSet.has(b.id) || justAdded.has(b.id);
      if (aIn !== bIn) return aIn ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }, [allList, grouped, activeGroup, search, currentSet, justAdded]);

  const handleAdd = (ex) => {
    onAdd(ex);
    setJustAdded((prev) => new Set(prev).add(ex.id));
  };

  const groupCounts = useMemo(() => {
    const counts = { All: allList.length };
    MUSCLE_GROUPS.forEach((g) => { counts[g] = (grouped[g] || []).length; });
    return counts;
  }, [allList, grouped]);

  return createPortal(
    <div className="fixed inset-0 z-[150] flex flex-col bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex flex-col w-full max-w-2xl mx-auto mt-4 sm:mt-8 flex-1 min-h-0 bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-slide-up sm:max-h-[85vh] sm:mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/60 shrink-0">
          <Dumbbell size={20} className="text-indigo-400 shrink-0" />
          <h2 className="text-base font-bold text-white flex-1">Add Exercise</h2>
          <button type="button" onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* ── Search ── */}
        <div className="px-4 py-3 border-b border-slate-700/40 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercises, muscles, equipment…"
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
              autoFocus
            />
          </div>
        </div>

        {/* ── Muscle group filter tabs ── */}
        <div className="px-4 py-2 border-b border-slate-700/40 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {['All', ...MUSCLE_GROUPS].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setActiveGroup(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  activeGroup === g
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                {g}
                <span className={`ml-1 ${activeGroup === g ? 'text-indigo-200' : 'text-slate-600'}`}>
                  {groupCounts[g] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Exercise list ── */}
        <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2 space-y-1.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No exercises match your search
            </div>
          ) : (
            filtered.map((ex) => {
              const isActive = currentSet.has(ex.id) || justAdded.has(ex.id);
              const isExpanded = expandedId === ex.id;

              return (
                <div
                  key={ex.id}
                  className={`rounded-xl border transition-all ${
                    isActive
                      ? 'bg-emerald-900/20 border-emerald-700/40'
                      : 'bg-slate-800/60 border-slate-700/40 hover:border-slate-600'
                  }`}
                >
                  {/* Main row */}
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                      className="flex-1 flex items-center gap-3 text-left min-w-0"
                    >
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-900/40 to-slate-800 overflow-hidden shrink-0 relative">
                        {ex.image && (
                          <img
                            src={ex.image} alt="" className="w-full h-full object-cover relative z-[1]" loading="lazy"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Dumbbell size={16} className="text-indigo-400/40" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{ex.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-slate-500">
                            {(ex.primaryMuscles || []).join(', ')}
                          </span>
                          {ex.category && (
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[ex.category] || ''}`}>
                              {ex.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {isExpanded ? <ChevronUp size={14} className="text-slate-500 shrink-0" /> : <ChevronDown size={14} className="text-slate-500 shrink-0" />}
                    </button>

                    {/* Add button */}
                    {isActive ? (
                      <div className="w-9 h-9 rounded-lg bg-emerald-600/20 flex items-center justify-center shrink-0">
                        <Check size={16} className="text-emerald-400" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAdd(ex)}
                        className="w-9 h-9 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 flex items-center justify-center text-indigo-400 hover:text-indigo-300 transition-all shrink-0 active:scale-90"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 space-y-2 animate-fade-in">
                      <div className="h-px bg-slate-700/40" />

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-700/30 rounded-lg py-1.5 px-2">
                          <p className="text-[10px] text-slate-500 uppercase">Sets</p>
                          <p className="text-sm font-bold text-white">{ex.sets}</p>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg py-1.5 px-2">
                          <p className="text-[10px] text-slate-500 uppercase">Reps</p>
                          <p className="text-sm font-bold text-white">{ex.reps}</p>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg py-1.5 px-2">
                          <p className="text-[10px] text-slate-500 uppercase">Rest</p>
                          <p className="text-sm font-bold text-white">{ex.rest}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="text-slate-500">Equipment:</span>
                        <span className="text-slate-300">{ex.equipment}</span>
                        <span className="mx-1 text-slate-600">·</span>
                        <span className={`font-semibold capitalize ${DIFFICULTY_COLORS[ex.difficulty] || 'text-slate-400'}`}>
                          {ex.difficulty}
                        </span>
                      </div>

                      {ex.instructions?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Form cues</p>
                          <ol className="text-xs text-slate-400 space-y-0.5 list-decimal list-inside">
                            {ex.instructions.slice(0, 3).map((inst, i) => (
                              <li key={i}>{inst}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {ex.tips && (
                        <p className="text-xs text-indigo-300/80 italic">💡 {ex.tips}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-3 border-t border-slate-700/60 shrink-0 flex items-center justify-between">
          <span className="text-xs text-slate-500">{filtered.length} exercises</span>
          <button type="button" onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 active:scale-95 transition-all">
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
