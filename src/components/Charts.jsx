import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, AreaChart, Area, ReferenceLine, Legend } from 'recharts';
import { useReducedMotion } from 'framer-motion';

export function Chart({ data, series, kind = 'area', horizontal = false, zero = false, label }) {
  const reduce = useReducedMotion();
  const Root = kind === 'bar' ? BarChart : AreaChart;
  const Series = kind === 'bar' ? Bar : Area;
  return <div className="chart" role="img" aria-label={label}>
    <ResponsiveContainer width="100%" height={240} minWidth={0}>
      <Root data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 12, left: 0, bottom: 8, right: 16 }}>
        <CartesianGrid stroke="#28313E" strokeDasharray="3 4" />
        {horizontal ? <>
          <XAxis type="number" tick={{ fill: '#929EAD', fontSize: 11 }} />
          <YAxis type="category" dataKey="label" width={64} tick={{ fill: '#929EAD', fontSize: 11 }} />
        </> : <>
          <XAxis dataKey="label" minTickGap={18} tick={{ fill: '#929EAD', fontSize: 11 }} />
          <YAxis width={48} tick={{ fill: '#929EAD', fontSize: 11 }} />
        </>}
        {zero && <ReferenceLine y={0} stroke="#929EAD" />}
        <Tooltip contentStyle={{ background: '#171D27', border: '1px solid #28313E', borderRadius: 10 }}
          labelStyle={{ color: '#F0F2F5' }} />
        {series.length > 1 && <Legend />}
        {series.map(([key, name, color]) => <Series key={key} dataKey={key} name={name} stroke={color} fill={color}
          fillOpacity={kind === 'area' ? .17 : .85} isAnimationActive={!reduce} animationDuration={240}
          {...(kind === 'area' ? { strokeWidth: 2, type: 'monotone' } : { radius: 4 })} />)}
      </Root>
    </ResponsiveContainer>
  </div>;
}
