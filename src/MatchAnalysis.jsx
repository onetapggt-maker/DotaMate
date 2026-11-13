import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getOpenDota } from './opendota';
import { isWin } from './lib';

const format = value => value == null ? '—' : Number(value).toLocaleString('ru-RU');

export default function MatchAnalysis({ summary, hero, image }) {
  const [details, setDetails] = useState(null);
  const [itemNames, setItemNames] = useState({});
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getOpenDota(`/matches/${summary.match_id}`).then(match => {
      if (!Array.isArray(match.players)) throw new Error('OpenDota пока не отдал составы этого матча.');
      if (active) setDetails(match);
    }).catch(error => {
      if (active) setError(error.message);
    });
    return () => { active = false; };
  }, [summary.match_id, attempt]);

  useEffect(() => {
    let active = true;
    getOpenDota('/constants/items').then(items => {
      if (active) setItemNames(Object.fromEntries(
        Object.values(items).filter(item => item?.id).map(item => [item.id, item.dname || item.name])
      ));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const player = details?.players.find(player => player.player_slot === summary.player_slot);
  const stats = { ...summary, ...player };
  const inventory = player
    ? [player.item_0, player.item_1, player.item_2, player.item_3, player.item_4, player.item_5, player.item_neutral].filter(id => id > 0)
    : [];
  const metrics = [
    ['Убийства', stats.kills], ['Смерти', stats.deaths], ['Помощь', stats.assists],
    ['Золото / мин', stats.gold_per_min], ['Опыт / мин', stats.xp_per_min], ['Добивания', stats.last_hits],
    ['Денаи', stats.denies], ['Урон героям', stats.hero_damage], ['Урон строениям', stats.tower_damage],
    ['Лечение', stats.hero_healing], ['Ценность', stats.net_worth], ['Уровень', stats.level],
  ];
  const result = isWin(summary);

  return <>
    <img className="detail-image" src={image(summary.hero_id)} alt="" />
    <p><strong className={result ? 'green' : 'red'}>{result ? 'Победа' : 'Поражение'}</strong>
      {' · '}{summary.player_slot < 128 ? 'Radiant' : 'Dire'}
      {' · '}{new Date(summary.start_time * 1000).toLocaleDateString('ru-RU')}
      {' · '}{Math.floor(summary.duration / 60)}:{String(summary.duration % 60).padStart(2, '0')}
    </p>
    <div className="detail-grid">
      {metrics.filter(([, value]) => value != null).map(([label, value]) =>
        <div key={label}><span>{label}</span><strong>{format(value)}</strong></div>
      )}
    </div>
    {!details && !error && <p className="muted" role="status">Загружаю подробности матча…</p>}
    {error && <div className="error" role="alert">
      {error} <button className="outline small" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Повторить</button>
    </div>}
    {details && <>
      {!player && <p className="muted">OpenDota не вернул подробную статистику игрока в этом матче.</p>}
      {inventory.length > 0 && <section className="analysis-section">
        <h3>Предметы к концу матча</h3>
        <ul className="item-list">{inventory.map((id, slot) =>
          <li key={slot}>{itemNames[id] || `Предмет #${id}`}</li>
        )}</ul>
      </section>}
      <section className="analysis-section">
        <h3>Команды и итоговый счёт</h3>
        {[['Radiant', details.radiant_score, true], ['Dire', details.dire_score, false]].map(([team, score, radiant]) =>
          <div key={team} className="team-analysis">
            <h4>{team} · {format(score)}</h4>
            <div className="table-scroll"><table>
              <thead><tr><th>Герой</th><th>K / D / A</th><th>GPM</th><th>Урон героям</th></tr></thead>
              <tbody>{details.players.filter(p => (p.player_slot < 128) === radiant).map(p =>
                <tr key={p.player_slot} className={p.player_slot === summary.player_slot ? 'selected-player' : ''}>
                  <td>{hero(p.hero_id).localized_name}</td>
                  <td>{format(p.kills)} / {format(p.deaths)} / {format(p.assists)}</td>
                  <td>{format(p.gold_per_min)}</td><td>{format(p.hero_damage)}</td>
                </tr>
              )}</tbody>
            </table></div>
          </div>
        )}
      </section>
    </>}
    <a className="lime full" href={`https://www.opendota.com/matches/${summary.match_id}`} target="_blank" rel="noreferrer">
      Открыть матч в OpenDota <ExternalLink size={16} />
    </a>
  </>;
}
