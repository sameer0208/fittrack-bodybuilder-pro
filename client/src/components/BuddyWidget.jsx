import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import toast from 'react-hot-toast';
import {
  Users, Flame, Trophy, MessageCircle, Zap,
  ChevronDown, ChevronUp, Send, Swords, Activity, Bell,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

dayjs.extend(relativeTime);

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const NUDGE_TYPES = [
  { type: 'workout', emoji: '💪', label: 'Hit the gym!' },
  { type: 'motivation', emoji: '🔥', label: 'Stay strong!' },
  { type: 'competition', emoji: '🏆', label: 'Challenge!' },
];

const CHALLENGE_TYPES = [
  { type: 'weekly_workouts', label: 'Most Workouts', emoji: '🏋️' },
  { type: 'weekly_volume', label: 'Most Volume', emoji: '⚡' },
  { type: 'weekly_streak', label: 'Best Streak', emoji: '🔥' },
];

const ACTIVITY_ICONS = {
  workout_completed: '🏋️',
  streak_milestone: '🔥',
  nutrition_logged: '🥗',
  weight_logged: '⚖️',
  achievement_unlocked: '🏆',
  challenge_won: '👑',
  nudge: '👊',
};

// Lightweight client-side content pre-check (server is the real gatekeeper)
const URL_RE = /(?:https?:\/\/|www\.)[\S]+/i;
const DOMAIN_RE = /\b[\w-]+\.(com|org|net|in|co|io|me|xyz|info|app|site|dev)\b/i;
const QUICK_BLOCK_RE = (() => {
  const words = [
    'fuck','shit','bitch','cunt','dick','cock','pussy','whore','slut','nigger','nigga','faggot',
    'bsdk','bhosdk','bhosadike','madarchod','behenchod','benchod','chutiya','chutiye','chut',
    'gandu','gaandu','randi','lode','lauda','lund','harami','bakchod',
    'mc','bc','bkl','mchod',
    'porn','xnxx','xvideos','pornhub','onlyfans',
    'kill you','rape','bomb','murder','suicide',
  ];
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(?:^|\\b|[^a-z])(?:${escaped.join('|')})(?:$|\\b|[^a-z])`, 'i');
})();

function quickContentCheck(text) {
  if (!text) return null;
  const t = text.toLowerCase().replace(/[._\-*~]+/g, '');
  if (URL_RE.test(text) || DOMAIN_RE.test(text)) return 'Links are not allowed';
  if (QUICK_BLOCK_RE.test(t)) return 'This message may be blocked';
  return null;
}

const AVATAR_COLORS = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-red-500',
  'from-violet-500 to-indigo-500',
];

function BuddyCard({ buddy, you, isActive, unreadCount, onSelect }) {
  const lastActive = buddy.lastWorkoutDate ? dayjs(buddy.lastWorkoutDate).fromNow() : 'Never';
  const colorIdx = buddy.name.charCodeAt(0) % AVATAR_COLORS.length;

  return (
    <button onClick={onSelect}
      className={`w-full p-3 flex items-center gap-3 rounded-xl transition-all ${
        isActive ? 'bg-purple-500/10 border border-purple-500/30' : 'hover:bg-slate-700/20 border border-transparent'
      }`}>
      <div className={`w-10 h-10 bg-gradient-to-br ${AVATAR_COLORS[colorIdx]} rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 relative`}>
        {buddy.name?.[0]?.toUpperCase() || 'B'}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">{unreadCount}</span>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="font-bold text-white text-xs truncate">{buddy.name}</div>
        <div className="text-[10px] text-slate-500">Active {lastActive}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-black text-orange-400 flex items-center gap-1"><Flame size={10} /> {buddy.streak}</div>
        <div className="text-[10px] text-slate-500">{buddy.weekWorkouts}/wk</div>
      </div>
    </button>
  );
}

function BuddyDetail({ buddy, you, currentUserId }) {
  const [activities, setActivities] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [inputWarning, setInputWarning] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  const pairId = buddy.pairId;

  const fetchActivity = useCallback(async () => {
    try { const { data } = await API.get(`/social/buddy/activity/${pairId}`); setActivities(data); } catch {}
  }, [pairId]);

  const fetchChallenge = useCallback(async () => {
    try { const { data } = await API.get(`/social/buddy/challenge/${pairId}`); setChallenge(data.active ? data.challenge : null); } catch {}
  }, [pairId]);

  const fetchMessages = useCallback(async () => {
    try { const { data } = await API.get(`/social/buddy/messages/${pairId}`); setMessages(data); } catch {}
  }, [pairId]);

  useEffect(() => {
    fetchActivity();
    fetchChallenge();
  }, [fetchActivity, fetchChallenge]);

  useEffect(() => {
    if (activeTab === 'chat') fetchMessages();
  }, [activeTab, fetchMessages]);

  useEffect(() => {
    if (activeTab !== 'chat') return;
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [activeTab, fetchMessages]);

  useEffect(() => {
    if (activeTab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const sendNudge = async (type) => {
    try { await API.post(`/social/buddy/nudge/${pairId}`, { type }); toast.success('Nudge sent!'); }
    catch { toast.error('Failed to send nudge'); }
  };

  const startChallenge = async (type) => {
    try { await API.post(`/social/buddy/challenge/${pairId}`, { type }); toast.success('Challenge started!'); fetchChallenge(); }
    catch { toast.error('Failed to start challenge'); }
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || sending) return;
    setSending(true);
    try {
      await API.post(`/social/buddy/messages/${pairId}`, { text: msgInput.trim() });
      setMsgInput('');
      fetchMessages();
    } catch (err) {
      const data = err.response?.data;
      if (data?.blocked) {
        toast.error(data.message || 'Message blocked by content filter', { duration: 4000, icon: '🚫' });
      } else {
        toast.error('Failed to send');
      }
    } finally { setSending(false); }
  };

  return (
    <div className="animate-fade-in">
      {/* Tabs */}
      <div className="flex border-b border-slate-700/40">
        {[
          { key: 'stats', label: 'Stats', icon: Activity },
          { key: 'feed', label: 'Feed', icon: Bell },
          { key: 'challenge', label: 'Challenge', icon: Swords },
          { key: 'chat', label: 'Chat', icon: MessageCircle },
        ].map((tab) => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors ${
              activeTab === tab.key ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'
            }`}>
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="text-xs font-bold text-indigo-400">You</div>
            <div className="text-[10px] text-slate-500 uppercase">vs</div>
            <div className="text-xs font-bold text-purple-400">{buddy.name}</div>
          </div>
          {[
            { label: 'Streak', myVal: you?.streak || 0, buddyVal: buddy.streak, icon: '🔥' },
            { label: 'This Week', myVal: you?.weekWorkouts || 0, buddyVal: buddy.weekWorkouts, icon: '📅' },
            { label: 'Total', myVal: you?.totalWorkouts || 0, buddyVal: buddy.totalWorkouts, icon: '🏋️' },
          ].map((row) => (
            <div key={row.label} className="grid grid-cols-3 gap-2 items-center">
              <div className={`text-center text-sm font-black ${row.myVal > row.buddyVal ? 'text-emerald-400' : row.myVal < row.buddyVal ? 'text-slate-400' : 'text-white'}`}>
                {row.myVal}
              </div>
              <div className="text-center text-[10px] text-slate-500">{row.icon} {row.label}</div>
              <div className={`text-center text-sm font-black ${row.buddyVal > row.myVal ? 'text-emerald-400' : row.buddyVal < row.myVal ? 'text-slate-400' : 'text-white'}`}>
                {row.buddyVal}
              </div>
            </div>
          ))}

          {buddy.lastWorkout && (
            <div className="p-2.5 bg-slate-700/30 rounded-xl">
              <div className="text-[10px] text-slate-500 mb-1">Last workout</div>
              <div className="text-xs font-semibold text-white">{buddy.lastWorkout.name}</div>
              <div className="text-[10px] text-slate-400">
                {buddy.lastWorkout.volume ? `${Math.round(buddy.lastWorkout.volume).toLocaleString()}kg` : ''} · {dayjs(buddy.lastWorkout.date).fromNow()}
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] text-slate-500 mb-1.5">Send a nudge</div>
            <div className="flex gap-1.5">
              {NUDGE_TYPES.map((n) => (
                <button key={n.type} onClick={() => sendNudge(n.type)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] font-semibold text-purple-300 hover:bg-purple-500/20 transition-colors">
                  {n.emoji} {n.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activity Feed Tab */}
      {activeTab === 'feed' && (
        <div className="p-4 max-h-64 overflow-y-auto space-y-2">
          {activities.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No recent activity from {buddy.name} yet.</p>
          ) : activities.map((a) => (
            <div key={a._id} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-700/20">
              <span className="text-lg shrink-0">{ACTIVITY_ICONS[a.type] || '📌'}</span>
              <div className="min-w-0">
                <p className="text-xs text-slate-200 leading-relaxed">{a.message}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{dayjs(a.createdAt).fromNow()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Challenge Tab */}
      {activeTab === 'challenge' && (
        <div className="p-4 space-y-3">
          {challenge ? (
            <div className="p-3 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1"><Trophy size={12} /> Weekly Challenge</span>
                <span className="text-[10px] text-slate-500">Ends {dayjs(challenge.weekEnd).fromNow()}</span>
              </div>
              <div className="text-xs text-slate-300 mb-3">
                {challenge.type === 'weekly_workouts' ? '🏋️ Most Workouts' : challenge.type === 'weekly_volume' ? '⚡ Most Volume' : '🔥 Best Streak'}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className={`text-xl font-black ${challenge.myScore >= challenge.buddyScore ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {challenge.type === 'weekly_volume' ? `${Math.round(challenge.myScore / 1000)}k` : challenge.myScore}
                  </div>
                  <div className="text-[10px] text-slate-500">You</div>
                </div>
                <div className="text-lg font-bold text-slate-600">vs</div>
                <div className="text-center">
                  <div className={`text-xl font-black ${challenge.buddyScore >= challenge.myScore ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {challenge.type === 'weekly_volume' ? `${Math.round(challenge.buddyScore / 1000)}k` : challenge.buddyScore}
                  </div>
                  <div className="text-[10px] text-slate-500">{buddy.name}</div>
                </div>
              </div>
              {challenge.myScore > challenge.buddyScore && <p className="text-[10px] text-emerald-400 text-center mt-2">You're winning! Keep it up!</p>}
              {challenge.buddyScore > challenge.myScore && <p className="text-[10px] text-amber-400 text-center mt-2">{buddy.name} is ahead — time to step up!</p>}
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-400 mb-3">Start a weekly challenge with {buddy.name}!</p>
              <div className="space-y-1.5">
                {CHALLENGE_TYPES.map((c) => (
                  <button key={c.type} onClick={() => startChallenge(c.type)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-600 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all">
                    <span className="text-xs font-semibold text-white">{c.emoji} {c.label}</span>
                    <Zap size={14} className="text-amber-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="flex flex-col">
          <div className="p-3 max-h-52 overflow-y-auto space-y-1.5 flex flex-col">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No messages yet. Say hi to {buddy.name}!</p>
            ) : messages.map((m) => {
              const isMe = m.senderId === currentUserId;
              return (
                <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-1.5 rounded-2xl text-xs ${
                    isMe
                      ? 'bg-indigo-600/30 text-indigo-100 rounded-br-sm'
                      : 'bg-slate-700/50 text-slate-200 rounded-bl-sm'
                  }`}>
                    <p>{m.text}</p>
                    <p className={`text-[9px] mt-0.5 ${isMe ? 'text-indigo-300/50' : 'text-slate-500'}`}>{dayjs(m.createdAt).format('h:mm A')}</p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          <div className="border-t border-slate-700/40">
            {inputWarning && (
              <div className="px-3 pt-2 flex items-center gap-1.5">
                <span className="text-[10px] text-red-400 font-medium">🚫 {inputWarning}</span>
              </div>
            )}
            <div className="flex gap-2 p-3">
              <input value={msgInput}
                onChange={(e) => {
                  setMsgInput(e.target.value);
                  setInputWarning(quickContentCheck(e.target.value));
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !inputWarning) sendMessage(); }}
                placeholder={`Message ${buddy.name}...`}
                className={`input-field flex-1 text-xs py-2 ${inputWarning ? 'border-red-500/50 focus:border-red-500' : ''}`} />
              <button onClick={sendMessage} disabled={sending || !msgInput.trim() || !!inputWarning}
                className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center disabled:opacity-40 transition-colors shrink-0">
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuddyWidget() {
  const { user: currentUser } = useApp();
  const [buddies, setBuddies] = useState([]);
  const [you, setYou] = useState(null);
  const [unreadMap, setUnreadMap] = useState({});
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const fetchBuddies = useCallback(async () => {
    try {
      const { data } = await API.get('/social/buddy');
      if (data.paired && data.buddies?.length > 0) {
        setBuddies(data.buddies);
        setYou(data.you);
      }
    } catch {}
  }, []);

  const fetchUnread = useCallback(async () => {
    try {
      const { data } = await API.get('/social/buddy/unread');
      setUnreadMap(data.perPair || {});
    } catch {}
  }, []);

  useEffect(() => { fetchBuddies(); fetchUnread(); }, [fetchBuddies, fetchUnread]);

  if (buddies.length === 0) return null;

  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);
  const activeBuddy = buddies[selectedIdx] || buddies[0];

  return (
    <div className="card mb-5 overflow-hidden">
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 hover:bg-slate-700/20 transition-colors">
        <div className="flex -space-x-2 shrink-0">
          {buddies.slice(0, 3).map((b, i) => {
            const colorIdx = b.name.charCodeAt(0) % AVATAR_COLORS.length;
            return (
              <div key={b.pairId} className={`w-9 h-9 bg-gradient-to-br ${AVATAR_COLORS[colorIdx]} rounded-xl flex items-center justify-center text-white font-bold text-xs border-2 border-slate-900`}
                style={{ zIndex: 3 - i }}>
                {b.name?.[0]?.toUpperCase() || 'B'}
              </div>
            );
          })}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-400 font-semibold flex items-center gap-1">
              <Users size={10} /> {buddies.length === 1 ? 'Workout Buddy' : `${buddies.length} Workout Buddies`}
            </span>
            {totalUnread > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{totalUnread}</span>
            )}
          </div>
          <div className="font-bold text-white text-sm truncate">
            {buddies.length === 1 ? buddies[0].name : buddies.map((b) => b.name).join(', ')}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-700/40 animate-fade-in">
          {/* Buddy selector (when more than 1) */}
          {buddies.length > 1 && (
            <div className="p-3 border-b border-slate-700/40 space-y-1.5">
              {buddies.map((b, i) => (
                <BuddyCard key={b.pairId} buddy={b} you={you}
                  isActive={i === selectedIdx}
                  unreadCount={unreadMap[b.pairId] || 0}
                  onSelect={() => setSelectedIdx(i)} />
              ))}
            </div>
          )}

          {/* Single buddy header for 1 buddy */}
          {buddies.length === 1 && (
            <div className="px-4 pt-3 pb-1 flex items-center gap-2">
              <div className={`w-7 h-7 bg-gradient-to-br ${AVATAR_COLORS[activeBuddy.name.charCodeAt(0) % AVATAR_COLORS.length]} rounded-lg flex items-center justify-center text-white font-bold text-[10px]`}>
                {activeBuddy.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-xs font-bold text-white">{activeBuddy.fullName || activeBuddy.name}</span>
              <span className="text-[10px] text-slate-500 ml-auto">{activeBuddy.fitnessGoal}</span>
            </div>
          )}

          {/* Detail panel for selected buddy */}
          <BuddyDetail
            key={activeBuddy.pairId}
            buddy={activeBuddy}
            you={you}
            currentUserId={currentUser?.id}
          />
        </div>
      )}
    </div>
  );
}
