const api = 'https://api.opendota.com/api';

export async function getOpenDota(path) {
  let response;
  try {
    response = await fetch(api + path, { signal: AbortSignal.timeout(18000) });
  } catch (error) {
    throw new Error(error.name === 'TimeoutError'
      ? 'OpenDota не ответил вовремя. Попробуй ещё раз.'
      : 'Не удалось подключиться к OpenDota. Проверь интернет и попробуй ещё раз.');
  }
  if (response.status === 429) {
    throw new Error('OpenDota ограничил число запросов. Попробуй через минуту.');
  }
  if (!response.ok) {
    throw new Error(response.status === 404
      ? 'Данные не найдены в OpenDota.'
      : 'OpenDota временно недоступен. Попробуй ещё раз.');
  }
  return response.json();
}

export async function loadProfile(id) {
  const path = `/players/${id}`;
  const [profileResult, matchesResult, results, heroes] = await Promise.allSettled([
    getOpenDota(path),
    getOpenDota(path + '/recentMatches'),
    getOpenDota(path + '/wl'),
    getOpenDota(path + '/heroes'),
  ]);
  if (matchesResult.status === 'rejected') throw matchesResult.reason;
  const matches = matchesResult.value;
  if (!Array.isArray(matches)) throw new Error('OpenDota вернул некорректный список матчей.');

  const profile = profileResult.value ?? {};
  if (!profile.profile && !matches.length) {
    if (profileResult.status === 'rejected') throw profileResult.reason;
    throw new Error('OpenDota не нашёл профиль с этим ID. Проверь номер и включи общедоступную историю матчей в настройках Dota 2.');
  }
  const records = heroes.value;
  return {
    id,
    name: profile.profile?.personaname || `Игрок ${id}`,
    rank: profile.rank_tier,
    leaderboard: profile.leaderboard_rank,
    matches: matches.slice(0, 20),
    totals: Number.isInteger(results.value?.win) && Number.isInteger(results.value?.lose)
      ? results.value : null,
    heroes: Array.isArray(records)
      ? records.filter(hero => hero.games > 0).sort((a, b) => b.games - a.games) : null,
  };
}

export function rankLabel(rank, leaderboard) {
  const ranks = ['Рекрут', 'Страж', 'Рыцарь', 'Герой', 'Легенда', 'Властелин', 'Божество', 'Титан'];
  const name = ranks[Math.floor(rank / 10) - 1];
  if (!name) return '—';
  if (rank >= 80) return leaderboard > 0 ? `${name} #${leaderboard}` : name;
  return rank % 10 ? `${name} ${rank % 10}` : name;
}
