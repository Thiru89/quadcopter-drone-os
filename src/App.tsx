import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CockpitTelemetry } from './components/CockpitTelemetry';
import { TacticalSurveyMap } from './components/TacticalSurveyMap';
import { StabilityController } from './components/StabilityController';
import { SensorPlugins } from './components/SensorPlugins';
import { BatteryBmsView } from './components/BatteryBmsView';
import { EncryptedUplink } from './components/EncryptedUplink';
import { MissionLogsPlayback } from './components/MissionLogsPlayback';
import { ApiIntegration } from './components/ApiIntegration';
import { DiagnosticsModal } from './components/DiagnosticsModal';

import { 
  initialFlightState, 
  initialPlugins, 
  initialWaypoints, 
  initialAlerts 
} from './mockData';
import { 
  FlightState, 
  FlightMode, 
  SensorPlugin, 
  MissionWaypoint, 
  MissionLog, 
  ApiKeyRecord, 
  DiagnosticAlert,
  StabilitySystemState
} from './types';

export default function App() {
  const [flightState, setFlightState] = useState<FlightState>(initialFlightState);
  const [plugins, setPlugins] = useState<SensorPlugin[]>(initialPlugins);
  const [waypoints, setWaypoints] = useState<MissionWaypoint[]>(initialWaypoints);
  const [alerts, setAlerts] = useState<DiagnosticAlert[]>(initialAlerts);
  const [missionLogs, setMissionLogs] = useState<MissionLog[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);

  const [activeTab, setActiveTab] = useState<'cockpit' | 'map' | 'stability' | 'plugins' | 'battery' | 'crypto' | 'logs' | 'api'>('cockpit');
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Fetch initial data from server API
  useEffect(() => {
    const fetchServerData = async () => {
      try {
        const [logsRes, keysRes] = await Promise.all([
          fetch('/api/logs').catch(() => null),
          fetch('/api/api-keys').catch(() => null)
        ]);

        if (logsRes && logsRes.ok) {
          const logsData = await logsRes.json();
          setMissionLogs(logsData);
        }

        if (keysRes && keysRes.ok) {
          const keysData = await keysRes.json();
          setApiKeys(keysData);
        }
      } catch (e) {
        console.error('Failed to load server state:', e);
      }
    };

    fetchServerData();
  }, []);

  // Real-time Flight Simulation Loop (ticks every 1.5s to provide lifelike telemetry)
  useEffect(() => {
    const timer = setInterval(() => {
      setFlightState(prev => {
        if (!prev.armed) return prev;

        const jitter = (Math.random() - 0.5) * 0.15;
        const currentAgl = Math.max(10, Math.round((prev.telemetry.altitudeAglM + jitter) * 10) / 10);
        const currentRoll = Math.round((prev.telemetry.rollDeg + (Math.random() - 0.5) * 0.4) * 10) / 10;
        const currentPitch = Math.round((prev.telemetry.pitchDeg + (Math.random() - 0.5) * 0.4) * 10) / 10;

        // Micro battery drain
        const newPct = prev.battery.percentage > 5 ? prev.battery.percentage - 0.01 : prev.battery.percentage;

        // Quadrapuller 4 Rotors RPM dynamics
        const updatedRotors = prev.telemetry.rotors.map((rotor) => {
          const baseRpm = prev.flightMode === 'AUTO_SURVEY' ? 6200 : prev.flightMode === 'POS_HOLD' ? 5800 : 5400;
          const noise = Math.round((Math.random() - 0.5) * 45);
          return {
            ...rotor,
            rpm: baseRpm + noise,
            thrustN: Math.round(((baseRpm + noise) / 128) * 10) / 10
          };
        });

        return {
          ...prev,
          encryption: {
            ...prev.encryption,
            rollingNonce: prev.encryption.rollingNonce + 1
          },
          battery: {
            ...prev.battery,
            percentage: Math.round(newPct * 10) / 10
          },
          telemetry: {
            ...prev.telemetry,
            altitudeAglM: currentAgl,
            rollDeg: currentRoll,
            pitchDeg: currentPitch,
            rotors: updatedRotors
          }
        };
      });
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  const triggerToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3000);
  };

  // Quick Action Handlers
  const handleArmToggle = () => {
    const nextArmed = !flightState.armed;
    setFlightState(prev => ({
      ...prev,
      armed: nextArmed,
      telemetry: {
        ...prev.telemetry,
        rotors: prev.telemetry.rotors.map(r => ({
          ...r,
          rpm: nextArmed ? 6200 : 0,
          thrustN: nextArmed ? 48.5 : 0
        }))
      }
    }));

    const alert: DiagnosticAlert = {
      id: `ALT-${Date.now()}`,
      subsystem: 'FLIGHT_CONTROL',
      severity: nextArmed ? 'SUCCESS' : 'WARNING',
      message: nextArmed ? 'Quadrapuller rotors armed. Automated stability flight loop active.' : 'Quadrapuller rotors disarmed. Propulsion safe cutoff.',
      timestamp: 'Just now'
    };
    setAlerts(prev => [alert, ...prev]);
    triggerToast(nextArmed ? 'PROPULSION ARMED (800Hz STABILITY ACTIVE)' : 'PROPULSION DISARMED');
  };

  const handleEmergencyHover = () => {
    setFlightState(prev => ({
      ...prev,
      flightMode: 'EMERGENCY_HOVER',
      telemetry: {
        ...prev.telemetry,
        groundspeedKmh: 0,
        verticalSpeedMs: 0
      }
    }));
    triggerToast('EMERGENCY AIR-BRAKE HOVER ENGAGED');
  };

  const handleReturnToLaunch = () => {
    setFlightState(prev => ({
      ...prev,
      flightMode: 'RTL',
      telemetry: {
        ...prev.telemetry,
        headingDeg: 270 // Home coordinate direction
      }
    }));
    triggerToast('AUTONOMOUS RETURN-TO-LAUNCH (RTL) INITIATED');
  };

  const handleSetAltitude = (alt: number) => {
    setFlightState(prev => ({
      ...prev,
      telemetry: {
        ...prev.telemetry,
        altitudeAglM: alt
      }
    }));
    triggerToast(`TARGET ALTITUDE SET TO ${alt}m AGL`);
  };

  const handleSetFlightMode = (mode: FlightMode) => {
    setFlightState(prev => ({
      ...prev,
      flightMode: mode
    }));
    triggerToast(`FLIGHT MODE CHANGED TO ${mode}`);
  };

  const handleUpdatePid = (pidUpdates: Partial<StabilitySystemState>) => {
    setFlightState(prev => ({
      ...prev,
      stabilitySystem: {
        ...prev.stabilitySystem,
        ...pidUpdates
      }
    }));
    triggerToast('PID FLIGHT LOOP PARAMETERS COMMITTED');
  };

  const handleTogglePlugin = (pluginId: string) => {
    setPlugins(prev => prev.map(p => {
      if (p.id === pluginId) {
        const nextStatus = p.status === 'ACTIVE' ? 'STANDBY' : 'ACTIVE';
        triggerToast(`${p.name} SET TO ${nextStatus}`);
        return { ...p, status: nextStatus };
      }
      return p;
    }));
  };

  const handleInstallPlugin = (newPlugin: Partial<SensorPlugin>) => {
    const fullPlugin: SensorPlugin = {
      id: `plg-custom-${Date.now()}`,
      name: newPlugin.name || 'Custom Sensor',
      type: newPlugin.type || 'LIDAR',
      version: '1.0.0',
      status: 'ACTIVE',
      samplingRateHz: newPlugin.samplingRateHz || 20,
      bandwidthKbps: 1024,
      powerDrawWatts: newPlugin.powerDrawWatts || 6.5,
      weightGrams: newPlugin.weightGrams || 250,
      interfaceBus: newPluginBus(newPlugin.interfaceBus || 'USB_3'),
      telemetryFields: ['dataStream', 'qualityMetric'],
      encryptionKeyFingerprint: `SHA256:${Math.random().toString(16).substring(2, 6)}:${Math.random().toString(16).substring(2, 6)}`,
      description: newPlugin.description || 'Enterprise custom sensor payload.'
    };

    setPlugins(prev => [...prev, fullPlugin]);
    triggerToast(`MOUNTED DRIVER: ${fullPlugin.name}`);
  };

  function newPluginBus(bus: string): any {
    return bus;
  }

  const handleDispatchCommand = async (command: string, params: Record<string, any>) => {
    // Send to server API
    try {
      const res = await fetch('/api/commands/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, parameters: params })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.updatedFlightState) {
          setFlightState(prev => ({ ...prev, ...data.updatedFlightState }));
        }
      }
    } catch (e) {
      console.warn('Backend command fallback:', e);
    }

    if (command === 'SET_FLIGHT_MODE' && params.mode) {
      setFlightState(prev => ({ ...prev, flightMode: params.mode }));
    } else if (command === 'SET_ALTITUDE' && params.altitude) {
      setFlightState(prev => ({ ...prev, telemetry: { ...prev.telemetry, altitudeAglM: params.altitude } }));
    }

    triggerToast(`ENCRYPTED CMD DISPATCHED: ${command}`);
  };

  const handleGenerateKey = async (name: string, scopes: string[]) => {
    const rawSecret = `qpos_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    const newKey: ApiKeyRecord = {
      id: `key-${Date.now()}`,
      name: name,
      keyPrefix: `${rawSecret.substring(0, 14)}...${rawSecret.substring(rawSecret.length - 4)}`,
      hashedSecret: `sha256_${Math.random().toString(36).substring(2, 18)}`,
      scopes: scopes,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      rateLimitPerMin: 1200,
      status: 'ACTIVE'
    };

    setApiKeys(prev => [...prev, newKey]);
    triggerToast(`ISSUED API TOKEN FOR: ${name}`);
    return { keyRecord: newKey, generatedPlainSecret: rawSecret };
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    triggerToast('API INTEGRATION TOKEN REVOKED');
  };

  const handleTriggerObstacleAvoidance = () => {
    setFlightState(prev => ({
      ...prev,
      telemetry: {
        ...prev.telemetry,
        obstacleAvoidance: {
          ...prev.telemetry.obstacleAvoidance,
          hazardLevel: 'CRITICAL',
          dynamicRerouteActive: true,
          avoidanceManeuver: 'Active Repulsive Vector +14° Evasion'
        }
      }
    }));

    const alert: DiagnosticAlert = {
      id: `ALT-${Date.now()}`,
      subsystem: 'OBSTACLE_AVOIDANCE',
      severity: 'CRITICAL',
      message: 'Close proximity obstacle hazard inside 8.0m safety envelope! Autonomous repulsive evasion vector executed.',
      timestamp: 'Just now'
    };
    setAlerts(prev => [alert, ...prev]);
    triggerToast('CRITICAL: OBSTACLE AVOIDANCE VECTOR ENGAGED');
  };

  const handleAcknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleClearAllAlerts = () => {
    setAlerts([]);
  };

  const handleInjectTestAlert = () => {
    const mockAlerts = [
      { sub: 'BARO_ALT', sev: 'WARNING' as const, msg: 'Barometric pressure delta: cross-referenced with LiDAR AGL (drift < 0.2m)' },
      { sub: 'THERMAL_ESC', sev: 'INFO' as const, msg: 'Motor 2 ESC reached nominal operating temperature (39.1°C)' },
      { sub: 'WIND_SHEAR', sev: 'WARNING' as const, msg: 'Atmospheric gust detected (21.5 km/h). Automated feedforward damping active.' }
    ];
    const picked = mockAlerts[Math.floor(Math.random() * mockAlerts.length)];
    const alert: DiagnosticAlert = {
      id: `ALT-${Date.now()}`,
      subsystem: picked.sub,
      severity: picked.sev,
      message: picked.msg,
      timestamp: 'Just now'
    };
    setAlerts(prev => [alert, ...prev]);
    triggerToast(`DIAGNOSTIC EVENT: ${picked.sub}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e2e2e2] flex flex-col font-sans">
      {/* Operating System Master Header */}
      <Header 
        flightState={flightState}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onArmToggle={handleArmToggle}
        onEmergencyHover={handleEmergencyHover}
        onReturnToLaunch={handleReturnToLaunch}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        unacknowledgedAlertsCount={alerts.length}
      />

      {/* Floating System Toast Notification */}
      {notificationToast && (
        <div className="fixed bottom-14 right-6 z-50 bg-[#151518] border border-white/10 text-sky-400 font-mono text-xs px-4 py-2.5 rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.8)] flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
          {notificationToast}
        </div>
      )}

      {/* Main OS Content Canvas */}
      <main className="flex-1 p-4 max-w-7xl w-full mx-auto">
        {activeTab === 'cockpit' && (
          <CockpitTelemetry 
            flightState={flightState}
            onSetAltitude={handleSetAltitude}
            onSetFlightMode={handleSetFlightMode}
          />
        )}

        {activeTab === 'map' && (
          <TacticalSurveyMap 
            flightState={flightState}
            waypoints={waypoints}
            onAddWaypoint={(wp) => setWaypoints(prev => [...prev, wp])}
            onTriggerObstacleAvoidance={handleTriggerObstacleAvoidance}
          />
        )}

        {activeTab === 'stability' && (
          <StabilityController 
            flightState={flightState}
            onUpdatePid={handleUpdatePid}
          />
        )}

        {activeTab === 'plugins' && (
          <SensorPlugins 
            plugins={plugins}
            onTogglePlugin={handleTogglePlugin}
            onInstallPlugin={handleInstallPlugin}
          />
        )}

        {activeTab === 'battery' && (
          <BatteryBmsView 
            battery={flightState.battery}
            onSimulateDischarge={() => {
              setFlightState(prev => ({
                ...prev,
                battery: {
                  ...prev.battery,
                  percentage: Math.max(5, prev.battery.percentage - 5)
                }
              }));
              triggerToast('SIMULATED RAPID DISCHARGE (-5%)');
            }}
          />
        )}

        {activeTab === 'crypto' && (
          <EncryptedUplink 
            encryption={flightState.encryption}
            onDispatchCommand={handleDispatchCommand}
          />
        )}

        {activeTab === 'logs' && (
          <MissionLogsPlayback 
            logs={missionLogs.length > 0 ? missionLogs : [
              {
                id: 'LOG-DEMO-01',
                missionName: 'Alpine Quarry High-Precision DEM Survey',
                droneModel: 'QuadraPuller XP-8 Heavy Lift',
                serialNumber: 'QP-HL-8821-X',
                timestamp: '2026-09-06T08:15:00Z',
                durationSeconds: 1420,
                status: 'COMPLETED',
                totalDistanceMeters: 4890,
                maxAltitudeMeters: 118.4,
                maxSpeedKmh: 46.2,
                avgPowerWatts: 420.5,
                energyConsumedWh: 165.8,
                sensorPluginsUsed: ['LiDAR-Pulse 64-Beam SLAM', 'FLIR Radiometric Thermal Duo'],
                geofenceViolations: 0,
                obstacleAvoidanceEvents: 3,
                pointsRecorded: 710,
                encryptionProtocol: 'ChaCha20-Poly1305 + Ed25519 Signed',
                summary: 'Autonomous quarry survey with automated crane avoidance maneuver.',
                trajectory: Array.from({ length: 30 }).map((_, i) => ({
                  t: i * 45,
                  lat: 37.7749 + (i * 0.0001),
                  lng: -122.4194 + (i * 0.0001),
                  alt: 20 + i * 3,
                  speed: 35,
                  battery: Math.max(10, 98 - i * 2),
                  roll: 1.5,
                  pitch: -2.0,
                  yaw: 120,
                  m1Rpm: 6200,
                  m2Rpm: 6210,
                  m3Rpm: 6195,
                  m4Rpm: 6205
                }))
              }
            ]}
          />
        )}

        {activeTab === 'api' && (
          <ApiIntegration 
            apiKeys={apiKeys}
            onGenerateKey={handleGenerateKey}
            onRevokeKey={handleRevokeKey}
          />
        )}
      </main>

      {/* Elegant Dark System Status Footer */}
      <footer className="h-10 bg-[#151518] border-t border-white/5 px-6 flex items-center justify-between shrink-0 text-[#e2e2e2]">
        <div className="flex gap-4 items-center">
          <span className="text-[10px] font-mono text-white/40">API ENDPOINT: SECURE-WSS://HUB.QUAD-OPS.CLOUD/LIVE</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
        </div>
        <div className="flex gap-6">
          <span className="text-[10px] text-white/40 uppercase tracking-widest">Uptime: 124:14:02</span>
          <span className="text-[10px] text-white/40 uppercase tracking-widest">Memory: 4.2GB / 16GB</span>
        </div>
      </footer>

      {/* Diagnostics Modal */}
      <DiagnosticsModal 
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        alerts={alerts}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onClearAllAlerts={handleClearAllAlerts}
        onInjectTestAlert={handleInjectTestAlert}
      />
    </div>
  );
}
