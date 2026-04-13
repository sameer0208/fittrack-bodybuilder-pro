import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine
} from 'recharts';
import dayjs from 'dayjs';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-2xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-white font-bold text-sm">
          {p.name}: <span style={{ color: p.color }}>{p.value} {p.unit || ''}</span>
        </p>
      ))}
    </div>
  );
};

export function WeightChart({ weightHistory, targetWeight }) {
  if (!weightHistory?.length) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
        No weight data yet. Log your weight to see progress!
      </div>
    );
  }

  const data = weightHistory.map((w) => ({
    date: dayjs(w.date).format('MMM D'),
    weight: w.weight,
  }));

  const minWeight = Math.min(...data.map((d) => d.weight)) - 2;
  const maxWeight = Math.max(...data.map((d) => d.weight), targetWeight || 0) + 2;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[minWeight, maxWeight]}
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        {targetWeight && (
          <ReferenceLine
            y={targetWeight}
            stroke="#10b981"
            strokeDasharray="4 4"
            label={{ value: `Target: ${targetWeight}kg`, fill: '#10b981', fontSize: 11, position: 'insideTopRight' }}
          />
        )}
        <Area
          type="monotone"
          dataKey="weight"
          stroke="#6366f1"
          strokeWidth={2.5}
          fill="url(#weightGrad)"
          dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#818cf8' }}
          name="Weight"
          unit="kg"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function VolumeChart({ weeklyData }) {
  if (!weeklyData?.length) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
        Complete workouts to see volume data!
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
        <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="volume"
          stroke="#10b981"
          strokeWidth={2.5}
          fill="url(#volGrad)"
          dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }}
          name="Volume"
          unit="kg"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
