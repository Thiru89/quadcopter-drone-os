/**
 * @file rc_receiver.c
 * @brief ExpressLRS / CRSF 420kbaud Packet Demultiplexer & Failsafe Watchdog
 */

#include "rc_receiver.h"
#include "qpos_config.h"
#include <string.h>

/* Parser State Machine */
typedef enum {
    STATE_WAIT_SYNC,
    STATE_WAIT_LEN,
    STATE_WAIT_TYPE,
    STATE_WAIT_PAYLOAD,
    STATE_WAIT_CRC
} crsf_state_t;

static crsf_state_t parser_state = STATE_WAIT_SYNC;
static uint8_t frame_len = 0;
static uint8_t frame_type = 0;
static uint8_t payload_idx = 0;
static uint8_t rx_buffer[CRSF_FRAME_MAX_PAYLOAD];
static rc_channels_t current_rc_channels = {
    1500, 1500, 1000, 1500, 1000, 1000, 1000, true, 0
};

/* Polynomial CRC8 table for CRSF (0xD5) */
static const uint8_t crsf_crc_table[256] = {
    0x00, 0xD5, 0x7F, 0xAA, 0xFE, 0x2B, 0x81, 0x54, 0x29, 0xFC, 0x56, 0x83, 0xD7, 0x02, 0xA8, 0x7D,
    0x52, 0x87, 0x2D, 0xF8, 0xAC, 0x79, 0xD3, 0x06, 0x7B, 0xAE, 0x04, 0xD1, 0x85, 0x50, 0xFA, 0x2F,
    0xA4, 0x71, 0xDB, 0x0E, 0x5A, 0x8F, 0x25, 0xF0, 0x8D, 0x58, 0xF2, 0x27, 0x73, 0xA6, 0x0C, 0xD9,
    0xF6, 0x23, 0x89, 0x5C, 0x08, 0xDD, 0x77, 0xA2, 0xDF, 0x0A, 0xA0, 0x75, 0x21, 0xF4, 0x5E, 0x8B,
    0x9D, 0x48, 0xE2, 0x37, 0x63, 0xB6, 0x1C, 0xC9, 0xB4, 0x61, 0xCB, 0x1E, 0x4A, 0x9F, 0x35, 0xE0,
    0xCF, 0x1A, 0xB0, 0x65, 0x31, 0xE4, 0x4E, 0x9B, 0xE6, 0x33, 0x99, 0x4C, 0x18, 0xCD, 0x67, 0xB2,
    0x39, 0xEC, 0x46, 0x93, 0xC7, 0x12, 0xB8, 0x6D, 0x10, 0xC5, 0x6F, 0xBA, 0xEE, 0x3B, 0x91, 0x44,
    0x6B, 0xBE, 0x14, 0xC1, 0x95, 0x40, 0xEA, 0x3F, 0x42, 0x97, 0x3D, 0xE8, 0xBC, 0x69, 0xC3, 0x16,
    0xEF, 0x3A, 0x90, 0x45, 0x11, 0xC4, 0x6E, 0xBB, 0xC6, 0x13, 0xB9, 0x6C, 0x38, 0xED, 0x47, 0x92,
    0xBD, 0x68, 0xC2, 0x17, 0x43, 0x96, 0x3C, 0xE9, 0x94, 0x41, 0xEB, 0x3E, 0x6A, 0xBF, 0x15, 0xC0,
    0x4B, 0x9E, 0x34, 0xE1, 0xB5, 0x60, 0xCA, 0x1F, 0x62, 0xB7, 0x1D, 0xC8, 0x9C, 0x49, 0xE3, 0x36,
    0x19, 0xCC, 0x66, 0xB3, 0xE7, 0x32, 0x98, 0x4D, 0x30, 0xE5, 0x4F, 0x9A, 0xCE, 0x1B, 0xB1, 0x64,
    0x72, 0xA7, 0x0D, 0xD8, 0x8C, 0x59, 0xF3, 0x26, 0x5B, 0x8E, 0x24, 0xF1, 0xA5, 0x70, 0xDA, 0x0F,
    0x20, 0xF5, 0x5F, 0x8A, 0xDE, 0x0B, 0xA1, 0x74, 0x09, 0xDC, 0x76, 0xA3, 0xF7, 0x22, 0x88, 0x5D,
    0xD6, 0x03, 0xA9, 0x7C, 0x28, 0xFD, 0x57, 0x82, 0xFF, 0x2A, 0x80, 0x55, 0x01, 0xD4, 0x7E, 0xAB,
    0x84, 0x51, 0xFB, 0x2E, 0x7A, 0xAF, 0x05, 0xD0, 0xAD, 0x78, 0xD2, 0x07, 0x53, 0x86, 0x2C, 0xF9
};

static uint8_t crsf_calc_crc(const uint8_t *data, uint8_t len) {
    uint8_t crc = 0;
    for (uint8_t i = 0; i < len; i++) {
        crc = crsf_crc_table[crc ^ data[i]];
    }
    return crc;
}

void rc_receiver_init(void) {
    parser_state = STATE_WAIT_SYNC;
    current_rc_channels.is_failsafe = true;
}

bool rc_receiver_process_byte(uint8_t byte) {
    switch (parser_state) {
        case STATE_WAIT_SYNC:
            if (byte == CRSF_SYNC_BYTE) {
                parser_state = STATE_WAIT_LEN;
            }
            break;

        case STATE_WAIT_LEN:
            if (byte >= 2 && byte <= CRSF_FRAME_MAX_PAYLOAD) {
                frame_len = byte;
                parser_state = STATE_WAIT_TYPE;
            } else {
                parser_state = STATE_WAIT_SYNC;
            }
            break;

        case STATE_WAIT_TYPE:
            frame_type = byte;
            payload_idx = 0;
            parser_state = STATE_WAIT_PAYLOAD;
            break;

        case STATE_WAIT_PAYLOAD:
            rx_buffer[payload_idx++] = byte;
            /* Payload length is (frame_len - 2) because LEN includes TYPE and CRC */
            if (payload_idx >= (frame_len - 2)) {
                parser_state = STATE_WAIT_CRC;
            }
            break;

        case STATE_WAIT_CRC: {
            parser_state = STATE_WAIT_SYNC;
            
            /* Verify CRC over TYPE + PAYLOAD */
            uint8_t crc_check = crsf_calc_crc(&frame_type, 1);
            for (uint8_t i = 0; i < payload_idx; i++) {
                crc_check = crsf_crc_table[crc_check ^ rx_buffer[i]];
            }

            if (crc_check == byte && frame_type == CRSF_FRAMETYPE_RC_CHANNELS) {
                /* Unpack 16 x 11-bit channels from 22 payload bytes */
                uint32_t raw_ch[16];
                raw_ch[0]  = ((rx_buffer[0]       | rx_buffer[1] << 8)                 & 0x07FF);
                raw_ch[1]  = ((rx_buffer[1] >> 3  | rx_buffer[2] << 5)                 & 0x07FF);
                raw_ch[2]  = ((rx_buffer[2] >> 6  | rx_buffer[3] << 2 | rx_buffer[4] << 10) & 0x07FF);
                raw_ch[3]  = ((rx_buffer[4] >> 1  | rx_buffer[5] << 7)                 & 0x07FF);
                raw_ch[4]  = ((rx_buffer[5] >> 4  | rx_buffer[6] << 4)                 & 0x07FF);
                raw_ch[5]  = ((rx_buffer[6] >> 7  | rx_buffer[7] << 1 | rx_buffer[8] << 9)  & 0x07FF);
                raw_ch[6]  = ((rx_buffer[8] >> 2  | rx_buffer[9] << 6)                 & 0x07FF);

                /* Convert CRSF 11-bit values (172-1811) to standard Microseconds (1000-2000) */
                #define CRSF_TO_US(v) (uint16_t)(988 + (float)((v) - 172) * (1024.0f / 1639.0f))

                current_rc_channels.roll        = CRSF_TO_US(raw_ch[0]);
                current_rc_channels.pitch       = CRSF_TO_US(raw_ch[1]);
                current_rc_channels.throttle    = CRSF_TO_US(raw_ch[2]);
                current_rc_channels.yaw         = CRSF_TO_US(raw_ch[3]);
                current_rc_channels.arm_switch  = CRSF_TO_US(raw_ch[4]);
                current_rc_channels.mode_switch = CRSF_TO_US(raw_ch[5]);
                current_rc_channels.rtl_switch  = CRSF_TO_US(raw_ch[6]);
                current_rc_channels.is_failsafe = false;

                return true;
            }
            break;
        }
    }
    return false;
}

void rc_receiver_get_channels(rc_channels_t *channels) {
    if (channels) {
        *channels = current_rc_channels;
    }
}

bool rc_receiver_is_failsafe(uint32_t current_time_ms) {
    if ((current_time_ms - current_rc_channels.last_packet_ms) > QPOS_RC_LOSS_FAILSAFE_MS) {
        current_rc_channels.is_failsafe = true;
        return true;
    }
    return current_rc_channels.is_failsafe;
}
