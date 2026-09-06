import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ShieldAlert, 
  Cpu, 
  Sliders, 
  Bell, 
  Check, 
  RefreshCw,
  Zap
} from 'lucide-react';
import { DiagnosticAlert, AlertSeverity } from '../types';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: DiagnosticAlert[];
  onAcknowledgeAlert: (id: string) => void;
  onClearAllAlerts: () => void;
  onInjectTestAlert: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onAcknowledgeAlert,
  onClearAllAlerts,
  onInjectTestAlert
}) => {
  const [filter, setFilter] = useState<'ALL' | AlertSeverity>('ALL');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter(a => filter === 'ALL' || a.severity === filter);

  const subsystemsHealth = [
    { name: 'Dual IMU Array', status: 'NOMINAL', metric: '0.01° divergence' },
    { name: 'Quadrapuller 4-ESC', status: 'NOMINAL', metric: '38.5°C • 6,200 RPM' },
    { name: 'RTK Carrier GNSS', status: 'NOMINAL', metric: '27 Sats • 0.58 HDOP' },
    { name: 'LiDAR SLAM Mapper', status: 'NOMINAL', metric: '1.28M pts/s' },
    { name: '77GHz Radar Array', status: 'NOMINAL', metric: '4 Targets tracking' },
    { name: 'ChaCha20 Uplink', status: 'NOMINAL', metric: '14.2ms • 0.02% loss' },
    { name: '12S Solid-State BMS', status: 'NOMINAL', metric: '49.8V • 20mV delta' },
    { name: 'NVMe Flight Recorder', status: 'NOMINAL', metric: '48.2 MB/s write' }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#151518] border border-white/10 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl flex flex-col max-h-[90vh] text-[#e2e2e2]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Real-Time Diagnostics & Health Matrix
              </h2>
              <p className="text-xs text-white/40 font-mono">
                Continuous UAV Subsystem Self-Test & Automated Failsafe Triggers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white font-mono text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Subsystems Health Matrix Banner */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-white/40 uppercase tracking-widest block">
            Subsystem Health Status (8/8 Optimal)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            {subsystemsHealth.map((sub, idx) => (
              <div 
                key={idx}
                className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5 space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white/70 font-medium truncate text-[10px]">{sub.name}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                </div>
                <div className="text-emerald-400 font-bold text-[10px]">{sub.status}</div>
                <div className="text-white/30 text-[9px] truncate">{sub.metric}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time Alerts Header & Actions */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          {/* Filters */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className={`px-2.5 py-1 rounded-lg transition uppercase text-[11px] font-semibold tracking-wider cursor-pointer ${
                  filter === sev 
                    ? 'bg-sky-500 text-black font-bold shadow-[0_0_10px_rgba(14,165,233,0.3)]' 
                    : 'bg-white/5 text-white/40 border border-white/5 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={onInjectTestAlert}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition cursor-pointer"
            >
              Simulate Event
            </button>
            <button
              onClick={onClearAllAlerts}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-2 overflow-y-auto flex-1 pr-1 font-mono text-xs">
          {filteredAlerts.length === 0 ? (
            <div className="p-6 text-center text-white/30 border border-white/5 rounded-xl bg-[#0d0d0f]">
              No active diagnostics alerts in this category
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const borderCol = alert.severity === 'CRITICAL' 
                ? 'border-rose-500/30 bg-rose-500/5 text-rose-200' 
                : alert.severity === 'WARNING'
                ? 'border-amber-500/30 bg-amber-500/5 text-amber-200'
                : 'border-white/5 bg-[#0d0d0f] text-white/70';

              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${borderCol}`}
                >
                  <div className="flex items-start gap-2.5">
                    {alert.severity === 'CRITICAL' ? (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : alert.severity === 'WARNING' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <strong className="text-[#e2e2e2] text-xs font-semibold">{alert.subsystem}</strong>
                        <span className="text-[10px] text-white/40">[{alert.timestamp}]</span>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onAcknowledgeAlert(alert.id)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-[10px] shrink-0 border border-white/10 cursor-pointer"
                  >
                    Acknowledge
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Failsafe Policies Footer */}
        <div className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5 text-[11px] font-mono text-white/40 flex flex-wrap items-center justify-between gap-2">
          <span>Active Failsafe: <strong className="text-[#e2e2e2]">AUTO-RTL ON CRITICAL (&lt;15% BATTERY OR LINK LOSS &gt;3.0s)</strong></span>
          <span className="text-emerald-400 font-semibold uppercase tracking-widest">ARMED & PROTECTED</span>
        </div>
      </div>
    </div>
  );
};
