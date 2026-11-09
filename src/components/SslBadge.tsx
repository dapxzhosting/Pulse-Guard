import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Shield } from 'lucide-react';
import { SslInfo } from '../types';

interface SslBadgeProps {
  sslInfo?: SslInfo;
  enabled: boolean;
  alertThreshold?: number;
}

export const SslBadge: React.FC<SslBadgeProps> = ({ sslInfo, enabled, alertThreshold = 30 }) => {
  if (!enabled) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400">
        <Shield className="w-3 h-3 text-slate-500" />
        SSL Disabled
      </span>
    );
  }

  if (!sslInfo) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/80 text-slate-400 animate-pulse">
        <Shield className="w-3 h-3 text-slate-500" />
        Checking SSL
      </span>
    );
  }

  const days = sslInfo.daysRemaining ?? 0;
  const isExpired = days <= 0;
  const isExpiringSoon = days <= alertThreshold;

  if (isExpired || !sslInfo.valid) {
    return (
      <span
        title={sslInfo.error || 'SSL Certificate is expired or invalid'}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30"
      >
        <ShieldX className="w-3.5 h-3.5 text-rose-400" />
        {isExpired ? 'SSL Expired' : 'SSL Invalid'}
      </span>
    );
  }

  if (isExpiringSoon) {
    return (
      <span
        title={`Certificate expires in ${days} days (${sslInfo.validTo ? new Date(sslInfo.validTo).toLocaleDateString() : ''})`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30"
      >
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
        SSL {days}d left
      </span>
    );
  }

  return (
    <span
      title={`Issuer: ${sslInfo.issuer || 'Trusted CA'}\nExpires: ${sslInfo.validTo ? new Date(sslInfo.validTo).toLocaleDateString() : ''}`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
    >
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      SSL {days}d
    </span>
  );
};
