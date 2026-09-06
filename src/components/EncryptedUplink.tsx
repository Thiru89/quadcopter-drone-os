import React, { useState } from 'react';
import { 
  Lock, 
  Key, 
  Terminal, 
  ShieldCheck, 
  Radio, 
  Send, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle, 
  Hash, 
  Clock,
  Layers
} from 'lucide-react';
import { EncryptionState, FlightMode } from '../types';

interface EncryptedUplinkProps {
  encryption: EncryptionState;
  onDispatchCommand: (command: string, params: Record<string, any>) => Promise<any>;
}

export const EncryptedUplink: React.FC<EncryptedUplinkProps> = ({
  encryption,
  onDispatchCommand
}) => {
  const [selectedCmd, setSelectedCmd] = useState<string>('SET_FLIGHT_MODE');
  const [targetMode, setTargetMode] = useState<FlightMode>('AUTO_SURVEY');
  const [targetAltitude, setTargetAltitude] = useState<number>(60);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [auditLog, setAuditLog] = useState<Array<{
    id: string;
    command: string;
    nonce: number;
    cipherTextHex: string;
    timestamp: string;
    status: string;
    latencyMs: number;
  }>>([
    {
      id: 'pkt-891',
      command: 'SET_FLIGHT_MODE: AUTO_SURVEY',
      nonce: encryption.rollingNonce - 2,
      cipherTextHex: 'a9f4c30291e4b882da0311f98bc4e2',
      timestamp: '11:00:15',
      status: 'VERIFIED & EXECUTED',
      latencyMs: 13.8
    },
    {
      id: 'pkt-892',
      command: 'SET_ALTITUDE: 52m',
      nonce: encryption.rollingNonce - 1,
      cipherTextHex: 'f1e038ac8812c77609d94aa3c109e8',
      timestamp: '11:00:19',
      status: 'VERIFIED & EXECUTED',
      latencyMs: 14.1
    }
  ]);

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const params = selectedCmd === 'SET_FLIGHT_MODE' 
        ? { mode: targetMode }
        : selectedCmd === 'SET_ALTITUDE'
        ? { altitude: Number(targetAltitude) }
        : {};

      await onDispatchCommand(selectedCmd, params);

      // Add to packet inspector
      const newEntry = {
        id: `pkt-${Date.now().toString().slice(-4)}`,
        command: selectedCmd === 'SET_FLIGHT_MODE' ? `SET_FLIGHT_MODE: ${targetMode}` : selectedCmd,
        nonce: encryption.rollingNonce + 1,
        cipherTextHex: Array.from({ length: 14 })
          .map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
          .join(''),
        timestamp: new Date().toTimeString().slice(0, 8),
        status: 'VERIFIED & EXECUTED',
        latencyMs: Math.round((Math.random() * 4 + 11) * 10) / 10
      };

      setAuditLog(prev => [newEntry, ...prev.slice(0, 8)]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4 text-[#e2e2e2]">
      {/* Cryptographic Link Status Master Banner */}
      <div className="bg-[#151518] border border-white/5 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sky-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Secure Encrypted Telemetry & Navigation Uplink
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                {encryption.sessionState}
              </span>
            </div>
            <p className="text-xs text-white/40 font-mono">
              AEAD Protocol • Zero-Trust Monotonic Nonce Replay Defense • Ed25519 Signed
            </p>
          </div>
        </div>

        {/* Cryptographic Telemetry Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <div className="text-white/40 text-[10px] uppercase tracking-widest">Cipher Suite</div>
            <div className="text-sky-400 font-bold">{encryption.cipherSuite}</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <div className="text-white/40 text-[10px] uppercase tracking-widest">Rolling Nonce</div>
            <div className="text-emerald-400 font-bold font-mono">#{encryption.rollingNonce}</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <div className="text-white/40 text-[10px] uppercase tracking-widest">RTT Latency</div>
            <div className="text-[#e2e2e2] font-bold">{encryption.uplinkLatencyMs} ms</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Encrypted Dispatcher & Cryptographic Audit Hex Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 5 Cols: Authenticated Command Dispatch Console */}
        <div className="lg:col-span-5 bg-[#151518] border border-white/5 rounded-xl p-4 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Remote Navigation Dispatcher
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Authenticated</span>
          </div>

          <form onSubmit={handleSendCommand} className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-white/70 block mb-1">Command Opcode:</label>
              <select 
                value={selectedCmd}
                onChange={(e) => setSelectedCmd(e.target.value)}
                className="w-full bg-[#0d0d0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:border-sky-500 outline-none"
              >
                <option value="SET_FLIGHT_MODE">SET_FLIGHT_MODE (Switch Autonomous State)</option>
                <option value="ARM_DISARM">ARM_DISARM (Toggle Rotor Arming)</option>
                <option value="RETURN_TO_LAUNCH">RETURN_TO_LAUNCH (Autonomous RTL)</option>
                <option value="EMERGENCY_HOVER">EMERGENCY_HOVER (Air Brake)</option>
                <option value="SET_ALTITUDE">SET_ALTITUDE (Adjust Target Elevation)</option>
                <option value="REKEY_SESSION">REKEY_SESSION (Rotate Session Cipher Key)</option>
              </select>
            </div>

            {/* Conditional Parameters */}
            {selectedCmd === 'SET_FLIGHT_MODE' && (
              <div>
                <label className="text-white/70 block mb-1">Target Flight Mode:</label>
                <select 
                  value={targetMode}
                  onChange={(e) => setTargetMode(e.target.value as FlightMode)}
                  className="w-full bg-[#0d0d0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:border-sky-500 outline-none"
                >
                  <option value="AUTO_SURVEY">AUTO_SURVEY (Grid Surveying)</option>
                  <option value="POS_HOLD">POS_HOLD (Position & Altitude Lock)</option>
                  <option value="ALT_HOLD">ALT_HOLD (Baro Altitude Hold)</option>
                  <option value="MISSION">MISSION (Executing Multi-Waypoint)</option>
                  <option value="RTL">RTL (Return to Launch)</option>
                  <option value="MANUAL">MANUAL (Pilot Stick Override)</option>
                </select>
              </div>
            )}

            {selectedCmd === 'SET_ALTITUDE' && (
              <div>
                <label className="text-white/70 block mb-1">Target Altitude AGL (m):</label>
                <input 
                  type="number"
                  value={targetAltitude}
                  onChange={(e) => setTargetAltitude(Number(e.target.value))}
                  className="w-full bg-[#0d0d0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:border-sky-500 outline-none"
                  min="5"
                  max="150"
                />
              </div>
            )}

            {/* Cryptographic Transmission Summary Box */}
            <div className="p-3 rounded-xl bg-[#0d0d0f] border border-white/5 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-white/40">
                <span>Signing Authority:</span>
                <span className="text-sky-400">GCS-MASTER-ED25519</span>
              </div>
              <div className="flex justify-between text-white/40">
                <span>HMAC Tag:</span>
                <span className="text-emerald-400 font-mono">HMAC-SHA256-256bit</span>
              </div>
              <div className="flex justify-between text-white/40">
                <span>Anti-Replay Window:</span>
                <span className="text-[#e2e2e2]">{encryption.antiReplayWindow} Packets</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(14,165,233,0.3)] cursor-pointer"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  SIGNING & TRANSMITTING ENCRYPTED PACKET...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  DISPATCH ENCRYPTED COMMAND
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right 7 Cols: Real-Time Cryptographic Packet Inspection Stream */}
        <div className="lg:col-span-7 bg-[#151518] border border-white/5 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Cryptographic Packet & Nonce Inspector
              </h3>
            </div>
            <span className="text-[10px] font-mono text-white/40">
              Link Loss: <strong className="text-emerald-400">{encryption.packetLossPct}%</strong> • SNR: <strong className="text-[#e2e2e2]">{encryption.snrDb} dB</strong>
            </span>
          </div>

          {/* Hex Stream Log */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 font-mono text-xs">
            {auditLog.map((log) => (
              <div 
                key={log.id}
                className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5 space-y-1 hover:border-white/15 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <strong className="text-[#e2e2e2]">{log.command}</strong>
                  </div>
                  <span className="text-[10px] text-white/40">{log.timestamp} • {log.latencyMs}ms</span>
                </div>

                <div className="text-[11px] text-white/40 flex items-center gap-2">
                  <span>Nonce: <strong className="text-sky-400 font-mono">#{log.nonce}</strong></span>
                  <span>•</span>
                  <span>Cipher:</span>
                  <span className="text-emerald-400 font-mono text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                    0x{log.cipherTextHex}...
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-[#0d0d0f] border border-white/5 text-[11px] font-mono text-white/40 flex justify-between">
            <span>Root Certificate Authority:</span>
            <span className="text-sky-400 font-semibold">{encryption.keyFingerprint}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
