# Makefile for QPOS Microcontroller Flight Firmware
CC = arm-none-eabi-gcc
OBJCOPY = arm-none-eabi-objcopy
SIZE = arm-none-eabi-size

TARGET = qpos_firmware
BUILD_DIR = build

CFLAGS = -mcpu=cortex-m7 -mthumb -mfpu=fpv5-d16 -mfloat-abi=hard
CFLAGS += -O3 -Wall -Wextra -Iinclude -DSTM32H743xx -std=c11

SRCS = src/main.c \
       src/pid.c \
       src/imu.c \
       src/motor_mixer.c \
       src/rc_receiver.c \
       src/bms.c \
       src/telemetry_protocol.c

OBJS = $(addprefix $(BUILD_DIR)/, $(notdir $(SRCS:.c=.o)))
vpath %.c src

.PHONY: all clean flash

all: $(BUILD_DIR)/$(TARGET).bin $(BUILD_DIR)/$(TARGET).hex
	@$(SIZE) $(BUILD_DIR)/$(TARGET).elf

$(BUILD_DIR)/%.o: %.c | $(BUILD_DIR)
	@echo "Compiling $<..."
	@$(CC) $(CFLAGS) -c $< -o $@

$(BUILD_DIR)/$(TARGET).elf: $(OBJS)
	@echo "Linking $@..."
	@$(CC) $(CFLAGS) -Wl,-Map=$(BUILD_DIR)/$(TARGET).map,--gc-sections $^ -o $@ -lm

$(BUILD_DIR)/%.bin: $(BUILD_DIR)/%.elf
	@$(OBJCOPY) -O binary $< $@

$(BUILD_DIR)/%.hex: $(BUILD_DIR)/%.elf
	@$(OBJCOPY) -O ihex $< $@

$(BUILD_DIR):
	mkdir -p $@

clean:
	rm -rf $(BUILD_DIR)

flash: all
	st-flash write $(BUILD_DIR)/$(TARGET).bin 0x08000000
