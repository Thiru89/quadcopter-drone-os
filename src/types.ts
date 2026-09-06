export type FlightMode = 
  | 'AUTO_SURVEY' 
  | 'POS_HOLD' 
  | 'ALT_HOLD' 
  | 'MISSION' 
  | 'RTL' 
  | 'MANUAL' 
  | 'EMERGENCY_HOVER';

export type AlertSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export interface DiagnosticAlert {
  id: string;
  subsystem: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  acknowledged?: boolean;
}

export interface RotorTelemetry {
  id: string;
  label: string;
  position: 'FL' | 'FR' | 'RR' | 'RL'; // Front-Left, Front-Right, Rear-Right, Rear-Left
  rpm: number;
  escTempC: number;
  currentA: number;
  thrustN: number;
  vibrationG: number;
  status: 'OPTIMAL' | 'WARM' | 'OVERHEAT' | 'FAIL';
}

export interface StabilitySystemState {
  loopRateHz: number;
  pidRoll: { p: number; i: number; d: number };
  pidPitch: { p: number; i: number; d: number };
  pidYaw: { p: number; i: number; d: number };
  pidAltitude: { p: number; i: number; d: number };
  windCompensatorActive: boolean;
  gustRejectionDamping: number;
  vibrationDecouplerDb: number;
  activeStabilityIndex: number;
  motorTiltCompensationDeg: number;
  antiTorqueCorrectionPct: number;
}

export interface EncryptionState {
  cipherSuite: string;
  keyExchange: string;
  macAlgorithm: string;
  rollingNonce: number;
  packetLossPct: number;
  uplinkLatencyMs: number;
  downlinkLatencyMs: number;
  antiReplayWindow: number;
  sessionState: 'SECURE_SYNCHRONIZED' | 'RE-KEYING' | 'DEGRADED';
  keyFingerprint: string;
  rssiDbm: number;
  snrDb: number;
}

export interface BatteryBmsState {
  cellConfiguration: string;
  nominalCapacityMah: number;
  remainingMah: number;
  percentage: number;
  voltageTotal: number;
  cellsVoltage: number[];
  currentDrawAmps: number;
  powerConsumptionWatts: number;
  internalResistanceMilliOhms: number;
  temperatureCelsius: number;
  healthCycles: number;
  healthCapacityPct: number;
  predictiveTimeRemainingSec: number;
  predictedRtlMarginSec: number;
  pointOfNoReturnPassed: boolean;
  smartWarning: string;
  cRate: number;
}

export interface ObstacleAvoidanceState {
  radarFrontRangeM: number;
  lidarClosestObstacleM: number;
  safetyBubbleRadiusM: number;
  activeAvoidanceVectors: Array<{ angleDeg: number; distanceM: number; intensity: number }>;
  hazardLevel: 'CLEAR' | 'CAUTION' | 'CRITICAL';
  dynamicRerouteActive: boolean;
  avoidanceManeuver: string | null;
}

export interface TelemetryState {
  latitude: number;
  longitude: number;
  altitudeMslM: number;
  altitudeAglM: number;
  groundspeedKmh: number;
  verticalSpeedMs: number;
  rollDeg: number;
  pitchDeg: number;
  yawDeg: number;
  headingDeg: number;
  windVector: {
    speedKmh: number;
    directionDeg: number;
    gustPeakKmh: number;
  };
  gnss: {
    fixType: 'RTK_FIXED' | 'RTK_FLOAT' | '3D_FIX' | 'NO_FIX';
    satellitesVisible: number;
    satellitesTracked: number;
    hdop: number;
    vdop: number;
    rtkAgeSec: number;
  };
  rotors: RotorTelemetry[];
  obstacleAvoidance: ObstacleAvoidanceState;
}

export interface FlightState {
  armed: boolean;
  flightMode: FlightMode;
  stabilitySystem: StabilitySystemState;
  encryption: EncryptionState;
  battery: BatteryBmsState;
  telemetry: TelemetryState;
}

export type SensorType = 'LIDAR' | 'THERMAL' | 'MULTISPECTRAL' | 'RADAR' | 'GAS_SNIFFER' | 'MAGNETOMETER';

export interface SensorPlugin {
  id: string;
  name: string;
  type: SensorType;
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
  livePayload?: Record<string, number | string | boolean>;
}

export interface MissionWaypoint {
  id: string;
  lat: number;
  lng: number;
  altM: number;
  speedKmh: number;
  action: 'TAKEOFF' | 'PHOTO_TRIGGER' | 'SCAN_HOVER' | 'SURVEY_PASS' | 'RTL_LAND';
  cameraHeadingDeg: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
}

export interface MissionLog {
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

export interface ApiKeyRecord {
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

export interface SurveyGridSettings {
  centerLat: number;
  centerLng: number;
  widthMeters: number;
  heightMeters: number;
  flightAltitudeM: number;
  forwardOverlapPct: number;
  sideOverlapPct: number;
  sensorGsdCmPx: number;
  flightSpeedKmh: number;
}
