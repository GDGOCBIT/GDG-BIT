// Pulls public chapter data from gdg.community.dev (Bevy) so the site is never empty.
// Results are cached in memory; on any failure we fall back to the last good copy (or []).
const axios = require('axios');

const BASE = 'https://gdg.community.dev';
const CHAPTER_ID = process.env.GDG_CHAPTER_ID || '2085';
const CHAPTER_SLUG = process.env.GDG_CHAPTER_SLUG || 'gdg-on-campus-bengal-institute-of-technology-kolkata-india';
const TTL = 30 * 60 * 1000;
const http = axios.create({ timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0 (GDG on Campus BIT website)' } });

const cache = { events: { at: 0, data: [] }, team: { at: 0, data: [] }, chapter: { at: 0, data: null } };

const cached = async (key, loader) => {
    const entry = cache[key];
    if (Date.now() - entry.at < TTL) return entry.data;
    try {
        entry.data = await loader();
        entry.at = Date.now();
    } catch (e) {
        console.log(`[gdg] ${key} sync failed: ${e.message}`);
        entry.at = Date.now() - TTL + 60 * 1000; // retry in a minute
    }
    return entry.data;
};

const stripHtml = (s = '') => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const fetchEvents = async () => {
    const results = [];
    let url = `${BASE}/api/event_slim/for_chapter/${CHAPTER_ID}/?page_size=100&include_cohosted_events=true&visible_on_parent_chapter_only=true&order=-start_date`;
    for (let i = 0; url && i < 5; i++) {
        const { data } = await http.get(url);
        results.push(...(data.results || []));
        url = data.links?.next || data.next || null;
    }
    return results
        .filter((e) => !e.is_hidden)
        .map((e) => ({
            _id: `gdg-${e.id}`,
            source: 'gdg',
            title: e.title,
            description: stripHtml(e.description_short || ''),
            startDate: e.start_date,
            endDate: e.end_date,
            mode: e.audience_type === 'VIRTUAL' || e.is_virtual_event ? 'Online' : e.audience_type === 'HYBRID' ? 'Hybrid' : 'In person',
            link: e.static_url || e.url,
            image: { url: (typeof e.picture === 'string' ? e.picture : e.picture?.url) || e.cropped_picture_url || '' },
        }));
};

const fetchTeam = async () => {
    const { data: html } = await http.get(`${BASE}/${CHAPTER_SLUG}/`, { responseType: 'text' });
    const key = '"chapterTeam":';
    const start = html.indexOf(key);
    if (start === -1) return [];
    // Walk the JSON array that follows the key, tracking brackets and strings.
    let i = start + key.length, depth = 0, inStr = false, esc = false, end = -1;
    for (; i < html.length; i++) {
        const c = html[i];
        if (inStr) {
            if (esc) esc = false;
            else if (c === '\\') esc = true;
            else if (c === '"') inStr = false;
        } else if (c === '"') inStr = true;
        else if (c === '[') depth++;
        else if (c === ']' && --depth === 0) { end = i + 1; break; }
    }
    if (end === -1) return [];
    const list = JSON.parse(html.slice(start + key.length, end));
    const byName = new Map();
    list.forEach((m, idx) => {
        const u = m.user || {};
        const name = (u.full_name || `${u.first_name || ''} ${u.last_name || ''}`).trim();
        if (!name) return;
        const isOrganizer = /organi[sz]er/i.test(m.title || '');
        const prev = byName.get(name.toLowerCase());
        // A person can be listed twice (organizer + a lead role): keep the organizer entry.
        if (prev && (prev.team === 'Organizers' || !isOrganizer)) return;
        byName.set(name.toLowerCase(), {
            _id: `gdg-team-${idx}`,
            source: 'gdg',
            name: name.replace(/\b([A-Z])([A-Z]+)\b/g, (_, a, b) => a + b.toLowerCase()),
            role: m.title || 'Member',
            team: isOrganizer ? 'Organizers' : 'Leads',
            order: isOrganizer ? 0 : 50,
            image: { url: u.cropped_avatar_url || u.avatar?.url || '' },
            twitter: u.twitter ? `https://x.com/${u.twitter}` : '',
            profile: u.profile_url ? `${BASE}${u.profile_url}` : '',
        });
    });
    return [...byName.values()];
};

const fetchChapter = async () => {
    const { data } = await http.get(`${BASE}/api/chapter_slim/${CHAPTER_SLUG}/`);
    return { members: Number(data.members_count) || 0 };
};

module.exports = {
    getChapterInfo: () => cached('chapter', fetchChapter),
    getCommunityEvents: () => cached('events', fetchEvents),
    getCommunityTeam: () => cached('team', fetchTeam),
};
