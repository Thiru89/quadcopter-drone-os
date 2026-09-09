cmake_minimum_required(VERSION 3.16)
project(qpos_firmware C CXX ASM)

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

# Target Definitions
add_definitions(
    -DARM_MATH_CM7
    -DSTM32H743xx
    -DQPOS_FLIGHT_CONTROLLER
)

# Include Directories
include_directories(
    include
)

# Source Files
set(QPOS_SOURCES
    src/main.c
    src/pid.c
    src/imu.c
    src/motor_mixer.c
    src/rc_receiver.c
    src/bms.c
    src/telemetry_protocol.c
)

# Compiler Optimization Flags
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -O3 -Wall -Wextra -ffunction-sections -fdata-sections")

# Executable Target
add_executable(qpos_firmware.elf ${QPOS_SOURCES})

# Math library link
target_link_libraries(qpos_firmware.elf m)
