const base = 'https://api.opendota.com/api';
const cache = new Map();
const pending = new Map();
let blockedUntil = 0;

export function api(path, ttl = 120_000) {
  const cached = cache.get(path);
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached.data);
  if (pending.has(path)) return pending.get(path);
  if (Date.now() < blockedUntil) {
    return Promise.reject(new Error('OpenDota ограничил число запросов. Повтори попытку через минуту.'));
  }

  const request = (async () => {
    let response;
    try {
      response = await fetch(base + path, { signal: AbortSignal.timeout(15000) });
    } catch {
      throw new Error('OpenDota не отвечает. Проверь подключение и повтори запрос.');
    }
    if (response.status === 429) {
      const seconds = Number(response.headers.get('Retry-After')) || 60;
      blockedUntil = Date.now() + seconds * 1000;
      throw new Error('OpenDota ограничил число запросов. Повтори попытку позже.');
    }
    if (!response.ok) {
      throw new Error(response.status === 404
        ? 'OpenDota не нашёл запрошенные данные.'
        : 'OpenDota временно недоступен.');
    }
    const data = await response.json();
    cache.set(path, { data, expires: Date.now() + ttl });
    if (cache.size > 120) cache.delete(cache.keys().next().value);
    return data;
  })().finally(() => pending.delete(path));
  pending.set(path, request);
  return request;
}

export const PAGE_SIZE = 20;
export const recentMatches = id => api(`/players/${id}/recentMatches`);
const fields = ['match_id', 'start_time', 'duration', 'hero_id', 'player_slot', 'radiant_win',
  'game_mode', 'lobby_type', 'kills', 'deaths', 'assists', 'gold_per_min', 'xp_per_min',
  'hero_damage', 'last_hits', 'denies'];

export function playerMatches(id, offset = 0, limit = PAGE_SIZE, since) {
  const query = new URLSearchParams({ significant: '0', limit, offset });
  if (since) query.set('date', since);
  fields.forEach(field => query.append('project', field));
  return api(`/players/${id}/matches?${query}`);
}

export async function playerProfile(id) {
  const results = await Promise.allSettled([
    api(`/players/${id}`), recentMatches(id), api(`/players/${id}/wl`),
    api(`/players/${id}/heroes`),
  ]);
  const [profile, matches, total, heroes] = results.map(result => result.value);
  if (!profile?.profile && !matches?.length) {
    throw results.find(result => result.status === 'rejected')?.reason
      ?? new Error('Профиль не найден. Проверь Steam ID и общедоступную историю матчей в Dota 2.');
  }
  return { profile, matches: matches ?? null, total, heroes: heroes?.filter(hero => hero.games > 0) };
}

export const heroStats = () => api('/heroStats', 1_800_000);
export const items = () => api('/constants/items', 3_600_000);
