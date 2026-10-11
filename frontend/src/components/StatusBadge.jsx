import React from 'react';

export default function StatusBadge({ status, label, size = 'sm' }) {
  const isSuccess = status === 'ok' || status === 'connected' || status === 'ready';
  const isWarning = status === 'unconfigured' || status === 'pending';
  const isError = status === 'offline' || status === 'disconnected' || status === 'error';

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';

  if (isSuccess) {
    colorClasses = 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30';
    dotColor = 'bg-emerald-400';
  } else if (isWarning) {
    colorClasses = 'bg-amber-950/50 text-amber-300 border-amber-500/30';
    dotColor = 'bg-amber-400';
  } else if (isError) {
    colorClasses = 'bg-rose-950/50 text-rose-300 border-rose-500/30';
    dotColor = 'bg-rose-400';
  }

  const sizeClasses = size === 'xs' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${colorClasses} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isSuccess ? 'animate-pulse-subtle' : ''}`} />
      <span>{label || status}</span>
    </span>
  );
}
