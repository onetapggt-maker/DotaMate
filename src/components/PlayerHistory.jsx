import { useState } from 'react';
import { PAGE_SIZE, playerMatches } from '../api/opendota';
import { result } from '../analytics';
import { useHeroes, mode } from './GameData';
import { MatchTable } from './MatchTable';
import { Panel, State } from './UI';

export default function PlayerHistory({ id, initial }) {
  const [matches, setMatches] = useState(initial || []);
  const [offset, setOffset] = useState(initial?.length || 0);
  const [more, setMore] = useState(initial == null || initial.length >= PAGE_SIZE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hero, setHero] = useState('');
  const [outcome, setOutcome] = useState('');
  const [gameMode, setGameMode] = useState('');
  const [period, setPeriod] = useState('');
  const { name } = useHeroes();
  const heroes = [...new Set(matches.map(m => m.hero_id).filter(Boolean))].sort((a, b) => name(a).localeCompare(name(b)));
  const modes = [...new Set(matches.map(m => m.game_mode).filter(m => m != null))].sort((a, b) => a - b);
  const filtered = matches.filter(m =>
    (!hero || String(m.hero_id) === hero) &&
    (!outcome || result(m) === (outcome === 'win')) &&
    (!gameMode || String(m.game_mode) === gameMode) &&
    (!period || m.start_time >= Date.now() / 1000 - Number(period) * 86400)
  );

  async function loadMore() {
    setBusy(true);
    setError('');
    try {
      const next = await playerMatches(id, offset);
      setMatches(previous => [...new Map([...previous, ...next].map(m => [m.match_id, m])).values()]);
      setOffset(offset + next.length);
      setMore(next.length === PAGE_SIZE);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <Panel title="История матчей" subtitle={`Загружено ${matches.length} · по фильтрам ${filtered.length}`}>
    <div className="filters">
      <label>Герой<select value={hero} onChange={e => setHero(e.target.value)}><option value="">Все герои</option>{heroes.map(id => <option key={id} value={id}>{name(id)}</option>)}</select></label>
      <label>Результат<select value={outcome} onChange={e => setOutcome(e.target.value)}><option value="">Все результаты</option><option value="win">Победы</option><option value="loss">Поражения</option></select></label>
      <label>Режим<select value={gameMode} onChange={e => setGameMode(e.target.value)}><option value="">Все режимы</option>{modes.map(id => <option key={id} value={id}>{mode(id)}</option>)}</select></label>
      <label>Период<select value={period} onChange={e => setPeriod(e.target.value)}><option value="">Весь загруженный период</option><option value="7">Последние 7 дней</option><option value="30">Последние 30 дней</option><option value="90">Последние 90 дней</option></select></label>
    </div>
    {filtered.length ? <MatchTable matches={filtered}/> : <State empty="В загруженной истории нет матчей по выбранным фильтрам."/>}
    {error && <State error={error}/>}
    {more && <button className="button secondary load-more" disabled={busy} onClick={loadMore}>{busy ? 'Загрузка…' : error ? 'Повторить загрузку' : 'Загрузить ещё 20 матчей'}</button>}
  </Panel>;
}
