export default function DriverSelect({ drivers, value, onChange, excludeIds = [], label, disabled }) {
  const selectedDriver = drivers.find((d) => d.id === value)
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>}
      <div className="relative">
        <select
          value={value || ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full appearance-none rounded-lg border border-track-600 bg-track-800 py-2.5 pl-3 pr-8 text-sm font-medium text-slate-100 outline-none transition focus:border-race-red disabled:cursor-not-allowed disabled:opacity-50"
          style={selectedDriver ? { borderColor: `${selectedDriver.teamColor}88` } : undefined}
        >
          <option value="">Select driver…</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id} disabled={excludeIds.includes(d.id)}>
              {d.name} — {d.team}
            </option>
          ))}
        </select>
        {selectedDriver && (
          <span
            className="pointer-events-none absolute left-0 top-0 h-full w-1 rounded-l-lg"
            style={{ backgroundColor: selectedDriver.teamColor }}
          />
        )}
      </div>
    </label>
  )
}
