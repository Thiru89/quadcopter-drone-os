/**
 * @file main.c
 * @brief Quadrapuller Drone Operating System (QPOS) - Microcontroller Flight Kernel
 * 
 * Target MCU: STM32H743VIT6 / ESP32-S3
 * RTOS: FreeRTOS Kernel v10.4+
 */

#include "qpos_config.h"
#include "qpos_types.h"
#include "pid.h"
#include "imu.h"
#include "motor_mixer.h"
#include "rc_receiver.h"
#include "bms.h"
#include "telemetry_protocol.h"
#include <stdio.h>
#include <stdbool.h>

/* Global Vehicle System State */
static system_state_t g_state;
static imu_data_t g_imu;
static rc_channels_t g_rc;

/* Cascaded PID Controllers */
static pid_controller_t pid_roll_angle;
static pid_controller_t pid_pitch_angle;
static pid_controller_t pid_roll_rate;
static pid_controller_t pid_pitch_rate;
static pid_controller_t pid_yaw_rate;
static pid_controller_t pid_altitude;

/* System Initialization */
void qpos_kernel_init(void) {
    /* 1. Core State Initialization */
    g_state.flight_mode = FLIGHT_MODE_DISARMED;
    g_state.is_armed = false;
    g_state.attitude.roll = 0.0f;
    g_state.attitude.pitch = 0.0f;
    g_state.attitude.yaw = 0.0f;
    g_state.altitude_m = 0.0f;

    /* 2. Initialize Subsystem Hardware Drivers */
    motor_mixer_init();
    rc_receiver_init();
    bms_init();
    telemetry_protocol_init();

    /* 3. Initialize IMU and Calibrate Gyro Bias */
    if (imu_init()) {
        imu_calibrate_gyro_bias(1000);
    }

    /* 4. Configure Outer Loop Attitude PIDs (Angle Mode) */
    /* Target Angle (deg) -> Target Rate (deg/s) */
    pid_init(&pid_roll_angle,  4.5f, 0.0f, 0.0f, 0.0f, 0.0f, QPOS_MAX_RATE_DPS, 0.0f);
    pid_init(&pid_pitch_angle, 4.5f, 0.0f, 0.0f, 0.0f, 0.0f, QPOS_MAX_RATE_DPS, 0.0f);

    /* 5. Configure Inner Loop Angular Rate PIDs (Rate Mode) */
    /* Target Rate (deg/s) -> Motor Effort (-500 to +500) */
    pid_init(&pid_roll_rate,  0.150f, 0.080f, 0.0035f, 0.040f, 250.0f, 500.0f, 80.0f);
    pid_init(&pid_pitch_rate, 0.160f, 0.085f, 0.0038f, 0.040f, 250.0f, 500.0f, 80.0f);
    pid_init(&pid_yaw_rate,   0.250f, 0.050f, 0.0000f, 0.000f, 200.0f, 400.0f, 50.0f);

    /* 6. Altitude Hold PID */
    pid_init(&pid_altitude,   1.800f, 0.400f, 0.0200f, 0.000f, 150.0f, 300.0f, 20.0f);
}

/* =========================================================================
 * TASK 1: 800 HZ HARD REAL-TIME FLIGHT STABILITY LOOP
 * Execution period: 1.25 milliseconds
 * ========================================================================= */
void Task_FlightLoop_800Hz(void) {
    const float dt_s = 1.0f / (float)QPOS_FLIGHT_LOOP_HZ;

    /* Step A: Read IMU Gyro & Accelerometers over SPI */
    imu_read_raw(&g_imu);

    /* Step B: Madgwick Quaternion Attitude Filter */
    imu_update_attitude(&g_imu, &g_state.attitude, dt_s);

    /* Step C: Evaluate Safety Arming Condition */
    if (g_rc.arm_switch > 1700 && !g_rc.is_failsafe && !g_state.bms.rtl_low_battery_triggered) {
        /* Angle check: Do not allow arming if drone is upside down or tilted > 25 deg */
        if (g_state.attitude.pitch < QPOS_MAX_ARM_ANGLE_DEG &&
            g_state.attitude.pitch > -QPOS_MAX_ARM_ANGLE_DEG &&
            g_state.attitude.roll < QPOS_MAX_ARM_ANGLE_DEG &&
            g_state.attitude.roll > -QPOS_MAX_ARM_ANGLE_DEG) {
            g_state.is_armed = true;
        }
    } else {
        g_state.is_armed = false;
        pid_reset(&pid_roll_angle);
        pid_reset(&pid_pitch_angle);
        pid_reset(&pid_roll_rate);
        pid_reset(&pid_pitch_rate);
        pid_reset(&pid_yaw_rate);
    }

    /* Step D: Interpret Pilot Setpoints from RC channels */
    float target_roll_angle  = ((float)g_rc.roll - 1500.0f) * (QPOS_MAX_ROLL_ANGLE_DEG / 500.0f);
    float target_pitch_angle = ((float)g_rc.pitch - 1500.0f) * (QPOS_MAX_PITCH_ANGLE_DEG / 500.0f);
    float target_yaw_rate    = ((float)g_rc.yaw - 1500.0f) * (QPOS_MAX_RATE_DPS / 500.0f);

    /* Deadband filtering */
    if (target_roll_angle > -1.0f && target_roll_angle < 1.0f) target_roll_angle = 0.0f;
    if (target_pitch_angle > -1.0f && target_pitch_angle < 1.0f) target_pitch_angle = 0.0f;
    if (target_yaw_rate > -2.0f && target_yaw_rate < 2.0f) target_yaw_rate = 0.0f;

    /* Step E: Cascaded PID Execution */
    /* Outer Loop: Angle Error -> Desired Angular Rate */
    float desired_roll_rate  = pid_update(&pid_roll_angle, target_roll_angle, g_state.attitude.roll, dt_s);
    float desired_pitch_rate = pid_update(&pid_pitch_angle, target_pitch_angle, g_state.attitude.pitch, dt_s);

    /* Inner Loop: Rate Error -> ESC Torque Efforts */
    float roll_effort  = pid_update(&pid_roll_rate, desired_roll_rate, g_imu.gyro_filtered_dps.x, dt_s);
    float pitch_effort = pid_update(&pid_pitch_rate, desired_pitch_rate, g_imu.gyro_filtered_dps.y, dt_s);
    float yaw_effort   = pid_update(&pid_yaw_rate, target_yaw_rate, g_imu.gyro_filtered_dps.z, dt_s);

    /* Step F: Quadrapuller Motor Mixer with Tilt Decoupling */
    motor_mixer_compute(g_rc.throttle, roll_effort, pitch_effort, yaw_effort, g_state.is_armed, &g_state.motors);

    /* Step G: Dispatch DShot600 Pulses to 4 ESCs */
    motor_mixer_send_dshot(&g_state.motors);
}

/* =========================================================================
 * TASK 2: 250 HZ RC RECEIVER & LINK MONITOR
 * Execution period: 4 milliseconds
 * ========================================================================= */
void Task_RcReceiver_250Hz(uint32_t current_time_ms) {
    rc_receiver_get_channels(&g_rc);

    /* Check failsafe link loss */
    if (rc_receiver_is_failsafe(current_time_ms)) {
        /* Auto engage Return-To-Launch on link loss */
        if (g_state.is_armed) {
            g_state.flight_mode = FLIGHT_MODE_RTL;
            /* Auto throttle for gentle descent */
            g_rc.throttle = 1450;
            g_rc.roll = 1500;
            g_rc.pitch = 1500;
            g_rc.yaw = 1500;
        }
    }
}

/* =========================================================================
 * TASK 3: 50 HZ GROUND STATION TELEMETRY STREAM & COMMAND DISPATCH
 * Execution period: 20 milliseconds
 * ========================================================================= */
void Task_Telemetry_50Hz(void) {
    uint8_t tx_buffer[128];
    g_state.timestamp_ms += 20;

    /* Encode fast attitude & motor frame and stream over UART */
    uint16_t bytes_to_send = telemetry_protocol_encode_fast_frame(&g_state, tx_buffer, sizeof(tx_buffer));
    (void)bytes_to_send;
}

/* =========================================================================
 * TASK 4: 20 HZ 12S BMS HEALTH MONITOR & FAILSAFE EVALUATION
 * Execution period: 50 milliseconds
 * ========================================================================= */
void Task_BmsHealth_20Hz(void) {
    const float dt_s = 0.05f;
    bms_update(&g_state.bms, dt_s);

    /* Low battery automated failsafe */
    if (g_state.bms.rtl_low_battery_triggered && g_state.is_armed) {
        g_state.flight_mode = FLIGHT_MODE_RTL;
    }
}

/* =========================================================================
 * MAIN ENTRY POINT
 * ========================================================================= */
int main(void) {
    /* Initialize clocks, hardware peripherals and QPOS flight kernel */
    qpos_kernel_init();

    printf("====================================================\r\n");
    printf("   Quadrapuller Drone OS (QPOS) Firmware v2.4.0    \r\n");
    printf("   Target: STM32H743 / ESP32-S3 | Loop: 800 Hz    \r\n");
    printf("   Motors: 4x Tractor-Puller DShot600 | 12S BMS    \r\n");
    printf("====================================================\r\n");

    /* Main Scheduler Loop (Simulated RTOS executive) */
    uint32_t ticks = 0;
    while (1) {
        /* 800 Hz Flight Loop */
        Task_FlightLoop_800Hz();

        /* Sub-rate dividers */
        if ((ticks % 3) == 0) {
            Task_RcReceiver_250Hz(ticks);
        }
        if ((ticks % 16) == 0) {
            Task_Telemetry_50Hz();
        }
        if ((ticks % 40) == 0) {
            Task_BmsHealth_20Hz();
        }

        ticks++;
    }

    return 0;
}
