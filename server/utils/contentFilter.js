/**
 * Content Moderation Filter — v2 (substring + root-based)
 *
 * Strategy:
 *  A) "Toxic roots" — short, distinctive character sequences that appear inside
 *     profanity but almost never in legitimate English/fitness vocabulary.
 *     These are matched as SUBSTRINGS (no word boundaries) so concatenated abuse
 *     like "maakabhosda" or "fuckyou" is caught.
 *  B) Whitelist — a small set of legitimate words that accidentally contain a
 *     toxic root (e.g. "cocktail" contains "cock", "grape" contains "rape").
 *  C) Word-boundary matching — for short / ambiguous terms (mc, bc, die, ass)
 *     that would false-positive as substrings.
 *  D) URL / link / domain / phone / email / app detection.
 *  E) Normalisation pipeline: lowercase → leet→ascii → homoglyph→ascii →
 *     strip separators → deflate repeats. Every layer is checked.
 */

// ── Normalisation ──────────────────────────────────────────────────────────

const LEET_MAP = {
  '@': 'a', '4': 'a', '^': 'a',
  '8': 'b',
  '(': 'c', '<': 'c',
  '3': 'e',
  '6': 'g', '9': 'g',
  '#': 'h',
  '!': 'i', '1': 'i', '|': 'i',
  '0': 'o',
  '5': 's', '$': 's',
  '7': 't', '+': 't',
  'v': 'u',
  '%': 'x',
  '¥': 'y',
  '2': 'z',
};

const HOMOGLYPHS = { 'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x', 'і': 'i', 'ѕ': 's' };

function normalise(text) {
  let s = text.toLowerCase();
  s = s.replace(/./g, (ch) => LEET_MAP[ch] || ch);
  s = s.replace(/[\u200B-\u200D\uFEFF\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u2000-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F]/g, '');
  s = s.replace(/./g, (ch) => HOMOGLYPHS[ch] || ch);
  return s;
}

function stripSeparators(text) {
  return text.replace(/[\s._\-*~•·,;:!?'"()\[\]{}\/\\|`^#]+/g, '');
}

function deflateRepeats(text) {
  return text.replace(/(.)\1+/g, '$1');
}

function stripNumbers(text) {
  return text.replace(/\d+/g, '');
}

// ── Whitelist: legitimate words that contain toxic substrings ───────────────

// Words that legitimately contain toxic substrings
const WHITELIST_WORDS = new Set([
  'cocktail', 'peacock', 'hancock', 'woodcock', 'shuttlecock', 'cockpit',
  'scunthorpe', 'assess', 'assassin', 'assault', 'assemble', 'assert',
  'assist', 'associate', 'assume', 'assignment', 'asset', 'classic',
  'class', 'grass', 'pass', 'mass', 'bass', 'compass', 'embarrass',
  'therapist', 'grape', 'drape', 'scrape', 'trapeze',
  'dictate', 'dictation', 'dictionary', 'predict', 'verdict', 'addict',
  'shitake', 'shiitake',
  'analytics', 'analysis', 'analyst',
  'penalize', 'penalty', 'pencil', 'pendant', 'pending',
  'exchange', 'excite', 'excuse', 'execute', 'executive',
  'button', 'butter', 'butterfly', 'buttress',
  'pusher', 'pushing', 'pushup', 'pushups',
  'title', 'titillate', 'titan',
  'document', 'documentation',
  'sextant', 'bisexual', 'sextuple',
  'manslaughter', 'laughter',
  'dicker', 'dickens',
  'country', 'counting', 'counter', 'count',
  'cumulative', 'accumulate', 'cucumber', 'circumstance',
  'together',
  'disk', 'disco', 'discount', 'discover', 'discuss', 'discussion',
  'basement', 'based', 'base',
  'parse', 'sparse',
  'thatch', 'hatchet', 'match', 'batch', 'catch', 'watch', 'scratch',
  'reparation', 'preparation',
  'happiness',
  'shutter', 'shuttle',
  'finished', 'punished', 'published',
  'wrist', 'fist', 'list', 'gist', 'mist', 'twist',
  'crush', 'crushed', 'crushing', 'crushit',
  'letscrushit', 'crushedit',
]);

// Full safe phrases that accidentally trigger the filter
const SAFE_PHRASES = [
  /\btherapist\b/i, /\bcrush\b/i, /\bcrushed\b/i, /\bcrushing\b/i, /\bcrush it\b/i,
  /\bcocktail\b/i, /\bpeacock\b/i, /\bscunthorpe\b/i,
  /\bgrape\b/i, /\bdrape\b/i, /\bscrape\b/i,
  /\bshiitake\b/i, /\bshitake\b/i,
  /\bcumulative\b/i, /\baccumulate\b/i,
  /\bbutton\b/i, /\bbutter\b/i, /\bpushup\b/i,
  /\btitan\b/i, /\btitle\b/i,
];

// ── Toxic roots: SUBSTRING-matched (no word boundaries) ────────────────────
// These 4+ char sequences are distinctive enough to never appear in normal words
// (after checking against the whitelist above).

const TOXIC_ROOTS_PROFANITY = [
  // Hindi/Urdu core roots (transliterated) — the most critical ones
  'bhosd', 'bhosad', 'bhosda', 'bhosdi', 'bhosdik',
  'madarcho', 'madarchod', 'madarc',
  'behench', 'benchod', 'behenc', 'bhencho',
  'chutiy', 'chutia', 'chootiy', 'choot',
  'gandu', 'gaandu', 'gaand',
  'randi', 'raand', 'randw', 'rundi',
  'lauda', 'laude', 'laudu', 'loda', 'lode', 'lodu',
  'lund', 'luund',
  'jhaat', 'jhant', 'jhatu',
  'harami', 'haramkh', 'haramzad',
  'bakchod', 'bakchodi',
  'kamin', 'kamina', 'kamine',
  'kuttiy', 'kutiya',
  'chod', 'chodn', 'chodug', 'chodung',
  'dalla', 'dalal',
  'fattu', 'phattu',
  'tatti',
  'panchod', 'penchod', 'painchod',
  'bokachod',
  'bsdk', 'mcbc', 'bkl',

  // English core roots — 4+ chars, unambiguous
  'fuck', 'fuck', 'fvck',
  'shit', 'shiit',
  'bitch', 'biatch',
  'asshole', 'ashole', 'arsehole',
  'bastard',
  'dickhead', 'dckhead',
  'cocksu',
  'cunt',
  'motherfuck', 'motherfu',
  'nigger', 'nigg', 'nigga',
  'faggot', 'faggo',
  'douchebag', 'douche',
  'jerkoff', 'wanker',
  'retard',

  // Sexual
  'porn', 'porno',
  'xnxx', 'xvideo', 'pornhub', 'brazzers', 'onlyfan',
  'blowjob', 'handjob', 'rimjob',
  'cumshot', 'creampie',
  'masturb',
  'threesome', 'foursome',
  'bdsm', 'bondage',
  'hooker', 'prostitut',
  'stripper', 'stripteas',
  'dickpic',
  'sugardaddy', 'sugarmommy',

  // Other languages
  'puta', 'pendej', 'mierda',
  'sharmut', 'kosomak',
  'scheiss', 'arschloch', 'hurensohn', 'fotze',
  'caralho',
  'pundai', 'dengey', 'lanja',
];

// Short / ambiguous terms — need WORD BOUNDARY matching
const TOXIC_SHORT_BOUNDARY = [
  'mc', 'bc', 'bkl', 'bsdk', 'mf',
  'stfu', 'gtfo',
  'fag', 'dyke',
  'spic', 'chink', 'kike', 'gook',
  'slut', 'whore', 'hoe',
  'dick', 'cock', 'pussy',
  'twat', 'prick',
  'ass', 'crap',
  'chut', 'chud', 'gand',
  'rand', 'lode',
  'hijra', 'chakka',
  'suar', 'suwar',
  'saala', 'saale', 'sala', 'sale',
  'kutte', 'kutta',
  'gadha', 'gadhe',
  'ullu',
  'fap',
  'horny',
  'nude', 'nudes', 'naked',
  'boobs', 'tits',
  'dildo',
  'erotic',
  'fetish',
  'orgy',
];

const THREAT_ROOTS_SINGLE = [
  'murder',
  'bombing', 'bomber',
  'shooting', 'gunshot',
  'stabbing',
  'suicidal',
  'torture', 'kidnap', 'kidnapping',
  'kaatdunga',
];

// Multi-word threat phrases — checked against normalized text (with spaces)
const THREAT_PHRASES = [
  /kill\s*(you|u|myself|himself|herself)\b/i,
  /gonna\s*kill/i, /going\s*to\s*kill/i,
  /\b(go\s*die|drop\s*dead)\b/i,
  /(?<!the)\brape\b/i,
  /\braping\b/i,
  /\brapist\b/i,
  /\bbomb\b/i,
  /\bshoot\b/i,
  /\bstab\b/i,
  /\bsuicide\b/i,
  /slit\s*throat/i,
  /acid\s*attack/i,
  /find\s*(where\s*you\s*live|your\s*address|ur\s*address)/i,
  /i\s*will\s*find\s*you/i, /ill\s*find\s*you/i,
  /watch\s*(your|ur)\s*back/i,
  /(you\s*are|ur|youre)\s*dead/i,
  /beat\s*(you|u)\b/i, /punch\s*(you|u)\b/i, /smash\s*(you|u)\b/i,
  /hurt\s*(you|u)\b/i,
  /destroy\s*(you|u)\b/i, /ruin\s*(you|u)\b/i,
  /maar\s*(dunga|dalunga|daalega|dega)/i,
  /jaan\s*se\s*maar/i, /jaan\s*se\s*marunga/i,
  /kaat\s*dunga/i,
  /goli\s*maar/i, /goli\s*marunga/i,
  /aag\s*laga/i, /jalaa\s*dunga/i,
  /tera\s*khoon/i, /khoon\s*nikal/i,
  /zinda\s*nahi\s*chod/i,
];

const HARASSMENT_ROOTS = [
  'stalking', 'stalk you', 'stalk u',
  'blackmail',
  'doxx', 'doxing',
  'leak your', 'leak ur',
  'expose you', 'expose u',
];

const HATE_ROOTS = [
  'terrorist', 'jihadi',
  'nazi', 'hitler', 'heil',
  'white power', 'white supremacy',
  'genocide', 'ethnic cleansing',
  'master race', 'inferior race',
];

const EXTERNAL_APPS = [
  'whatsapp', 'watsapp', 'watsap', 'whatsap',
  'telegram', 'telegrm',
  'snapchat',
  'instagram', 'insta',
  'facebook',
  'twitter',
  'tiktok',
  'discord', 'discrd',
  'wechat', 'skype', 'viber',
  'onlyfans',
  'tinder', 'bumble', 'hinge', 'grindr', 'omegle',
  'youtube',
  'reddit', 'linkedin', 'pinterest', 'twitch',
];

// Hindi Devanagari script
const HINDI_DEVANAGARI = [
  'भोसड़ीके', 'भोसडीके', 'भोसड़ी', 'बीएसडीके',
  'मादरचोद', 'मदरचोद', 'एमसी',
  'बेहनचोद', 'बहनचोद', 'बीसी',
  'चूतिया', 'चूतिये', 'चूत',
  'गांडू', 'गांड', 'गाण्ड',
  'रंडी', 'रांड', 'रण्डी',
  'लौड़े', 'लौड़ा', 'लंड', 'लण्ड',
  'हरामी', 'हरामखोर',
  'कुत्ता', 'कुत्ते', 'कुत्तिया',
  'साला', 'साले',
  'बकचोद', 'बकचोदी',
  'कमीना', 'कमीने',
  'झाटू', 'झाण्ट',
  'तत्ती', 'गधा', 'गधे', 'सुअर',
];

// Compound phrase patterns (regex) — catches concatenated Hindi abuse phrases
const COMPOUND_PATTERNS = [
  /(?:teri|tera|meri|mera|uski|iski|tumhari)[\s]*(?:ma|maa|ammi|amma|behen|behan|bhen|baap|bap)[\s]*(?:ki|ka|ko|ke)?\s*(?:bhos|chut|gand|gaand|lod|lund|chod)/i,
  /(?:ma|maa|amma)[\s]*(?:ka|ki|ke)?\s*(?:bhos|bhosa|bhosda|bhosdi)/i,
  /(?:behen|behan|bhen)[\s]*(?:ka|ki|ke)?\s*(?:chut|chod|lod|lund)/i,
  /(?:chod|chud)[\s]*(?:dunga|diya|denge|degi|unga|uga)/i,
  /(?:maar|maar)[\s]*(?:dunga|dalunga|denge|daalega|dega)/i,
  /(?:gand|gaand)[\s]*(?:mar|maar|faad|phad|tod)/i,
  /(?:lund|loda|lauda)[\s]*(?:ka|ki|ke|chus|le|muh)/i,
  /(?:teri|tera|meri|iski|uski)[\s]*(?:ma|maa|ammi|amma|behen|behan|bhen)[\s]*(?:ki|ka|ko|ke)/i,
  /(?:ma|maa|amma)[\s]*(?:ki|ka|ke)[\s]*(?:chut|aankh|bhos)/i,
];

// ── Regex utilities ────────────────────────────────────────────────────────

const URL_REGEX = /(?:https?:\/\/|ftp:\/\/|www\.)[\S]+/i;
const DOMAIN_REGEX = /\b[\w-]+\.(com|org|net|in|co|io|me|xyz|info|biz|us|uk|dev|app|site|online|live|tech|store|shop)\b/i;
const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[\w.-]+/i;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,5}[\s.-]?\d{3,5}/;
const IP_REGEX = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;

// Build a SUBSTRING regex (no word boundaries) — catches "maakabhosda", "fuckyou" etc.
function buildContainsRegex(roots) {
  const escaped = roots.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(escaped.join('|'), 'i');
}

// Build a WORD-BOUNDARY regex for short/ambiguous terms
function buildBoundaryRegex(words) {
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(?:^|\\b|[^a-z])(?:${escaped.join('|')})(?:$|\\b|[^a-z])`, 'i');
}

// Build a fuzzy regex where each letter can repeat (catches fuuuck, shiiit)
function buildFuzzyContainsRegex(roots) {
  const patterns = roots.map((w) => {
    const e = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return e.replace(/[a-z]/gi, (ch) => `${ch}+`);
  });
  return new RegExp(patterns.join('|'), 'i');
}

// Devanagari — strict contains
function buildStrictContains(words) {
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(escaped.join('|'), 'i');
}

// ── Pre-compile all regexes at module load ─────────────────────────────────

const RE_TOXIC_CONTAINS    = buildContainsRegex(TOXIC_ROOTS_PROFANITY);
const RE_TOXIC_FUZZY       = buildFuzzyContainsRegex(TOXIC_ROOTS_PROFANITY);
const RE_SHORT_BOUNDARY    = buildBoundaryRegex(TOXIC_SHORT_BOUNDARY);
const RE_THREAT_CONTAINS   = buildContainsRegex(THREAT_ROOTS_SINGLE);
const RE_HARASS_CONTAINS   = buildContainsRegex(HARASSMENT_ROOTS);
const RE_HATE_CONTAINS     = buildContainsRegex(HATE_ROOTS);
const RE_APPS_CONTAINS     = buildContainsRegex(EXTERNAL_APPS);
const RE_DEVANAGARI        = buildStrictContains(HINDI_DEVANAGARI);

// ── Whitelist: remove known safe words/phrases before toxic check ──────────

function sanitiseForCheck(text) {
  let s = text;
  for (const re of SAFE_PHRASES) {
    s = s.replace(re, ' ');
  }
  const words = s.split(/\s+/);
  s = words.filter((w) => !WHITELIST_WORDS.has(w)).join(' ');
  return s.trim();
}

// ── Main filter function ───────────────────────────────────────────────────

function checkMessage(raw) {
  if (!raw || typeof raw !== 'string') return { safe: false, reason: 'Empty message' };

  const text = raw.trim();
  if (text.length === 0) return { safe: false, reason: 'Empty message' };
  if (text.length > 500) return { safe: false, reason: 'Message too long (max 500 chars)' };

  // ── Layer 1: URLs, links, domains, IPs, emails ──────────────────────────
  if (URL_REGEX.test(text)) return { safe: false, reason: 'Links and URLs are not allowed' };
  if (DOMAIN_REGEX.test(text)) return { safe: false, reason: 'Website addresses are not allowed' };
  if (EMAIL_REGEX.test(text)) return { safe: false, reason: 'Sharing email addresses is not allowed' };
  if (IP_REGEX.test(text)) return { safe: false, reason: 'Sharing IP addresses is not allowed' };

  // ── Build normalised variants ───────────────────────────────────────────
  const norm     = normalise(text);
  const stripped = stripSeparators(norm);
  const deflated = deflateRepeats(stripped);
  const noNums   = stripNumbers(stripped);
  const deflNoNums = deflateRepeats(noNums);

  // All variants to check (order: most transformed → least)
  const variants = [deflated, deflNoNums, stripped, noNums, norm];

  // ── Layer 2: Devanagari profanity (raw text) ────────────────────────────
  if (RE_DEVANAGARI.test(text)) return { safe: false, reason: 'Inappropriate language detected' };

  // ── Layer 3: External apps / platforms ──────────────────────────────────
  for (const v of variants) {
    if (RE_APPS_CONTAINS.test(v)) return { safe: false, reason: 'Mentioning external apps or platforms is not allowed' };
  }

  // ── Layer 4: Phone numbers ──────────────────────────────────────────────
  const digitsOnly = text.replace(/\D/g, '');
  if (digitsOnly.length >= 8 && PHONE_REGEX.test(text)) {
    return { safe: false, reason: 'Sharing phone numbers is not allowed' };
  }

  // ── Layer 5: Compound Hindi phrases (regex patterns) ────────────────────
  for (const re of COMPOUND_PATTERNS) {
    for (const v of variants) {
      if (re.test(v)) return { safe: false, reason: 'Inappropriate language detected' };
    }
  }

  // ── Layer 6: Toxic roots — SUBSTRING match (the key layer) ──────────────
  // Sanitise: remove safe words/phrases to avoid false positives like "crush it"
  for (const v of variants) {
    const cleaned = sanitiseForCheck(v);
    if (!cleaned) continue;
    if (RE_TOXIC_CONTAINS.test(cleaned) || RE_TOXIC_FUZZY.test(cleaned)) {
      return { safe: false, reason: 'Inappropriate language detected' };
    }
  }

  // ── Layer 7: Short / ambiguous terms — WORD BOUNDARY match ──────────────
  for (const v of variants) {
    if (RE_SHORT_BOUNDARY.test(v)) return { safe: false, reason: 'Inappropriate language detected' };
  }

  // ── Layer 8: Threats and violence ───────────────────────────────────────
  for (const v of variants) {
    if (RE_THREAT_CONTAINS.test(v)) return { safe: false, reason: 'Threatening or violent content is not allowed' };
  }
  // Multi-word threat phrases (checked on normalized text with spaces preserved)
  for (const re of THREAT_PHRASES) {
    if (re.test(norm)) return { safe: false, reason: 'Threatening or violent content is not allowed' };
  }

  // ── Layer 9: Harassment ─────────────────────────────────────────────────
  for (const v of variants) {
    if (RE_HARASS_CONTAINS.test(v)) return { safe: false, reason: 'Harassment is not allowed' };
  }

  // ── Layer 10: Hate speech ───────────────────────────────────────────────
  for (const v of variants) {
    if (RE_HATE_CONTAINS.test(v)) return { safe: false, reason: 'Hate speech is not allowed' };
  }

  return { safe: true };
}

module.exports = { checkMessage };
