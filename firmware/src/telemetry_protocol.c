/**
 * @file telemetry_protocol.c
 * @brief Binary Telemetry Serialization & Replay-Protected Command Demux
 */

#include "telemetry_protocol.h"
#include <string.h>

/* State Machine for Command Reception */
typedef enum {
    PARSER_WAIT_SYNC1,
    PARSER_WAIT_SYNC2,
    PARSER_WAIT_MSG_ID,
    PARSER_WAIT_LEN,
    PARSER_WAIT_PAYLOAD,
    PARSER_WAIT_CRC1,
    PARSER_WAIT_CRC2
} proto_state_t;

static proto_state_t rx_state = PARSER_WAIT_SYNC1;
static uint8_t rx_msg_id = 0;
static uint8_t rx_len = 0;
static uint8_t rx_idx = 0;
static uint8_t rx_payload[64];
static uint16_t rx_crc = 0;

static uint32_t last_accepted_nonce = 0;

/* CRC16-CCITT (Polynomial 0x1021) */
static uint16_t crc16_ccitt(const uint8_t *data, uint16_t len) {
    uint16_t crc = 0xFFFF;
    for (uint16_t i = 0; i < len; i++) {
        crc ^= (uint16_t)data[i] << 8;
        for (uint8_t j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    return crc;
}

void telemetry_protocol_init(void) {
    rx_state = PARSER_WAIT_SYNC1;
    last_accepted_nonce = 0;
}

uint16_t telemetry_protocol_encode_fast_frame(const system_state_t *state, uint8_t *tx_buf, uint16_t max_len) {
    if (!state || !tx_buf || max_len < 48) return 0;

    uint16_t idx = 0;

    /* Header */
    tx_buf[idx++] = QPOS_PROTO_SYNC_1;
    tx_buf[idx++] = QPOS_PROTO_SYNC_2;
    tx_buf[idx++] = MSG_ID_TELEMETRY_FAST;

    /* Payload length placeholder */
    uint16_t len_pos = idx++;

    /* Payload encoding */
    uint16_t payload_start = idx;

    /* Timestamp (4 bytes) */
    memcpy(&tx_buf[idx], &state->timestamp_ms, 4); idx += 4;

    /* Mode & Armed (2 bytes) */
    tx_buf[idx++] = (uint8_t)state->flight_mode;
    tx_buf[idx++] = state->is_armed ? 1 : 0;

    /* Euler Angles Roll/Pitch/Yaw (float * 100 as int16_t: 6 bytes) */
    int16_t r = (int16_t)(state->attitude.roll * 100.0f);
    int16_t p = (int16_t)(state->attitude.pitch * 100.0f);
    int16_t y = (int16_t)(state->attitude.yaw * 100.0f);
    memcpy(&tx_buf[idx], &r, 2); idx += 2;
    memcpy(&tx_buf[idx], &p, 2); idx += 2;
    memcpy(&tx_buf[idx], &y, 2); idx += 2;

    /* Altitude (int16_t cm: 2 bytes) */
    int16_t alt_cm = (int16_t)(state->altitude_m * 100.0f);
    memcpy(&tx_buf[idx], &alt_cm, 2); idx += 2;

    /* Speed (uint16_t cm/s: 2 bytes) */
    uint16_t spd_cms = (uint16_t)(state->groundspeed_mps * 100.0f);
    memcpy(&tx_buf[idx], &spd_cms, 2); idx += 2;

    /* Motor RPMs (4 x uint16_t: 8 bytes) */
    memcpy(&tx_buf[idx], &state->motors.motor_rpm[0], 8); idx += 8;

    /* Battery total voltage (uint16_t mV: 2 bytes) */
    uint16_t v_mv = (uint16_t)(state->bms.total_voltage_v * 100.0f);
    memcpy(&tx_buf[idx], &v_mv, 2); idx += 2;

    /* Fill in payload length */
    tx_buf[len_pos] = (uint8_t)(idx - payload_start);

    /* Compute CRC16 over Header + Length + Payload */
    uint16_t crc = crc16_ccitt(&tx_buf[2], (uint16_t)(idx - 2));
    tx_buf[idx++] = (uint8_t)(crc >> 8);
    tx_buf[idx++] = (uint8_t)(crc & 0xFF);

    return idx;
}

bool telemetry_protocol_parse_byte(uint8_t byte, command_packet_t *cmd_out) {
    switch (rx_state) {
        case PARSER_WAIT_SYNC1:
            if (byte == QPOS_PROTO_SYNC_1) rx_state = PARSER_WAIT_SYNC2;
            break;

        case PARSER_WAIT_SYNC2:
            if (byte == QPOS_PROTO_SYNC_2) {
                rx_state = PARSER_WAIT_MSG_ID;
            } else {
                rx_state = PARSER_WAIT_SYNC1;
            }
            break;

        case PARSER_WAIT_MSG_ID:
            rx_msg_id = byte;
            rx_state = PARSER_WAIT_LEN;
            break;

        case PARSER_WAIT_LEN:
            rx_len = byte;
            rx_idx = 0;
            if (rx_len <= sizeof(rx_payload) && rx_len > 0) {
                rx_state = PARSER_WAIT_PAYLOAD;
            } else {
                rx_state = PARSER_WAIT_SYNC1;
            }
            break;

        case PARSER_WAIT_PAYLOAD:
            rx_payload[rx_idx++] = byte;
            if (rx_idx >= rx_len) {
                rx_state = PARSER_WAIT_CRC1;
            }
            break;

        case PARSER_WAIT_CRC1:
            rx_crc = (uint16_t)byte << 8;
            rx_state = PARSER_WAIT_CRC2;
            break;

        case PARSER_WAIT_CRC2: {
            rx_crc |= byte;
            rx_state = PARSER_WAIT_SYNC1;

            /* Check message ID */
            if (rx_msg_id == MSG_ID_COMMAND_UPLINK && rx_len >= sizeof(command_packet_t)) {
                command_packet_t *cmd = (command_packet_t*)rx_payload;

                /* Nonce replay validation */
                if (cmd->rolling_nonce > last_accepted_nonce) {
                    last_accepted_nonce = cmd->rolling_nonce;
                    if (cmd_out) {
                        *cmd_out = *cmd;
                    }
                    return true;
                }
            }
            break;
        }
    }

    return false;
}
