/**
 * @file imu.h
 * @brief High-Speed SPI IMU Driver (ICM-42688-P) & Madgwick AHRS Fusion
 */

#ifndef IMU_H
#define IMU_H

#include "qpos_types.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ICM-42688-P SPI Register Map */
#define ICM42688_REG_DEVICE_CONFIG     0x11
#define ICM42688_REG_DRIVE_CONFIG      0x13
#define ICM42688_REG_INT_CONFIG        0x14
#define ICM42688_REG_FIFO_CONFIG       0x16
#define ICM42688_REG_TEMP_DATA1        0x1D
#define ICM42688_REG_ACCEL_DATA_X1     0x1F
#define ICM42688_REG_GYRO_DATA_X1      0x25
#define ICM42688_REG_PWR_MGMT0         0x4E
#define ICM42688_REG_GYRO_CONFIG0      0x4F
#define ICM42688_REG_ACCEL_CONFIG0     0x50
#define ICM42688_REG_WHO_AM_I          0x75

#define ICM42688_WHO_AM_I_VALUE        0x47

/**
 * @brief Initialize SPI bus and configure ICM-42688-P IMU registers
 * @return true if WHO_AM_I verification and configuration succeeded
 */
bool imu_init(void);

/**
 * @brief Read 14-byte burst of temperature, 3-axis accel, and 3-axis gyro
 * @param data Output data structure
 * @return true if SPI transfer succeeded
 */
bool imu_read_raw(imu_data_t *data);

/**
 * @brief Execute calibration routine (measures zero-rate gyro bias while stationary)
 * @param num_samples Number of calibration iterations (typically 1000)
 */
void imu_calibrate_gyro_bias(uint16_t num_samples);

/**
 * @brief Update Madgwick AHRS quaternion filter and compute Euler angles
 * @param imu Pointer to calibrated IMU sensor data
 * @param attitude Output Euler angles (roll, pitch, yaw in degrees)
 * @param dt_s Delta time in seconds (e.g. 0.00125 for 800 Hz)
 */
void imu_update_attitude(const imu_data_t *imu, euler_angles_t *attitude, float dt_s);

#ifdef __cplusplus
}
#endif

#endif /* IMU_H */
