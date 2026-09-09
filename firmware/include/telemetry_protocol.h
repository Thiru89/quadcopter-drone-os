/**
 * @file telemetry_protocol.h
 * @brief High-Speed Ground Station Telemetry Stream & Encrypted Command Uplink
 */

#ifndef TELEMETRY_PROTOCOL_H
#define TELEMETRY_PROTOCOL_H

#include "qpos_types.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

#define QPOS_PROTO_SYNC_1          0xAA
#define QPOS_PROTO_SYNC_2          0x55

#define MSG_ID_HEARTBEAT           0x01
#define MSG_ID_TELEMETRY_FAST      0x02  /* 50 Hz Attitude, Motor RPM, Speed, Altitude */
#define MSG_ID_BMS_SLOW            0x03  /* 10 Hz 12-cell voltages & PNR */
#define MSG_ID_COMMAND_UPLINK      0x10  /* Arm, Mode, RTL, Altitude */
#define MSG_ID_COMMAND_ACK         0x11

#define CMD_ARM_DISARM             0x01
#define CMD_SET_FLIGHT_MODE        0x02
#define CMD_RETURN_TO_LAUNCH       0x03
#define CMD_SET_ALTITUDE           0x04
#define CMD_EMERGENCY_STOP         0xFF

typedef struct {
    uint8_t command_opcode;
    uint32_t rolling_nonce;
    int32_t param1;
    int32_t param2;
    uint16_t signature;
} __attribute__((packed)) command_packet_t;

/**
 * @brief Initialize telemetry serial interface
 */
void telemetry_protocol_init(void);

/**
 * @brief Build binary telemetry frame from current system state
 * @param state Current system state
 * @param tx_buf Output transmit buffer
 * @param max_len Maximum buffer length
 * @return uint16_t Number of bytes written to buffer
 */
uint16_t telemetry_protocol_encode_fast_frame(const system_state_t *state, uint8_t *tx_buf, uint16_t max_len);

/**
 * @brief Parse incoming byte from Ground Station command uplink
 * @param byte Incoming UART byte
 * @param cmd_out Pointer to command_packet_t receiving verified command
 * @return true if an authenticated command packet was decoded
 */
bool telemetry_protocol_parse_byte(uint8_t byte, command_packet_t *cmd_out);

#ifdef __cplusplus
}
#endif

#endif /* TELEMETRY_PROTOCOL_H */
