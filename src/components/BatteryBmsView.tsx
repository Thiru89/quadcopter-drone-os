import React, { useState } from 'react';
import { 
  BatteryMedium, 
  BatteryWarning, 
  Zap, 
  Thermometer, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  TrendingDown, 
  ShieldCheck,
  Activity,
  Layers
} from 'lucide-react';
import { BatteryBmsState } from '../types';

interface BatteryBmsViewProps {
  battery: BatteryBmsState;
  onSimulateDischarge: () => void;
}

export const BatteryBmsView: React.FC<BatteryBmsViewProps> = ({
  battery,
  onSimulateDischarge
}) => {
  // Calculate cell voltage variance
  const minCell = Math.min(...battery.cellsVoltage);
  const maxCell = Math.max(...battery.cellsVoltage);
  const cellDeltaMv = Math.round((maxCell - minCell) * 1000);

  // Predictive time calculations
  const remainingMinutes = Math.floor(battery.predictiveTimeRemainingSec / 60);
  const remainingSeconds = battery.predictiveTimeRemainingSec % 60;
  const rtlMarginMinutes = Math.floor(battery.predictedRtlMarginSec / 60);

  return (
    <div className="space-y-4 text-[#e2e2e2]">
      {/* Predictive BMS Banner */}
      <div className="bg-[#151518] border border-white/5 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
            <BatteryMedium className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Predictive Battery Management System (BMS)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                12S High-Discharge Pack
              </span>
            </div>
            <p className="text-xs text-white/40 font-mono">
              Real-Time Dynamic Point-of-No-Return (PNR) & Impedance Spectroscopy
            </p>
          </div>
        </div>

        {/* Predictive Endurance Highlights */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <div className="text-white/40 text-[10px] uppercase tracking-widest">State of Charge</div>
            <div className={`text-2xl font-light tracking-tighter ${battery.percentage > 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {battery.percentage}% <span className="text-xs text-white/40 font-normal">({(battery.remainingMah / 1000).toFixed(1)} Ah)</span>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <div className="text-white/40 text-[10px] uppercase tracking-widest">Predictive Endurance</div>
            <div className="text-sky-400 font-light text-2xl tracking-tighter">
              {remainingMinutes}m {remainingSeconds}s
            </div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <div className="text-white/40 text-[10px] uppercase tracking-widest">RTL Reserve Margin</div>
            <div className="text-emerald-400 font-light text-2xl tracking-tighter">
              +{rtlMarginMinutes}m margin
            </div>
          </div>
        </div>
      </div>

      {/* Point of No Return & Dynamic Reserve Advisory */}
      <div className="bg-[#151518] border border-white/5 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
              Autonomous Return-To-Launch (PNR) Envelope
            </h3>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {battery.smartWarning}
          </span>
        </div>

        {/* Dynamic Multi-segment Battery Bar with PNR Zone */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="relative w-full h-7 bg-[#050505] rounded-xl overflow-hidden border border-white/10 flex">
            {/* Critical Emergency Reserve (0 - 15%) */}
            <div 
              className="h-full bg-rose-950/80 border-r border-rose-800 flex items-center justify-center text-[10px] text-rose-300 font-bold"
              style={{ width: '15%' }}
            >
              EMERGENCY
            </div>

            {/* RTL Flight Buffer (15 - 35%) */}
            <div 
              className="h-full bg-amber-950/80 border-r border-amber-800 flex items-center justify-center text-[10px] text-amber-300 font-bold"
              style={{ width: '20%' }}
            >
              RTL SAFE BUFFER (PNR)
            </div>

            {/* Active Usable Mission Energy (35 - 100%) */}
            <div 
              className="h-full bg-emerald-950/40 relative flex items-center px-3"
              style={{ width: '65%' }}
            >
              {/* Current Fill Level Overlay */}
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/80 to-sky-500/80 transition-all duration-500"
                style={{ width: `${Math.max(0, ((battery.percentage - 35) / 65) * 100)}%` }}
              />
              <span className="relative z-10 text-[11px] text-[#e2e2e2] font-bold">
                ACTIVE SURVEY CRUISE ZONE
              </span>
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-white/40 pt-0.5">
            <span>0% Critical Hard Landing</span>
            <span className="text-amber-400 font-semibold">▲ Point of No Return Threshold (35%)</span>
            <span>100% Full Solid-State Pack</span>
          </div>
        </div>
      </div>

      {/* Main Grid: 12-Cell Individual Monitor & Electrical Thermal Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Cols: Individual 12-Cell Voltage Matrix */}
        <div className="lg:col-span-7 bg-[#151518] border border-white/5 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                12S Cell Voltage Telemetry & Balancing
              </h3>
            </div>
            <div className="text-[11px] font-mono text-white/40 flex items-center gap-2">
              <span>Cell Delta (ΔV):</span>
              <strong className="text-emerald-400">{cellDeltaMv} mV</strong>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">BALANCED</span>
            </div>
          </div>

          {/* 12-Cell Grid Display */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 font-mono text-xs">
            {battery.cellsVoltage.map((voltage, idx) => (
              <div 
                key={idx}
                className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5 hover:border-white/15 transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[10px] text-white/40">
                  <span>CELL #{idx + 1}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                </div>
                <div className="my-1">
                  <span className="text-sm font-bold text-[#e2e2e2]">
                    {voltage.toFixed(3)} <span className="text-[10px] text-white/30 font-normal">V</span>
                  </span>
                </div>
                {/* Visual bar */}
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 transition-all"
                    style={{ width: `${((voltage - 3.2) / (4.2 - 3.2)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-[11px] font-mono text-white/40 border-t border-white/5 pt-2 flex items-center justify-between">
            <span>Nominal Pack Voltage: <strong className="text-[#e2e2e2]">{battery.voltageTotal.toFixed(1)} V</strong></span>
            <span>Over-Discharge Cutoff: <strong className="text-amber-400">36.0 V (3.0V/cell)</strong></span>
          </div>
        </div>

        {/* Right 5 Cols: Electrical Dynamics & Health Analytics */}
        <div className="lg:col-span-5 space-y-4">
          {/* Instantaneous Electrical Draw Card */}
          <div className="bg-[#151518] border border-white/5 rounded-xl p-4 shadow-lg space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Instantaneous Electrical Load
              </h3>
              <span className="text-[10px] text-emerald-400 uppercase tracking-widest">Continuous 0.58C</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5">
                <span className="text-white/40 text-[10px] uppercase tracking-wider block">Current Draw:</span>
                <strong className="text-[#e2e2e2] text-base">{battery.currentDrawAmps.toFixed(1)} A</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5">
                <span className="text-white/40 text-[10px] uppercase tracking-wider block">Power Output:</span>
                <strong className="text-sky-400 text-base">{battery.powerConsumptionWatts.toFixed(0)} W</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5">
                <span className="text-white/40 text-[10px] uppercase tracking-wider block">Pack Temp:</span>
                <strong className="text-emerald-400 text-base">{battery.temperatureCelsius.toFixed(1)}°C</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5">
                <span className="text-white/40 text-[10px] uppercase tracking-wider block">Internal Res:</span>
                <strong className="text-[#e2e2e2] text-base">{battery.internalResistanceMilliOhms.toFixed(2)} mΩ</strong>
              </div>
            </div>
          </div>

          {/* Battery Lifetime & Cycle Health Card */}
          <div className="bg-[#151518] border border-white/5 rounded-xl p-4 shadow-lg space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Battery Longevity & Health
              </h3>
              <span className="text-[10px] text-sky-400">{battery.healthCapacityPct}% SOH</span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-white/40">
                <span>Charge Cycle Count:</span>
                <span className="text-[#e2e2e2] font-semibold">{battery.healthCycles} cycles</span>
              </div>
              <div className="flex justify-between text-white/40">
                <span>State of Health (SOH):</span>
                <span className="text-emerald-400 font-semibold">{battery.healthCapacityPct}% remaining</span>
              </div>
              <div className="flex justify-between text-white/40">
                <span>Chemistry Type:</span>
                <span className="text-white/70">Solid-State High-Nickel LiPo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
