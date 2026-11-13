import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight, Swords } from 'lucide-react';
import { api, items } from '../api/opendota';
import { useResource } from '../hooks/useResource';
import { date, duration, number } from '../analytics';
import { Portrait, useHeroes, mode } from '../components/GameData';
import { Chart } from '../components/Charts';
import WardPositions from '../components/WardPositions';
import { Metrics, Panel, State, paths } from '../components/UI';

const columns = [
  ['У / С / П', p => [p.kills, p.deaths, p.assists].map(x => number(x)).join(' / ')],
  ['Уровень', p => number(p.level)], ['Ценность', p => number(p.net_worth)],
  ['GPM', p => number(p.gold_per_min)], ['XPM', p => number(p.xp_per_min)],
  ['Урон героям', p => number(p.hero_damage)], ['Урон строениям', p => number(p.tower_damage)],
  ['Лечение', p => number(p.hero_healing)], ['Добивания', p => number(p.last_hits)],
  ['Денаи', p => number(p.denies)],
];
const time = seconds => Number.isFinite(seconds) ? `${seconds < 0 ? '−' : ''}${duration(Math.abs(seconds))}` : '—';

function itemName(catalog, id) {
  const item = catalog[id];
  return item?.dname || item?.name || `Предмет №${id}`;
}

function Inventory({ player, catalog }) {
  const ids = Array.from({ length: 6 }, (_, i) => player[`item_${i}`]).filter(id => id > 0);
  return <div className="inventory">
    {ids.map((id, slot) => <span key={slot} className="item-chip" title={itemName(catalog, id)}>{itemName(catalog, id)}</span>)}
    {player.item_neutral > 0 && <span className="item-chip neutral" title="Нейтральный предмет">{itemName(catalog, player.item_neutral)}</span>}
    {!ids.length && !player.item_neutral && '—'}
  </div>;
}

function Teams({ players, match, catalog }) {
  const { name } = useHeroes();
  return <>{[[true, 'Radiant', match.radiant_score], [false, 'Dire', match.dire_score]].map(([radiant, team, score]) =>
    <Panel key={team} title={`${team} · ${number(score)}`} subtitle={match.radiant_win === radiant ? 'Победа' : undefined}>
      <div className="table-scroll" tabIndex={0} aria-label={`Таблица игроков ${team}`}><table>
        <thead><tr><th>Игрок</th>{columns.map(([label]) => <th key={label}>{label}</th>)}<th>Предметы</th></tr></thead>
        <tbody>{players.filter(p => Number.isFinite(p.player_slot) && (p.player_slot < 128) === radiant).map(p =>
          <tr key={p.player_slot}>
            <td><div className="hero-cell"><Link to={paths.hero(p.hero_id)} aria-label={name(p.hero_id)}><Portrait id={p.hero_id}/></Link>
              <div><strong>{p.account_id > 0 ? <Link to={paths.player(p.account_id)}>{p.personaname || `Игрок №${p.account_id}`}</Link> : p.personaname || 'Скрытый профиль'}</strong><small>{name(p.hero_id)}</small></div>
            </div></td>
            {columns.map(([label, get]) => <td key={label}>{get(p)}</td>)}<td><Inventory player={p} catalog={catalog}/></td>
          </tr>)}</tbody>
      </table></div>
    </Panel>)}</>;
}

function Advanced({ match, players, catalog }) {
  const { name } = useHeroes();
  const series = [[match.radiant_gold_adv, 'Золото', '#E6B765'], [match.radiant_xp_adv, 'Опыт', '#E36B4F']];
  const purchases = players.filter(p => p.purchase_log?.length);
  const wards = players.filter(p => [p.obs_placed, p.sen_placed, p.observer_kills, p.sentry_kills].some(Number.isFinite));
  return <>
    <div className="two-columns">{series.map(([values, label, color]) =>
      <Panel key={label} title={`Преимущество · ${label.toLowerCase()}`} subtitle="Выше нуля — Radiant, ниже — Dire">
        {values?.some(Number.isFinite) ? <Chart data={values.map((value, minute) => ({ label: `${minute} мин`, value }))}
          label={`Преимущество по показателю «${label}»`} zero series={[[ 'value', label, color ]]}/>
          : <State empty="Поминутные данные недоступны для этого матча."/>}
      </Panel>)}</div>
    <Panel title="Сравнение игроков" subtitle="Урон героям за матч">
      {players.some(p => Number.isFinite(p.hero_damage)) ? <Chart kind="bar" label="Урон игроков"
        data={players.map(p => ({ label: name(p.hero_id), radiant: p.player_slot < 128 ? p.hero_damage : null,
          dire: p.player_slot >= 128 ? p.hero_damage : null }))} series={[[ 'radiant', 'Radiant', '#48C78E' ], ['dire', 'Dire', '#E05252']]}/>
        : <State empty="Урон по игрокам недоступен."/>}
    </Panel>
    <Panel title="Покупки предметов">
      {purchases.length ? <div className="section-stack">{purchases.map(p => <details key={p.player_slot}>
        <summary>{name(p.hero_id)} · {p.purchase_log.length}</summary>
        <ul className="list">{p.purchase_log.map((entry, index) => <li key={index}>{time(entry.time)} · {catalog[entry.key]?.dname || entry.key || '—'}</li>)}</ul>
      </details>)}</div> : <State empty="Журнал покупок недоступен."/>}
    </Panel>
    <div className="two-columns">
      <Panel title="Командные сражения">
        {match.teamfights?.length ? <div className="table-scroll"><table>
          <thead><tr><th>Начало</th><th>Конец</th><th>Смерти Radiant</th><th>Смерти Dire</th></tr></thead>
          <tbody>{match.teamfights.map((fight, i) => {
            const deaths = fight.players?.map(p => p.deaths);
            const sum = values => values?.length && values.every(Number.isFinite) ? values.reduce((a,b) => a+b, 0) : null;
            return <tr key={i}><td>{time(fight.start)}</td><td>{time(fight.end)}</td>
              <td>{number(sum(deaths?.slice(0,5)))}</td><td>{number(sum(deaths?.slice(5,10)))}</td></tr>;
          })}</tbody></table></div> : <State empty="Разметка командных сражений недоступна."/>}
      </Panel>
      <Panel title="Варды и обзор">
        <WardPositions players={players}/>
        {wards.length ? <div className="table-scroll"><table>
          <thead><tr><th>Герой</th><th>Поставлено Observer / Sentry</th><th>Уничтожено Observer / Sentry</th></tr></thead>
          <tbody>{wards.map(p => <tr key={p.player_slot}><td>{name(p.hero_id)}</td>
            <td>{number(p.obs_placed)} / {number(p.sen_placed)}</td>
            <td>{number(p.observer_kills)} / {number(p.sentry_kills)}</td></tr>)}</tbody>
        </table></div> : <State empty="Журнал установки и уничтожения вардов недоступен."/>}
      </Panel>
    </div>
  </>;
}

export default function Match() {
  const { id } = useParams();
  const valid = /^\d{1,16}$/.test(id) && Number(id) > 0 && Number.isSafeInteger(Number(id));
  const resource = useResource(valid ? id : null, () => api(`/matches/${id}`, 900_000));
  const dictionary = useResource(resource.data?.players?.length ? 'items' : null, items);
  if (!valid) return <State error="Некорректный ID матча."/>;
  if (!resource.data) return <State {...resource}/>;
  const match = resource.data;
  const players = Array.isArray(match.players) ? match.players : [];
  const catalog = Object.fromEntries(Object.entries(dictionary.data || {}).flatMap(([key, item]) => [[key, item], [item.id, item]]));
  return <div className="section-stack">
    <Panel className="match-header">
      <div className="identity"><span className="mark"><Swords size={23}/></span><div>
        <p className="muted">Матч №{id}</p><h1>{typeof match.radiant_win === 'boolean' ? `Победа ${match.radiant_win ? 'Radiant' : 'Dire'}` : 'Результат недоступен'}</h1>
      </div><a className="button secondary" href={`https://www.opendota.com/matches/${id}`} target="_blank" rel="noreferrer">OpenDota <ArrowUpRight size={15}/></a></div>
      <Metrics values={[[ 'Radiant', number(match.radiant_score), 'Командный счёт', 'win' ], ['Dire', number(match.dire_score), 'Командный счёт', 'loss'],
        ['Длительность', duration(match.duration)], ['Режим', mode(match.game_mode)], ['Дата', date(match.start_time)]]}/>
    </Panel>
    {match.version == null && <State empty="OpenDota ещё не разобрал повтор. Базовые данные доступны, поминутные события могут отсутствовать."/>}
    {players.length ? <Teams players={players} match={match} catalog={catalog}/> : <State empty="Составы команд недоступны."/>}
    <Advanced match={match} players={players} catalog={catalog}/>
  </div>;
}
