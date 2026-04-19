const API_HOSTS = [
  'https://jiosaavn-api-privatecvc2.vercel.app',
  'https://jiosaavn-api-rose.vercel.app',
];

let activeHostIdx = 0;

async function apiFetch(endpoint, retries = API_HOSTS.length) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const host = API_HOSTS[(activeHostIdx + attempt) % API_HOSTS.length];
    try {
      const res = await fetch(`${host}${endpoint}`);
      if (!res.ok) continue;
      const json = await res.json();
      if (json.status === 'SUCCESS' || json.success) {
        activeHostIdx = (activeHostIdx + attempt) % API_HOSTS.length;
        return json;
      }
    } catch { /* try next host */ }
  }
  throw new Error('All music API hosts failed');
}

function getImageUrl(images, preferredIdx = 2) {
  if (!Array.isArray(images) || images.length === 0) return '';
  const pick = images[Math.min(preferredIdx, images.length - 1)];
  return pick?.link || pick?.url || '';
}

function getDownloadUrl(downloads) {
  if (!Array.isArray(downloads) || downloads.length === 0) return '';
  const best = downloads[downloads.length - 1];
  return best?.link || best?.url || '';
}

function normalizeSong(raw) {
  if (!raw) return null;
  const url = getDownloadUrl(raw.downloadUrl);
  if (!url) return null;

  const artistStr =
    raw.primaryArtists ||
    raw.artist ||
    (Array.isArray(raw.artists?.primary) ? raw.artists.primary.map((a) => a.name).join(', ') : '') ||
    'Unknown';

  return {
    id: raw.id,
    name: (raw.name || raw.song || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"'),
    artist: artistStr.replace(/&amp;/g, '&'),
    album: typeof raw.album === 'object' ? raw.album?.name || '' : raw.album || '',
    duration: parseInt(raw.duration, 10) || 0,
    image: getImageUrl(raw.image, 2),
    imageSmall: getImageUrl(raw.image, 1),
    url,
    year: raw.year || '',
    language: raw.language || '',
    hasLyrics: raw.hasLyrics === 'true' || raw.hasLyrics === true,
  };
}

function extractResults(json) {
  if (json.data?.results) return json.data.results;
  if (json.results) return json.results;
  if (Array.isArray(json.data)) return json.data;
  return [];
}

export async function searchSongs(query, limit = 20) {
  if (!query?.trim()) return [];
  const json = await apiFetch(`/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
  return extractResults(json).map(normalizeSong).filter(Boolean);
}

export async function searchAlbums(query, limit = 10) {
  if (!query?.trim()) return [];
  try {
    const json = await apiFetch(`/search/albums?query=${encodeURIComponent(query)}&limit=${limit}`);
    return extractResults(json).map((raw) => ({
      id: raw.id,
      name: (raw.name || raw.title || '').replace(/&amp;/g, '&'),
      description: raw.description || '',
      image: getImageUrl(raw.image, 2),
      songCount: raw.songCount || 0,
    }));
  } catch { return []; }
}

export async function getAlbumSongs(albumId) {
  try {
    const json = await apiFetch(`/albums?id=${albumId}`);
    const data = json.data || json;
    return {
      id: data.id,
      name: (data.name || '').replace(/&amp;/g, '&'),
      image: getImageUrl(data.image, 2),
      songs: (data.songs || []).map(normalizeSong).filter(Boolean),
    };
  } catch { return { id: albumId, name: '', image: '', songs: [] }; }
}

export async function getPlaylistSongs(playlistId) {
  try {
    const json = await apiFetch(`/playlists?id=${playlistId}`);
    const data = json.data || json;
    return {
      id: data.id,
      name: (data.name || '').replace(/&amp;/g, '&'),
      image: getImageUrl(data.image, 2),
      songs: (data.songs || []).map(normalizeSong).filter(Boolean),
    };
  } catch { return { id: playlistId, name: '', image: '', songs: [] }; }
}

export const WORKOUT_CATEGORIES = [
  { id: 'gym-motivation', query: 'gym motivation workout', label: 'Gym Motivation', emoji: '🔥', gradient: 'from-red-600 to-orange-600' },
  { id: 'high-energy', query: 'high energy pump up', label: 'High Energy', emoji: '⚡', gradient: 'from-yellow-500 to-red-500' },
  { id: 'hip-hop-workout', query: 'hip hop workout beats', label: 'Hip Hop', emoji: '🎤', gradient: 'from-purple-600 to-pink-600' },
  { id: 'edm-cardio', query: 'edm cardio running', label: 'EDM & Cardio', emoji: '🎧', gradient: 'from-cyan-500 to-blue-600' },
  { id: 'rock-metal', query: 'rock metal workout power', label: 'Rock & Metal', emoji: '🤘', gradient: 'from-slate-600 to-red-700' },
  { id: 'bollywood-workout', query: 'bollywood workout songs', label: 'Bollywood Beats', emoji: '🇮🇳', gradient: 'from-amber-500 to-pink-500' },
  { id: 'punjabi-hype', query: 'punjabi gym songs', label: 'Punjabi Hype', emoji: '💪', gradient: 'from-orange-500 to-yellow-500' },
  { id: 'lo-fi-cooldown', query: 'lo-fi chill beats relax', label: 'Cool Down', emoji: '🧘', gradient: 'from-indigo-600 to-purple-700' },
  { id: 'running-pace', query: 'running fast pace songs', label: 'Running Pace', emoji: '🏃', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'bass-boost', query: 'bass boosted gym trap', label: 'Bass Boost', emoji: '🔊', gradient: 'from-fuchsia-600 to-violet-700' },
];

export function formatDuration(sec) {
  const s = parseInt(sec, 10) || 0;
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, '0')}`;
}
