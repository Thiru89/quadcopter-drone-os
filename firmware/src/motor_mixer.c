/**
 * @file motor_mixer.c
 * @brief Quadrapuller Tractor Geometry Motor Mixer & DShot600 Protocol Implementation
 */

#include "motor_mixer.h"
#include "qpos_config.h"
#include <math.h>

#define DSHOT_MIN_THROTTLE 48
#define DSHOT_MAX_THROTTLE 2047
#define DSHOT_DISARMED     0

/* Trigonometric factor for motor tilt outward decoupling (2.5 degrees) */
static float cos_tilt = 0.999048f; /* cos(2.5 deg) */
static float sin_tilt = 0.043619f; /* sin(2.5 deg) */

void motor_mixer_init(void) {
    /* Initialize Timer PWM / DMA channels for DShot600 generation */
    motor_mixer_emergency_stop();
}

void motor_mixer_compute(uint16_t throttle, float roll_effort, float pitch_effort, float yaw_effort,
                        bool is_armed, motor_outputs_t *outputs) {
    if (!outputs) return;

    if (!is_armed || throttle < QPOS_MOTOR_THROTTLE_IDLE) {
        outputs->m1_fl = QPOS_MOTOR_THROTTLE_MIN;
        outputs->m2_fr = QPOS_MOTOR_THROTTLE_MIN;
        outputs->m3_rr = QPOS_MOTOR_THROTTLE_MIN;
        outputs->m4_rl = QPOS_MOTOR_THROTTLE_MIN;
        return;
    }

    /*
     * Quadrapuller Tractor Motor Configuration:
     * M1 (Front-Left, CCW):  +Pitch (nose down), +Roll (right down), -Yaw
     * M2 (Front-Right, CW):  +Pitch (nose down), -Roll (left down),  +Yaw
     * M3 (Rear-Right, CCW):  -Pitch (tail down), -Roll (left down),  -Yaw
     * M4 (Rear-Left, CW):    -Pitch (tail down), +Roll (right down), +Yaw
     *
     * In a quadrapuller design, outward motor tilt couples roll and yaw authority:
     */
    float m1 = (float)throttle + (pitch_effort * cos_tilt) + (roll_effort * cos_tilt) - (yaw_effort * cos_tilt);
    float m2 = (float)throttle + (pitch_effort * cos_tilt) - (roll_effort * cos_tilt) + (yaw_effort * cos_tilt);
    float m3 = (float)throttle - (pitch_effort * cos_tilt) - (roll_effort * cos_tilt) - (yaw_effort * cos_tilt);
    float m4 = (float)throttle - (pitch_effort * cos_tilt) + (roll_effort * cos_tilt) + (yaw_effort * cos_tilt);

    /* Clamp motor outputs to safe operating bounds */
    #define CLAMP_THROTTLE(val) \
        ((val) > QPOS_MOTOR_THROTTLE_MAX ? QPOS_MOTOR_THROTTLE_MAX : \
         ((val) < QPOS_MOTOR_THROTTLE_IDLE ? QPOS_MOTOR_THROTTLE_IDLE : (uint16_t)(val)))

    outputs->m1_fl = CLAMP_THROTTLE(m1);
    outputs->m2_fr = CLAMP_THROTTLE(m2);
    outputs->m3_rr = CLAMP_THROTTLE(m3);
    outputs->m4_rl = CLAMP_THROTTLE(m4);
}

uint16_t motor_mixer_encode_dshot_packet(uint16_t throttle_val, bool telemetry_req) {
    /* 1. Clamp throttle value within valid 11-bit DShot range */
    if (throttle_val > DSHOT_MAX_THROTTLE) throttle_val = DSHOT_MAX_THROTTLE;

    /* 2. Format: [11-bit throttle] [1-bit telemetry] */
    uint16_t packet = (throttle_val << 1) | (telemetry_req ? 1 : 0);

    /* 3. Compute 4-bit CRC: (packet ^ (packet >> 4) ^ (packet >> 8)) & 0x0F */
    uint16_t checksum = (packet ^ (packet >> 4) ^ (packet >> 8)) & 0x0F;

    /* 4. Append 4-bit CRC into lower nibble */
    return (packet << 4) | checksum;
}

void motor_mixer_send_dshot(const motor_outputs_t *outputs) {
    if (!outputs) return;

    /* Convert standard 1000-2000 throttle to DShot range (48 - 2047) */
    #define MAP_TO_DSHOT(p) ((p) <= QPOS_MOTOR_THROTTLE_MIN ? DSHOT_DISARMED : \
        (uint16_t)(DSHOT_MIN_THROTTLE + ((float)((p) - QPOS_MOTOR_THROTTLE_IDLE) / \
        (float)(QPOS_MOTOR_THROTTLE_MAX - QPOS_MOTOR_THROTTLE_IDLE)) * (DSHOT_MAX_THROTTLE - DSHOT_MIN_THROTTLE)))

    uint16_t dshot_m1 = motor_mixer_encode_dshot_packet(MAP_TO_DSHOT(outputs->m1_fl), false);
    uint16_t dshot_m2 = motor_mixer_encode_dshot_packet(MAP_TO_DSHOT(outputs->m2_fr), false);
    uint16_t dshot_m3 = motor_mixer_encode_dshot_packet(MAP_TO_DSHOT(outputs->m3_rr), false);
    uint16_t dshot_m4 = motor_mixer_encode_dshot_packet(MAP_TO_DSHOT(outputs->m4_rl), false);

    /* In actual STM32 hardware, these 4 16-bit packets are loaded into DMA circular buffers */
    (void)dshot_m1;
    (void)dshot_m2;
    (void)dshot_m3;
    (void)dshot_m4;
}

void motor_mixer_emergency_stop(void) {
    motor_outputs_t zero_outputs = {0, 0, 0, 0, {0,0,0,0}, {0,0,0,0}};
    motor_mixer_send_dshot(&zero_outputs);
}
