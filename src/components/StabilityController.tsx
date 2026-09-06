import React, { useState } from 'react';
import { 
  Sliders, 
  Cpu, 
  Wind, 
  ShieldCheck, 
  Activity, 
  Zap, 
  RefreshCw, 
  Check, 
  RotateCcw,
  Sparkles,
  Layers,
  Gauge
} from 'lucide-react';
import { FlightState, StabilitySystemState } from '../types';

interface StabilityControllerProps {
  flightState: FlightState;
  onUpdatePid: (pidState: Partial<StabilitySystemState>) => void;
}

export const StabilityController: React.FC<StabilityControllerProps> = ({
  flightState,
  onUpdatePid
}) => {
  const { stabilitySystem } = flightState;

  const [activeAxis, setActiveAxis] = useState<'ROLL' | 'PITCH' | 'YAW' | 'ALTITUDE'>('ROLL');
  const [pidRoll, setPidRoll] = useState(stabilitySystem.pidRoll);
  const [pidPitch, setPidPitch] = useState(stabilitySystem.pidPitch);
  const [pidYaw, setPidYaw] = useState(stabilitySystem.pidYaw);
  const [pidAltitude, setPidAltitude] = useState(stabilitySystem.pidAltitude);
  const [windDamping, setWindDamping] = useState(stabilitySystem.gustRejectionDamping);
  const [tiltCompensation, setTiltCompensation] = useState(stabilitySystem.motorTiltCompensationDeg);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Preset switch handler
  const applyPreset = (preset: 'PRECISION_SURVEY' | 'HIGH_WIND_DEFENSE' | 'HEAVY_PAYLOAD' | 'RAPID_AGILITY') => {
    let newRoll = { ...pidRoll };
    let newPitch = { ...pidPitch };
    let newYaw = { ...pidYaw };
    let newDamp = windDamping;
    let newTilt = tiltCompensation;

    if (preset === 'PRECISION_SURVEY') {
      newRoll = { p: 1.45, i: 0.08, d: 0.32 };
      newPitch = { p: 1.48, i: 0.08, d: 0.31 };
      newYaw = { p: 2.10, i: 0.12, d: 0.15 };
      newDamp = 0.94;
      newTilt = 1.8;
    } else if (preset === 'HIGH_WIND_DEFENSE') {
      newRoll = { p: 1.75, i: 0.14, d: 0.42 };
      newPitch = { p: 1.78, i: 0.14, d: 0.40 };
      newYaw = { p: 2.40, i: 0.18, d: 0.22 };
      newDamp = 0.98;
      newTilt = 2.4;
    } else if (preset === 'HEAVY_PAYLOAD') {
      newRoll = { p: 1.60, i: 0.11, d: 0.38 };
      newPitch = { p: 1.62, i: 0.11, d: 0.36 };
      newYaw = { p: 2.25, i: 0.14, d: 0.18 };
      newDamp = 0.92;
      newTilt = 2.0;
    } else {
      newRoll = { p: 1.85, i: 0.06, d: 0.28 };
      newPitch = { p: 1.88, i: 0.06, d: 0.27 };
      newYaw = { p: 2.60, i: 0.10, d: 0.14 };
      newDamp = 0.88;
      newTilt = 1.6;
    }

    setPidRoll(newRoll);
    setPidPitch(newPitch);
    setPidYaw(newYaw);
    setWindDamping(newDamp);
    setTiltCompensation(newTilt);

    onUpdatePid({
      pidRoll: newRoll,
      pidPitch: newPitch,
      pidYaw: newYaw,
      gustRejectionDamping: newDamp,
      motorTiltCompensationDeg: newTilt
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  const handleCommitPid = () => {
    onUpdatePid({
      pidRoll,
      pidPitch,
      pidYaw,
      pidAltitude,
      gustRejectionDamping: windDamping,
      motorTiltCompensationDeg: tiltCompensation
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  return (
    <div className="space-y-4 text-[#e2e2e2]">
      {/* Flight Loop Master Header */}
      <div className="bg-[#151518] border border-white/5 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sky-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Automated Stability Control & Flight Loop
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                800 Hz Deterministic
              </span>
            </div>
            <p className="text-xs text-white/40 font-mono">
              Quadrapuller Dynamic Pull-Vector Balancing & Harmonic Notch Filtering
            </p>
          </div>
        </div>

        {/* Stability Index Score */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <div className="text-white/40 text-[10px] uppercase tracking-widest">Stability Index</div>
            <div className="text-emerald-400 font-light text-2xl tracking-tighter leading-tight">
              {stabilitySystem.activeStabilityIndex}%
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="text-right">
            <div className="text-white/40 text-[10px] uppercase tracking-widest">Loop Latency</div>
            <div className="text-sky-400 font-light text-2xl tracking-tighter leading-tight">
              1.21 <span className="text-xs text-white/40 font-normal">ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stability Tuning Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => applyPreset('PRECISION_SURVEY')}
          className="p-3 rounded-xl bg-[#151518] border border-white/5 hover:border-white/20 transition text-left group cursor-pointer"
        >
          <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">
            Precision Survey
          </div>
          <p className="text-[10px] text-white/40 font-mono mt-1">
            Smooth photogrammetry stabilization (&lt;0.05° variance)
          </p>
        </button>

        <button
          onClick={() => applyPreset('HIGH_WIND_DEFENSE')}
          className="p-3 rounded-xl bg-[#151518] border border-white/5 hover:border-white/20 transition text-left group cursor-pointer"
        >
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            High-Wind Defense
          </div>
          <p className="text-[10px] text-white/40 font-mono mt-1">
            Aggressive gust rejection up to 45 km/h winds
          </p>
        </button>

        <button
          onClick={() => applyPreset('HEAVY_PAYLOAD')}
          className="p-3 rounded-xl bg-[#151518] border border-white/5 hover:border-white/20 transition text-left group cursor-pointer"
        >
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            Heavy Payload Lift
          </div>
          <p className="text-[10px] text-white/40 font-mono mt-1">
            LiDAR + FLIR Dual Rig inertia compensation
          </p>
        </button>

        <button
          onClick={() => applyPreset('RAPID_AGILITY')}
          className="p-3 rounded-xl bg-[#151518] border border-white/5 hover:border-white/20 transition text-left group cursor-pointer"
        >
          <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">
            Obstacle Evasion Agility
          </div>
          <p className="text-[10px] text-white/40 font-mono mt-1">
            High rate response for reactive collision avoidance
          </p>
        </button>
      </div>

      {/* Main Stability Editor Grid: 4-Axis PID & Dynamic Aerodynamic Compensation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Cols: Interactive 4-Axis PID Flight Loop Editor */}
        <div className="lg:col-span-7 bg-[#151518] border border-white/5 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                PID Rate & Attitude Loop Parameters
              </h3>
            </div>

            {/* Axis Selector Tabs */}
            <div className="flex gap-1.5 text-xs font-mono">
              {(['ROLL', 'PITCH', 'YAW', 'ALTITUDE'] as const).map(axis => (
                <button
                  key={axis}
                  onClick={() => setActiveAxis(axis)}
                  className={`px-3 py-1 rounded-lg text-[11px] uppercase tracking-wider transition ${
                    activeAxis === axis
                      ? 'bg-sky-500 text-black font-bold shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                      : 'bg-white/5 text-white/40 border border-white/5 hover:text-white'
                  }`}
                >
                  {axis}
                </button>
              ))}
            </div>
          </div>

          {/* Active Axis PID Sliders */}
          <div className="space-y-4 font-mono text-xs">
            {activeAxis === 'ROLL' && (
              <>
                <div>
                  <div className="flex justify-between text-white/70 mb-1">
                    <span>Proportional Gain (P):</span>
                    <strong className="text-sky-400">{pidRoll.p.toFixed(2)}</strong>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3.0" 
                    step="0.01" 
                    value={pidRoll.p}
                    onChange={(e) => setPidRoll({ ...pidRoll, p: parseFloat(e.target.value) })}
                    className="w-full accent-sky-500"
                  />
                  <span className="text-[10px] text-white/40">Corrects immediate angular error across lateral quadrapuller pullers</span>
                </div>

                <div>
                  <div className="flex justify-between text-white/70 mb-1">
                    <span>Integral Gain (I):</span>
                    <strong className="text-emerald-400">{pidRoll.i.toFixed(3)}</strong>
                  </div>
                  <input 
                    type="range" 
                    min="0.01" 
                    max="0.3" 
                    step="0.005" 
                    value={pidRoll.i}
                    onChange={(e) => setPidRoll({ ...pidRoll, i: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                  <span className="text-[10px] text-white/40">Removes steady-state attitude offset in constant crosswinds</span>
                </div>

                <div>
                  <div className="flex justify-between text-white/70 mb-1">
                    <span>Derivative Gain (D):</span>
                    <strong className="text-amber-400">{pidRoll.d.toFixed(2)}</strong>
                  </div>
                  <input 
                    type="range" 
                    min="0.05" 
                    max="0.8" 
                    step="0.01" 
                    value={pidRoll.d}
                    onChange={(e) => setPidRoll({ ...pidRoll, d: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                  <span className="text-[10px] text-white/40">Damps rotor oscillation and prevents overshoot on fast banking</span>
                </div>
              </>
            )}

            {activeAxis === 'PITCH' && (
              <>
                <div>
                  <div className="flex justify-between text-white/70 mb-1">
                    <span>Proportional Gain (P):</span>
                    <strong className="text-sky-400">{pidPitch.p.toFixed(2)}</strong>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3.0" 
                    step="0.01" 
                    value={pidPitch.p}
                    onChange={(e) => setPidPitch({ ...pidPitch, p: parseFloat(e.target.value) })}
                    className="w-full accent-sky-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-white/70 mb-1">
                    <span>Integral Gain (I):</span>
                    <strong className="text-emerald-400">{pidPitch.i.toFixed(3)}</strong>
                  </div>
                  <input 
                    type="range" 
                    min="0.01" 
                    max="0.3" 
                    step="0.005" 
                    value={pidPitch.i}
                    onChange={(e) => setPidPitch({ ...pidPitch, i: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-white/70 mb-1">
                    <span>Derivative Gain (D):</span>
                    <strong className="text-amber-400">{pidPitch.d.toFixed(2)}</strong>
                  </div>
                  <input 
                    type="range" 
                    min="0.05" 
                    max="0.8" 
                    step="0.01" 
                    value={pidPitch.d}
                    onChange={(e) => setPidPitch({ ...pidPitch, d: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                </div>
              </>
            )}

            {activeAxis === 'YAW' && (
              <>
                <div>
                  <div className="flex justify-between text-white/70 mb-1">
                    <span>Proportional Gain (P):</span>
                    <strong className="text-sky-400">{pidYaw.p.toFixed(2)}</strong>
                  </div>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="4.0" 
                    step="0.05" 
                    value={pidYaw.p}
                    onChange={(e) => setPidYaw({ ...pidYaw, p: parseFloat(e.target.value) })}
                    className="w-full accent-sky-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-white/70 mb-1">
                    <span>Integral Gain (I):</span>
                    <strong className="text-emerald-400">{pidYaw.i.toFixed(3)}</strong>
                  </div>
                  <input 
                    type="range" 
                    min="0.01" 
                    max="0.3" 
                    step="0.005" 
                    value={pidYaw.i}
                    onChange={(e) => setPidYaw({ ...pidYaw, i: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-white/70 mb-1">
                    <span>Derivative Gain (D):</span>
                    <strong className="text-amber-400">{pidYaw.d.toFixed(2)}</strong>
                  </div>
                  <input 
                    type="range" 
                    min="0.05" 
                    max="0.5" 
                    step="0.01" 
                    value={pidYaw.d}
                    onChange={(e) => setPidYaw({ ...pidYaw, d: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                </div>
              </>
            )}

            {activeAxis === 'ALTITUDE' && (
              <>
                <div>
                  <div className="flex justify-between text-white/70 mb-1">
                    <span>Altitude Position (P):</span>
                    <strong className="text-sky-400">{pidAltitude.p.toFixed(2)}</strong>
                  </div>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="5.0" 
                    step="0.05" 
                    value={pidAltitude.p}
                    onChange={(e) => setPidAltitude({ ...pidAltitude, p: parseFloat(e.target.value) })}
                    className="w-full accent-sky-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-white/70 mb-1">
                    <span>Climb Rate Hold (I):</span>
                    <strong className="text-emerald-400">{pidAltitude.i.toFixed(3)}</strong>
                  </div>
                  <input 
                    type="range" 
                    min="0.05" 
                    max="0.6" 
                    step="0.01" 
                    value={pidAltitude.i}
                    onChange={(e) => setPidAltitude({ ...pidAltitude, i: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-white/70 mb-1">
                    <span>Vertical Damping (D):</span>
                    <strong className="text-amber-400">{pidAltitude.d.toFixed(2)}</strong>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.02" 
                    value={pidAltitude.d}
                    onChange={(e) => setPidAltitude({ ...pidAltitude, d: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                </div>
              </>
            )}

            {/* Commit Changes Button */}
            <div className="pt-2">
              <button
                onClick={handleCommitPid}
                className="w-full py-2.5 rounded-lg bg-sky-500 text-black font-bold tracking-wider text-[11px] uppercase transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:bg-sky-400 cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    PID PARAMETERS COMMITTED TO FLIGHT CONTROLLER
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    APPLY REAL-TIME STABILITY TUNING
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Step Response Simulator & Environmental Vibration Filters */}
        <div className="lg:col-span-5 space-y-4">
          {/* Simulated Step Response Curve */}
          <div className="bg-[#151518] border border-white/5 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Simulated Step Response
              </h3>
              <span className="text-[10px] font-mono text-emerald-400">Settling: 142ms</span>
            </div>

            {/* SVG Step Response Visualization */}
            <div className="w-full h-32 bg-[#050505] rounded-xl p-2 relative overflow-hidden border border-white/10 flex items-center">
              <svg className="w-full h-full overflow-visible">
                {/* Target Step Line (dashed amber) */}
                <line x1="20" y1="35" x2="280" y2="35" stroke="#f59e0b" strokeDasharray="3 3" strokeWidth="1.5" />
                {/* Zero line */}
                <line x1="20" y1="95" x2="280" y2="95" stroke="#334155" strokeWidth="1" />
                {/* Simulated PID Step Response Curve */}
                <path 
                  d="M 20 95 Q 40 95, 60 25 T 100 38 T 140 34 T 180 35 L 280 35"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="2.5"
                />
              </svg>
              <div className="absolute top-2 right-2 text-[10px] font-mono text-sky-400 bg-black/80 px-2 py-0.5 rounded-md border border-white/10">
                Overshoot: 4.8%
              </div>
            </div>

            <div className="mt-2 text-[11px] font-mono text-white/40 flex justify-between">
              <span>Target: +15° Roll Step</span>
              <span>Damping Ratio: ζ = 0.72</span>
            </div>
          </div>

          {/* Aerodynamic Pull-Vector & Decoupling Controls */}
          <div className="bg-[#151518] border border-white/5 rounded-xl p-4 shadow-lg space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Aerodynamic Decoupling
              </h3>
              <span className="text-[10px] text-sky-400 font-mono uppercase tracking-widest">Active</span>
            </div>

            {/* Motor Tilt Outward Angle */}
            <div>
              <div className="flex justify-between text-white/70 mb-1">
                <span>Motor Tilt Outward Angle:</span>
                <strong className="text-[#e2e2e2]">{tiltCompensation.toFixed(1)}°</strong>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="4.0" 
                step="0.1" 
                value={tiltCompensation}
                onChange={(e) => setTiltCompensation(parseFloat(e.target.value))}
                className="w-full accent-sky-500"
              />
              <span className="text-[10px] text-white/40">Provides natural lateral authority without tilting the fuselage</span>
            </div>

            {/* Gust Rejection Damping */}
            <div>
              <div className="flex justify-between text-white/70 mb-1">
                <span>Wind Gust Rejection Damping:</span>
                <strong className="text-emerald-400">{(windDamping * 100).toFixed(0)}%</strong>
              </div>
              <input 
                type="range" 
                min="0.60" 
                max="0.99" 
                step="0.01" 
                value={windDamping}
                onChange={(e) => setWindDamping(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <span className="text-[10px] text-white/40">Feedforward acceleration compensation for sudden wind shear</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5 text-[11px] text-white/40 flex items-center justify-between">
              <span>Gyro Dynamic Harmonic Notch:</span>
              <span className="text-emerald-400 font-semibold">120 Hz / -28.5 dB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
