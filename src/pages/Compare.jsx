import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { api, playerMatches, recentMatches } from '../api/opendota';
import { useResource } from '../hooks/useResource';
import { aggregate, groupBy, number, percent } from '../analytics';
import { parseAccountId } from '../lib';
import { Portrait, useHeroes } from '../components/GameData';
import { Chart } from '../components/Charts';
import { Panel, State, paths } from '../components/UI';

const limit = 100;
const periods = [7, 30, 90];

async function loadComparison(ids, days, cutoff) {
  const profiles = Promise.allSettled(ids.map(id => api(`/players/${id}`)));
  let sampleLimit = limit;
  let matches;
  try {
    matches = await Promise.all(ids.map(id => playerMatches(id, 0, limit, days)));
  } catch {
    sampleLimit = 20;
    matches = await Promise.all(ids.map(recentMatches));
  }
  const identities = await profiles;
  return {
    sampleLimit,
    players: ids.map((id, i) => {
      const player = identities[i].value?.profile;
      if (!player && !matches[i].length) throw new Error(`Для ID ${id} не найден профиль с доступными матчами.`);
      const sample = matches[i].filter(m => m.start_time >= cutoff);
      return {
        id, name: player?.personaname || `Игрок №${id}`, avatar: player?.avatarfull,
        stats: aggregate(sample), capped: matches[i].length >= sampleLimit,
        favorites: [...groupBy(sample.filter(m => m.hero_id), m => m.hero_id)]
          .sort((a,b) => b[1].length - a[1].length).slice(0,3),
      };
    }),
  };
}

function Comparison({ ids, days }) {
  const [cutoff] = useState(() => Date.now() / 1000 - days * 86400);
  const { name } = useHeroes();
  const resource = useResource(ids.join(':') + days, () => loadComparison(ids, days, cutoff));
  if (!resource.data) return <State {...resource}/>;
  const { players, sampleLimit } = resource.data;
  const [a,b] = players;
  const charts = [['rate','Винрейт, %'], ['kda','KDA'], ['gpm','GPM'], ['xpm','XPM']];
  return <div className="section-stack">
    <Panel title={`Сравнение за ${days} дней`} subtitle={`Одинаковый период и правила расчёта. До ${sampleLimit} последних матчей каждого игрока.`}>
      {sampleLimit < limit && <p className="muted">Расширенная история недоступна. Для обоих игроков использована недавняя выборка.</p>}
      {(a.capped || b.capped) && <p className="muted">Лимит выборки достигнут. Часть более ранних матчей периода не вошла в сравнение.</p>}
      <div className="two-columns comparison-identities">{players.map((p, i) => <div className="identity" key={i}>
        <span className="avatar">{p.avatar ? <img src={p.avatar} alt=""/> : p.name.slice(0,1)}</span>
        <div><Link to={paths.player(p.id)}><strong>{p.name}</strong></Link><p className="muted">{p.stats.count} матчей · {percent(p.stats.wins,p.stats.decided)} побед</p></div>
      </div>)}</div>
      <div className="table-scroll"><table><thead><tr><th>Показатель</th><th>{a.name}</th><th>{b.name}</th></tr></thead>
        <tbody>{[['Матчи','count'], ...charts.map(([key,label])=>[label,key])].map(([label,key]) => <tr key={key}><td>{label}</td>
          <td>{number(a.stats[key],2)}</td><td>{number(b.stats[key],2)}</td></tr>)}</tbody></table></div>
    </Panel>
    <div className="two-columns">{charts.map(([key,label]) => <Panel key={key} title={label}>
      {[a,b].some(p => p.stats[key] != null) ? <Chart horizontal kind="bar" label={`Сравнение по показателю ${label}`}
        data={[{ label: 'Игроки', first: a.stats[key] == null ? null : +a.stats[key].toFixed(2), second: b.stats[key] == null ? null : +b.stats[key].toFixed(2) }]}
        series={[[ 'first', a.name, '#D64545' ], ['second', b.name, '#48C78E']]}/> : <State empty="Показатель недоступен в этом периоде."/>}
    </Panel>)}</div>
    <div className="two-columns">{players.map((p, i) => <Panel key={i} title={p.name} subtitle="Самые частые герои в выбранном периоде">
      {p.favorites.length ? <ul className="top-heroes">{p.favorites.map(([id,games]) =>
        <li key={id}><Link to={paths.hero(id)} className="hero-cell"><Portrait id={id}/>{name(id)}</Link><span>{games.length} матчей</span></li>)}</ul>
        : <State empty="В выбранном периоде матчей нет."/>}
    </Panel>)}</div>
  </div>;
}

export default function Compare() {
  const [query, setQuery] = useSearchParams();
  const first = query.get('first') || '';
  const second = query.get('second') || '';
  const days = periods.includes(Number(query.get('days'))) ? Number(query.get('days')) : 30;
  const [error, setError] = useState('');
  let ids;
  if (first && second) {
    try { ids = [parseAccountId(first), parseAccountId(second)]; } catch { ids = null; }
  }

  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
      const a = parseAccountId(form.get('first'));
      const b = parseAccountId(form.get('second'));
      if (a === b) throw new Error('Введи два разных профиля.');
      setError('');
      setQuery({ first: a, second: b, days: form.get('days') });
    } catch (error) {
      setError(error.message);
    }
  }

  return <div className="section-stack">
    <div className="page-heading"><Users size={24}/><div><h1>Сравнение игроков</h1><p>Два Steam-профиля за один период.</p></div></div>
    <Panel>
      <form className="filters compare-form" key={query.toString()} onSubmit={submit}>
        <label>Steam ID первого игрока<input name="first" defaultValue={first} required /></label>
        <label>Steam ID второго игрока<input name="second" defaultValue={second} required /></label>
        <label>Период<select name="days" defaultValue={days}>{periods.map(days => <option key={days} value={days}>Последние {days} дней</option>)}</select></label>
        <button className="button primary">Сравнить</button>
      </form>
      {error && <State error={error}/>}
    </Panel>
    {ids && ids[0] !== ids[1] && <Comparison key={`${ids.join(':')}:${days}`} ids={ids} days={days}/>}
  </div>;
}
