import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory data store for server-side persistence
interface MissionLog {
  id: string;
  missionName: string;
  droneModel: string;
  serialNumber: string;
  timestamp: string;
  durationSeconds: number;
  status: 'COMPLETED' | 'ABORTED' | 'ACTIVE';
  totalDistanceMeters: number;
  maxAltitudeMeters: number;
  maxSpeedKmh: number;
  avgPowerWatts: number;
  energyConsumedWh: number;
  sensorPluginsUsed: string[];
  geofenceViolations: number;
  obstacleAvoidanceEvents: number;
  pointsRecorded: number;
  encryptionProtocol: string;
  summary: string;
  trajectory: Array<{
    t: number;
    lat: number;
    lng: number;
    alt: number;
    speed: number;
    battery: number;
    roll: number;
    pitch: number;
    yaw: number;
    m1Rpm: number;
    m2Rpm: number;
    m3Rpm: number;
    m4Rpm: number;
    events?: string[];
  }>;
}

interface SensorPlugin {
  id: string;
  name: string;
  type: 'LIDAR' | 'THERMAL' | 'MULTISPECTRAL' | 'RADAR' | 'GAS_SNIFFER' | 'MAGNETOMETER';
  version: string;
  status: 'ACTIVE' | 'STANDBY' | 'FAULT' | 'UNMOUNTED';
  samplingRateHz: number;
  bandwidthKbps: number;
  powerDrawWatts: number;
  weightGrams: number;
  interfaceBus: 'SPI_0' | 'CAN_1' | 'USB_3' | 'ETHERNET_MII' | 'I2C_2';
  telemetryFields: string[];
  encryptionKeyFingerprint: string;
  description: string;
}

interface ApiKeyRecord {
  id: string;
  name: string;
  keyPrefix: string;
  hashedSecret: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
  rateLimitPerMin: number;
  status: 'ACTIVE' | 'REVOKED';
}

// Initial Sensor Plugins
const initialPlugins: SensorPlugin[] = [
  {
    id: 'plg-lidar-v64',
    name: 'LiDAR-Pulse 64-Beam SLAM',
    type: 'LIDAR',
    version: '3.4.1',
    status: 'ACTIVE',
    samplingRateHz: 20,
    bandwidthKbps: 4200,
    powerDrawWatts: 18.5,
    weightGrams: 480,
    interfaceBus: 'ETHERNET_MII',
    telemetryFields: ['pointCloudCount', 'reflectanceAvg', 'groundElevationM', 'obstacleDistanceMin'],
    encryptionKeyFingerprint: 'SHA256:8f4c:12a9:b4e2:9910',
    description: 'High-density multi-return 3D laser scanner with real-time SLAM odometry and obstacle perimeter mapping.'
  },
  {
    id: 'plg-thermal-radiometric',
    name: 'FLIR Radiometric Thermal Duo',
    type: 'THERMAL',
    version: '2.1.0',
    status: 'ACTIVE',
    samplingRateHz: 10,
    bandwidthKbps: 1850,
    powerDrawWatts: 7.2,
    weightGrams: 220,
    interfaceBus: 'USB_3',
    telemetryFields: ['spotTempMinC', 'spotTempMaxC', 'thermalDelta', 'isothermalAlert'],
    encryptionKeyFingerprint: 'SHA256:7d2a:e994:c103:fa33',
    description: 'Calibrated radiometric infrared sensor for solar panel, high-voltage line, and thermal leak inspection.'
  },
  {
    id: 'plg-multispec-ag',
    name: 'SpectraScan 5-Band Multispectral',
    type: 'MULTISPECTRAL',
    version: '1.9.4',
    status: 'STANDBY',
    samplingRateHz: 5,
    bandwidthKbps: 1200,
    powerDrawWatts: 5.8,
    weightGrams: 310,
    interfaceBus: 'USB_3',
    telemetryFields: ['ndviIndex', 'chlorophyllAbsorption', 'redEdgeReflectance'],
    encryptionKeyFingerprint: 'SHA256:5b1c:9981:ef73:aa20',
    description: 'Narrow-band RGB + RedEdge + Near-IR sensor array for autonomous precision agriculture and forestry biomass.'
  },
  {
    id: 'plg-radar-mmwave',
    name: 'AeroShield 77GHz mmWave Radar Array',
    type: 'RADAR',
    version: '4.0.2',
    status: 'ACTIVE',
    samplingRateHz: 50,
    bandwidthKbps: 640,
    powerDrawWatts: 4.5,
    weightGrams: 140,
    interfaceBus: 'CAN_1',
    telemetryFields: ['targetVelocities', 'azimuthAngle', 'radarRCS', 'nearFieldPenetration'],
    encryptionKeyFingerprint: 'SHA256:3a99:41cd:88ee:1901',
    description: 'All-weather 360-degree radar sensor resistant to heavy dust, dense fog, and direct solar glare.'
  },
  {
    id: 'plg-gas-sniffer',
    name: 'AeroSniff Multi-VOC Environmental Probe',
    type: 'GAS_SNIFFER',
    version: '1.2.0',
    status: 'STANDBY',
    samplingRateHz: 2,
    bandwidthKbps: 64,
    powerDrawWatts: 3.2,
    weightGrams: 95,
    interfaceBus: 'I2C_2',
    telemetryFields: ['ch4MethanePpm', 'co2Ppm', 'vocIndex', 'pm25Density'],
    encryptionKeyFingerprint: 'SHA256:99e1:bc34:281f:51cc',
    description: 'Micro-electrochemical gas chamber for industrial pipeline leak detection and hazardous site safety scouting.'
  },
  {
    id: 'plg-magneto-boom',
    name: 'FluxGate Subsurface Magnetometer',
    type: 'MAGNETOMETER',
    version: '2.0.1',
    status: 'STANDBY',
    samplingRateHz: 100,
    bandwidthKbps: 320,
    powerDrawWatts: 2.9,
    weightGrams: 180,
    interfaceBus: 'SPI_0',
    telemetryFields: ['totalMagneticFieldnT', 'gradientDeltaX', 'anomalyConfidence'],
    encryptionKeyFingerprint: 'SHA256:44fe:10ab:9872:dd02',
    description: 'Ultra-sensitive triaxial magnetic fluxgate boom for surveying buried pipelines and geological magnetic anomalies.'
  }
];

// In-memory repositories
let sensorPlugins: SensorPlugin[] = [...initialPlugins];

// Pre-seeded mission logs
const sampleMissionLogs: MissionLog[] = [
  {
    id: 'LOG-2026-0906-01',
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
    sensorPluginsUsed: ['LiDAR-Pulse 64-Beam SLAM', 'FLIR Radiometric Thermal Duo', 'AeroShield 77GHz mmWave Radar Array'],
    geofenceViolations: 0,
    obstacleAvoidanceEvents: 3,
    pointsRecorded: 710,
    encryptionProtocol: 'ChaCha20-Poly1305 + Ed25519 Signed',
    summary: 'Autonomous 3D photogrammetry and point-cloud scan of North-East quarry wall. Automated dynamic obstacle avoidance averted collision with mobile crane jib at waypoint 7.',
    trajectory: Array.from({ length: 40 }).map((_, i) => {
      const progress = i / 39;
      return {
        t: Math.round(progress * 1420),
        lat: 37.7749 + Math.sin(progress * Math.PI * 2) * 0.0035,
        lng: -122.4194 + (progress - 0.5) * 0.005,
        alt: 15 + Math.sin(progress * Math.PI) * 103,
        speed: 25 + Math.sin(progress * 10) * 15,
        battery: Math.max(12, Math.round(98 - progress * 74)),
        roll: Math.sin(progress * 8) * 3.5,
        pitch: Math.cos(progress * 6) * 4.2,
        yaw: (progress * 360) % 360,
        m1Rpm: Math.round(6200 + Math.sin(i) * 180),
        m2Rpm: Math.round(6220 - Math.sin(i) * 160),
        m3Rpm: Math.round(6190 + Math.cos(i) * 190),
        m4Rpm: Math.round(6210 - Math.cos(i) * 170),
        events: i === 14 ? ['Obstacle detected: Crane boom at 18.2m', 'Initiated Repulsive Vector Trajectory'] : undefined
      };
    })
  },
  {
    id: 'LOG-2026-0905-04',
    missionName: 'Solar Array Thermal Defect Inspection',
    droneModel: 'QuadraPuller XP-8 Heavy Lift',
    serialNumber: 'QP-HL-8821-X',
    timestamp: '2026-09-05T14:30:00Z',
    durationSeconds: 1180,
    status: 'COMPLETED',
    totalDistanceMeters: 3620,
    maxAltitudeMeters: 45.0,
    maxSpeedKmh: 28.0,
    avgPowerWatts: 380.2,
    energyConsumedWh: 124.6,
    sensorPluginsUsed: ['FLIR Radiometric Thermal Duo', 'LiDAR-Pulse 64-Beam SLAM'],
    geofenceViolations: 0,
    obstacleAvoidanceEvents: 1,
    pointsRecorded: 590,
    encryptionProtocol: 'AES-256-GCM + RSA-4096 Key Exchange',
    summary: 'Autonomous lawnmower grid pattern over 40-megawatt solar plant. Detected 14 thermal hot-spots with localized micro-cracks in inverter junction zones.',
    trajectory: Array.from({ length: 30 }).map((_, i) => {
      const progress = i / 29;
      return {
        t: Math.round(progress * 1180),
        lat: 37.772 + Math.floor(i / 5) * 0.0008,
        lng: -122.415 + (i % 5) * 0.001,
        alt: 40 + Math.sin(i) * 2,
        speed: 28,
        battery: Math.max(18, Math.round(96 - progress * 68)),
        roll: 1.2,
        pitch: 2.1,
        yaw: (i % 2 === 0 ? 90 : 270),
        m1Rpm: 5800,
        m2Rpm: 5810,
        m3Rpm: 5790,
        m4Rpm: 5805
      };
    })
  },
  {
    id: 'LOG-2026-0904-02',
    missionName: 'Offshore Wind Turbine Blade Mapping',
    droneModel: 'QuadraPuller XP-8 Heavy Lift',
    serialNumber: 'QP-HL-8821-X',
    timestamp: '2026-09-04T10:00:00Z',
    durationSeconds: 1650,
    status: 'COMPLETED',
    totalDistanceMeters: 5210,
    maxAltitudeMeters: 145.0,
    maxSpeedKmh: 42.5,
    avgPowerWatts: 495.0,
    energyConsumedWh: 226.8,
    sensorPluginsUsed: ['LiDAR-Pulse 64-Beam SLAM', 'AeroShield 77GHz mmWave Radar Array'],
    geofenceViolations: 0,
    obstacleAvoidanceEvents: 6,
    pointsRecorded: 825,
    encryptionProtocol: 'ChaCha20-Poly1305 + Ed25519 Signed',
    summary: 'High-wind autonomous vertical spiral climb scanning three 80m turbine blades. Active wind gust stabilization maintained <4cm hover accuracy in 18kt shear winds.',
    trajectory: Array.from({ length: 35 }).map((_, i) => {
      const progress = i / 34;
      return {
        t: Math.round(progress * 1650),
        lat: 37.780 + Math.sin(progress * 12) * 0.001,
        lng: -122.410 + Math.cos(progress * 12) * 0.001,
        alt: 20 + progress * 125,
        speed: 18 + Math.cos(i) * 8,
        battery: Math.max(15, Math.round(99 - progress * 80)),
        roll: Math.sin(i * 3) * 5.2,
        pitch: Math.cos(i * 3) * 4.8,
        yaw: (i * 25) % 360,
        m1Rpm: Math.round(6500 + Math.sin(i) * 350),
        m2Rpm: Math.round(6450 - Math.sin(i) * 320),
        m3Rpm: Math.round(6520 + Math.cos(i) * 340),
        m4Rpm: Math.round(6480 - Math.cos(i) * 330)
      };
    })
  }
];

let missionLogs: MissionLog[] = [...sampleMissionLogs];

let apiKeys: ApiKeyRecord[] = [
  {
    id: 'key-ent-prod-01',
    name: 'Enterprise GIS Fleet Sync',
    keyPrefix: 'qpos_live_9f8c...3b1a',
    hashedSecret: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    scopes: ['telemetry:read', 'telemetry:stream', 'logs:export', 'survey:read'],
    createdAt: '2026-08-15T09:00:00Z',
    lastUsedAt: '2026-09-06T10:45:12Z',
    rateLimitPerMin: 1200,
    status: 'ACTIVE'
  },
  {
    id: 'key-gcs-cmd-02',
    name: 'GCS Encrypted Navigation Dispatcher',
    keyPrefix: 'qpos_cmd_7a22...99ee',
    hashedSecret: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    scopes: ['telemetry:read', 'commands:write', 'plugins:manage', 'stability:configure'],
    createdAt: '2026-08-20T11:30:00Z',
    lastUsedAt: '2026-09-06T10:59:44Z',
    rateLimitPerMin: 600,
    status: 'ACTIVE'
  }
];

// Real-time Flight Controller dynamic state for Quadrapuller
let flightState = {
  armed: true,
  flightMode: 'AUTO_SURVEY', // 'AUTO_SURVEY' | 'POS_HOLD' | 'ALT_HOLD' | 'MISSION' | 'RTL' | 'MANUAL' | 'EMERGENCY_HOVER'
  stabilitySystem: {
    loopRateHz: 800,
    pidRoll: { p: 1.45, i: 0.08, d: 0.32 },
    pidPitch: { p: 1.48, i: 0.08, d: 0.31 },
    pidYaw: { p: 2.10, i: 0.12, d: 0.15 },
    pidAltitude: { p: 2.40, i: 0.25, d: 0.40 },
    windCompensatorActive: true,
    gustRejectionDamping: 0.94,
    vibrationDecouplerDb: -28.5,
    activeStabilityIndex: 99.4, // percentage
    motorTiltCompensationDeg: 1.8
  },
  encryption: {
    cipherSuite: 'ChaCha20-Poly1305-AEAD',
    keyExchange: 'X25519-ECDH',
    macAlgorithm: 'HMAC-SHA256',
    rollingNonce: 1849204,
    packetLossPct: 0.02,
    uplinkLatencyMs: 14.2,
    downlinkLatencyMs: 11.8,
    antiReplayWindow: 64,
    sessionState: 'SECURE_SYNCHRONIZED'
  },
  battery: {
    cellConfiguration: '12S2P High-Discharge Solid-State LiPo',
    nominalCapacityMah: 32000,
    remainingMah: 24960,
    percentage: 78,
    voltageTotal: 49.8,
    cellsVoltage: [4.15, 4.16, 4.14, 4.15, 4.15, 4.14, 4.16, 4.15, 4.15, 4.14, 4.15, 4.16],
    currentDrawAmps: 18.6,
    powerConsumptionWatts: 926.28,
    internalResistanceMilliOhms: 1.15,
    temperatureCelsius: 32.4,
    healthCycles: 42,
    healthCapacityPct: 98.2,
    predictiveTimeRemainingSec: 1640,
    predictedRtlMarginSec: 680,
    pointOfNoReturnPassed: false,
    smartWarning: 'NOMINAL - Ample margin for autonomous return'
  },
  telemetry: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitudeMslM: 148.2,
    altitudeAglM: 52.6, // Above ground level from LiDAR
    groundspeedKmh: 34.8,
    verticalSpeedMs: 0.12,
    rollDeg: 2.1,
    pitchDeg: -3.4,
    yawDeg: 124.5,
    headingDeg: 125,
    windVector: { speedKmh: 14.2, directionDeg: 240, gustPeakKmh: 21.5 },
    gnss: {
      fixType: 'RTK_FIXED',
      satellitesVisible: 31,
      satellitesTracked: 27,
      hdop: 0.58,
      vdop: 0.72,
      rtkAgeSec: 0.2
    },
    // Quadrapuller 4 Rotors: M1 (Front-Left), M2 (Front-Right), M3 (Rear-Right), M4 (Rear-Left)
    rotors: [
      { id: 'M1_FL', rpm: 6180, escTempC: 38.2, currentA: 4.6, thrustN: 48.2, vibrationG: 0.08 },
      { id: 'M2_FR', rpm: 6210, escTempC: 39.1, currentA: 4.7, thrustN: 48.8, vibrationG: 0.09 },
      { id: 'M3_RR', rpm: 6195, escTempC: 38.8, currentA: 4.6, thrustN: 48.5, vibrationG: 0.07 },
      { id: 'M4_RL', rpm: 6185, escTempC: 37.9, currentA: 4.6, thrustN: 48.3, vibrationG: 0.08 }
    ],
    obstacleAvoidance: {
      radarFrontRangeM: 42.5,
      lidarClosestObstacleM: 19.8,
      safetyBubbleRadiusM: 8.0,
      activeAvoidanceVectors: [],
      hazardLevel: 'CLEAR' // 'CLEAR' | 'CAUTION' | 'CRITICAL'
    }
  }
};

// ==================== API ROUTES ====================

app.get('/api/health', (req, res) => {
  res.json({
    system: 'QuadraPuller-OS',
    version: '4.8.2-Enterprise',
    kernel: 'RT-Preempt-UAV-6.6.14-qpos',
    timestamp: new Date().toISOString(),
    status: 'OPTIMAL'
  });
});

app.get('/api/system/status', (req, res) => {
  res.json({
    flightState,
    plugins: sensorPlugins,
    activeAlerts: [
      { id: 'alt-01', level: 'INFO', message: 'RTK Carrier Phase Fixed solution active (27 sats)', timestamp: new Date().toISOString() },
      { id: 'alt-02', level: 'SUCCESS', message: 'ChaCha20-Poly1305 encrypted telemetry channel verified', timestamp: new Date().toISOString() }
    ]
  });
});

app.get('/api/telemetry/live', (req, res) => {
  // Add subtle realistic micro-fluctuation
  const jitter = (Math.random() - 0.5) * 0.05;
  flightState.telemetry.altitudeAglM = Math.max(10, Math.round((flightState.telemetry.altitudeAglM + jitter) * 100) / 100);
  flightState.telemetry.rotors.forEach(r => {
    r.rpm = Math.round(6200 + (Math.random() - 0.5) * 60);
  });
  flightState.encryption.rollingNonce += 1;
  res.json(flightState);
});

// Secure encrypted command dispatch
app.post('/api/commands/dispatch', (req, res) => {
  const { command, parameters, signature, token } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Command payload required' });
  }

  // Simulated cryptographic verification
  const receivedNonce = flightState.encryption.rollingNonce + 1;
  flightState.encryption.rollingNonce = receivedNonce;

  const executionLog = {
    command,
    timestamp: new Date().toISOString(),
    verifiedWithKey: 'Ed25519-GCS-ALPHA',
    nonce: receivedNonce,
    latencyMs: Math.round((Math.random() * 5 + 10) * 10) / 10
  };

  switch (command) {
    case 'SET_FLIGHT_MODE':
      if (parameters?.mode) {
        flightState.flightMode = parameters.mode;
      }
      break;
    case 'ARM_DISARM':
      flightState.armed = !flightState.armed;
      break;
    case 'RETURN_TO_LAUNCH':
      flightState.flightMode = 'RTL';
      break;
    case 'EMERGENCY_HOVER':
      flightState.flightMode = 'POS_HOLD';
      flightState.telemetry.groundspeedKmh = 0;
      break;
    case 'UPDATE_PID':
      if (parameters?.pid) {
        flightState.stabilitySystem = {
          ...flightState.stabilitySystem,
          ...parameters.pid
        };
      }
      break;
    case 'SET_ALTITUDE':
      if (parameters?.altitude) {
        flightState.telemetry.altitudeAglM = parameters.altitude;
      }
      break;
    case 'TRIGGER_OBSTACLE_AVOIDANCE':
      flightState.telemetry.obstacleAvoidance.hazardLevel = parameters?.hazardLevel || 'CAUTION';
      break;
  }

  res.json({
    status: 'COMMAND_ACKNOWLEDGED_AND_EXECUTED',
    executionLog,
    updatedFlightState: flightState
  });
});

// Sensor Plugins
app.get('/api/plugins', (req, res) => {
  res.json(sensorPlugins);
});

app.post('/api/plugins/:id/toggle', (req, res) => {
  const plugin = sensorPlugins.find(p => p.id === req.params.id);
  if (!plugin) {
    return res.status(404).json({ error: 'Plugin not found' });
  }
  plugin.status = plugin.status === 'ACTIVE' ? 'STANDBY' : 'ACTIVE';
  res.json(plugin);
});

app.post('/api/plugins/install', (req, res) => {
  const newPlugin: SensorPlugin = {
    id: `plg-custom-${Date.now()}`,
    name: req.body.name || 'Custom Sensor Module',
    type: req.body.type || 'LIDAR',
    version: req.body.version || '1.0.0',
    status: 'ACTIVE',
    samplingRateHz: Number(req.body.samplingRateHz) || 20,
    bandwidthKbps: Number(req.body.bandwidthKbps) || 1024,
    powerDrawWatts: Number(req.body.powerDrawWatts) || 6.5,
    weightGrams: Number(req.body.weightGrams) || 250,
    interfaceBus: req.body.interfaceBus || 'USB_3',
    telemetryFields: req.body.telemetryFields || ['status', 'sampleValue'],
    encryptionKeyFingerprint: `SHA256:${Math.random().toString(16).substring(2, 6)}:${Math.random().toString(16).substring(2, 6)}`,
    description: req.body.description || 'Enterprise user-configured payload sensor driver.'
  };
  sensorPlugins.push(newPlugin);
  res.status(201).json(newPlugin);
});

// Cloud-based Mission Log Repository
app.get('/api/logs', (req, res) => {
  res.json(missionLogs);
});

app.get('/api/logs/:id', (req, res) => {
  const log = missionLogs.find(l => l.id === req.params.id);
  if (!log) {
    return res.status(404).json({ error: 'Mission log not found' });
  }
  res.json(log);
});

app.post('/api/logs/record', (req, res) => {
  const newLog: MissionLog = {
    id: `LOG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${(missionLogs.length + 1).toString().padStart(2, '0')}`,
    missionName: req.body.missionName || 'Autonomous Survey Flight',
    droneModel: 'QuadraPuller XP-8 Heavy Lift',
    serialNumber: 'QP-HL-8821-X',
    timestamp: new Date().toISOString(),
    durationSeconds: req.body.durationSeconds || 960,
    status: req.body.status || 'COMPLETED',
    totalDistanceMeters: req.body.totalDistanceMeters || 3200,
    maxAltitudeMeters: req.body.maxAltitudeMeters || 85.0,
    maxSpeedKmh: req.body.maxSpeedKmh || 38.0,
    avgPowerWatts: req.body.avgPowerWatts || 410.0,
    energyConsumedWh: req.body.energyConsumedWh || 112.5,
    sensorPluginsUsed: sensorPlugins.filter(p => p.status === 'ACTIVE').map(p => p.name),
    geofenceViolations: 0,
    obstacleAvoidanceEvents: req.body.obstacleAvoidanceEvents || 1,
    pointsRecorded: 480,
    encryptionProtocol: 'ChaCha20-Poly1305 + Ed25519 Signed',
    summary: req.body.summary || 'Recorded mission log from live flight operating system session.',
    trajectory: req.body.trajectory || sampleMissionLogs[0].trajectory
  };
  missionLogs.unshift(newLog);
  res.status(201).json(newLog);
});

// API Key Management for External Data Integration
app.get('/api/api-keys', (req, res) => {
  res.json(apiKeys);
});

app.post('/api/api-keys/generate', (req, res) => {
  const { name, scopes } = req.body;
  const rawSecret = `qpos_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
  const newKey: ApiKeyRecord = {
    id: `key-${Date.now()}`,
    name: name || 'External Integration Client',
    keyPrefix: `${rawSecret.substring(0, 14)}...${rawSecret.substring(rawSecret.length - 4)}`,
    hashedSecret: `sha256_${Math.random().toString(36).substring(2, 18)}`,
    scopes: scopes || ['telemetry:read'],
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    rateLimitPerMin: 1000,
    status: 'ACTIVE'
  };
  apiKeys.push(newKey);
  res.status(201).json({ keyRecord: newKey, generatedPlainSecret: rawSecret });
});

app.delete('/api/api-keys/:id', (req, res) => {
  apiKeys = apiKeys.filter(k => k.id !== req.params.id);
  res.json({ message: 'API key revoked' });
});

// Autonomous Survey Grid Generator
app.post('/api/survey/compute-grid', (req, res) => {
  const { centerLat, centerLng, widthMeters, heightMeters, flightAltitudeM, forwardOverlapPct, sideOverlapPct, sensorGsdCmPx } = req.body;
  
  const cLat = centerLat || 37.7749;
  const cLng = centerLng || -122.4194;
  const alt = flightAltitudeM || 60;
  const fOverlap = forwardOverlapPct || 75;
  const sOverlap = sideOverlapPct || 70;

  // Generate boustrophedon (lawnmower) path waypoints
  const linesCount = 6;
  const pointsPerLine = 8;
  const waypoints = [];
  const latDelta = (heightMeters || 400) / 111320;
  const lngDelta = (widthMeters || 300) / (111320 * Math.cos(cLat * Math.PI / 180));

  for (let l = 0; l < linesCount; l++) {
    const latLine = cLat - latDelta / 2 + (l / (linesCount - 1)) * latDelta;
    const isReverse = l % 2 === 1;
    for (let p = 0; p < pointsPerLine; p++) {
      const pIdx = isReverse ? (pointsPerLine - 1 - p) : p;
      const lngPoint = cLng - lngDelta / 2 + (pIdx / (pointsPerLine - 1)) * lngDelta;
      waypoints.push({
        id: `WP-${l + 1}-${pIdx + 1}`,
        lat: Number(latLine.toFixed(6)),
        lng: Number(lngPoint.toFixed(6)),
        altM: alt,
        speedKmh: 28,
        action: 'PHOTO_TRIGGER',
        cameraHeadingDeg: isReverse ? 270 : 90
      });
    }
  }

  const estDistanceMeters = linesCount * (widthMeters || 300) + (linesCount - 1) * ((heightMeters || 400) / linesCount);
  const estFlightTimeSec = Math.round(estDistanceMeters / (28 / 3.6));
  const estBatteryConsumptionPct = Math.round((estFlightTimeSec / 1800) * 100);

  res.json({
    surveyGrid: {
      center: { lat: cLat, lng: cLng },
      dimensions: { widthMeters: widthMeters || 300, heightMeters: heightMeters || 400 },
      flightAltitudeM: alt,
      gsdCmPx: sensorGsdCmPx || 1.85,
      totalWaypoints: waypoints.length,
      estimatedDistanceM: Math.round(estDistanceMeters),
      estimatedFlightTimeSec: estFlightTimeSec,
      estimatedBatteryPct: estBatteryConsumptionPct,
      waypoints
    }
  });
});

// Vite Middleware for Dev / Static Serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Drone Quadrapuller OS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
