# QPOS Embedded Microcontroller Flight Firmware

This directory contains the **bare-metal / FreeRTOS flight firmware** for autonomous quadrapuller UAVs, designed to be flashed directly onto flight controller hardware.

---

## 1. Supported Microcontrollers & Targets

1. **STM32H743VIT6** (Primary Target)
   * 480 MHz ARM Cortex-M7 with Double-Precision FPU
   * 2 MB Flash, 1 MB SRAM
   * Flashing Interface: **ST-Link V2/V3 (SWD)** or **USB DFU Bootloader**
2. **STM32F405 / STM32F411** (Compact Target)
   * 168 MHz ARM Cortex-M4 with Single-Precision FPU
   * Flashing Interface: **USB DFU**
3. **ESP32-S3** (Dual-Core Target)
   * 240 MHz Dual-Core Xtensa LX7
   * Flashing Interface: **Native USB-Serial / JTAG**

---

## 2. Firmware Directory Structure

```
firmware/
├── include/
│   ├── qpos_config.h           # Flight loop rates (800Hz), safety arming angles, pin speeds
│   ├── qpos_types.h            # Vectors, quaternions, telemetry and motor command structs
│   ├── pid.h                   # Cascaded angle & rate PID with D-term low-pass filter
│   ├── imu.h                   # ICM-42688-P SPI driver & Madgwick AHRS sensor fusion
│   ├── motor_mixer.h           # Quadrapuller tractor mixer & DShot600 digital ESC packet encoder
│   ├── rc_receiver.h           # ExpressLRS / CRSF 420kbaud packet parser with failsafe watchdog
│   ├── bms.h                   # 12S lithium voltage ADC monitoring & Point-of-No-Return RTL
│   └── telemetry_protocol.h    # Binary serial telemetry stream matching QPOS Ground Station
├── src/
│   ├── main.c                  # FreeRTOS scheduler executive (800Hz loop, 250Hz RC, 50Hz telem)
│   ├── pid.c                   # Floating-point PID math with anti-windup clamping
│   ├── imu.c                   # SPI register config, calibration & fast inverse square root AHRS
│   ├── motor_mixer.c           # 2.5° outward tilt decoupling & DShot CRC computation
│   ├── rc_receiver.c           # CRSF byte stream state machine & 16-channel demux
│   ├── bms.c                   # 12-cell ADC ladder processing & endurance calculation
│   └── telemetry_protocol.c    # Replay-protected command parser & telemetry packager
├── CMakeLists.txt              # Standard CMake build configuration
├── Makefile                    # GCC ARM Embedded build file
├── platformio.ini              # One-click build/flash for PlatformIO (VS Code)
├── WIRING_PINOUT.md            # Complete hardware schematic & pin connection guide
└── README.md                   # Flashing instructions & bench testing procedure
```

---

## 3. How to Build & Flash to Hardware

### Option A: Using PlatformIO in Visual Studio Code (Recommended)
1. Open the `/firmware` directory in **Visual Studio Code** with the **PlatformIO IDE extension** installed.
2. Connect your flight controller (e.g. STM32H7 or ESP32-S3) via USB.
3. Click the PlatformIO **Build** checkmark or run:
   ```bash
   pio run -e stm32h743vit6
   ```
4. To flash the compiled firmware over ST-Link or USB DFU:
   ```bash
   pio run -e stm32h743vit6 --target upload
   ```

### Option B: Using GCC-ARM & Make (Command Line)
Requirements: `arm-none-eabi-gcc` and `stlink-tools` (or `dfu-util`).
```bash
# 1. Compile the firmware ELF and binary
make

# 2. Flash to STM32 via ST-Link programmer
make flash

# Or flash via USB DFU bootloader:
dfu-util -a 0 -s 0x08000000:leave -D build/qpos_firmware.bin
```

---

## 4. Pre-Flight Bench Testing Procedure

Before connecting propellers, complete the following bench checklist:

1. **Bench Test WITHOUT Propellers**: Always remove carbon-fiber propellers during initial bench testing.
2. **Sensor Calibration**: Power on the drone while resting flat and stationary on a level surface. The green status LED will blink rapidly for 1.25 seconds while the `imu_calibrate_gyro_bias` routine collects 1,000 baseline gyro zero-rate samples.
3. **Check Ground Station Telemetry**: Connect the telemetry serial cable (or telemetry radio) to your PC. Open the QPOS Web Cockpit at `http://localhost:3000`. You will see the 3D artificial horizon pitch and roll respond immediately as you tilt the airframe.
4. **Radio Link & Failsafe Check**:
   - Verify all 4 stick axes (Roll, Pitch, Throttle, Yaw) move smoothly between 1000µs and 2000µs.
   - Switch off your radio transmitter. Verify that `is_failsafe` changes to `true` and the vehicle automatically engages **RTL Mode**.
5. **Motor Spin Direction Test**:
   - Arm the drone in low-idle mode.
   - Verify M1 (Front-Left) and M3 (Rear-Right) spin **Counter-Clockwise (CCW)**.
   - Verify M2 (Front-Right) and M4 (Rear-Left) spin **Clockwise (CW)**.
