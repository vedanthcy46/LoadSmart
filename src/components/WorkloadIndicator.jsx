export default function WorkloadIndicator({ workload, showLabel = true }) {
  const getWorkloadColor = (wl) => {
    if (wl < 40) return { bg: 'bg-emerald-500', text: 'text-emerald-600', label: 'Low' };
    if (wl <= 80) return { bg: 'bg-amber-500', text: 'text-amber-600', label: 'Balanced' };
    return { bg: 'bg-rose-500', text: 'text-rose-600', label: 'Overloaded' };
  };

  const { bg, text, label } = getWorkloadColor(workload);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${bg} transition-all duration-500`}
          style={{ width: `${Math.min(workload, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-sm font-medium ${text} min-w-[80px]`}>
          {workload}% - {label}
        </span>
      )}
    </div>
  );
}
