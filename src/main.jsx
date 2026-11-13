import React, { Suspense, lazy, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Activity, Menu, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { GameData } from './components/GameData';
import { PlayerSearch, State, paths } from './components/UI';
import { readSaved } from './lib';
import Home from './pages/Home';
import './style.css';

const Player = lazy(() => import('./pages/Player'));
const Match = lazy(() => import('./pages/Match'));
const Heroes = lazy(() => import('./pages/Heroes'));
const Compare = lazy(() => import('./pages/Compare'));
const Directory = lazy(() => import('./pages/Directory'));
const links = [['/', 'Главная'], ['/players', 'Игроки'], ['/heroes', 'Герои'],
  ['/matches', 'Матчи'], ['/compare', 'Аналитика'], ['/rankings', 'Рейтинги']];

function App() {
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  const findSaved = () => readSaved('dotamate.lastId', readSaved('dotamate.profile', null)?.id);
  const [saved, setSaved] = useState(findSaved);
  useEffect(() => {
    const update = () => setSaved(findSaved());
    window.addEventListener('dotamate:profile', update);
    return () => window.removeEventListener('dotamate:profile', update);
  }, []);
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [pathname]);
  return <>
    <a className="skip-link" href="#content" onClick={event => { event.preventDefault(); document.getElementById('content').focus(); }}>К содержимому</a>
    <header className="topbar">
      <div className="top-inner">
        <Link to="/" className="brand"><span className="mark"><Activity size={21}/></span>Dota<span>Mate</span></Link>
        <button className="button secondary nav-toggle" aria-label={menu ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={menu} aria-controls="top-navigation" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
        <nav id="top-navigation" className={`top-nav ${menu ? 'expanded' : ''}`} aria-label="Главное меню">
          {links.map(([to, label]) => <NavLink to={to} end={to === '/'} key={to}>{label}</NavLink>)}
        </nav>
        <div className="top-actions">
          <PlayerSearch compact />
          <select className="language" aria-label="Язык интерфейса" defaultValue="ru"><option value="ru">РУС</option></select>
          {saved && <Link className="button secondary icon-button" to={paths.player(saved)} aria-label="Открыть сохранённый профиль"><UserRound size={17}/></Link>}
        </div>
      </div>
    </header>
    <main id="content" tabIndex={-1} className="main">
      <Suspense fallback={<State />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<Directory type="players" />} />
          <Route path="/players/:id/:section?" element={<Player />} />
          <Route path="/heroes" element={<Heroes />} />
          <Route path="/heroes/:id" element={<Heroes />} />
          <Route path="/matches" element={<Directory type="matches" />} />
          <Route path="/matches/:id" element={<Match />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/rankings" element={<Directory type="rankings" />} />
          <Route path="*" element={<div className="state">Страница не найдена. <Link to="/">На главную</Link></div>} />
        </Routes>
      </Suspense>
    </main>
    <footer className="footer"><Link to="/" className="brand">Dota<span>Mate</span></Link><p>Игровые данные <a href="https://www.opendota.com/" target="_blank" rel="noreferrer">OpenDota</a> · Dota 2 принадлежит Valve</p></footer>
  </>;
}

createRoot(document.getElementById('root')).render(<HashRouter><GameData><App /></GameData></HashRouter>);
