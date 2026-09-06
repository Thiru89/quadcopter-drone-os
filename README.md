# Quadrapuller Drone Operating System (QPOS)

An enterprise-grade, deterministic operating system and telemetry cockpit designed for autonomous quadrapuller unmanned aerial vehicles (UAVs). QPOS combines high-frequency flight stability control, authenticated encrypted navigation, modular hot-pluggable sensor architecture, predictive battery safety algorithms, and full-fidelity cloud black-box flight replay.

![Autonomous Industrial Quadrapuller Drone](./public/assets/images/drone_quadrapuller_1788718411820.jpg)
*Figure 1: Autonomous Heavy-Lift Quadrapuller Airframe with 4-Tractor Propellers, Dual Carbon-Fiber Nacelles, and Stabilized LiDAR/Radiometric Sensor Pod.*

---

## 1. Programming Languages & Technology Stack

The operating system and ground control station (GCS) are written end-to-end in modern, type-safe technologies:

* **Primary Language**: **TypeScript** (Strict Mode) — Used uniformly across both the backend flight kernel and the client-side telemetry dashboard for compile-time safety and mathematical rigor.
* **Server & Kernel Runtime**: **Node.js** with **Express** (`server.ts`), booted via `tsx` in development and bundled into self-contained CommonJS (`dist/server.cjs`) via `esbuild` for production container execution.
* **Frontend Framework**: **React 18** paired with **Vite** as high-performance build tooling.
* **User Interface & Design System**: **Tailwind CSS** implementing the bespoke **Elegant Dark** theme (`#0a0a0b` background, `#151518` elevated surfaces, `#e2e2e2` typography, emerald and sky-blue luminescent status vectors).
* **Vector Graphics & Icons**: Native SVG rendering engines paired with **Lucide React**.

---

## 2. System Architecture & How It Works

```
                     ┌───────────────────────────────────────────────┐
                     │          Enterprise Ground Station UI         │
                     │  (React 18 + Tailwind CSS "Elegant Dark")     │
                     └───────────────────────┬───────────────────────┘
                                             │
                              Authenticated WebSocket / REST
                                             │
                     ┌───────────────────────▼───────────────────────┐
                     │            QPOS Flight Core (Express)         │
                     │          - Deterministic State Manager        │
                     │          - Encrypted Dispatch Engine          │
                     │          - Mission Black-Box Store            │
                     └───────┬───────────────┬───────────────┬───────┘
                             │               │               │
            ┌────────────────┴──────┐ ┌──────┴──────┐ ┌──────┴───────────────┐
            │   800Hz Stability     │ │ 12S Smart   │ │ Modular Payload Bus  │
            │   Flight Loop (PID)   │ │ BMS Monitor │ │ (LiDAR, Radar, etc.) │
            └───────────────────────┘ └─────────────┘ └──────────────────────┘
```

### A. Deterministic Flight Loop & Stability Control
* **800 Hz Flight Control Loop**: Runs deterministic attitude and rate feedback balancing across the four tractor-puller motors (Front-Left, Front-Right, Rear-Right, Rear-Left).
* **4-Axis PID Tuning**: Dedicated Proportional, Integral, and Derivative gain stages for **Roll**, **Pitch**, **Yaw**, and **Altitude Hold**.
* **Aerodynamic Decoupling**: Adjusts motor tilt outward angles (0.5° – 4.0°) to deliver direct lateral pull authority without banking the fuselage, ensuring vibration-free photogrammetry.
* **Gust Rejection Feedforward**: Dynamic wind shear damping (60% – 99%) and a 120 Hz / -28.5 dB dynamic harmonic notch filter on IMU gyros.

### B. Secure Encrypted Transmission
* **Cryptographic Protocol**: AEAD ciphers (**ChaCha20-Poly1305** and **AES-256-GCM**) authenticating all uplink commands and downlink telemetry frames.
* **Zero-Trust Nonce Replay Defense**: Each packet utilizes a strictly incrementing 64-bit monotonic rolling nonce with an anti-replay sliding verification window (64 packets).
* **Ed25519 Digital Signatures**: Every command opcode (`SET_FLIGHT_MODE`, `ARM_DISARM`, `RETURN_TO_LAUNCH`, `SET_ALTITUDE`) is cryptographically signed and attested before the flight controller executes it.

### C. Modular Sensor Plugin Architecture
* **Hot-Pluggable Hardware Bus**: Hardware driver isolation supporting multiple high-speed physical interfaces:
  * **USB 3.1 Gen 2** (e.g., 3D LiDAR Laser Scanners)
  * **Gigabit Ethernet MII** (e.g., Dual Strongest/Last Return Point Cloud)
  * **CAN-FD 2.0B** (e.g., 77GHz mmWave Collision Avoidance Radar)
  * **High-Speed SPI** (e.g., Radiometric FLIR Thermal Infrared Imagers)
  * **I2C Fast Mode Plus** (e.g., Environmental Gas Sniffers & Magnetometers)
* **Resource Quota Management**: Real-time tracking of total payload power draw (Watts), DMA bandwidth throughput (MB/s), and total mounted mass (grams) against maximum takeoff weight (MTOW) limits.

### D. Tactical Surveying & Obstacle Avoidance
* **Autonomous Grid Generator**: Computes high-efficiency lawnmower survey flight paths with customizable altitude, flight speeds, and forward/side sensor overlaps.
* **Spatial LiDAR & Radar Sweep**: Continuous 360° obstacle scanning displaying proximity markers, closing relative velocity, and automated trajectory deviation vectors.

![Autonomous Drone Survey Field Operations](./public/assets/images/survey_field_ops_1788718438059.jpg)
*Figure 2: Autonomous High-Precision Photogrammetry & LiDAR Topographical Scanning across Complex Industrial Infrastructure.*

### E. Predictive Battery Management System (BMS)
* **12S Solid-State Pack Telemetry**: Real-time voltage tracking across all 12 individual lithium cells with instantaneous cell delta variance ($\Delta V$ in mV) and internal resistance ($m\Omega$) tracking.
* **Point of No Return (PNR) Calculation**: Dynamically compares remaining usable battery milliamp-hours ($mAh$) against current wind resistance, distance from home waypoint, and return flight speed to calculate the autonomous **Return-to-Launch (RTL)** reserve margin.

### F. Cloud Mission Log Repository & Forensic Playback
* **50 Hz Telemetry Black Box**: Records frame-by-frame UAV position (Lat/Lng), altitude AGL, groundspeed, roll/pitch/yaw angles, battery state, and 4-rotor RPM outputs.
* **Interactive Playback Scrubber**: Variable speed replay (1x, 2x, 5x, 10x) with scrub slider for flight path incident analysis and post-mission auditing.
* **Data Export**: Direct one-click export to formatted `.csv` spreadsheets or `.json` GeoJSON flight paths.

---

## 3. How the System Can Be Monitored

QPOS provides multiple real-time monitoring channels designed for remote ground crews and automated fleet monitoring systems:

![Telemetry Ground Station Dashboard](./public/assets/images/cockpit_dashboard_1788718425533.jpg)
*Figure 3: QPOS Ground Station Interface featuring 3D Artificial Horizon, 4-Rotor Thrust Gauges, 360° LiDAR Collision Radar, and Multi-Sensor Analytics.*

### 1. Primary Cockpit HUD
* **3D Perspective Artificial Horizon**: Visualizes real-time pitch ladder, roll angle indicators, and bank markers.
* **Quadrapuller Thrust Gauges**: Four individual radial dials reporting instantaneous rotor RPM (0 – 10,000 RPM) and motor current.
* **Altimeter & Variometer (VSI)**: Barometric and GPS altitude AGL with climb/sink rate indicator.
* **Compass Heading Strip**: Digital magnetic heading tape with active waypoint bearing markers.

### 2. Real-Time Subsystem Health Matrix
Accessible via the **Diagnostics & Health** panel (`ShieldAlert` status button), tracking 8 critical subsystems:
1. **Dual Redundant IMU Array** (Angular drift and divergence verification)
2. **Quadrapuller 4-ESC Bus** (ESC temperatures and commutation RPM)
3. **RTK Carrier Phase GNSS** (Satellite constellation count and HDOP dilution)
4. **LiDAR SLAM Surface Mapper** (Point cloud acquisition throughput)
5. **77GHz mmWave Radar Array** (Horizon target detection count)
6. **ChaCha20 Cryptographic Uplink** (Round-trip latency and packet loss)
7. **12S Solid-State Smart BMS** (Total pack voltage and cell balancing)
8. **Onboard NVMe Flight Recorder** (Disk write throughput)

### 3. Real-Time Diagnostic Alerts & Automated Failsafes
* Categorized by severity: `CRITICAL`, `WARNING`, and `INFO`.
* **Automated Failsafe Policies**: Automatically initiates **Return-To-Launch (RTL)** if battery capacity drops below 15% or telemetry uplink is lost for more than 3.0 seconds.

### 4. External Enterprise REST & WebSocket API
External GIS software, fleet management platforms (e.g., ArcGIS, DroneDeploy), and command centers can monitor and interface with the vehicle programmatically:

| Endpoint | Method | Description |
|---|---|---|
| `/api/telemetry/live` | `GET` | Returns 800Hz UAV attitude, speed, altitude, battery, and rotor RPMs |
| `/api/system/status` | `GET` | Returns current flight mode, arm state, and active diagnostic alerts |
| `/api/plugins` | `GET` | Returns installed sensor payload drivers and bus statistics |
| `/api/logs` | `GET` | Returns historical flight missions and trajectory time series |
| `/api/commands/dispatch` | `POST` | Authenticated uplink for executing signed navigation commands |
| `/api/survey/compute-grid` | `POST` | Computes autonomous lawnmower survey flight paths |
| `/api/health` | `GET` | Lightweight health probe for container orchestrators |

#### Authentication
API requests require an authorization bearer token generated from the **Enterprise API Gateway**:
```bash
curl -H "Authorization: Bearer qpos_live_enterprise_token" \
     https://<your-app-url>/api/telemetry/live
```

---

## 4. Development & Production Deployment

### Running in Development
```bash
# Boot the full-stack server (Vite + Express in TSX)
npm run dev
```
The server binds to `0.0.0.0:3000` with hot asset streaming and live API routing.

### Compiling for Production
```bash
# Build the client SPA and bundle server.ts to dist/server.cjs
npm run build

# Launch the production CommonJS kernel
npm start
```
