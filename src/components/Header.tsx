import React from 'react';
import { 
  Radio, 
  ShieldCheck, 
  BatteryMedium, 
  BatteryWarning, 
  Compass, 
  AlertTriangle, 
  Power, 
  Play, 
  Square, 
  RotateCcw, 
  Layers, 
  Sliders, 
  Cpu, 
  Terminal, 
  History, 
  Key, 
  MapPin, 
  Bell,
  Gauge,
  Code2
} from 'lucide-react';
import { FlightState, FlightMode } from '../types';

interface HeaderProps {
  flightState: FlightState;
  activeTab: 'cockpit' | 'map' | 'stability' | 'plugins' | 'battery' | 'crypto' | 'logs' | 'api' | 'firmware';
  setActiveTab: (tab: 'cockpit' | 'map' | 'stability' | 'plugins' | 'battery' | 'crypto' | 'logs' | 'api' | 'firmware') => void;
  onArmToggle: () => void;
  onEmergencyHover: () => void;
  onReturnToLaunch: () => void;
  onOpenDiagnostics: () => void;
  unacknowledgedAlertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  flightState,
  activeTab,
  setActiveTab,
  onArmToggle,
  onEmergencyHover,
  onReturnToLaunch,
  onOpenDiagnostics,
  unacknowledgedAlertsCount
}) => {
  const { armed, flightMode, battery, encryption, telemetry } = flightState;

  const modeBadgeColor: Record<FlightMode, string> = {
    AUTO_SURVEY: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    POS_HOLD: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    ALT_HOLD: 'bg-sky-600/20 text-sky-300 border-sky-600/30',
    MISSION: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    RTL: 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse',
    MANUAL: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    EMERGENCY_HOVER: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
  };

  return (
    <header className="border-b border-white/5 bg-[#151518] sticky top-0 z-40 text-[#e2e2e2]">
      {/* Top Banner: Drone OS identity & Critical Quick Controls */}
      <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-white/5">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sky-400 font-tech font-bold text-base shadow-[0_0_10px_rgba(14,165,233,0.15)]">
              QP
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-[#888] font-bold">
                System Status
              </span>
              <span className="text-sm font-semibold flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${armed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-500'}`} />
                QUAD-OPS v4.8 // {armed ? 'ARMED' : 'STANDBY'}
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-8 w-[1px] bg-white/10" />

          {/* Mode & Transmission */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-[#888] font-bold">
                Flight Mode
              </span>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border mt-0.5 ${modeBadgeColor[flightMode]}`}>
                {flightMode.replace('_', ' ')}
              </span>
            </div>

            <div className="hidden md:flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-[#888] font-bold">
                Transmission
              </span>
              <span className="text-sm font-mono text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                CHACHA20 // SECURE
              </span>
            </div>
          </div>
        </div>

        {/* Global Quick Telemetry Stats */}
        <div className="hidden lg:flex items-center gap-6 text-xs font-mono">
          {/* Predictive Battery */}
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-widest text-[#888] font-bold block">
              Predictive Battery
            </span>
            <div className="flex items-center gap-2 justify-end">
              <span className={`text-xl font-bold ${battery.percentage < 25 ? 'text-red-400' : battery.percentage < 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {Math.floor(battery.predictiveTimeRemainingSec / 60)}:{String(battery.predictiveTimeRemainingSec % 60).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-white/40 uppercase">
                {battery.percentage}% REM
              </span>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-white/10" />

          {/* Altitude & Speed */}
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-widest text-[#888] font-bold block">
              AGL Altitude
            </span>
            <span className="text-xl font-light tracking-tighter text-sky-400">
              {telemetry.altitudeAglM.toFixed(1)}<span className="text-xs ml-0.5 font-normal text-white/50">M</span>
            </span>
          </div>

          <div className="h-8 w-[1px] bg-white/10" />

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-widest text-[#888] font-bold block">
              Ground Speed
            </span>
            <span className="text-xl font-light tracking-tighter text-[#e2e2e2]">
              {telemetry.groundspeedKmh.toFixed(1)}<span className="text-xs ml-0.5 font-normal text-white/50">KM/H</span>
            </span>
          </div>
        </div>

        {/* Action Controls: Arm/Disarm, RTL, Emergency Hover, Diagnostics */}
        <div className="flex items-center gap-2">
          {/* Arm / Disarm */}
          <button
            id="btn-arm-toggle"
            onClick={onArmToggle}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] uppercase tracking-widest font-semibold transition border ${
              armed
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
            title={armed ? 'Disarm UAV rotors' : 'Arm UAV rotors'}
          >
            <Power className="w-3.5 h-3.5" />
            {armed ? 'ARMED' : 'DISARMED'}
          </button>

          {/* RTL */}
          <button
            id="btn-rtl"
            onClick={onReturnToLaunch}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] uppercase tracking-widest font-medium bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:text-white transition"
            title="Return to Launch (Home coordinates)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            RTL
          </button>

          {/* Emergency Air-Brake Hover */}
          <button
            id="btn-emergency-hover"
            onClick={onEmergencyHover}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] uppercase tracking-widest font-medium bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition"
            title="Instant Braking Hover & Altitude Lock"
          >
            <Square className="w-3.5 h-3.5 fill-red-400" />
            AIR BRAKE
          </button>

          {/* Diagnostics Alert Drawer Button */}
          <button
            id="btn-diagnostics-bell"
            onClick={onOpenDiagnostics}
            className="relative p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition"
            title="System Diagnostics & Alert Log"
          >
            <Bell className="w-4 h-4" />
            {unacknowledgedAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-black font-mono shadow-[0_0_8px_rgba(245,158,11,0.6)]">
                {unacknowledgedAlertsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Sub-bar: OS Feature Modules */}
      <nav className="px-5 flex items-center gap-1.5 overflow-x-auto py-2 text-xs border-t border-white/5 scrollbar-none">
        <button
          id="nav-cockpit"
          onClick={() => setActiveTab('cockpit')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] uppercase tracking-widest transition whitespace-nowrap ${
            activeTab === 'cockpit'
              ? 'bg-sky-500 text-black font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)]'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          Cockpit & PFD
        </button>

        <button
          id="nav-map"
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] uppercase tracking-widest transition whitespace-nowrap ${
            activeTab === 'map'
              ? 'bg-sky-500 text-black font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)]'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Tactical Survey & Avoidance
        </button>

        <button
          id="nav-stability"
          onClick={() => setActiveTab('stability')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] uppercase tracking-widest transition whitespace-nowrap ${
            activeTab === 'stability'
              ? 'bg-sky-500 text-black font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)]'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Stability Flight Loop
        </button>

        <button
          id="nav-plugins"
          onClick={() => setActiveTab('plugins')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] uppercase tracking-widest transition whitespace-nowrap ${
            activeTab === 'plugins'
              ? 'bg-sky-500 text-black font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)]'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Sensor Plugins
        </button>

        <button
          id="nav-battery"
          onClick={() => setActiveTab('battery')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] uppercase tracking-widest transition whitespace-nowrap ${
            activeTab === 'battery'
              ? 'bg-sky-500 text-black font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)]'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <BatteryMedium className="w-3.5 h-3.5" />
          Predictive BMS
        </button>

        <button
          id="nav-crypto"
          onClick={() => setActiveTab('crypto')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] uppercase tracking-widest transition whitespace-nowrap ${
            activeTab === 'crypto'
              ? 'bg-sky-500 text-black font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)]'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Encrypted Uplink
        </button>

        <button
          id="nav-logs"
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] uppercase tracking-widest transition whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-sky-500 text-black font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)]'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Mission Logs & Playback
        </button>

        <button
          id="nav-api"
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] uppercase tracking-widest transition whitespace-nowrap ${
            activeTab === 'api'
              ? 'bg-sky-500 text-black font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)]'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          Enterprise API Access
        </button>

        <button
          id="nav-firmware"
          onClick={() => setActiveTab('firmware')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] uppercase tracking-widest transition whitespace-nowrap ${
            activeTab === 'firmware'
              ? 'bg-sky-500 text-black font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)]'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          MCU Firmware & Flashing
        </button>
      </nav>
    </header>
  );
};
