import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Trash2, Loader2, Bot, UserCircle } from 'lucide-react';
import axios from 'axios';
import dayjs from 'dayjs';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});
API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const QUICK_CHIPS = [
  'Suggest a high-protein meal',
  'How to improve bench press?',
  'Am I eating enough protein?',
  'Best pre-workout snack?',
  'How much water should I drink?',
  'Tips for muscle recovery',
];

export default function SmartAgent() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [retryMsg, setRetryMsg] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const token = localStorage.getItem('ft_token');

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  // Load chat history when panel opens for the first time
  useEffect(() => {
    if (!open || historyLoaded || !token) return;
    (async () => {
      try {
        const { data } = await API.get('/agent/history');
        if (data.length) {
          setMessages(data.map((m) => ({
            id: m._id,
            role: m.role,
            content: m.content,
            timestamp: m.createdAt,
          })));
        }
      } catch { /* history not critical */ }
      setHistoryLoaded(true);
    })();
  }, [open, historyLoaded, token]);

  useEffect(() => { if (open) scrollToBottom(); }, [messages, open, scrollToBottom]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setError(null);

    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await API.post('/agent/chat', { message: msg });
      setMessages((prev) => [...prev, {
        id: `a_${Date.now()}`,
        role: 'agent',
        content: data.reply,
        timestamp: data.timestamp,
      }]);
      if (data.cached) console.log('[SamAI] Served from cache');
    } catch (err) {
      const status = err.response?.status;
      const errData = err.response?.data;

      if (status === 429) {
        setError(errData?.message || 'Daily AI quota reached. Try again tomorrow.');
      } else if (status === 503 && errData?.retryAfterSec) {
        setRetryMsg(msg);
        setError(`AI is busy — auto-retrying in ${errData.retryAfterSec}s...`);
        setTimeout(() => {
          setError(null);
          setRetryMsg(null);
          sendMessage(msg);
        }, errData.retryAfterSec * 1000);
      } else {
        setError(errData?.message || 'Could not reach SamAI. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await API.delete('/agent/history');
    } catch { /* best effort */ }
    setMessages([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Render markdown-lite: bold, bullet lists, line breaks
  function formatContent(text) {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      let processed = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');

      const isBullet = /^[\s]*[-*•]\s/.test(line);
      if (isBullet) {
        processed = processed.replace(/^[\s]*[-*•]\s/, '');
        return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      if (!processed.trim()) return <br key={i} />;
      return <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  }

  return createPortal(
    <>
      {/* ── Floating Action Button ──────────────────────── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-[88px] right-3 lg:bottom-6 lg:right-6 z-[9999] flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white shadow-xl shadow-purple-500/40 hover:shadow-purple-500/60 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
          aria-label="Open SamAI Assistant"
        >
          <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/30">
            <Bot size={20} />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="font-extrabold text-sm tracking-tight">SamAI</span>
            <span className="text-[9px] text-white/70 font-medium">Ask me anything</span>
          </div>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
        </button>
      )}

      {/* ── Chat Panel ──────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-end lg:items-end lg:justify-end">
          {/* Backdrop on mobile */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />

          <div className="relative w-full h-[85vh] max-h-[85vh] lg:w-[420px] lg:h-[620px] lg:max-h-[80vh] lg:m-6 lg:mb-6 bg-slate-800 border border-slate-700 rounded-t-2xl lg:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base leading-tight tracking-tight">SamAI</h3>
                  <p className="text-[11px] text-white/70 font-medium">Your Fitness & Nutrition Expert</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {messages.length > 0 && (
                  <button onClick={clearHistory} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors" title="Clear chat">
                    <Trash2 size={15} />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-18 h-18 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-fuchsia-500/20 rounded-2xl flex items-center justify-center mb-4 p-4">
                    <Bot size={36} className="text-indigo-400" />
                  </div>
                  <h4 className="text-white font-extrabold text-lg mb-1">Hey! I'm SamAI</h4>
                  <p className="text-slate-400 text-sm mb-6 max-w-[280px]">
                    Your personal AI fitness assistant. Ask me about workouts, nutrition, supplements, or health goals.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-[320px]">
                    {QUICK_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => sendMessage(chip)}
                        className="px-3 py-2 bg-slate-700/60 border border-slate-600/50 rounded-xl text-xs text-slate-300 hover:bg-indigo-600/30 hover:border-indigo-500/50 hover:text-white transition-all touch-manipulation"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'agent' && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 mt-1">
                      <Bot size={14} className="text-indigo-400" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-slate-700/70 text-slate-200 rounded-bl-md border border-slate-600/30'
                  }`}>
                    <div className="space-y-1">{formatContent(msg.content)}</div>
                    <div className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-indigo-200/60' : 'text-slate-500'}`}>
                      {dayjs(msg.timestamp).format('h:mm A')}
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-1">
                      <UserCircle size={14} className="text-purple-400" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-indigo-400" />
                  </div>
                  <div className="bg-slate-700/70 border border-slate-600/30 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {error && (
                <div className="mx-auto max-w-[85%] text-center text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 space-y-2">
                  <p className="text-red-400">{error}</p>
                  {!retryMsg && (
                    <button
                      onClick={() => { setError(null); if (messages.length) sendMessage(messages[messages.length - 1]?.role === 'user' ? messages[messages.length - 1].content : ''); }}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-medium transition-colors"
                    >
                      Retry
                    </button>
                  )}
                  {retryMsg && (
                    <div className="flex items-center justify-center gap-1.5 text-amber-400">
                      <Loader2 size={12} className="animate-spin" />
                      <span>Auto-retrying...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick chips after messages exist */}
            {messages.length > 0 && !loading && (
              <div className="px-4 pb-2 shrink-0">
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                  {QUICK_CHIPS.slice(0, 3).map((chip) => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      className="shrink-0 px-2.5 py-1.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-[11px] text-slate-400 hover:bg-indigo-600/20 hover:text-white transition-all touch-manipulation"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4 pt-2 border-t border-slate-700 shrink-0">
              {!token ? (
                <p className="text-xs text-slate-500 text-center py-2">Sign in with an account to chat with SamAI.</p>
              ) : (
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask SamAI about workouts, nutrition..."
                      rows={1}
                      className="w-full resize-none bg-slate-700/60 border border-slate-600/50 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      style={{ maxHeight: '120px' }}
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                    />
                  </div>
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 touch-manipulation"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
