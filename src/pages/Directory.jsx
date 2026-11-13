import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, heroStats } from '../api/opendota';
import { useResource } from '../hooks/useResource';
import { date, duration, number } from '../analytics';
import { readSaved } from '../lib';
import { LinkButton, Panel, PlayerSearch, State, paths } from '../components/UI';

function RecentMatches() {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [error, setError] = useState('');
  const resource = useResource('proMatches', () => api('/proMatches'));
  return <div className="section-stack">
    <div className="page-heading"><div><h1>Матчи</h1><p>Найди матч по ID или открой одну из недавних игр профессиональных команд.</p></div></div>
    <Panel>
      <form className="filters" onSubmit={e => {
        e.preventDefault();
        const value = id.trim();
        if (/^\d+$/.test(value) && Number(value) > 0 && Number.isSafeInteger(Number(value))) navigate(paths.match(value));
        else setError('Введи числовой ID матча.');
      }}>
        <label>ID матча<input inputMode="numeric" value={id} onChange={e => { setId(e.target.value); setError(''); }} required /></label>
        <button className="button primary">Открыть матч</button>
      </form>
      {error && <State error={error}/>}
    </Panel>
    <Panel title="Недавние профессиональные матчи" subtitle="Данные OpenDota">
      {!resource.data ? <State {...resource}/> : resource.data.length ? <div className="table-scroll"><table>
        <thead><tr>{['Матч','Radiant','Dire','Победитель','Счёт','Турнир','Дата','Время'].map(label => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{resource.data.map(m => <tr key={m.match_id}><td><Link to={paths.match(m.match_id)}>№{m.match_id}</Link></td>
          <td>{m.radiant_name || '—'}</td><td>{m.dire_name || '—'}</td>
          <td>{typeof m.radiant_win === 'boolean' ? (m.radiant_win ? m.radiant_name || 'Radiant' : m.dire_name || 'Dire') : '—'}</td>
          <td>{number(m.radiant_score)} : {number(m.dire_score)}</td><td>{m.league_name || '—'}</td>
          <td>{date(m.start_time)}</td><td>{duration(m.duration)}</td></tr>)}</tbody>
      </table></div> : <State empty="OpenDota не вернул профессиональные матчи."/>}
    </Panel>
  </div>;
}

function Rankings() {
  const heroes = useResource('heroStats', heroStats);
  const [heroId, setHeroId] = useState('11');
  const ranking = useResource(heroId, () => api(`/rankings?hero_id=${heroId}`, 600_000));
  const rows = ranking.data?.rankings ?? [];
  return <div className="section-stack">
    <div className="page-heading"><div><h1>Рейтинги</h1><p>Рейтинг игроков на выбранном герое по очкам OpenDota.</p></div></div>
    <Panel title="Рейтинг по герою" subtitle="Очки в таблице — показатель OpenDota. Официальный MMR Valve в этой таблице недоступен.">
      {heroes.data ? <div className="filters"><label>Герой<select value={heroId} onChange={e => setHeroId(e.target.value)}>
        {[...heroes.data].sort((a,b) => a.localized_name.localeCompare(b.localized_name)).map(h => <option key={h.id} value={h.id}>{h.localized_name}</option>)}</select></label></div> : <State {...heroes}/>}
      {!ranking.data ? <State {...ranking}/> : rows.length ? <div className="table-scroll"><table>
        <thead><tr><th>Место</th><th>Игрок</th><th>Очки OpenDota</th></tr></thead>
        <tbody>{rows.slice(0,100).map((p,i) => <tr key={p.account_id}><td>{i+1}</td>
          <td><Link className="hero-cell" to={paths.player(p.account_id)}>{p.avatar && <img className="ranking-avatar" src={p.avatar} loading="lazy" alt=""/>}{p.personaname || `Игрок №${p.account_id}`}</Link></td>
          <td>{number(p.score,2)}</td></tr>)}</tbody>
      </table></div> : <State empty="Рейтинг для этого героя недоступен."/>}
    </Panel>
  </div>;
}

export default function Directory({ type }) {
  if (type === 'matches') return <RecentMatches/>;
  if (type === 'rankings') return <Rankings/>;
  const saved = readSaved('dotamate.lastId', readSaved('dotamate.profile', null)?.id);
  return <div className="section-stack">
    <div className="page-heading"><div><h1>Игроки</h1><p>Профиль, история матчей и статистика героев.</p></div></div>
    <Panel title="Найти профиль" subtitle="Введи SteamID64, ID друга Dota 2 или числовую ссылку Steam.">
      <PlayerSearch initial={saved || ''}/>
      {saved && <div className="settings-action"><LinkButton to={paths.player(saved)}>Последний профиль</LinkButton></div>}
    </Panel>
  </div>;
}
