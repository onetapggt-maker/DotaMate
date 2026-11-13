import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { duration } from '../analytics';
import { useHeroes } from './GameData';

export default function WardPositions({ players }) {
  const { name } = useHeroes();
  const wards = players.flatMap(player =>
    [['obs_log', 'Observer'], ['sen_log', 'Sentry']].flatMap(([key, kind]) =>
      (player[key] || []).filter(ward => Number.isFinite(ward.x) && Number.isFinite(ward.y)).map(ward => ({
        x: ward.x, y: ward.y, time: ward.time, kind, hero: name(player.hero_id),
      }))
    )
  );
  if (!wards.length) return null;
  return <div className="ward-positions">
    <h3>Места установки вардов</h3>
    <p className="muted">Координаты из журнала матча · золотой Observer, красный Sentry</p>
    <div role="img" aria-label="Координаты установленных вардов">
      <ResponsiveContainer width="100%" height={290} minWidth={0}>
        <ScatterChart margin={{ top: 12, right: 12, bottom: 5, left: 0 }}>
          <CartesianGrid stroke="#28313E" strokeDasharray="3 4"/>
          <XAxis dataKey="x" type="number" domain={[0, 256]} tick={{ fill: '#929EAD', fontSize: 11 }}/>
          <YAxis dataKey="y" type="number" domain={[0, 256]} tick={{ fill: '#929EAD', fontSize: 11 }}/>
          <Tooltip content={({ payload }) => {
            const ward = payload?.[0]?.payload;
            return ward && <div className="state">{ward.kind} · {ward.hero} · {ward.time < 0 ? '−' : ''}{duration(Math.abs(ward.time))}</div>;
          }}/>
          <Scatter data={wards.filter(ward => ward.kind === 'Observer')} fill="#E6B765" isAnimationActive={false}/>
          <Scatter data={wards.filter(ward => ward.kind === 'Sentry')} fill="#E36B4F" isAnimationActive={false}/>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  </div>;
}
