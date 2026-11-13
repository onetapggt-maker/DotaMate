export const number = (value, digits = 0) => value == null || !Number.isFinite(Number(value))
  ? '—' : Number(value).toLocaleString('ru-RU', { maximumFractionDigits: digits });
export const percent = (part, total) => total > 0 && part != null ? `${number(part / total * 100, 1)}%` : '—';
export const duration = seconds => Number.isFinite(seconds)
  ? `${Math.floor(Math.round(seconds) / 60)}:${String(Math.round(seconds) % 60).padStart(2, '0')}` : '—';
export const date = seconds => Number.isFinite(seconds) && seconds > 0
  ? new Date(seconds * 1000).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : '—';
export const result = match => typeof match.radiant_win === 'boolean' && Number.isFinite(match.player_slot)
  ? (match.player_slot < 128) === match.radiant_win : null;
export const mean = values => {
  const known = values.filter(Number.isFinite);
  return known.length ? known.reduce((sum, value) => sum + value, 0) / known.length : null;
};

export function aggregate(matches) {
  const decided = matches.map(result).filter(value => value !== null);
  const wins = decided.filter(Boolean).length;
  const combat = matches.filter(m => [m.kills, m.deaths, m.assists].every(Number.isFinite));
  return {
    count: matches.length,
    wins,
    losses: decided.length - wins,
    decided: decided.length,
    rate: decided.length ? wins / decided.length * 100 : null,
    kda: mean(combat.map(m => (m.kills + m.assists) / Math.max(1, m.deaths))),
    gpm: mean(matches.map(m => m.gold_per_min)),
    xpm: mean(matches.map(m => m.xp_per_min)),
    deaths: mean(matches.map(m => m.deaths)),
    duration: mean(matches.map(m => m.duration)),
  };
}

export function groupBy(values, key) {
  const groups = new Map();
  values.forEach(value => {
    const label = key(value);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(value);
  });
  return groups;
}

export function insights(matches, heroes, name) {
  const notes = [];
  const stats = aggregate(matches);
  if (stats.decided) notes.push(`В последних ${stats.decided} матчах с известным результатом винрейт составил ${percent(stats.wins, stats.decided)}.`);
  const best = heroes.filter(h => h.games >= 5 && Number.isFinite(h.win))
    .sort((a, b) => b.win / b.games - a.win / a.games || b.games - a.games)[0];
  if (best) notes.push(`Лучший винрейт среди героев с минимум 5 матчами у ${name(best.hero_id)} — ${percent(best.win, best.games)} за ${best.games} матчей.`);
  if (matches.length >= 20) {
    const recent = matches.slice(0, 10);
    const previous = matches.slice(10, 20);
    if ([...recent, ...previous].every(m => Number.isFinite(m.deaths))) {
      const now = aggregate(recent).deaths;
      const before = aggregate(previous).deaths;
      if (now !== before) notes.push(`Среднее число смертей за последние 10 матчей ${now > before ? 'выросло' : 'снизилось'} с ${number(before, 1)} до ${number(now, 1)} по сравнению с предыдущими десятью.`);
    }
  }
  const radiant = aggregate(matches.filter(m => Number.isFinite(m.player_slot) && m.player_slot < 128));
  const dire = aggregate(matches.filter(m => Number.isFinite(m.player_slot) && m.player_slot >= 128));
  if (radiant.decided >= 5 && dire.decided >= 5 && radiant.rate !== dire.rate) {
    notes.push(`В последних матчах винрейт выше за ${radiant.rate > dire.rate ? 'Radiant' : 'Dire'} (Radiant ${percent(radiant.wins, radiant.decided)}, Dire ${percent(dire.wins, dire.decided)}).`);
  }
  return notes;
}

export function rankLabel(rank, leaderboard) {
  const ranks = ['Рекрут', 'Страж', 'Рыцарь', 'Герой', 'Легенда', 'Властелин', 'Божество', 'Титан'];
  const name = ranks[Math.floor(rank / 10) - 1];
  if (!name) return '—';
  if (rank >= 80) return leaderboard > 0 ? `${name} #${leaderboard}` : name;
  return rank % 10 ? `${name} ${rank % 10}` : name;
}
