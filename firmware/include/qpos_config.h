/**
 * @file qpos_config.h
 * @brief Quadrapuller Drone Operating System (QPOS) Firmware Configuration
 * 
 * Hardware Target: STM32H743VIT6 (480 MHz Cortex-M7) / ESP32-S3 (240 MHz dual Xtensa)
 * Architecture: Real-Time Operating System (FreeRTOS v10.x)
 */

#ifndef QPOS_CONFIG_H
#define QPOS_CONFIG_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* =========================================================================
 * 1. REAL-TIME FLIGHT LOOP EXECUTION FREQUENCIES
 * ========================================================================= */
#define QPOS_FLIGHT_LOOP_HZ         800     /* 800 Hz deterministic attitude/rate loop (1.25 ms period) */
#define QPOS_IMU_SAMPLE_HZ          1600    /* 1.6 kHz SPI gyroscope/accelerometer oversampling */
#define QPOS_RC_RECEIVER_HZ         250     /* 250 Hz ExpressLRS / CRSF packet processing */
#define QPOS_TELEMETRY_STREAM_HZ    50      /* 50 Hz binary telemetry stream to Ground Station */
#define QPOS_BMS_HEALTH_HZ          20      /* 20 Hz battery cell scanning and failsafe evaluation */

/* =========================================================================
 * 2. QUADRAPULLER MOTOR GEOMETRY & ESC DRIVER
 * ========================================================================= */
#define QPOS_NUM_MOTORS             4
#define QPOS_MOTOR_PROTOCOL_DSHOT600 1       /* 600 kbit/s bidirectional digital ESC protocol */
#define QPOS_MOTOR_PWM_FREQUENCY_HZ 400     /* Fallback standard high-rate PWM */

/* Quadrapuller Aerodynamic Decoupling (Motor Tilt Outward Angles in Degrees) */
#define QPOS_MOTOR_TILT_OUTWARD_DEG 2.5f    /* Direct lateral tractor pull authority */
#define QPOS_MOTOR_ARM_LENGTH_M     0.285f  /* Center to rotor hub distance: 285 mm */

/* Motor Min/Max Command Values */
#define QPOS_MOTOR_THROTTLE_MIN     1000    /* Idle disarmed */
#define QPOS_MOTOR_THROTTLE_IDLE    1100    /* Low idle spin upon arming */
#define QPOS_MOTOR_THROTTLE_MAX     2000    /* Full 100% thrust */

/* =========================================================================
 * 3. SAFETY, ARMING & FAILSAFE THRESHOLDS
 * ========================================================================= */
#define QPOS_MAX_ARM_ANGLE_DEG      25.0f   /* Drone cannot arm if tilted past 25 degrees */
#define QPOS_MAX_PITCH_ANGLE_DEG    45.0f   /* Maximum allowed pitch command in ANGLE mode */
#define QPOS_MAX_ROLL_ANGLE_DEG     45.0f   /* Maximum allowed roll command in ANGLE mode */
#define QPOS_MAX_RATE_DPS           360.0f  /* Maximum rate command: 360 deg/sec in ACRO mode */

/* Failsafe Timeouts */
#define QPOS_RC_LOSS_FAILSAFE_MS    500     /* Auto-RTL after 500ms RC link loss */
#define QPOS_GCS_LOSS_FAILSAFE_MS   3000    /* Auto-RTL after 3000ms GCS command loss */
#define QPOS_BMS_CRITICAL_VOLT_V    39.6f   /* 3.3V/cell on 12S pack -> Immediate emergency land */
#define QPOS_BMS_LOW_VOLT_RTL_V     42.0f   /* 3.5V/cell on 12S pack -> Automated Return-To-Launch */

/* =========================================================================
 * 4. SERIAL & COMMUNICATION BAUD RATES
 * ========================================================================= */
#define QPOS_UART_RC_BAUD           420000  /* ExpressLRS / CRSF UART baud */
#define QPOS_UART_GCS_BAUD          921600  /* High-speed Ground Station telemetry stream */
#define QPOS_UART_GPS_BAUD          115200  /* u-blox NEO-M9N / F9P RTK GNSS baud */

#ifdef __cplusplus
}
#endif

#endif /* QPOS_CONFIG_H */
