import { FlightState, SensorPlugin, MissionLog, MissionWaypoint, DiagnosticAlert } from './types';

export const initialFlightState: FlightState = {
  armed: true,
  flightMode: 'AUTO_SURVEY',
  stabilitySystem: {
    loopRateHz: 800,
    pidRoll: { p: 1.45, i: 0.08, d: 0.32 },
    pidPitch: { p: 1.48, i: 0.08, d: 0.31 },
    pidYaw: { p: 2.10, i: 0.12, d: 0.15 },
    pidAltitude: { p: 2.40, i: 0.25, d: 0.40 },
    windCompensatorActive: true,
    gustRejectionDamping: 0.94,
    vibrationDecouplerDb: -28.5,
    activeStabilityIndex: 99.4,
    motorTiltCompensationDeg: 1.8,
    antiTorqueCorrectionPct: 98.7
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
    sessionState: 'SECURE_SYNCHRONIZED',
    keyFingerprint: 'SHA256:e4f1:92b8:10ac:33de:8710:cc55',
    rssiDbm: -58,
    snrDb: 28.4
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
    smartWarning: 'NOMINAL - Ample margin for autonomous return',
    cRate: 0.58
  },
  telemetry: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitudeMslM: 148.2,
    altitudeAglM: 52.6,
    groundspeedKmh: 34.8,
    verticalSpeedMs: 0.12,
    rollDeg: 2.1,
    pitchDeg: -3.4,
    yawDeg: 124.5,
    headingDeg: 125,
    windVector: {
      speedKmh: 14.2,
      directionDeg: 240,
      gustPeakKmh: 21.5
    },
    gnss: {
      fixType: 'RTK_FIXED',
      satellitesVisible: 31,
      satellitesTracked: 27,
      hdop: 0.58,
      vdop: 0.72,
      rtkAgeSec: 0.2
    },
    rotors: [
      { id: 'M1_FL', label: 'Motor 1 (Front-Left)', position: 'FL', rpm: 6180, escTempC: 38.2, currentA: 4.6, thrustN: 48.2, vibrationG: 0.08, status: 'OPTIMAL' },
      { id: 'M2_FR', label: 'Motor 2 (Front-Right)', position: 'FR', rpm: 6210, escTempC: 39.1, currentA: 4.7, thrustN: 48.8, vibrationG: 0.09, status: 'OPTIMAL' },
      { id: 'M3_RR', label: 'Motor 3 (Rear-Right)', position: 'RR', rpm: 6195, escTempC: 38.8, currentA: 4.6, thrustN: 48.5, vibrationG: 0.07, status: 'OPTIMAL' },
      { id: 'M4_RL', label: 'Motor 4 (Rear-Left)', position: 'RL', rpm: 6185, escTempC: 37.9, currentA: 4.6, thrustN: 48.3, vibrationG: 0.08, status: 'OPTIMAL' }
    ],
    obstacleAvoidance: {
      radarFrontRangeM: 42.5,
      lidarClosestObstacleM: 19.8,
      safetyBubbleRadiusM: 8.0,
      activeAvoidanceVectors: [
        { angleDeg: 15, distanceM: 19.8, intensity: 0.65 },
        { angleDeg: 45, distanceM: 28.4, intensity: 0.35 },
        { angleDeg: -30, distanceM: 34.1, intensity: 0.20 }
      ],
      hazardLevel: 'CLEAR',
      dynamicRerouteActive: false,
      avoidanceManeuver: null
    }
  }
};

export const initialPlugins: SensorPlugin[] = [
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
    description: 'High-density multi-return 3D laser scanner with real-time SLAM odometry and obstacle perimeter mapping.',
    livePayload: {
      pointsPerSec: '1,280,000 pts/s',
      returnMode: 'Dual Strongest/Last',
      surfaceRoughnessCm: 1.4,
      closestObstacleM: 19.8
    }
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
    description: 'Calibrated radiometric infrared sensor for solar panel, high-voltage line, and thermal leak inspection.',
    livePayload: {
      spotMaxTempC: 38.6,
      spotMinTempC: 17.2,
      isothermThresholdC: 45.0,
      deltaTempC: 21.4
    }
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
    description: 'All-weather 360-degree radar sensor resistant to heavy dust, dense fog, and direct solar glare.',
    livePayload: {
      trackedTargetsCount: 4,
      maxRelativeVelocityKmh: -12.4,
      penetrationMode: 'Heavy Fog Filter Active'
    }
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
    description: 'Narrow-band RGB + RedEdge + Near-IR sensor array for autonomous precision agriculture and forestry biomass.',
    livePayload: {
      averageNdvi: 0.68,
      canopyCoveragePct: 82.5,
      sunSensorIrradianceWm2: 840
    }
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
    description: 'Micro-electrochemical gas chamber for industrial pipeline leak detection and hazardous site safety scouting.',
    livePayload: {
      ch4ConcentrationPpm: 1.82,
      co2LevelPpm: 418,
      airQualityStatus: 'OPTIMAL / LOW HAZARD'
    }
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
    description: 'Ultra-sensitive triaxial magnetic fluxgate boom for surveying buried pipelines and geological magnetic anomalies.',
    livePayload: {
      totalIntensitynT: 48920,
      gradientDelta: '0.04 nT/m',
      subsurfaceAnomalyAlert: 'NONE'
    }
  }
];

export const initialWaypoints: MissionWaypoint[] = [
  { id: 'WP-01', lat: 37.7742, lng: -122.4208, altM: 50, speedKmh: 20, action: 'TAKEOFF', cameraHeadingDeg: 90, status: 'COMPLETED' },
  { id: 'WP-02', lat: 37.7748, lng: -122.4198, altM: 52, speedKmh: 35, action: 'PHOTO_TRIGGER', cameraHeadingDeg: 90, status: 'COMPLETED' },
  { id: 'WP-03', lat: 37.7754, lng: -122.4188, altM: 53, speedKmh: 35, action: 'PHOTO_TRIGGER', cameraHeadingDeg: 90, status: 'ACTIVE' },
  { id: 'WP-04', lat: 37.7760, lng: -122.4180, altM: 54, speedKmh: 35, action: 'SCAN_HOVER', cameraHeadingDeg: 180, status: 'PENDING' },
  { id: 'WP-05', lat: 37.7758, lng: -122.4168, altM: 52, speedKmh: 32, action: 'SURVEY_PASS', cameraHeadingDeg: 270, status: 'PENDING' },
  { id: 'WP-06', lat: 37.7750, lng: -122.4160, altM: 50, speedKmh: 30, action: 'PHOTO_TRIGGER', cameraHeadingDeg: 270, status: 'PENDING' },
  { id: 'WP-07', lat: 37.7743, lng: -122.4172, altM: 45, speedKmh: 25, action: 'RTL_LAND', cameraHeadingDeg: 0, status: 'PENDING' }
];

export const initialAlerts: DiagnosticAlert[] = [
  { id: 'ALT-101', subsystem: 'GNSS_RTK', severity: 'SUCCESS', message: 'Carrier phase locked with base station (27 satellites, HDOP: 0.58)', timestamp: 'Just now' },
  { id: 'ALT-102', subsystem: 'CRYPTO_CORE', severity: 'INFO', message: 'ChaCha20-Poly1305 uplink authenticated with GCS Master Key', timestamp: '1m ago' },
  { id: 'ALT-103', subsystem: 'STABILITY_CTRL', severity: 'INFO', message: 'Quadrapuller dynamic pull-vector balancing active (4-rotor sync: 99.4%)', timestamp: '2m ago' },
  { id: 'ALT-104', subsystem: 'OBSTACLE_LIDAR', severity: 'WARNING', message: 'Crane structural boom detected at 19.8m range; vector clearance > 8.0m bubble', timestamp: '3m ago' }
];
