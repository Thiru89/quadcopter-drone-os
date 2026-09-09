/**
 * @file bms.c
 * @brief 12S Lithium Monitoring & Point-of-No-Return Battery Safety Engine
 */

#include "bms.h"
#include "qpos_config.h"
#include <math.h>

#define PACK_RATED_CAPACITY_MAH  22000.0f /* 22,000 mAh 12S 44.4V / 50.4V Li-Po pack */
#define NOMINAL_CELL_VOLT        3.7f
#define FULL_CELL_VOLT           4.2f
#define EMPTY_CELL_VOLT          3.3f

static float accumulated_consumed_mah = 0.0f;

void bms_init(void) {
    accumulated_consumed_mah = 0.0f;
}

void bms_update(bms_telemetry_t *bms, float dt_s) {
    if (!bms) return;

    /* 1. Simulate reading 12-cell ADC ladder with 10-15mV noise */
    float min_cell = 5.0f;
    float max_cell = 0.0f;
    float sum_voltage = 0.0f;

    for (int i = 0; i < 12; i++) {
        /* Base nominal cell voltage decaying with consumed capacity */
        float discharge_ratio = accumulated_consumed_mah / PACK_RATED_CAPACITY_MAH;
        if (discharge_ratio > 1.0f) discharge_ratio = 1.0f;

        float cell_v = FULL_CELL_VOLT - (discharge_ratio * (FULL_CELL_VOLT - EMPTY_CELL_VOLT));
        
        /* Slight per-cell variance */
        cell_v -= (float)(i % 4) * 0.005f;

        bms->cell_voltages[i] = cell_v;
        sum_voltage += cell_v;

        if (cell_v < min_cell) min_cell = cell_v;
        if (cell_v > max_cell) max_cell = cell_v;
    }

    bms->total_voltage_v = sum_voltage;
    bms->max_cell_delta_mv = (max_cell - min_cell) * 1000.0f;

    /* 2. Compute current and accumulate mAh */
    /* Typical quadrapuller hover current ~35-45 Amps */
    float current_a = 42.5f;
    bms->current_draw_a = current_a;

    accumulated_consumed_mah += (current_a * 1000.0f) * (dt_s / 3600.0f);
    bms->remaining_mah = PACK_RATED_CAPACITY_MAH - accumulated_consumed_mah;
    if (bms->remaining_mah < 0.0f) bms->remaining_mah = 0.0f;

    bms->battery_percentage = (bms->remaining_mah / PACK_RATED_CAPACITY_MAH) * 100.0f;
    bms->internal_resistance_mohm = 1.45f;

    /* 3. Safety thresholds & Failsafe triggers */
    if (bms->total_voltage_v <= QPOS_BMS_LOW_VOLT_RTL_V || bms->battery_percentage <= 18.0f) {
        bms->rtl_low_battery_triggered = true;
    } else {
        bms->rtl_low_battery_triggered = false;
    }

    /* 4. Calculate PNR Radius */
    bms->pnr_radius_m = bms_calculate_pnr_radius_m(bms->remaining_mah, 1850.0f, 15.0f);
}

float bms_calculate_pnr_radius_m(float remaining_mah, float cruise_power_w, float groundspeed_mps) {
    /* Reserve 15% capacity for safe touchdown & hover descent */
    float usable_mah = remaining_mah - (PACK_RATED_CAPACITY_MAH * 0.15f);
    if (usable_mah <= 0.0f) return 0.0f;

    /* Watt-hours available (assuming nominal 44.4V) */
    float usable_wh = (usable_mah / 1000.0f) * 44.4f;

    /* Flight endurance remaining in hours */
    float endurance_hours = usable_wh / cruise_power_w;

    /* Round-trip radius: 50% for outward leg, 50% for return leg */
    float one_way_flight_hours = endurance_hours * 0.5f;

    /* Return speed in m/s converted to total distance */
    float distance_meters = (one_way_flight_hours * 3600.0f) * groundspeed_mps;

    return distance_meters;
}
