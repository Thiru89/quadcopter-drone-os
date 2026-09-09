/**
 * @file bms.h
 * @brief 12S Solid-State Smart BMS Driver & Point-of-No-Return (PNR) Safety
 */

#ifndef BMS_H
#define BMS_H

#include "qpos_types.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Initialize BMS ADC and I2C/SPI fuel gauge interface
 */
void bms_init(void);

/**
 * @brief Sample all 12 cell voltages and current sensor shunt
 * @param bms Pointer to telemetry struct
 * @param dt_s Sampling period in seconds (e.g. 0.05 for 20 Hz)
 */
void bms_update(bms_telemetry_t *bms, float dt_s);

/**
 * @brief Calculate remaining Point-of-No-Return radius in meters
 * @param remaining_mah Usable battery capacity remaining
 * @param cruise_power_w Estimated cruise power consumption in Watts
 * @param groundspeed_mps Cruise return groundspeed in m/s
 * @return float Safe operational radius in meters before RTL must be engaged
 */
float bms_calculate_pnr_radius_m(float remaining_mah, float cruise_power_w, float groundspeed_mps);

#ifdef __cplusplus
}
#endif

#endif /* BMS_H */
