import { lazy, Suspense, useEffect, useState } from 'react';
import { NavLink, Link, useParams } from 'react-router-dom';
import { Activity, ChartNoAxesCombined, ChevronDown, ExternalLink, Flame, Settings, Swords, TrendingUp, Users } from 'lucide-react';
import { playerProfile } from '../api/opendota';
import { useResource } from '../hooks/useResource';
import { aggregate, date, duration, groupBy, insights, number, percent, rankLabel } from '../analytics';
import { readSaved, save } from '../lib';
import { LinkButton, Metrics, Panel, PlayerSearch, State, paths } from '../components/UI';
import { mode, Portrait, useHeroes } from '../components/GameData';
import { MatchTable } from '../components/MatchTable';
import PlayerHistory from '../components/PlayerHistory';

const Progress = lazy(() => import('../components/PlayerProgress'));
const sections = [['', 'Обзор', Activity], ['history', 'История матчей', Swords], ['heroes', 'Герои', Flame],
  ['stats', 'Статистика', ChartNoAxesCombined], ['progress', 'Прогресс', TrendingUp], ['compare', 'Сравнение', Users], ['settings', 'Настройки', Settings]];

function HeroTable({ rows, recent }) {
  const { name } = useHeroes();
  const [sort, setSort] = useState('games');
  const sorted = [...rows].sort((a,b) => sort === 'games'
    ? b.games - a.games : (b.win ?? -1) / b.games - (a.win ?? -1) / a.games || b.games - a.games);
  return <Panel title="Герои игрока" subtitle="Матчи и винрейт за всю доступную историю. KDA, GPM и XPM рассчитаны по последним 20 матчам."
    action={<select aria-label="Сортировка героев" value={sort} onChange={e => setSort(e.target.value)}><option value="games">По числу матчей</option><option value="win">По винрейту</option></select>}>
    {!rows.length ? <State empty="История по героям недоступна."/> : <div className="table-scroll" tabIndex={0}>
      <table><thead><tr>{['Герой','Матчи','Победы','Поражения','Винрейт','Матчи в выборке','KDA','GPM','XPM'].map(x => <th key={x}>{x}</th>)}</tr></thead>
        <tbody>{sorted.map(hero => {
          const stats = aggregate(recent.get(hero.hero_id) || []);
          return <tr key={hero.hero_id}><td><Link className="hero-cell" to={paths.hero(hero.hero_id)}><Portrait id={hero.hero_id}/>{name(hero.hero_id)}</Link></td>
            <td>{number(hero.games)}</td><td>{number(hero.win)}</td><td>{hero.win == null ? '—' : number(hero.games - hero.win)}</td>
            <td>{percent(hero.win, hero.games)}{hero.games < 5 && <small title="Менее пяти матчей"> · мало матчей</small>}</td>
            <td>{stats.count}</td><td>{number(stats.kda, 2)}</td><td>{number(stats.gpm)}</td><td>{number(stats.xpm)}</td></tr>;
        })}</tbody></table>
    </div>}
  </Panel>;
}

function Breakdowns({ matches }) {
  const sides = [...groupBy(matches.filter(m => Number.isFinite(m.player_slot)), m => m.player_slot < 128 ? 'Radiant' : 'Dire')];
  const modes = [...groupBy(matches.filter(m => m.game_mode != null), m => mode(m.game_mode))];
  return <div className="two-columns">
    {[['По сторонам', sides], ['По режимам', modes]].map(([title, rows]) => <Panel title={title} subtitle={`Последние ${matches.length} матчей`} key={title}>
      {rows.length ? <div className="table-scroll"><table><thead><tr><th>Выборка</th><th>Матчи</th><th>Победы</th><th>Винрейт</th></tr></thead>
        <tbody>{rows.map(([label, games]) => {
          const stats = aggregate(games);
          return <tr key={label}><td>{label}</td><td>{stats.count}</td><td>{stats.decided ? stats.wins : '—'}</td><td>{percent(stats.wins, stats.decided)}</td></tr>;
        })}</tbody></table></div> : <State empty="Данных для разбивки пока нет."/>}
    </Panel>)}
  </div>;
}

export default function Player() {
  const { id, section = '' } = useParams();
  const valid = /^\d{1,10}$/.test(id) && Number(id) > 0 && Number(id) <= 4294967295;
  const resource = useResource(valid ? id : null, () => playerProfile(id));
  const [open, setOpen] = useState(false);
  const { name } = useHeroes();
  useEffect(() => {
    if (resource.data && save('dotamate.lastId', id)) window.dispatchEvent(new Event('dotamate:profile'));
  }, [resource.data, id]);
  if (!valid) return <State error="Некорректный ID игрока."/>;
  if (!sections.some(([key]) => key === section)) return <Panel title="Раздел не найден"><LinkButton to={paths.player(id)}>Обзор профиля</LinkButton></Panel>;
  if (!resource.data) return <State {...resource}/>;
  const { profile, matches: source, total, heroes = [] } = resource.data;
  const matches = source || [];
  const person = profile?.profile;
  const playerName = person?.personaname || `Игрок №${id}`;
  const steam = (76561197960265728n + BigInt(id)).toString();
  const rank = rankLabel(profile?.rank_tier, profile?.leaderboard_rank);
  const recentHeroes = groupBy(matches, m => m.hero_id);
  const stats = aggregate(matches);
  const count = Number.isFinite(total?.win) && Number.isFinite(total?.lose) ? total.win + total.lose : null;
  const latest = matches.reduce((value, m) => Math.max(value, m.start_time || 0), 0);
  const notes = insights(matches, heroes, name);
  const statsValues = [['Средний KDA', number(stats.kda, 2), 'Среднее по матчам: (убийства + помощь) / максимум из смертей и 1'],
    ['Золото в минуту', number(stats.gpm), 'GPM'], ['Опыт в минуту', number(stats.xpm), 'XPM'],
    ['Средняя длительность', duration(stats.duration)], ['Винрейт', percent(stats.wins, stats.decided)]];
  return <div className="profile-layout">
    <aside className="side panel">
      <button className="button secondary side-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>Разделы профиля <ChevronDown size={17}/></button>
      <nav className={open ? 'side-links open' : 'side-links'} aria-label="Разделы профиля">
        {sections.map(([key, title, Icon]) => <NavLink end key={key} to={paths.player(id) + (key ? `/${key}` : '')} onClick={() => setOpen(false)}><Icon size={17}/>{title}</NavLink>)}
      </nav>
    </aside>
    <div className="section-stack profile-body">
      <section className="panel player-header">
        <div className="identity">
          <span className="avatar">{person?.avatarfull ? <img src={person.avatarfull} alt=""/> : playerName.slice(0, 1)}</span>
          <div><h1>{playerName}</h1><p className="muted">Steam ID {steam}</p>
            <div className="identity-links">
              {rank !== '—' && <span className="rank">
                {profile.rank_tier && <img alt="" src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/rank_icons/rank_icon_${Math.floor(profile.rank_tier / 10)}.png`} onError={e => { e.currentTarget.hidden = true; }}/>}
                {rank}</span>}
              <a href={`https://steamcommunity.com/profiles/${steam}`} target="_blank" rel="noreferrer">Steam <ExternalLink size={13}/></a>
            </div>
          </div>
        </div>
        <p className="muted">Последний доступный матч · {date(latest)}</p>
        <Metrics values={[[ 'Матчи за всю историю', number(count) ], ['Победы', number(total?.win), '', 'win'],
          ['Поражения', number(total?.lose), '', 'loss'], ['Общий винрейт', percent(total?.win, count)]]}/>
      </section>
      {count === null && <State error="Сводка за всю историю недоступна в OpenDota." retry={resource.retry}/>}
      {source === null && <State error="История матчей временно недоступна." retry={resource.retry}/>}
      {Array.isArray(source) && !matches.length && <State empty="OpenDota не показывает матчи. Проверь, включена ли общедоступная история матчей в Dota 2."/>}
      {section === '' && <>
        <Panel title={`Последние ${matches.length} матчей`} subtitle="Средние значения рассчитаны по матчам, где OpenDota вернул показатель."><Metrics values={statsValues}/></Panel>
        <div className="two-columns">
          <Panel title="Выводы по данным">{notes.length ? <ul className="list insights">{notes.map(note => <li key={note}>{note}</li>)}</ul> : <State empty="Для выводов пока мало данных."/>}</Panel>
          <Panel title="Самые частые герои" subtitle="Вся история в OpenDota" action={<LinkButton to={paths.player(id) + '/heroes'}>Все герои</LinkButton>}>
            {heroes.length ? <ul className="top-heroes">{[...heroes].sort((a,b) => b.games-a.games).slice(0, 5).map(h =>
              <li key={h.hero_id}><Link className="hero-cell" to={paths.hero(h.hero_id)}><Portrait id={h.hero_id}/>{name(h.hero_id)}</Link><span>{number(h.games)} матчей · {percent(h.win,h.games)}</span></li>)}</ul>
              : <State empty="Нет данных по героям."/>}
          </Panel>
        </div>
        {!!matches.length && <Panel title="Недавние матчи" action={<LinkButton to={paths.player(id) + '/history'}>Вся история</LinkButton>}><MatchTable matches={matches.slice(0,5)}/></Panel>}
      </>}
      {section === 'history' && <PlayerHistory key={id} id={id} initial={source}/>}
      {section === 'heroes' && <HeroTable key={id} rows={heroes} recent={recentHeroes}/>}
      {section === 'stats' && <><Panel title={`Показатели последних ${matches.length} матчей`}><Metrics values={statsValues}/></Panel><Breakdowns matches={matches}/></>}
      {section === 'progress' && <Suspense fallback={<State/>}><Progress key={id} id={id} matches={matches}/></Suspense>}
      {section === 'compare' && <Panel title="Сравнение"><p className="muted">Открой сравнение с этим игроком и введи второй Steam ID.</p><LinkButton to={`/compare?first=${id}`}>Сравнить игроков</LinkButton></Panel>}
      {section === 'settings' && <Panel title="Настройки профиля"><p className="muted">История MMR хранится в браузере отдельно для каждого ID.</p>
        <SaveProfile key={id} id={id}/><PlayerSearch initial={id}/></Panel>}
    </div>
  </div>;
}

function SaveProfile({ id }) {
  const [message, setMessage] = useState('');
  return <div className="settings-action">
    <button className="button secondary" onClick={() => setMessage(save('dotamate.lastId', id) ? 'Профиль сохранён в браузере.' : 'Браузер не разрешил сохранить профиль.')}>Сохранить профиль</button>
    {message && <p role="status" className="muted">{message}</p>}
  </div>;
}
