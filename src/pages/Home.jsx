import { Activity, ChartNoAxesCombined, Swords, Users, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PlayerSearch, LinkButton, paths } from '../components/UI';
import { readSaved } from '../lib';

const features = [
  [Activity, 'Профиль и прогресс', 'Винрейт по сторонам, динамика результатов и личный дневник MMR.', '/players'],
  [Swords, 'Разбор матча', 'Составы, предметы, урон и графики преимущества, когда OpenDota разобрал матч.', '/matches'],
  [ChartNoAxesCombined, 'Статистика героев', 'Выбирай героев по атрибуту, винрейту и частоте пика.', '/heroes'],
  [Users, 'Сравнение игроков', 'Сравнивай винрейт, KDA и фарм двух игроков за одинаковый период.', '/compare'],
];

export default function Home() {
  const saved = readSaved('dotamate.lastId', readSaved('dotamate.profile', null)?.id);
  return <>
    <section className="home-hero">
      <img className="hero-background" src={`${import.meta.env.BASE_URL}heroes/nevermore.png`} alt="" fetchPriority="high"/>
      <div className="hero-content">
        <h1>DotaMate —<br/>твоя игра в цифрах.</h1>
        <p>Анализируй матчи, отслеживай прогресс и находи слабые стороны своей игры.</p>
        <PlayerSearch initial={saved || ''} />
        {saved && <LinkButton to={paths.player(saved)}>Открыть последний профиль</LinkButton>}
      </div>
    </section>
    <div className="feature-grid">
      {features.map(([Icon, title, copy, to]) => <Link to={to} className="panel feature" key={to}>
        <Icon size={21}/><h2>{title}</h2><p>{copy}</p>
      </Link>)}
    </div>
    <div className="home-info">
      <section className="panel feature">
        <h2>Как открыть историю матчей</h2>
        <ol><li>В Dota 2 открой настройки и перейди к параметрам игры.</li>
          <li>Включи «Общедоступную историю матчей».</li>
          <li>Введи SteamID64, ID друга из Dota 2 или ссылку Steam с числовым ID.</li></ol>
        <p>История появляется в OpenDota после обновления данных.</p>
      </section>
      <section className="panel feature"><Database size={20}/><h2>Источники статистики</h2>
        <p>Профили, матчи и справочники загружаются из <a href="https://www.opendota.com/" target="_blank" rel="noreferrer">OpenDota</a>.</p>
        <p>Показатели зависят от доступности публичной истории. Подключение STRATZ запланировано после получения официального доступа и настройки серверного API.</p>
      </section>
    </div>
  </>;
}
