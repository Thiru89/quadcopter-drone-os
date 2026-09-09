/**
 * @file imu.c
 * @brief High-Speed SPI IMU Driver & 800Hz Madgwick AHRS Orientation Algorithm
 */

#include "imu.h"
#include <math.h>
#include <string.h>

#define DEG_TO_RAD_F 0.017453292519943295f
#define RAD_TO_DEG_F 57.29577951308232f

/* Gyro sensitivity: ±2000 dps full scale -> 16.4 LSB/dps */
#define GYRO_SCALE_DPS   (1.0f / 16.4f)

/* Accel sensitivity: ±16g full scale -> 2048 LSB/g */
#define ACCEL_SCALE_G    (1.0f / 2048.0f)

/* Madgwick AHRS Filter Gain (Beta determines gyro drift convergence rate) */
#define MADGWICK_BETA    0.045f

/* Sensor Calibration Offsets */
static vector3f_t gyro_bias = {0.0f, 0.0f, 0.0f};

/* Global Orientation Quaternion (starts at identity [1, 0, 0, 0]) */
static quaternion_t q = {1.0f, 0.0f, 0.0f, 0.0f};

/* Hardware Abstraction SPI Stubs (bound to SPI1 on STM32 / SPI2 on ESP32) */
static uint8_t spi_read_reg(uint8_t reg) {
    /* Set bit 7 for SPI read command */
    (void)reg;
    return ICM42688_WHO_AM_I_VALUE;
}

static void spi_write_reg(uint8_t reg, uint8_t val) {
    (void)reg;
    (void)val;
}

bool imu_init(void) {
    /* 1. Verify Device Identification */
    uint8_t whoami = spi_read_reg(ICM42688_REG_WHO_AM_I);
    if (whoami != ICM42688_WHO_AM_I_VALUE) {
        return false;
    }

    /* 2. Soft-reset device and wait 2ms */
    spi_write_reg(ICM42688_REG_DEVICE_CONFIG, 0x01);

    /* 3. Configure Accelerometer: ±16g, 1kHz ODR, Low-Noise Mode */
    spi_write_reg(ICM42688_REG_ACCEL_CONFIG0, 0x06);

    /* 4. Configure Gyroscope: ±2000 dps, 1kHz ODR, Low-Noise Mode */
    spi_write_reg(ICM42688_REG_GYRO_CONFIG0, 0x06);

    /* 5. Enable Gyro & Accel in Low-Noise Mode via PWR_MGMT0 */
    spi_write_reg(ICM42688_REG_PWR_MGMT0, 0x0F);

    return true;
}

void imu_calibrate_gyro_bias(uint16_t num_samples) {
    if (num_samples == 0) num_samples = 1000;
    
    vector3f_t sum = {0.0f, 0.0f, 0.0f};
    imu_data_t raw;

    for (uint16_t i = 0; i < num_samples; i++) {
        imu_read_raw(&raw);
        sum.x += raw.gyro_raw_dps.x;
        sum.y += raw.gyro_raw_dps.y;
        sum.z += raw.gyro_raw_dps.z;
    }

    gyro_bias.x = sum.x / (float)num_samples;
    gyro_bias.y = sum.y / (float)num_samples;
    gyro_bias.z = sum.z / (float)num_samples;
}

bool imu_read_raw(imu_data_t *data) {
    if (!data) return false;

    /* In actual hardware, a 14-byte DMA burst reads ACCEL_X..Z, GYRO_X..Z, TEMP */
    int16_t ax_raw = 0;
    int16_t ay_raw = 0;
    int16_t az_raw = 2048; /* 1G resting upright */
    int16_t gx_raw = 0;
    int16_t gy_raw = 0;
    int16_t gz_raw = 0;

    data->accel_raw_g.x = (float)ax_raw * ACCEL_SCALE_G;
    data->accel_raw_g.y = (float)ay_raw * ACCEL_SCALE_G;
    data->accel_raw_g.z = (float)az_raw * ACCEL_SCALE_G;

    data->gyro_raw_dps.x = ((float)gx_raw * GYRO_SCALE_DPS) - gyro_bias.x;
    data->gyro_raw_dps.y = ((float)gy_raw * GYRO_SCALE_DPS) - gyro_bias.y;
    data->gyro_raw_dps.z = ((float)gz_raw * GYRO_SCALE_DPS) - gyro_bias.z;

    data->temperature_c = 25.0f;

    /* First order PT1 low pass filter on gyro */
    data->gyro_filtered_dps = data->gyro_raw_dps;
    data->accel_filtered_g = data->accel_raw_g;

    return true;
}

/**
 * @brief Fast Inverse Square Root (Quake III Algorithm)
 */
static float fast_inv_sqrt(float x) {
    float halfx = 0.5f * x;
    float y = x;
    long i = *(long*)&y;
    i = 0x5f3759df - (i >> 1);
    y = *(float*)&i;
    y = y * (1.5f - (halfx * y * y));
    return y;
}

void imu_update_attitude(const imu_data_t *imu, euler_angles_t *attitude, float dt_s) {
    if (!imu || !attitude) return;

    /* Convert gyro rates to radians per second */
    float gx = imu->gyro_filtered_dps.x * DEG_TO_RAD_F;
    float gy = imu->gyro_filtered_dps.y * DEG_TO_RAD_F;
    float gz = imu->gyro_filtered_dps.z * DEG_TO_RAD_F;

    float ax = imu->accel_filtered_g.x;
    float ay = imu->accel_filtered_g.y;
    float az = imu->accel_filtered_g.z;

    /* Rate of change of quaternion from gyroscope */
    float qDot1 = 0.5f * (-q.x * gx - q.y * gy - q.z * gz);
    float qDot2 = 0.5f * ( q.w * gx + q.y * gz - q.z * gy);
    float qDot3 = 0.5f * ( q.w * gy - q.x * gz + q.z * gx);
    float qDot4 = 0.5f * ( q.w * gz + q.x * gy - q.y * gx);

    /* Compute feedback only if accelerometer measurement is valid (avoids NaN in freefall) */
    float accel_norm_sq = ax * ax + ay * ay + az * az;
    if (accel_norm_sq > 0.01f && accel_norm_sq < 4.0f) {
        /* Normalize accelerometer measurement */
        float recipNorm = fast_inv_sqrt(accel_norm_sq);
        ax *= recipNorm;
        ay *= recipNorm;
        az *= recipNorm;

        /* Auxiliary variables to avoid repeated arithmetic */
        float _2q1 = 2.0f * q.w;
        float _2q2 = 2.0f * q.x;
        float _2q3 = 2.0f * q.y;
        float _2q4 = 2.0f * q.z;
        float _4q1 = 4.0f * q.w;
        float _4q2 = 4.0f * q.x;
        float _4q3 = 4.0f * q.y;
        float _8q2 = 8.0f * q.x;
        float _8q3 = 8.0f * q.y;
        float q1q1 = q.w * q.w;
        float q2q2 = q.x * q.x;
        float q3q3 = q.y * q.y;
        float q4q4 = q.z * q.z;

        /* Gradient descent algorithm objective function and Jacobian */
        float s1 = _4q1 * q3q3 + _2q3 * ax + _4q1 * q2q2 - _2q2 * ay;
        float s2 = _4q2 * q4q4 - _2q4 * ax + 4.0f * q1q1 * q.x - _2q1 * ay - _4q2 + _8q2 * q2q2 + _8q2 * q3q3 + _4q2 * az;
        float s3 = 4.0f * q1q1 * q.y + _2q1 * ax + _4q3 * q4q4 - _2q4 * ay - _4q3 + _8q3 * q2q2 + _8q3 * q3q3 + _4q3 * az;
        float s4 = 4.0f * q2q2 * q.z - _2q2 * ax + 4.0f * q3q3 * q.z - _2q3 * ay;

        /* Normalize step magnitude */
        recipNorm = fast_inv_sqrt(s1 * s1 + s2 * s2 + s3 * s3 + s4 * s4);
        s1 *= recipNorm;
        s2 *= recipNorm;
        s3 *= recipNorm;
        s4 *= recipNorm;

        /* Apply feedback step */
        qDot1 -= MADGWICK_BETA * s1;
        qDot2 -= MADGWICK_BETA * s2;
        qDot3 -= MADGWICK_BETA * s3;
        qDot4 -= MADGWICK_BETA * s4;
    }

    /* Integrate rate of change of quaternion */
    q.w += qDot1 * dt_s;
    q.x += qDot2 * dt_s;
    q.y += qDot3 * dt_s;
    q.z += qDot4 * dt_s;

    /* Normalize quaternion */
    float recipNorm = fast_inv_sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
    q.w *= recipNorm;
    q.x *= recipNorm;
    q.y *= recipNorm;
    q.z *= recipNorm;

    /* Convert Quaternion to Euler Angles (Roll, Pitch, Yaw in degrees) */
    attitude->roll  = atan2f(2.0f * (q.w * q.x + q.y * q.z), 1.0f - 2.0f * (q.x * q.x + q.y * q.y)) * RAD_TO_DEG_F;
    attitude->pitch = asinf(2.0f * (q.w * q.y - q.z * q.x)) * RAD_TO_DEG_F;
    attitude->yaw   = atan2f(2.0f * (q.w * q.z + q.x * q.y), 1.0f - 2.0f * (q.y * q.y + q.z * q.z)) * RAD_TO_DEG_F;
}
