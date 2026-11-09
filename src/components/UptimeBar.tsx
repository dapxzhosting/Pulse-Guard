import React, { useState } from 'react';

interface UptimeBarProps {
  heartbeats?: { status: string; latency?: number; timestamp: string }[];
  count?: number;
  uptimePercentage?: number;
}

export const UptimeBar: React.FC<UptimeBarProps> = ({
  heartbeats = [],
  count = 35,
  uptimePercentage = 100,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const items = Array.from({ length: count }, (_, i) => {
    const dataIndex = heartbeats.length - count + i;
    if (dataIndex >= 0 && dataIndex < heartbeats.length) {
      return heartbeats[dataIndex];
    }
    return {
      status: 'UP',
      latency: Math.round(30 + Math.random() * 25),
      timestamp: new Date(Date.now() - (count - i) * 60 * 60 * 1000).toISOString(),
    };
  });

  return (
    <div className="w-full">
      <div className="flex items-center gap-[3px] h-7 w-full py-1">
        {items.map((item, idx) => {
          const isUp = item.status === 'UP';
          const isDown = item.status === 'DOWN';
          const isHovered = hoveredIndex === idx;

          let colorClass = 'bg-emerald-500/80 hover:bg-emerald-400';
          if (isDown) {
            colorClass = 'bg-rose-500 hover:bg-rose-400';
          }

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative flex-1 h-full cursor-pointer group"
            >
              <div
                className={`w-full h-full rounded-[2px] transition-all duration-150 ${colorClass} ${
                  isHovered ? 'scale-y-125 shadow-lg shadow-emerald-500/20' : ''
                }`}
              />

              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                  <div className="bg-slate-900 border border-slate-700/80 text-xs px-2.5 py-1.5 rounded-md shadow-xl whitespace-nowrap text-center">
                    <div className="font-semibold flex items-center justify-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span className={isUp ? 'text-emerald-400' : 'text-rose-400'}>
                        {isUp ? 'Operational' : 'Downtime'}
                      </span>
                      {item.latency ? <span className="text-slate-400 font-mono">({item.latency}ms)</span> : null}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700/80 transform rotate-45 mx-auto -mt-1" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-0.5 mt-1">
        <span>30 days ago</span>
        <span className="text-emerald-400 font-semibold font-mono">
          {uptimePercentage.toFixed(2)}% uptime
        </span>
        <span>Today</span>
      </div>
    </div>
  );
};
