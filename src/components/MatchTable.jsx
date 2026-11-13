import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Portrait, useHeroes, mode } from './GameData';
import { date, duration, number, result } from '../analytics';
import { paths } from './UI';

export function MatchTable({ matches }) {
  const { name } = useHeroes();
  return <div className="table-scroll" tabIndex={0} aria-label="Таблица матчей">
    <table><thead><tr>
      {['Герой', 'Результат', 'Режим', 'Дата', 'Время', 'У / С / П', 'GPM', 'XPM', 'Урон', 'Добивания', 'Денаи', 'Матч'].map(label => <th key={label}>{label}</th>)}
    </tr></thead><tbody>
      {matches.map(match => {
        const won = result(match);
        return <tr key={match.match_id}>
          <td><Link className="hero-cell" to={paths.match(match.match_id)}><Portrait id={match.hero_id}/>{name(match.hero_id)}</Link></td>
          <td><span className={`result ${won === null ? '' : won ? 'win' : 'loss'}`}>{won === null ? '—' : won ? 'Победа' : 'Поражение'}</span></td>
          <td>{mode(match.game_mode)}</td><td>{date(match.start_time)}</td><td>{duration(match.duration)}</td>
          <td>{[match.kills, match.deaths, match.assists].map(x => number(x)).join(' / ')}</td>
          {[match.gold_per_min, match.xp_per_min, match.hero_damage, match.last_hits, match.denies].map((x, i) => <td key={i}>{number(x)}</td>)}
          <td><Link className="table-link" to={paths.match(match.match_id)} aria-label={`Разобрать матч ${match.match_id}`}><ChevronRight size={17}/></Link></td>
        </tr>;
      })}
    </tbody></table>
  </div>;
}
