import React from 'react';
import { 
  Compass, 
  Wind, 
  Gauge, 
  Activity, 
  Thermometer, 
  Zap, 
  Anchor, 
  Navigation2, 
  ArrowUpRight, 
  Waves,
  Crosshair
} from 'lucide-react';
import { FlightState } from '../types';

interface CockpitTelemetryProps {
  flightState: FlightState;
  onSetAltitude: (alt: number) => void;
  onSetFlightMode: (mode: any) => void;
}

export const CockpitTelemetry: React.FC<CockpitTelemetryProps> = ({
  flightState,
  onSetAltitude,
  onSetFlightMode
}) => {
  const { telemetry, stabilitySystem, armed, flightMode } = flightState;
  const { rollDeg, pitchDeg, yawDeg, headingDeg, altitudeAglM, altitudeMslM, groundspeedKmh, verticalSpeedMs, windVector, gnss, rotors } = telemetry;

  // Calculate horizon pitch translation in SVG
  const pitchOffset = Math.max(-60, Math.min(60, pitchDeg * 4));
  const rollRotation = -rollDeg;

  return (
    <div className="space-y-4 text-[#e2e2e2]">
      {/* Top Cockpit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Primary Flight Display (PFD) Artificial Horizon (6 Cols) */}
        <div className="lg:col-span-6 bg-[#151518] border border-white/5 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Primary Flight Display (PFD)
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-emerald-400 border border-white/5">
              AHRS Active
            </span>
          </div>

          {/* Artificial Horizon Instrument Canvas */}
          <div className="relative w-full h-[280px] sm:h-[320px] rounded-xl overflow-hidden bg-[#050505] border border-white/10 flex items-center justify-center select-none">
            {/* Horizon Sky/Ground Split */}
            <div 
              className="absolute inset-0 w-full h-full transition-transform duration-75 ease-out"
              style={{
                transform: `rotate(${rollRotation}deg) translateY(${pitchOffset}px)`
              }}
            >
              {/* Sky */}
              <div className="w-full h-1/2 bg-sky-950/40 border-b-2 border-emerald-400/80 relative">
                {/* Sky Pitch Ladders */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 text-[10px] font-mono text-sky-400/80">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-sky-400/60" />
                    <span>+20°</span>
                    <span className="w-8 h-[1px] bg-sky-400/60" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12 h-[1px] bg-sky-400" />
                    <span>+10°</span>
                    <span className="w-12 h-[1px] bg-sky-400" />
                  </div>
                </div>
              </div>

              {/* Ground */}
              <div className="w-full h-1/2 bg-[#1c1815] relative">
                {/* Ground Pitch Ladders */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 text-[10px] font-mono text-amber-400/70">
                  <div className="flex items-center gap-2">
                    <span className="w-12 h-[1px] border-b border-dashed border-amber-400/70" />
                    <span>-10°</span>
                    <span className="w-12 h-[1px] border-b border-dashed border-amber-400/70" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-[1px] border-b border-dashed border-amber-400/50" />
                    <span>-20°</span>
                    <span className="w-8 h-[1px] border-b border-dashed border-amber-400/50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Aircraft Reference Symbol (Fixed Reticle) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="relative flex items-center">
                {/* Left Wing Bar */}
                <div className="w-10 h-1.5 bg-amber-400 border border-black shadow-sm" />
                {/* Center Pivot Point */}
                <div className="w-3 h-3 rounded-full border-2 border-amber-400 bg-black/80 mx-1" />
                {/* Right Wing Bar */}
                <div className="w-10 h-1.5 bg-amber-400 border border-black shadow-sm" />
              </div>
            </div>

            {/* Roll Bank Angle Pointer Arc */}
            <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none z-10">
              <div className="text-center font-mono text-xs font-semibold px-2 py-0.5 rounded bg-black/80 border border-white/10 text-sky-400">
                BANK: {rollDeg.toFixed(1)}°
              </div>
            </div>

            {/* Left Speed Tape Overlay */}
            <div className="absolute left-2 inset-y-6 w-14 bg-black/80 border border-white/10 rounded-lg p-1.5 flex flex-col justify-between font-mono text-xs z-10">
              <span className="text-[10px] text-white/40 uppercase text-center font-bold">SPD</span>
              <div className="text-center">
                <div className="text-emerald-400 font-light text-base tracking-tight">
                  {groundspeedKmh.toFixed(0)}
                </div>
                <div className="text-[9px] text-white/40">km/h</div>
              </div>
              <div className="text-[9px] text-white/40 text-center">
                IAS: {(groundspeedKmh * 0.95).toFixed(0)}
              </div>
            </div>

            {/* Right Altitude Tape Overlay */}
            <div className="absolute right-2 inset-y-6 w-16 bg-black/80 border border-white/10 rounded-lg p-1.5 flex flex-col justify-between font-mono text-xs z-10">
              <span className="text-[10px] text-white/40 uppercase text-center font-bold">ALT</span>
              <div className="text-center">
                <div className="text-sky-400 font-light text-base tracking-tight">
                  {altitudeAglM.toFixed(1)}
                </div>
                <div className="text-[9px] text-sky-300">m AGL</div>
              </div>
              <div className="text-[9px] text-white/40 text-center">
                MSL: {altitudeMslM.toFixed(0)}m
              </div>
            </div>

            {/* Variometer Vertical Speed (Bottom Right) */}
            <div className="absolute bottom-2 right-20 bg-black/80 border border-white/10 rounded px-2 py-0.5 font-mono text-[10px] text-white/60 z-10 flex items-center gap-1">
              <span>VSI:</span>
              <span className={`font-bold ${verticalSpeedMs >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {verticalSpeedMs > 0 ? `+${verticalSpeedMs.toFixed(2)}` : verticalSpeedMs.toFixed(2)} m/s
              </span>
            </div>

            {/* Heading Tape at Bottom */}
            <div className="absolute bottom-2 left-20 right-20 flex justify-center z-10">
              <div className="bg-black/80 border border-white/10 rounded-lg px-3 py-0.5 font-mono text-xs text-[#e2e2e2] font-semibold flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                HDG: {Math.round(headingDeg)}° {headingDeg > 337 || headingDeg <= 22 ? 'N' : headingDeg <= 67 ? 'NE' : headingDeg <= 112 ? 'E' : headingDeg <= 157 ? 'SE' : headingDeg <= 202 ? 'S' : headingDeg <= 247 ? 'SW' : headingDeg <= 292 ? 'W' : 'NW'}
              </div>
            </div>
          </div>

          {/* Quick Target Altitude Selector */}
          <div className="mt-3 flex items-center justify-between text-xs font-mono">
            <span className="text-white/40 uppercase tracking-widest text-[10px]">Altitude Preset:</span>
            <div className="flex gap-1.5">
              {[30, 50, 80, 120].map(target => (
                <button
                  key={target}
                  onClick={() => onSetAltitude(target)}
                  className={`px-3 py-1 rounded-lg text-xs transition border ${
                    Math.abs(altitudeAglM - target) < 5
                      ? 'bg-sky-500 text-black font-bold border-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                      : 'bg-white/5 text-white/70 border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {target}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quadrapuller 4 Rotors Thrust & Dynamics Matrix (6 Cols) */}
        <div className="lg:col-span-6 bg-[#151518] border border-white/5 rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Quadrapuller 4-Rotor Thrust Matrix
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-emerald-400 border border-white/5 uppercase tracking-widest">
              Balance: {stabilitySystem.activeStabilityIndex}%
            </span>
          </div>

          {/* Quadrapuller Rotor Grid & Pulling Dynamics */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {rotors.map((rotor) => {
              const rotationDir = (rotor.position === 'FL' || rotor.position === 'RR') ? 'CW' : 'CCW';

              return (
                <div 
                  key={rotor.id} 
                  className="bg-[#0d0d0f] border border-white/5 rounded-xl p-3 relative overflow-hidden group hover:border-white/15 transition"
                >
                  {/* Rotor Header */}
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(14,165,233,0.8)]" />
                      <strong className="text-[#e2e2e2]">{rotor.label.split(' ')[0]} {rotor.position}</strong>
                      <span className="text-[10px] text-white/30">({rotationDir})</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {rotor.status}
                    </span>
                  </div>

                  {/* RPM & Thrust Gauge */}
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between font-mono">
                      <span className="text-white/40 text-[11px] uppercase tracking-wider">Speed:</span>
                      <span className="text-sky-400 font-bold text-sm">
                        {rotor.rpm} <span className="text-[10px] text-white/30 font-normal">RPM</span>
                      </span>
                    </div>

                    {/* RPM progress bar */}
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${Math.min(100, (rotor.rpm / 8000) * 100)}%` }}
                      />
                    </div>

                    {/* Secondary Rotor Metrics: ESC Temp, Current, Thrust, Vibration */}
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
                      <div className="flex items-center justify-between text-white/40 bg-white/5 px-2 py-1 rounded-lg">
                        <span>Thrust:</span>
                        <span className="text-[#e2e2e2] font-semibold">{rotor.thrustN.toFixed(1)} N</span>
                      </div>
                      <div className="flex items-center justify-between text-white/40 bg-white/5 px-2 py-1 rounded-lg">
                        <span>ESC Temp:</span>
                        <span className="text-amber-400 font-semibold">{rotor.escTempC.toFixed(1)}°C</span>
                      </div>
                      <div className="flex items-center justify-between text-white/40 bg-white/5 px-2 py-1 rounded-lg">
                        <span>Current:</span>
                        <span className="text-emerald-400 font-semibold">{rotor.currentA.toFixed(1)} A</span>
                      </div>
                      <div className="flex items-center justify-between text-white/40 bg-white/5 px-2 py-1 rounded-lg">
                        <span>Vibe FFT:</span>
                        <span className="text-[#e2e2e2]">{rotor.vibrationG.toFixed(2)} g</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quadrapuller Vector Geometry Bar */}
          <div className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Anchor className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-white/40">Motor Tilt Outward:</span>
              <span className="text-[#e2e2e2] font-semibold">{stabilitySystem.motorTiltCompensationDeg}°</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/40">Torque Decoupling:</span>
              <span className="text-emerald-400 font-semibold">{stabilitySystem.antiTorqueCorrectionPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Cockpit Grid: Spatial Vectors, RTK GNSS, and Wind Aerodynamics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Spatial Attitude & Vectors */}
        <div className="bg-[#151518] border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Navigation2 className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Attitude & Euler Angles
              </h3>
            </div>
            <span className="text-[10px] font-mono text-white/40">EKF3 Fusion</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5">
              <span className="text-[10px] text-white/40 uppercase block font-bold">ROLL (φ)</span>
              <span className="text-lg font-light tracking-tight text-sky-400">{rollDeg > 0 ? `+${rollDeg.toFixed(1)}` : rollDeg.toFixed(1)}°</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5">
              <span className="text-[10px] text-white/40 uppercase block font-bold">PITCH (θ)</span>
              <span className="text-lg font-light tracking-tight text-sky-400">{pitchDeg > 0 ? `+${pitchDeg.toFixed(1)}` : pitchDeg.toFixed(1)}°</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5">
              <span className="text-[10px] text-white/40 uppercase block font-bold">YAW (ψ)</span>
              <span className="text-lg font-light tracking-tight text-sky-400">{yawDeg.toFixed(1)}°</span>
            </div>
          </div>

          <div className="mt-3 text-xs font-mono space-y-1.5 text-white/70">
            <div className="flex justify-between">
              <span className="text-white/40">Angular Velocity:</span>
              <span>0.02 / -0.01 / 0.05 rad/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Vertical Acceleration:</span>
              <span className="text-emerald-400">1.01 g (hover)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Wind Vector & Aerodynamics */}
        <div className="bg-[#151518] border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Wind Vector & Drift
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Active</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Wind Rose Graphic */}
            <div className="relative w-16 h-16 rounded-full border border-white/10 bg-[#050505] flex items-center justify-center shrink-0">
              <div 
                className="w-10 h-0.5 bg-emerald-400 absolute transition-transform duration-500"
                style={{ transform: `rotate(${windVector.directionDeg}deg)` }}
              >
                <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full absolute -right-1 -top-0.5" />
              </div>
              <span className="text-[9px] font-mono text-white/30 absolute top-0.5">N</span>
            </div>

            <div className="space-y-1 font-mono text-xs flex-1">
              <div className="flex justify-between">
                <span className="text-white/40">Speed:</span>
                <span className="text-[#e2e2e2] font-bold">{windVector.speedKmh} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Direction:</span>
                <span className="text-white/80">{windVector.directionDeg}° (WSW)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Peak Gust:</span>
                <span className="text-amber-400 font-semibold">{windVector.gustPeakKmh} km/h</span>
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-white/5 text-[11px] font-mono text-white/40 flex justify-between">
            <span>Gust Rejection Damping:</span>
            <span className="text-emerald-400 font-semibold">{(stabilitySystem.gustRejectionDamping * 100).toFixed(0)}% rejection</span>
          </div>
        </div>

        {/* Card 3: High-Precision GNSS RTK Solution */}
        <div className="bg-[#151518] border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                RTK Positioning & GNSS
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {gnss.fixType}
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-white/40">Latitude:</span>
              <span className="text-[#e2e2e2]">{telemetry.latitude.toFixed(6)}° N</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Longitude:</span>
              <span className="text-[#e2e2e2]">{telemetry.longitude.toFixed(6)}° W</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Constellation:</span>
              <span className="text-sky-300">GPS + Galileo + BeiDou</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Accuracy (HDOP):</span>
              <span className="text-emerald-400 font-semibold">{gnss.hdop}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">RTK Base Age:</span>
              <span className="text-white/80">{gnss.rtkAgeSec}s</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
