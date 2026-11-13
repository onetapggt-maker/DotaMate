import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowRight, CircleAlert, Search } from 'lucide-react';
import { m, LazyMotion, domAnimation, useReducedMotion } from 'framer-motion';
import { parseAccountId } from '../lib';

export const paths = {
  player: id => `/players/${id}`,
  hero: id => `/heroes/${id}`,
  match: id => `/matches/${id}`,
};

export function Panel({ title, subtitle, action, children, className = '' }) {
  return <section className={`panel ${className}`}>
    {title && <div className="panel-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>}
    {children}
  </section>;
}

export function State({ error, retry, empty, label = 'Загрузка данных' }) {
  if (error) return <div className="state error" role="alert">
    <CircleAlert size={19} /><span>{error}</span>
    {retry && <button className="button secondary" onClick={retry}>Повторить</button>}
  </div>;
  if (empty) return <p className="state">{empty}</p>;
  return <div className="skeleton-grid" role="status" aria-label={label}>
    {[1, 2, 3].map(n => <div key={n} className="skeleton" />)}
  </div>;
}

export function Metrics({ values }) {
  const reduce = useReducedMotion();
  return <LazyMotion features={domAnimation}><div className="metric-grid">
    {values.map(([label, value, hint, tone], index) =>
      <m.div className="metric" key={label}
        initial={reduce ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .18, delay: Math.min(index, 5) * .025 }}>
        <span title={hint}>{label}</span><strong className={tone}>{value ?? '—'}</strong>
      </m.div>
    )}
  </div></LazyMotion>;
}

export function PlayerSearch({ compact = false, initial = '' }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState('');
  function submit(event) {
    event.preventDefault();
    try {
      const id = parseAccountId(value);
      setError('');
      navigate(paths.player(id));
    } catch (error) {
      setError(error.message);
    }
  }
  return <form className={compact ? 'search-form compact' : 'search-form'} onSubmit={submit} role="search">
    <div className="search-box">
      <Search size={19} aria-hidden="true" />
      <input aria-label="Steam ID или ссылка на профиль Steam" placeholder={compact ? 'Steam ID' : 'Введи Steam ID или ссылку на профиль Steam'}
        value={value} onChange={event => { setValue(event.target.value); setError(''); }} required />
      <button className="button primary" aria-label="Найти игрока">{compact ? <ArrowRight size={17} /> : 'Найти игрока'}</button>
    </div>
    {error && <p className="search-error" role="alert">{error}</p>}
  </form>;
}

export function LinkButton({ to, children }) {
  return <Link className="button secondary" to={to}>{children}<ArrowRight size={15}/></Link>;
}
