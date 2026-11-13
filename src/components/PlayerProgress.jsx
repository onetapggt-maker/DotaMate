import { useState } from 'react';
import { aggregate, groupBy, number } from '../analytics';
import { readSaved, save } from '../lib';
import { Panel, State } from './UI';
import { Chart } from './Charts';

export default function PlayerProgress({ id, matches }) {
  const key = `dotamate.mmr.${id}`;
  const [entries, setEntries] = useState(() => readSaved(key, []));
  const [mmr, setMmr] = useState('');
  const [message, setMessage] = useState('');
  const [day, setDay] = useState(() => new Date().toLocaleDateString('sv-SE'));
  const groups = groupBy([...matches].filter(m => Number.isFinite(m.start_time)).sort((a,b) => a.start_time-b.start_time),
    m => new Date(m.start_time * 1000).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }));
  const days = [...groups].map(([label, games]) => {
    const stats = aggregate(games);
    return { label, wins: stats.wins, losses: stats.losses, games: stats.count,
      rate: stats.rate == null ? null : Number(stats.rate.toFixed(1)),
      kda: stats.kda == null ? null : Number(stats.kda.toFixed(2)) };
  });

  function add(event) {
    event.preventDefault();
    const value = Number(mmr);
    const next = [...entries.filter(entry => entry.date !== day), { date: day, value }].sort((a,b) => a.date.localeCompare(b.date));
    if (!save(key, next)) {
      setMessage('Браузер не разрешил сохранить запись.');
      return;
    }
    setEntries(next);
    setMmr('');
    setMessage('Запись сохранена.');
  }

  return <div className="section-stack">
    <Panel title="Матчи по дням" subtitle={`Последние ${matches.length} матчей · победы и поражения`}>
      {days.length ? <Chart data={days} kind="bar" label="Число матчей и исходы по дням"
        series={[[ 'games', 'Все матчи', '#929EAD' ], ['wins', 'Победы', '#48C78E'], ['losses', 'Поражения', '#E05252']]}/> : <State empty="Даты матчей недоступны."/>}
    </Panel>
    {!!days.length && <div className="two-columns">
      <Panel title="Винрейт по дням" subtitle="Доля побед в матчах с известным исходом"><Chart data={days} label="Динамика винрейта" series={[[ 'rate', 'Винрейт, %', '#48C78E' ]]}/></Panel>
      <Panel title="Результативность по дням" subtitle="Среднее KDA за каждый день"><Chart data={days} label="Динамика KDA" series={[[ 'kda', 'KDA', '#E36B4F' ]]}/></Panel>
    </div>}
    <Panel title="Дневник MMR" subtitle="Записи вводятся вручную и сохраняются в этом браузере. Повторная запись за ту же дату заменяет предыдущую.">
      <form onSubmit={add} className="filters">
        <label>Дата<input required type="date" value={day} onChange={e => setDay(e.target.value)} /></label>
        <label>MMR<input required type="number" min="0" max="20000" step="1" value={mmr} onChange={e => setMmr(e.target.value)} /></label>
        <button className="button primary">Сохранить запись</button>
      </form>
      {message && <p className="muted" role="status">{message}</p>}
      {entries.length ? <>
        <Chart data={entries.map(entry => ({ label: entry.date, mmr: entry.value }))} label="История MMR" series={[[ 'mmr', 'MMR', '#E36B4F' ]]}/>
        <details><summary>Все записи</summary><ul className="list">{[...entries].reverse().map(e => <li key={e.date}>{e.date} · {number(e.value)} MMR</li>)}</ul></details>
      </> : <State empty="Добавь первую запись, чтобы начать отслеживать MMR."/>}
    </Panel>
  </div>;
}
