import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/opendota';

const Context = createContext({});
const cdn = 'https://cdn.cloudflare.steamstatic.com';
const base = import.meta.env.BASE_URL;
const localHeroes = { 1: 'antimage', 6: 'drow_ranger', 11: 'nevermore', 14: 'pudge', 44: 'phantom_assassin' };
const names = {
  1: 'Все герои', 2: 'Режим капитанов', 3: 'Случайный выбор', 4: 'Одиночный выбор',
  5: 'Случайные герои', 12: 'Режим наименее сыгранных героев', 16: 'Драфт капитанов',
  18: 'Драфт способностей', 20: 'Бой до смерти', 21: 'Один на один', 22: 'Общий драфт', 23: 'Турбо',
};
export const mode = id => names[id] ?? (id == null ? '—' : `Режим ${id}`);
export const attributes = { str: 'Сила', agi: 'Ловкость', int: 'Интеллект', all: 'Универсал' };
export const roles = { Carry: 'Керри', Support: 'Поддержка', Nuker: 'Быстрый урон', Disabler: 'Контроль',
  Jungler: 'Лесник', Durable: 'Выживаемость', Escape: 'Отступление', Pusher: 'Снос строений', Initiator: 'Инициация' };

export function GameData({ children }) {
  const [heroes, setHeroes] = useState({});
  useEffect(() => {
    fetch(`${base}heroes.json`).then(r => {
      if (!r.ok) throw new Error();
      return r.json();
    }).then(setHeroes).catch(() => {
      api('/constants/heroes', 3_600_000).then(setHeroes).catch(() => {});
    });
  }, []);
  return <Context.Provider value={heroes}>{children}</Context.Provider>;
}

export function useHeroes() {
  const heroes = useContext(Context);
  return {
    heroes,
    name: id => heroes[id]?.localized_name || (id ? `Герой №${id}` : '—'),
    image: id => localHeroes[id]
      ? `${base}heroes/${localHeroes[id]}.png`
      : heroes[id]?.img ? cdn + heroes[id].img : undefined,
  };
}

export function Portrait({ id, className = '' }) {
  const { image } = useHeroes();
  return <span className={`portrait ${className}`}>
    {image(id) && <img src={image(id)} alt="" loading="lazy" decoding="async" />}
  </span>;
}
