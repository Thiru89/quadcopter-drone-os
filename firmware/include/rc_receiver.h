/**
 * @file rc_receiver.h
 * @brief ExpressLRS / TBS Crossfire (CRSF) Protocol Telemetry & Channel Parser
 */

#ifndef RC_RECEIVER_H
#define RC_RECEIVER_H

#include "qpos_types.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

#define CRSF_SYNC_BYTE             0xC8
#define CRSF_FRAMETYPE_RC_CHANNELS 0x16
#define CRSF_FRAME_MAX_PAYLOAD     64

/**
 * @brief Initialize UART peripheral for CRSF reception (420,000 baud, 8N1)
 */
void rc_receiver_init(void);

/**
 * @brief Process incoming serial byte stream from radio receiver
 * @param byte Incoming UART byte
 * @return true if a complete valid RC channel frame was decoded
 */
bool rc_receiver_process_byte(uint8_t byte);

/**
 * @brief Get latest decoded RC channels and failsafe status
 * @param channels Output pointer to rc_channels_t struct
 */
void rc_receiver_get_channels(rc_channels_t *channels);

/**
 * @brief Check if radio link has timed out (>500ms since last packet)
 * @param current_time_ms System uptime in milliseconds
 * @return true if failsafe condition is active
 */
bool rc_receiver_is_failsafe(uint32_t current_time_ms);

#ifdef __cplusplus
}
#endif

#endif /* RC_RECEIVER_H */
