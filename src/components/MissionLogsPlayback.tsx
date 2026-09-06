import React, { useState, useEffect } from 'react';
import { 
  History, 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Download, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Compass, 
  Battery, 
  Activity,
  FileText
} from 'lucide-react';
import { MissionLog } from '../types';

interface MissionLogsPlaybackProps {
  logs: MissionLog[];
}

export const MissionLogsPlayback: React.FC<MissionLogsPlaybackProps> = ({ logs }) => {
  const [selectedLogId, setSelectedLogId] = useState<string>(logs[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const activeLog = logs.find(l => l.id === selectedLogId) || logs[0];
  const trajectory = activeLog?.trajectory || [];

  // Playback timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && trajectory.length > 0) {
      interval = setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev >= trajectory.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 500 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, trajectory, playbackSpeed]);

  const currentFrame = trajectory[playbackIndex] || trajectory[0];

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeLog, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeLog.id}_telemetry_flight_log.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,TimeSec,Lat,Lng,AltM,SpeedKmh,BatteryPct,RollDeg,PitchDeg,YawDeg,M1Rpm,M2Rpm,M3Rpm,M4Rpm\n";
    trajectory.forEach(pt => {
      csvContent += `${pt.t},${pt.lat},${pt.lng},${pt.alt},${pt.speed},${pt.battery},${pt.roll},${pt.pitch},${pt.yaw},${pt.m1Rpm},${pt.m2Rpm},${pt.m3Rpm},${pt.m4Rpm}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeLog.id}_flight_telemetry.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-4 text-[#e2e2e2]">
      {/* Header Banner */}
      <div className="bg-[#151518] border border-white/5 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sky-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Cloud Mission Log Repository & Playback Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-sky-400 border border-white/5 uppercase tracking-widest">
                50Hz Replay
              </span>
            </div>
            <p className="text-xs text-white/40 font-mono">
              Enterprise UAV Black-Box Telemetry • Incident Forensic Review • Sensor Trace Playback
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition flex items-center gap-1.5 uppercase text-[11px] font-semibold tracking-wider cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-[11px] uppercase tracking-wider transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(14,165,233,0.3)] cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            EXPORT GEOJSON / LOG
          </button>
        </div>
      </div>

      {/* Main Grid: Mission Selector & Playback HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 4 Cols: Stored Cloud Mission Logs */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-mono text-white/40 px-1">
            Archived Missions ({logs.length})
          </div>

          {logs.map((log) => {
            const isSelected = selectedLogId === log.id;

            return (
              <div
                key={log.id}
                onClick={() => {
                  setSelectedLogId(log.id);
                  setPlaybackIndex(0);
                  setIsPlaying(false);
                }}
                className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2 ${
                  isSelected 
                    ? 'bg-[#19191d] border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.1)]' 
                    : 'bg-[#151518] border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-sm text-[#e2e2e2]">
                    {log.missionName}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                    {log.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-white/40">
                  <div>Duration: <strong className="text-[#e2e2e2]">{Math.floor(log.durationSeconds / 60)}m {log.durationSeconds % 60}s</strong></div>
                  <div>Distance: <strong className="text-[#e2e2e2]">{(log.totalDistanceMeters / 1000).toFixed(1)} km</strong></div>
                  <div>Max Alt: <strong className="text-sky-400">{log.maxAltitudeMeters}m</strong></div>
                  <div>Max Speed: <strong className="text-emerald-400">{log.maxSpeedKmh} km/h</strong></div>
                </div>

                <div className="text-[10px] font-mono text-white/40 border-t border-white/5 pt-1.5 flex items-center justify-between">
                  <span>Logged: {new Date(log.timestamp).toLocaleDateString()}</span>
                  <span className="text-amber-400">{log.obstacleAvoidanceEvents} Obstacle Events</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 8 Cols: Interactive Playback Scrubber & Replay Visualizer */}
        <div className="lg:col-span-8 bg-[#151518] border border-white/5 rounded-xl p-4 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                {activeLog?.missionName}
              </h3>
              <p className="text-xs text-white/40 font-mono">
                Platform: {activeLog?.droneModel} • S/N: {activeLog?.serialNumber} • Cipher: {activeLog?.encryptionProtocol}
              </p>
            </div>
            <span className="text-xs font-mono text-sky-400">
              FRAME {playbackIndex + 1} / {trajectory.length}
            </span>
          </div>

          {/* Replay Scrubber Controls */}
          <div className="p-3 bg-[#0d0d0f] rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center gap-3 font-mono text-xs">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold transition flex items-center gap-1 shadow-[0_0_15px_rgba(14,165,233,0.3)] cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-black" />}
              </button>

              <button
                onClick={() => setPlaybackIndex(0)}
                className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/60 hover:text-white cursor-pointer"
                title="Restart playback from frame 0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Playback speed selector */}
              <div className="flex items-center gap-1 text-white/40">
                <span>Speed:</span>
                {[1, 2, 5, 10].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-2 py-0.5 rounded-md text-xs transition cursor-pointer ${
                      playbackSpeed === speed
                        ? 'bg-sky-500 text-black font-bold'
                        : 'bg-white/5 text-white/40 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              <div className="ml-auto text-[#e2e2e2] font-semibold">
                T+ {currentFrame ? Math.floor(currentFrame.t / 60) : 0}m {currentFrame ? currentFrame.t % 60 : 0}s
              </div>
            </div>

            {/* Slider Scrubber */}
            <input 
              type="range"
              min="0"
              max={Math.max(0, trajectory.length - 1)}
              value={playbackIndex}
              onChange={(e) => {
                setPlaybackIndex(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Current Frame Replay Telemetry Matrix */}
          {currentFrame && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5">
                <span className="text-[10px] text-white/40 uppercase tracking-wider block">Replay Altitude:</span>
                <strong className="text-sky-400 text-base">{currentFrame.alt.toFixed(1)} m</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5">
                <span className="text-[10px] text-white/40 uppercase tracking-wider block">Replay Groundspeed:</span>
                <strong className="text-emerald-400 text-base">{currentFrame.speed.toFixed(1)} km/h</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5">
                <span className="text-[10px] text-white/40 uppercase tracking-wider block">Battery Level:</span>
                <strong className="text-amber-400 text-base">{currentFrame.battery}%</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5">
                <span className="text-[10px] text-white/40 uppercase tracking-wider block">Attitude (R / P):</span>
                <span className="text-[#e2e2e2] text-base font-bold">
                  {currentFrame.roll.toFixed(1)}° / {currentFrame.pitch.toFixed(1)}°
                </span>
              </div>
            </div>
          )}

          {/* Quadrapuller Rotors RPM Replay at this frame */}
          {currentFrame && (
            <div className="p-3 bg-[#0d0d0f] rounded-xl border border-white/5 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-white/40 text-[11px]">
                <span>Quadrapuller Rotor Thrust Outputs at Frame:</span>
                <span className="text-sky-400">Synchronized 4-Rotor Log</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-[#151518] border border-white/5">
                  <span className="text-[9px] text-white/40 block">M1 FL</span>
                  <strong className="text-[#e2e2e2]">{currentFrame.m1Rpm} RPM</strong>
                </div>
                <div className="p-2 rounded-lg bg-[#151518] border border-white/5">
                  <span className="text-[9px] text-white/40 block">M2 FR</span>
                  <strong className="text-[#e2e2e2]">{currentFrame.m2Rpm} RPM</strong>
                </div>
                <div className="p-2 rounded-lg bg-[#151518] border border-white/5">
                  <span className="text-[9px] text-white/40 block">M3 RR</span>
                  <strong className="text-[#e2e2e2]">{currentFrame.m3Rpm} RPM</strong>
                </div>
                <div className="p-2 rounded-lg bg-[#151518] border border-white/5">
                  <span className="text-[9px] text-white/40 block">M4 RL</span>
                  <strong className="text-[#e2e2e2]">{currentFrame.m4Rpm} RPM</strong>
                </div>
              </div>
            </div>
          )}

          {/* Mission Incident & Forensic Events */}
          <div className="p-3 rounded-xl bg-[#0d0d0f] border border-white/5 font-mono text-xs space-y-1">
            <span className="text-white/40 text-[11px] block">Flight Summary & Forensic Record:</span>
            <p className="text-white/70 text-xs leading-relaxed">
              {activeLog?.summary}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
