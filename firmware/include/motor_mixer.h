/**
 * @file motor_mixer.h
 * @brief Quadrapuller Geometry Mixer & DShot600 Digital ESC Driver
 */

#ifndef MOTOR_MIXER_H
#define MOTOR_MIXER_H

#include "qpos_types.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Initialize ESC hardware timers (TIM1 / TIM8 DMA for DShot600)
 */
void motor_mixer_init(void);

/**
 * @brief Compute individual motor throttle values from Roll, Pitch, Yaw, and Throttle commands
 * @param throttle Base collective vertical thrust (1000 - 2000)
 * @param roll_effort Roll correction torque (-500 to +500)
 * @param pitch_effort Pitch correction torque (-500 to +500)
 * @param yaw_effort Yaw correction torque (-500 to +500)
 * @param is_armed System armed state
 * @param outputs Pointer to struct receiving calculated M1-M4 throttle values
 */
void motor_mixer_compute(uint16_t throttle, float roll_effort, float pitch_effort, float yaw_effort,
                        bool is_armed, motor_outputs_t *outputs);

/**
 * @brief Encode 11-bit throttle into 16-bit DShot frame with 4-bit inverted XOR checksum
 * @param throttle_val DShot command value (0 = Disarmed, 48-2047 = Motor throttle)
 * @param telemetry_req Request ESC telemetry frame (bidirectional DShot)
 * @return uint16_t Formatted 16-bit DShot packet
 */
uint16_t motor_mixer_encode_dshot_packet(uint16_t throttle_val, bool telemetry_req);

/**
 * @brief Send DShot600 packet burst via DMA to all 4 ESC signal lines
 * @param outputs Motor throttle commands
 */
void motor_mixer_send_dshot(const motor_outputs_t *outputs);

/**
 * @brief Emergency disarm and stop all 4 motors immediately (<1ms)
 */
void motor_mixer_emergency_stop(void);

#ifdef __cplusplus
}
#endif

#endif /* MOTOR_MIXER_H */
