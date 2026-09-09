# QPOS Flight Controller Hardware Wiring & Pinout Guide

This document defines the hardware connections, pin mappings, and electrical specifications for running the **Quadrapuller Drone Operating System (QPOS)** on **STM32H743VIT6** and **ESP32-S3** microcontrollers.

---

## 1. Flight Controller Pinout Table

### STM32H743VIT6 Pin Mapping

| Subsystem | Signal Name | MCU Pin | Peripheral | Description |
|---|---|---|---|---|
| **Motor 1 (FL)** | `ESC_DSHOT_M1` | `PA8` | `TIM1_CH1` (DMA2_Stream6) | Front-Left Tractor Motor (CCW) |
| **Motor 2 (FR)** | `ESC_DSHOT_M2` | `PA9` | `TIM1_CH2` (DMA2_Stream2) | Front-Right Tractor Motor (CW) |
| **Motor 3 (RR)** | `ESC_DSHOT_M3` | `PA10` | `TIM1_CH3` (DMA2_Stream1) | Rear-Right Tractor Motor (CCW) |
| **Motor 4 (RL)** | `ESC_DSHOT_M4` | `PA11` | `TIM1_CH4` (DMA2_Stream4) | Rear-Left Tractor Motor (CW) |
| **IMU SPI** | `IMU_SCK` | `PA5` | `SPI1_SCK` (24 MHz) | ICM-42688-P Clock |
| **IMU SPI** | `IMU_MISO` | `PA6` | `SPI1_MISO` | Master In Slave Out |
| **IMU SPI** | `IMU_MOSI` | `PB5` | `SPI1_MOSI` | Master Out Slave In |
| **IMU SPI** | `IMU_CS` | `PD14` | `GPIO_OUT_PP` | Active-Low Chip Select |
| **IMU Interrupt**| `IMU_INT1` | `PC4` | `EXTI4` (Rising Edge) | 800Hz / 1.6kHz Data Ready Pulse |
| **RC Receiver** | `CRSF_RX` | `PD2` | `UART5_RX` (420 kbaud) | ExpressLRS / Crossfire RX |
| **RC Receiver** | `CRSF_TX` | `PC12` | `UART5_TX` (420 kbaud) | ExpressLRS Telemetry TX |
| **GCS Telemetry**| `GCS_TELEM_TX` | `PA2` | `USART2_TX` (921,600 baud) | High-speed link to Ground Station |
| **GCS Telemetry**| `GCS_TELEM_RX` | `PA3` | `USART2_RX` (921,600 baud) | Ground Station Command RX |
| **RTK GNSS / GPS**| `GPS_TX` | `PD5` | `USART1_TX` (115,200 baud) | u-blox NEO-M9N / F9P RTK GPS |
| **RTK GNSS / GPS**| `GPS_RX` | `PD6` | `USART1_RX` (115,200 baud) | GPS Position Stream |
| **I2C Bus** | `I2C1_SCL` | `PB6` | `I2C1_SCL` (400 kHz) | DPS310 Barometer + Compass |
| **I2C Bus** | `I2C1_SDA` | `PB7` | `I2C1_SDA` (400 kHz) | QMC5883L Magnetometer |
| **12S BMS ADC** | `BMS_VOLTAGE` | `PC0` | `ADC1_INP10` | 12S Voltage Divider (1:20 ratio) |
| **Current Shunt**| `BMS_CURRENT` | `PC1` | `ADC1_INP11` | Hall-effect current sensor (50mV/A) |
| **Buzzer / Beeper**| `BUZZER_PIN` | `PD15` | `GPIO_OUT_PP` | Low Battery & Arming Tone |
| **Status RGB LED** | `WS2812_DATA` | `PB0` | `TIM3_CH3` (DMA) | Visual Flight Mode Status |

---

### ESP32-S3 Dual-Core Pin Mapping

| Subsystem | Signal Name | ESP32-S3 Pin | Peripheral |
|---|---|---|---|
| **Motor 1 (FL)** | `ESC_DSHOT_M1` | `GPIO 4` | `RMT Channel 0` (DShot600) |
| **Motor 2 (FR)** | `ESC_DSHOT_M2` | `GPIO 5` | `RMT Channel 1` (DShot600) |
| **Motor 3 (RR)** | `ESC_DSHOT_M3` | `GPIO 6` | `RMT Channel 2` (DShot600) |
| **Motor 4 (RL)** | `ESC_DSHOT_M4` | `GPIO 7` | `RMT Channel 3` (DShot600) |
| **IMU SPI** | `SCK / MISO / MOSI` | `GPIO 12 / 13 / 11` | `SPI2` (FSPI) |
| **IMU CS / INT** | `CS / INT1` | `GPIO 10 / GPIO 9` | `GPIO Output / EXTI` |
| **RC Receiver** | `CRSF_RX / TX` | `GPIO 18 / GPIO 17` | `UART1` (420 kbaud) |
| **GCS Telemetry**| `GCS_TX / RX` | `GPIO 43 / GPIO 44` | `UART0` (USB-Serial / 921k) |
| **I2C Bus** | `SCL / SDA` | `GPIO 2 / GPIO 1` | `I2C0` (400 kHz) |
| **BMS ADC** | `VOLT / CURR` | `GPIO 8 / GPIO 14` | `ADC1 Channel 7 / 6` |

---

## 2. Quadrapuller Motor Geometry & Rotational Directions

In a **Quadrapuller** tractor configuration, propellers are mounted on top pulling the aircraft forward and upward:

```
               [Front / Nose]
                     ▲
    M1 (FL)                  M2 (FR)
     CCW                      CW
      (Tilt 2.5° Out)          (Tilt 2.5° Out)
      ┌────────┐               ┌────────┐
      │  Rotor │               │  Rotor │
      └────┬───┘               └───┬────┘
           │                       │
           └───────► [CG] ◄────────┘
           │                       │
      ┌────┴───┐               ┌───┴────┐
      │  Rotor │               │  Rotor │
      └────────┘               └────────┘
      (Tilt 2.5° Out)          (Tilt 2.5° Out)
     CW                       CCW
    M4 (RL)                  M3 (RR)
```

* **M1 (Front-Left)**: Counter-Clockwise (CCW) rotation.
* **M2 (Front-Right)**: Clockwise (CW) rotation.
* **M3 (Rear-Right)**: Counter-Clockwise (CCW) rotation.
* **M4 (Rear-Left)**: Clockwise (CW) rotation.
* **Motor Outward Tilt**: Each motor mount is mechanically angled **2.5° outward** from the vertical axis. This provides direct lateral pull authority with zero fuselage tilt, keeping cameras level for surveying.

---

## 3. Power Distribution & Safety Isolation

1. **Main Battery**: 12S Li-Po or Solid-State pack (Nominal 44.4V, Full Charge 50.4V).
2. **Voltage Regulator (BEC)**: Step-down switching regulator supplying **5.0V @ 3A** for the flight controller MCU, GPS, and RC receiver.
3. **Sensor Rail**: Clean **3.3V LDO** dedicated exclusively to the ICM-42688-P IMU and barometer to eliminate motor ESC electrical switching noise.
4. **Current Shunt**: Connect ground return through a 0.5mΩ high-power current shunt to monitor instantaneous battery draw up to 200 Amps.
