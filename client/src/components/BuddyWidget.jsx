import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import toast from 'react-hot-toast';
import {
  Users, Flame, Trophy, MessageCircle, Zap,
  ChevronDown, ChevronUp, Send, Swords, Activity, Bell,
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

export default function BuddyWidget() {
  const { user: currentUser } = useApp();
  const [buddy, setBuddy] = useState(null);
  const [you, setYou] = useState(null);
  const [pairId, setPairId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);

  const fetchBuddy = useCallback(async () => {
    try {
      const { data } = await API.get('/social/buddy');
      if (data.paired) {
        setBuddy(data.buddy);
        setYou(data.you);
        setPairId(data.pairId);
      }
    } catch {}
  }, []);

  const fetchActivity = useCallback(async () => {
    try {
      const { data } = await API.get('/social/buddy/activity');
      setActivities(data);
    } catch {}
  }, []);

  const fetchChallenge = useCallback(async () => {
    try {
      const { data } = await API.get('/social/buddy/challenge');
      if (data.active) setChallenge(data.challenge);
    } catch {}
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await API.get('/social/buddy/messages');
      setMessages(data);
    } catch {}
  }, []);

  const fetchUnread = useCallback(async () => {
    try {
      const { data } = await API.get('/social/buddy/messages/unread');
      setUnread(data.count);
    } catch {}
  }, []);

  useEffect(() => {
    fetchBuddy();
    fetchUnread();
  }, [fetchBuddy, fetchUnread]);

  useEffect(() => {
    if (!buddy || !expanded) return;
    fetchActivity();
    fetchChallenge();
    if (activeTab === 'chat') fetchMessages();
  }, [buddy, expanded, activeTab, fetchActivity, fetchChallenge, fetchMessages]);

  useEffect(() => {
    if (!buddy || activeTab !== 'chat' || !expanded) return;
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [buddy, activeTab, expanded, fetchMessages]);

  const sendNudge = async (type) => {
    try {
      await API.post('/social/buddy/nudge', { type });
      toast.success('Nudge sent!');
    } catch { toast.error('Failed to send nudge'); }
  };

  const startChallenge = async (type) => {
    try {
      await API.post('/social/buddy/challenge', { type });
      toast.success('Challenge started!');
      fetchChallenge();
    } catch { toast.error('Failed to start challenge'); }
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || sending) return;
    setSending(true);
    try {
      await API.post('/social/buddy/messages', { text: msgInput.trim() });
      setMsgInput('');
      fetchMessages();
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  if (!buddy) return null;

  const lastActive = buddy.lastWorkoutDate ? dayjs(buddy.lastWorkoutDate).fromNow() : 'Never';

  return (
    <div className="card mb-5 overflow-hidden">
      {/* Header — always visible */}
      <button onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 hover:bg-slate-700/20 transition-colors">
        <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
          {buddy.name?.[0]?.toUpperCase() || 'B'}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-400 font-semibold flex items-center gap-1"><Users size={10} /> Workout Buddy</span>
            {unread > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unread}</span>
            )}
          </div>
          <div className="font-bold text-white text-sm truncate">{buddy.name}</div>
          <div className="text-[10px] text-slate-500">Active {lastActive}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-black text-orange-400 flex items-center gap-1"><Flame size={12} /> {buddy.streak}</div>
          <div className="text-[10px] text-slate-500">{buddy.weekWorkouts} this week</div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-700/40 animate-fade-in">
          {/* Tabs */}
          <div className="flex border-b border-slate-700/40">
            {[
              { key: 'stats', label: 'Stats', icon: Activity },
              { key: 'feed', label: 'Feed', icon: Bell },
              { key: 'challenge', label: 'Challenge', icon: Swords },
              { key: 'chat', label: 'Chat', icon: MessageCircle, badge: unread },
            ].map((tab) => (
              <button key={tab.key}
                onClick={() => { setActiveTab(tab.key); if (tab.key === 'chat') { fetchMessages(); setUnread(0); } }}
                className={`flex-1 py-2.5 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors ${
                  activeTab === tab.key ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'
                }`}>
                <tab.icon size={12} />
                {tab.label}
                {tab.badge > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">{tab.badge}</span>}
              </button>
            ))}
          </div>

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="p-4 space-y-3">
              {/* Side-by-side comparison */}
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

              {/* Quick Nudges */}
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
                <p className="text-xs text-slate-500 text-center py-4">No recent activity from your buddy yet.</p>
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
                  {challenge.buddyScore > challenge.myScore && <p className="text-[10px] text-amber-400 text-center mt-2">Your buddy is ahead — time to step up!</p>}
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
                  <p className="text-xs text-slate-500 text-center py-4">No messages yet. Say hi!</p>
                ) : messages.map((m) => {
                  const isMe = m.senderId === currentUser?.id;
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
              </div>
              <div className="flex gap-2 p-3 border-t border-slate-700/40">
                <input value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                  placeholder="Type a message..."
                  className="input-field flex-1 text-xs py-2" />
                <button onClick={sendMessage} disabled={sending || !msgInput.trim()}
                  className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center disabled:opacity-40 transition-colors shrink-0">
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
