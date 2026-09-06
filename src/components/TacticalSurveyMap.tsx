import React, { useState, useRef, useEffect } from 'react';
import { 
  Map, 
  Layers, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Play, 
  RefreshCw, 
  Compass, 
  Target, 
  Grid, 
  Camera, 
  Sliders, 
  AlertOctagon,
  CheckCircle2
} from 'lucide-react';
import { FlightState, MissionWaypoint, SurveyGridSettings } from '../types';

interface TacticalSurveyMapProps {
  flightState: FlightState;
  waypoints: MissionWaypoint[];
  onAddWaypoint: (wp: MissionWaypoint) => void;
  onTriggerObstacleAvoidance: () => void;
}

export const TacticalSurveyMap: React.FC<TacticalSurveyMapProps> = ({
  flightState,
  waypoints,
  onAddWaypoint,
  onTriggerObstacleAvoidance
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeLayer, setActiveLayer] = useState<{
    lidarPoints: boolean;
    surveyGrid: boolean;
    obstacles: boolean;
    safetyBubble: boolean;
    topography: boolean;
  }>({
    lidarPoints: true,
    surveyGrid: true,
    obstacles: true,
    safetyBubble: true,
    topography: true
  });

  const [surveySettings, setSurveySettings] = useState<SurveyGridSettings>({
    centerLat: 37.7749,
    centerLng: -122.4194,
    widthMeters: 360,
    heightMeters: 420,
    flightAltitudeM: 55,
    forwardOverlapPct: 75,
    sideOverlapPct: 70,
    sensorGsdCmPx: 1.85,
    flightSpeedKmh: 32
  });

  const [simulatedObstacles, setSimulatedObstacles] = useState([
    { id: 'obs-1', label: 'Industrial Crane Jib', x: 260, y: 170, radius: 18, distanceM: 19.8, type: 'CRANE', threat: 'HIGH' },
    { id: 'obs-2', label: 'Telecom Mast Guy-Wires', x: 440, y: 280, radius: 14, distanceM: 34.2, type: 'TOWER', threat: 'MEDIUM' },
    { id: 'obs-3', label: 'Dense Tree Canopy Crest', x: 180, y: 320, radius: 24, distanceM: 42.0, type: 'VEGETATION', threat: 'LOW' }
  ]);

  const [selectedWaypoint, setSelectedWaypoint] = useState<MissionWaypoint | null>(null);
  const [computingSurvey, setComputingSurvey] = useState(false);
  const [gridGenerated, setGridGenerated] = useState(true);

  // Render 2.5D Tactical Survey Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Dark tactical coordinate background - Elegant Dark deepest black
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      // Draw Topographic / Grid Contours
      if (activeLayer.topography) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Topographic contour rings
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
        ctx.lineWidth = 1.5;
        for (let r = 80; r < 360; r += 70) {
          ctx.beginPath();
          ctx.ellipse(320, 240, r, r * 0.75, 0.2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw Survey Boundary Box
      if (activeLayer.surveyGrid) {
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(100, 70, 480, 360);
        ctx.setLineDash([]);

        // Survey Area Label
        ctx.fillStyle = 'rgba(14, 165, 233, 0.8)';
        ctx.font = '10px monospace';
        ctx.fillText(`AUTONOMOUS SURVEY POLYGON (${surveySettings.widthMeters}m x ${surveySettings.heightMeters}m)`, 105, 62);
      }

      // Draw Flight Path Lines & Survey Lanes
      if (waypoints.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 2;

        waypoints.forEach((wp, idx) => {
          // Normalize lat/lng to canvas coordinates
          const x = 120 + idx * 75;
          const y = idx % 2 === 0 ? 110 : 380;

          if (idx === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();

        // Draw Waypoint nodes and camera exposure triggers
        waypoints.forEach((wp, idx) => {
          const x = 120 + idx * 75;
          const y = idx % 2 === 0 ? 110 : 380;

          // Camera trigger flash ring
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.fillStyle = wp.status === 'COMPLETED' ? '#10b981' : wp.status === 'ACTIVE' ? '#0ea5e9' : '#475569';
          ctx.fill();
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Waypoint Label
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(wp.id, x - 12, y - 13);
        });
      }

      // Draw Detected Obstacles & Collision Proximity Zones
      if (activeLayer.obstacles) {
        simulatedObstacles.forEach(obs => {
          // Threat buffer circle
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, obs.radius * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = obs.threat === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.12)';
          ctx.fill();
          ctx.strokeStyle = obs.threat === 'HIGH' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(245, 158, 11, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Core Obstacle symbol
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
          ctx.fillStyle = obs.threat === 'HIGH' ? '#ef4444' : '#f59e0b';
          ctx.fill();

          // Label
          ctx.fillStyle = '#fecaca';
          ctx.font = '10px monospace';
          ctx.fillText(`${obs.label} (${obs.distanceM}m)`, obs.x - 30, obs.y + obs.radius + 14);
        });
      }

      // Draw Simulated 3D LiDAR Point Cloud Swarm
      if (activeLayer.lidarPoints) {
        ctx.fillStyle = 'rgba(52, 211, 153, 0.6)';
        const timeNow = Date.now() / 1000;
        for (let i = 0; i < 70; i++) {
          const angle = (i / 70) * Math.PI * 2 + timeNow * 0.4;
          const dist = 60 + Math.sin(i * 12 + timeNow) * 45;
          const px = 320 + Math.cos(angle) * dist;
          const py = 240 + Math.sin(angle) * dist;

          ctx.fillRect(px, py, 2, 2);
        }
      }

      // Draw Drone Position Vector & 360° Safety Bubble
      const droneX = 320;
      const droneY = 240;

      if (activeLayer.safetyBubble) {
        // Dynamic Safety Envelope Bubble
        ctx.beginPath();
        ctx.arc(droneX, droneY, 48, 0, Math.PI * 2);
        ctx.strokeStyle = flightState.telemetry.obstacleAvoidance.hazardLevel === 'CRITICAL' 
          ? 'rgba(239, 68, 68, 0.8)' 
          : 'rgba(14, 165, 233, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Internal Repulsive Field Vector Line
        if (flightState.telemetry.obstacleAvoidance.dynamicRerouteActive) {
          ctx.beginPath();
          ctx.moveTo(droneX, droneY);
          ctx.lineTo(droneX + 45, droneY - 40);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Avoidance vector arrowhead
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(droneX + 45, droneY - 40, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Drone Airframe Icon
      ctx.save();
      ctx.translate(droneX, droneY);
      ctx.rotate((flightState.telemetry.headingDeg * Math.PI) / 180);

      // Drone Airframe Body (Quadrapuller Geometry)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      // Front Arms
      ctx.beginPath();
      ctx.moveTo(-16, -16);
      ctx.lineTo(16, 16);
      ctx.moveTo(16, -16);
      ctx.lineTo(-16, 16);
      ctx.stroke();

      // 4 Puller Rotors
      ctx.fillStyle = '#0ea5e9';
      [[-16, -16], [16, -16], [16, 16], [-16, 16]].forEach(([rx, ry]) => {
        ctx.beginPath();
        ctx.arc(rx, ry, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Heading Nose Indicator
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(-4, -10);
      ctx.lineTo(4, -10);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeLayer, waypoints, simulatedObstacles, flightState, surveySettings]);

  const handleComputeSurvey = () => {
    setComputingSurvey(true);
    setTimeout(() => {
      setComputingSurvey(false);
      setGridGenerated(true);
    }, 600);
  };

  return (
    <div className="space-y-4 text-[#e2e2e2]">
      {/* Top Map Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151518] border border-white/5 rounded-xl p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
            Tactical Survey Mapping & 3D Obstacle Avoidance
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-sky-400 border border-white/5 uppercase tracking-widest">
            LiDAR SLAM Active
          </span>
        </div>

        {/* Map Layer Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
          <button
            onClick={() => setActiveLayer(prev => ({ ...prev, lidarPoints: !prev.lidarPoints }))}
            className={`px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider border transition flex items-center gap-1 ${
              activeLayer.lidarPoints 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-white/5 text-white/40 border-white/5 hover:text-white'
            }`}
          >
            {activeLayer.lidarPoints ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            LiDAR Cloud
          </button>

          <button
            onClick={() => setActiveLayer(prev => ({ ...prev, surveyGrid: !prev.surveyGrid }))}
            className={`px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider border transition flex items-center gap-1 ${
              activeLayer.surveyGrid 
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' 
                : 'bg-white/5 text-white/40 border-white/5 hover:text-white'
            }`}
          >
            {activeLayer.surveyGrid ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Survey Grid
          </button>

          <button
            onClick={() => setActiveLayer(prev => ({ ...prev, obstacles: !prev.obstacles }))}
            className={`px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider border transition flex items-center gap-1 ${
              activeLayer.obstacles 
                ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                : 'bg-white/5 text-white/40 border-white/5 hover:text-white'
            }`}
          >
            <AlertOctagon className="w-3 h-3" />
            Obstacles
          </button>

          <button
            onClick={() => setActiveLayer(prev => ({ ...prev, safetyBubble: !prev.safetyBubble }))}
            className={`px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider border transition flex items-center gap-1 ${
              activeLayer.safetyBubble 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-white/5 text-white/40 border-white/5 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            Safety Bubble
          </button>

          <button
            onClick={onTriggerObstacleAvoidance}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-semibold"
            title="Simulate sudden obstacle detection and test autonomous repulsive vector avoidance"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Simulate Hazard
          </button>
        </div>
      </div>

      {/* Main Canvas & Autonomous Grid Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 8 Cols: High-Resolution Canvas Map */}
        <div className="lg:col-span-8 bg-[#151518] border border-white/5 rounded-xl p-3 shadow-lg relative overflow-hidden flex flex-col">
          <div className="relative w-full aspect-[16/10] bg-[#050505] rounded-xl overflow-hidden border border-white/10">
            <canvas 
              ref={canvasRef} 
              width={720} 
              height={450} 
              className="w-full h-full object-contain cursor-crosshair"
            />

            {/* In-Canvas Dynamic Obstacle Avoidance Banner */}
            <div className="absolute top-3 right-3 bg-[#151518]/95 border border-white/10 rounded-xl p-3 max-w-xs font-mono text-xs shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-200 mb-1.5 border-b border-white/5 pb-1">
                <span className="font-semibold text-sky-400">Avoidance Subsystem:</span>
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </div>
              <div className="text-[11px] text-white/80 space-y-0.5">
                <div>Range to nearest hazard: <strong className="text-amber-400">19.8m</strong> (Crane Jib)</div>
                <div>Safety Bubble Envelope: <span className="text-white">8.0m radius</span></div>
                <div>Repulsive Potential: <span className="text-emerald-400 font-bold">Active (+14° Yaw)</span></div>
              </div>
            </div>
          </div>

          {/* Bottom Waypoint Quick Strip */}
          <div className="mt-3 flex items-center justify-between text-xs font-mono border-t border-white/5 pt-2.5">
            <div className="text-white/40">
              Active Path: <strong className="text-[#e2e2e2]">{waypoints.length} Waypoints</strong> • GSD: <strong>1.85 cm/px</strong> • Coverage: <strong>15.1 Ha</strong>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 uppercase tracking-widest">
              RTK Precision: ±1.5cm
            </span>
          </div>
        </div>

        {/* Right 4 Cols: Autonomous Survey Planner & Sensor Parameter Matrix */}
        <div className="lg:col-span-4 space-y-4">
          {/* Autonomous Survey Parameters Card */}
          <div className="bg-[#151518] border border-white/5 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                  Survey Grid Generator
                </h3>
              </div>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Boustrophedon</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* Flight Altitude */}
              <div>
                <div className="flex justify-between text-white/70 mb-1">
                  <span>Flight Altitude (AGL):</span>
                  <strong className="text-sky-400">{surveySettings.flightAltitudeM} meters</strong>
                </div>
                <input 
                  type="range" 
                  min="20" 
                  max="120" 
                  value={surveySettings.flightAltitudeM}
                  onChange={(e) => setSurveySettings({ ...surveySettings, flightAltitudeM: Number(e.target.value) })}
                  className="w-full accent-sky-500"
                />
              </div>

              {/* Overlaps: Forward and Side */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-white/70 mb-1">
                    <span>Forward:</span>
                    <strong className="text-emerald-400">{surveySettings.forwardOverlapPct}%</strong>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="90" 
                    value={surveySettings.forwardOverlapPct}
                    onChange={(e) => setSurveySettings({ ...surveySettings, forwardOverlapPct: Number(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-white/70 mb-1">
                    <span>Side:</span>
                    <strong className="text-emerald-400">{surveySettings.sideOverlapPct}%</strong>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="85" 
                    value={surveySettings.sideOverlapPct}
                    onChange={(e) => setSurveySettings({ ...surveySettings, sideOverlapPct: Number(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>

              {/* Area Size */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-white/40 text-[10px] uppercase tracking-wider block">Width (m):</label>
                  <input 
                    type="number" 
                    value={surveySettings.widthMeters}
                    onChange={(e) => setSurveySettings({ ...surveySettings, widthMeters: Number(e.target.value) })}
                    className="w-full bg-[#0d0d0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-[#e2e2e2] font-mono mt-0.5 focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-white/40 text-[10px] uppercase tracking-wider block">Height (m):</label>
                  <input 
                    type="number" 
                    value={surveySettings.heightMeters}
                    onChange={(e) => setSurveySettings({ ...surveySettings, heightMeters: Number(e.target.value) })}
                    className="w-full bg-[#0d0d0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-[#e2e2e2] font-mono mt-0.5 focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Survey Calculation Summary */}
              <div className="p-3 rounded-xl bg-[#0d0d0f] border border-white/5 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-white/50">
                  <span>Ground Sampling Dist:</span>
                  <span className="text-[#e2e2e2] font-semibold">1.85 cm / pixel</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Est. Survey Distance:</span>
                  <span className="text-[#e2e2e2] font-semibold">3,850 meters</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Est. Flight Duration:</span>
                  <span className="text-emerald-400 font-semibold">14m 20s</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Camera Exposures:</span>
                  <span className="text-sky-300 font-semibold">142 captures</span>
                </div>
              </div>

              {/* Compute Button */}
              <button
                onClick={handleComputeSurvey}
                disabled={computingSurvey}
                className="w-full py-2.5 rounded-lg bg-sky-500 text-black font-bold tracking-wider text-[11px] uppercase transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:bg-sky-400 cursor-pointer"
              >
                {computingSurvey ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    COMPUTING PATH MATRIX...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    RECALCULATE HIGH-PRECISION GRID
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active Waypoints List Card */}
          <div className="bg-[#151518] border border-white/5 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2.5 border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Mission Waypoints
              </h3>
              <span className="text-[10px] font-mono text-sky-400">
                {waypoints.filter(w => w.status === 'COMPLETED').length}/{waypoints.length} DONE
              </span>
            </div>

            <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1 font-mono text-xs">
              {waypoints.map((wp) => (
                <div 
                  key={wp.id}
                  onClick={() => setSelectedWaypoint(wp)}
                  className={`p-2 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                    wp.status === 'ACTIVE'
                      ? 'bg-sky-500/10 border-sky-500/50 text-white'
                      : wp.status === 'COMPLETED'
                      ? 'bg-[#0d0d0f] border-white/5 text-white/40'
                      : 'bg-[#0d0d0f] border-white/5 text-white/70 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      wp.status === 'ACTIVE' ? 'bg-sky-400 animate-ping' : wp.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-white/20'
                    }`} />
                    <strong className="text-[#e2e2e2]">{wp.id}</strong>
                    <span className="text-[10px] text-white/40">{wp.action}</span>
                  </div>
                  <div className="text-[11px] text-right">
                    <span>{wp.altM}m</span>
                    <span className="text-white/40 ml-1">@{wp.speedKmh}km/h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
