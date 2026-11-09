import React, { useState } from 'react';
import { Heartbeat } from '../types';

interface LatencyChartProps {
  heartbeats: Heartbeat[];
  height?: number;
}

export const LatencyChart: React.FC<LatencyChartProps> = ({ heartbeats, height = 180 }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; hb: Heartbeat } | null>(null);

  if (!heartbeats || heartbeats.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-slate-500 bg-slate-900/40 rounded-lg border border-slate-800"
      >
        No heartbeat latency data recorded yet
      </div>
    );
  }

  const points = heartbeats.filter(h => typeof h.latency === 'number' && h.latency >= 0);
  if (points.length < 2) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-slate-500 bg-slate-900/40 rounded-lg border border-slate-800"
      >
        Collecting more data points for latency chart
      </div>
    );
  }

  const latencies = points.map(p => p.latency);
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies, 20);
  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);

  const padding = { top: 20, right: 16, bottom: 25, left: 45 };
  const chartWidth = 700;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const yRange = maxLatency - minLatency || 10;
  const getY = (val: number) => {
    const normalized = (val - minLatency) / (yRange * 1.15 || 1);
    return padding.top + innerHeight - normalized * innerHeight;
  };

  const getX = (idx: number) => {
    return padding.left + (idx / (points.length - 1)) * innerWidth;
  };

  const pathD = points.reduce((acc, p, idx) => {
    const x = getX(idx);
    const y = getY(p.latency);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaD = `${pathD} L ${getX(points.length - 1)} ${padding.top + innerHeight} L ${getX(0)} ${
    padding.top + innerHeight
  } Z`;

  return (
    <div className="w-full bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Response Time Trend (ms)
          </h4>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-slate-400">
            Min: <strong className="text-emerald-400 font-semibold">{minLatency}ms</strong>
          </span>
          <span className="text-slate-400">
            Avg: <strong className="text-sky-400 font-semibold">{avgLatency}ms</strong>
          </span>
          <span className="text-slate-400">
            Max: <strong className="text-amber-400 font-semibold">{maxLatency}ms</strong>
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-auto overflow-visible"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="90%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          <line
            x1={padding.left}
            y1={padding.top}
            x2={chartWidth - padding.right}
            y2={padding.top}
            stroke="#1e293b"
            strokeDasharray="3 3"
          />
          <line
            x1={padding.left}
            y1={padding.top + innerHeight / 2}
            x2={chartWidth - padding.right}
            y2={padding.top + innerHeight / 2}
            stroke="#1e293b"
            strokeDasharray="3 3"
          />
          <line
            x1={padding.left}
            y1={padding.top + innerHeight}
            x2={chartWidth - padding.right}
            y2={padding.top + innerHeight}
            stroke="#334155"
          />

          <text
            x={padding.left - 8}
            y={padding.top + 4}
            textAnchor="end"
            className="fill-slate-500 text-[10px] font-mono"
          >
            {Math.round(minLatency + yRange * 1.15)}ms
          </text>
          <text
            x={padding.left - 8}
            y={padding.top + innerHeight / 2 + 3}
            textAnchor="end"
            className="fill-slate-500 text-[10px] font-mono"
          >
            {Math.round(minLatency + yRange * 0.55)}ms
          </text>
          <text
            x={padding.left - 8}
            y={padding.top + innerHeight}
            textAnchor="end"
            className="fill-slate-500 text-[10px] font-mono"
          >
            {minLatency}ms
          </text>

          <path d={areaD} fill="url(#latencyGradient)" />

          <path
            d={pathD}
            fill="none"
            stroke="url(#lineStroke)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p, idx) => {
            const cx = getX(idx);
            const cy = getY(p.latency);
            const isHovered = hoveredPoint?.hb.id === p.id;
            return (
              <g key={p.id || idx}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5 : 2.5}
                  className={`${
                    p.status === 'UP' ? 'fill-emerald-400' : 'fill-rose-500'
                  } transition-all duration-100`}
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                <rect
                  x={cx - innerWidth / (points.length * 2)}
                  y={padding.top}
                  width={innerWidth / points.length}
                  height={innerHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint({ x: cx, y: cy, hb: p })}
                />
              </g>
            );
          })}

          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1={padding.top}
              x2={hoveredPoint.x}
              y2={padding.top + innerHeight}
              stroke="#94a3b8"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          )}
        </svg>

        {hoveredPoint && (
          <div
            className="absolute pointer-events-none z-30 transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${(hoveredPoint.x / chartWidth) * 100}%`,
              top: `${hoveredPoint.y}px`,
            }}
          >
            <div className="bg-slate-900/95 border border-slate-700 backdrop-blur-md rounded-lg p-2.5 shadow-xl text-center min-w-[130px]">
              <div className="text-emerald-400 font-bold text-sm font-mono flex items-center justify-center gap-1">
                <span>{hoveredPoint.hb.latency} ms</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({hoveredPoint.hb.statusCode || '200'})
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {new Date(hoveredPoint.hb.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
              {hoveredPoint.hb.latencyBreakdown && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-800 grid grid-cols-2 gap-x-2 text-[9px] text-slate-400 text-left font-mono">
                  <span>DNS: {hoveredPoint.hb.latencyBreakdown.dns}ms</span>
                  <span>TCP: {hoveredPoint.hb.latencyBreakdown.tcp}ms</span>
                  <span>TLS: {hoveredPoint.hb.latencyBreakdown.tls}ms</span>
                  <span>TTFB: {hoveredPoint.hb.latencyBreakdown.ttfb}ms</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
