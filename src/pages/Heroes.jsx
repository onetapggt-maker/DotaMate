import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { api, heroStats } from '../api/opendota';
import { useResource } from '../hooks/useResource';
import { number, percent } from '../analytics';
import { Portrait, attributes, roles, useHeroes } from '../components/GameData';
import { LinkButton, Metrics, Panel, State, paths } from '../components/UI';

const attributesList = Object.entries(attributes);
const rate = (wins, picks) => Number.isFinite(wins) && picks > 0 ? wins / picks : null;
const publicGames = hero => ({
  picks: hero.pub_pick,
  wins: hero.pub_win,
});
const population = heroes => {
  const picks = heroes.map(h => h.pub_pick).filter(Number.isFinite);
  return picks.length ? picks.reduce((a,b) => a+b, 0) : null;
};

function Catalog({ heroes }) {
  const [search, setSearch] = useState('');
  const [attribute, setAttribute] = useState('');
  const [sort, setSort] = useState('picks');
  const total = population(heroes);
  const shown = heroes.filter(h => (!attribute || attribute === h.primary_attr) &&
    h.localized_name?.toLowerCase().includes(search.trim().toLowerCase())).sort((a,b) => {
    if (sort === 'name') return a.localized_name.localeCompare(b.localized_name);
    if (sort === 'win') return (rate(b.pub_win,b.pub_pick) ?? -1) - (rate(a.pub_win,a.pub_pick) ?? -1);
    return (b.pub_pick ?? -1) - (a.pub_pick ?? -1);
  });
  return <>
    <div className="page-heading"><Flame size={24}/><div><h1>Герои Dota 2</h1><p>Публичная выборка OpenDota. Популярность — доля всех пиков в этой выборке.</p></div></div>
    <div className="panel filters catalog-filters">
      <label>Поиск<input placeholder="Название героя" value={search} onChange={e => setSearch(e.target.value)}/></label>
      <label>Атрибут<select value={attribute} onChange={e => setAttribute(e.target.value)}><option value="">Все атрибуты</option>
        {attributesList.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
      <label>Сортировка<select value={sort} onChange={e => setSort(e.target.value)}><option value="picks">По популярности</option>
        <option value="win">По винрейту</option><option value="name">По названию</option></select></label>
    </div>
    <div className="hero-grid">{shown.map(h => <Link className="panel hero-card" to={paths.hero(h.id)} key={h.id}>
      <Portrait id={h.id}/><div className="hero-card-body">
        <small>{attributes[h.primary_attr] || '—'}</small><h2>{h.localized_name}</h2>
        <dl><div><dt>Винрейт</dt><dd>{percent(h.pub_win,h.pub_pick)}</dd></div>
          <div><dt>Матчи</dt><dd>{number(h.pub_pick)}</dd></div><div><dt>Доля пиков</dt><dd>{percent(h.pub_pick,total)}</dd></div></dl>
      </div>
    </Link>)}</div>
    {!shown.length && <State empty="Герои по этим фильтрам не найдены."/>}
  </>;
}

function HeroDetail({ hero, total }) {
  const { name } = useHeroes();
  const matchups = useResource(hero.id, () => api(`/heroes/${hero.id}/matchups`, 900_000));
  const { picks, wins } = publicGames(hero);
  const rows = (matchups.data || []).filter(h => h.games_played > 0).sort((a,b) => b.games_played-a.games_played);
  return <div className="section-stack">
    <Panel>
      <div className="identity hero-identity"><Portrait id={hero.id}/><div><p className="muted">{attributes[hero.primary_attr] || '—'}</p><h1>{hero.localized_name}</h1>
        <p>{hero.roles?.map(role => roles[role]).filter(Boolean).join(' · ')}</p></div><LinkButton to="/heroes">Все герои</LinkButton></div>
      <Metrics values={[[ 'Матчи в публичной выборке', number(picks) ], ['Винрейт', percent(wins,picks)], ['Доля пиков', percent(picks,total)],
        ['Пики на про-сцене', number(hero.pro_pick)], ['Винрейт на про-сцене', percent(hero.pro_win,hero.pro_pick)]]}/>
    </Panel>
    <Panel title="По ранговым группам" subtitle="Выборки OpenDota по уровню игры">
      <div className="table-scroll"><table><thead><tr><th>Группа</th><th>Пики</th><th>Победы</th><th>Винрейт</th></tr></thead>
        <tbody>{['Рекрут','Страж','Рыцарь','Герой','Легенда','Властелин','Божество','Титан'].map((label, i) => {
          const count = hero[`${i+1}_pick`];
          const win = hero[`${i+1}_win`];
          return <tr key={label}><td>{label}</td><td>{number(count)}</td><td>{number(win)}</td><td>{percent(win,count)}</td></tr>;
        })}</tbody></table></div>
    </Panel>
    <Panel title="Матчи против других героев" subtitle="Первые 30 соперников по числу матчей в отдельной выборке OpenDota">
      {!matchups.data ? <State {...matchups}/> : rows.length ? <div className="table-scroll"><table><thead><tr><th>Соперник</th><th>Матчи</th><th>Победы</th><th>Винрейт</th></tr></thead>
        <tbody>{rows.slice(0,30).map(row => <tr key={row.hero_id}><td><Link className="hero-cell" to={paths.hero(row.hero_id)}><Portrait id={row.hero_id}/>{name(row.hero_id)}</Link></td>
          <td>{number(row.games_played)}</td><td>{number(row.wins)}</td><td>{percent(row.wins,row.games_played)}</td></tr>)}</tbody></table></div>
        : <State empty="Данные о соперниках недоступны."/>}
    </Panel>
  </div>;
}

export default function Heroes() {
  const { id } = useParams();
  const resource = useResource('heroStats', heroStats);
  if (!resource.data) return <State {...resource}/>;
  if (!id) return <Catalog heroes={resource.data}/>;
  const hero = resource.data.find(h => String(h.id) === id);
  return hero ? <HeroDetail key={id} hero={hero} total={population(resource.data)}/>
    : <Panel title="Герой не найден"><LinkButton to="/heroes">Каталог героев</LinkButton></Panel>;
}
