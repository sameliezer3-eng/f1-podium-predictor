import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function TrendChart({ data, players }) {
  if (data.length === 0) return null

  return (
    <div className="rounded-2xl border border-track-700 bg-track-900 p-4">
      <h3 className="mb-3 px-1 font-display text-base font-bold text-slate-100">Season momentum</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2b2b3a" />
            <XAxis dataKey="label" stroke="#6b7280" fontSize={12} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#16161f', border: '1px solid #2e303a', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {players.map((p) => (
              <Line
                key={p.id}
                type="monotone"
                dataKey={p.id}
                name={p.name}
                stroke={p.color}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
