/**
 * @file pid.h
 * @brief High-Precision Cascaded PID Controller for Quadrapuller UAV
 */

#ifndef PID_H
#define PID_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    float kp;               /* Proportional Gain */
    float ki;               /* Integral Gain */
    float kd;               /* Derivative Gain */
    float kf;               /* Feedforward Gain */

    float integrator_limit; /* Maximum integrator accumulator clamping */
    float output_limit;     /* Maximum controller output clamping */
    float dterm_filter_hz;  /* Low-pass cutoff frequency for D-term (e.g. 80 Hz) */

    /* Runtime internal states */
    float integrator;
    float previous_measurement;
    float filtered_dterm;
} pid_controller_t;

/**
 * @brief Initialize a PID controller instance with gains and limits
 */
void pid_init(pid_controller_t *pid, float kp, float ki, float kd, float kf,
              float integrator_limit, float output_limit, float dterm_filter_hz);

/**
 * @brief Reset integrator and filter states
 */
void pid_reset(pid_controller_t *pid);

/**
 * @brief Compute PID output step with anti-windup and D-term filtering
 * @param pid Pointer to controller instance
 * @param setpoint Target desired state
 * @param measurement Current actual sensor state
 * @param dt_s Delta time in seconds (e.g. 0.00125 for 800 Hz)
 * @return float Clamped control effort
 */
float pid_update(pid_controller_t *pid, float setpoint, float measurement, float dt_s);

#ifdef __cplusplus
}
#endif

#endif /* PID_H */
