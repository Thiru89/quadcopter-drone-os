/**
 * @file qpos_types.h
 * @brief Core Data Types, Math Vectors, and Packet Structs for QPOS Flight Controller
 */

#ifndef QPOS_TYPES_H
#define QPOS_TYPES_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* 3-Dimensional Floating Point Vector */
typedef struct {
    float x;
    float y;
    float z;
} vector3f_t;

/* 4-Dimensional Unit Quaternion */
typedef struct {
    float w;
    float x;
    float y;
    float z;
} quaternion_t;

/* Euler Attitude Angles (degrees) */
typedef struct {
    float roll;
    float pitch;
    float yaw;
} euler_angles_t;

/* Operating Flight Modes */
typedef enum {
    FLIGHT_MODE_DISARMED   = 0,
    FLIGHT_MODE_STABILIZE  = 1, /* Angle mode with self-leveling */
    FLIGHT_MODE_ACRO       = 2, /* Pure rate mode (no leveling) */
    FLIGHT_MODE_ALT_HOLD   = 3, /* Baro/LiDAR altitude hold */
    FLIGHT_MODE_POS_HOLD   = 4, /* RTK GPS position hold */
    FLIGHT_MODE_AUTO_GRID  = 5, /* Autonomous lawnmower photogrammetry survey */
    FLIGHT_MODE_RTL        = 6, /* Return To Launch (Failsafe) */
    FLIGHT_MODE_EMERGENCY  = 7  /* Motor disarm / hard touchdown */
} qpos_flight_mode_t;

/* RC Channel Inputs (Normalized 1000 - 2000 microseconds) */
typedef struct {
    uint16_t roll;        /* Channel 1: Roll (1000=Left, 1500=Center, 2000=Right) */
    uint16_t pitch;       /* Channel 2: Pitch (1000=Down, 1500=Center, 2000=Up) */
    uint16_t throttle;    /* Channel 3: Throttle (1000=Zero, 2000=Max) */
    uint16_t yaw;         /* Channel 4: Yaw (1000=CCW, 1500=Center, 2000=CW) */
    uint16_t arm_switch;  /* Channel 5: 2-position switch (>1700 = Armed) */
    uint16_t mode_switch; /* Channel 6: 3-position mode selector */
    uint16_t rtl_switch;  /* Channel 7: 2-position RTL trigger */
    bool is_failsafe;     /* True if RC packet loss > 500ms */
    uint32_t last_packet_ms;
} rc_channels_t;

/* Quadrapuller Motor Output Commands */
typedef struct {
    uint16_t m1_fl;       /* Front-Left Tractor Motor (DShot value 48-2047 or PWM 1000-2000) */
    uint16_t m2_fr;       /* Front-Right Tractor Motor */
    uint16_t m3_rr;       /* Rear-Right Tractor Motor */
    uint16_t m4_rl;       /* Rear-Left Tractor Motor */
    float motor_current_a[4];
    uint16_t motor_rpm[4];
} motor_outputs_t;

/* 12S Battery Management Telemetry */
typedef struct {
    float total_voltage_v;
    float current_draw_a;
    float cell_voltages[12];
    float max_cell_delta_mv;
    float remaining_mah;
    float battery_percentage;
    float internal_resistance_mohm;
    float pnr_radius_m;   /* Dynamic Point-of-No-Return radius in meters */
    bool rtl_low_battery_triggered;
} bms_telemetry_t;

/* IMU Raw & Filtered State */
typedef struct {
    vector3f_t accel_raw_g;
    vector3f_t gyro_raw_dps;
    vector3f_t accel_filtered_g;
    vector3f_t gyro_filtered_dps;
    vector3f_t mag_gauss;
    float temperature_c;
} imu_data_t;

/* Complete System State Frame */
typedef struct {
    uint32_t timestamp_ms;
    qpos_flight_mode_t flight_mode;
    bool is_armed;
    euler_angles_t attitude;
    vector3f_t angular_rates;
    float altitude_m;
    float vertical_speed_mps;
    double gps_latitude;
    double gps_longitude;
    float groundspeed_mps;
    uint8_t gps_sats;
    float hdop;
    motor_outputs_t motors;
    bms_telemetry_t bms;
    uint32_t loop_time_us;
} system_state_t;

#ifdef __cplusplus
}
#endif

#endif /* QPOS_TYPES_H */
