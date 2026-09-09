/**
 * @file pid.c
 * @brief Cascaded PID Implementation with First-Order D-Term Filter & Clamping Anti-Windup
 */

#include "pid.h"
#include <math.h>

#define M_PI_F 3.14159265358979323846f

void pid_init(pid_controller_t *pid, float kp, float ki, float kd, float kf,
              float integrator_limit, float output_limit, float dterm_filter_hz) {
    if (!pid) return;

    pid->kp = kp;
    pid->ki = ki;
    pid->kd = kd;
    pid->kf = kf;
    pid->integrator_limit = fabsf(integrator_limit);
    pid->output_limit = fabsf(output_limit);
    pid->dterm_filter_hz = dterm_filter_hz;

    pid_reset(pid);
}

void pid_reset(pid_controller_t *pid) {
    if (!pid) return;
    pid->integrator = 0.0f;
    pid->previous_measurement = 0.0f;
    pid->filtered_dterm = 0.0f;
}

float pid_update(pid_controller_t *pid, float setpoint, float measurement, float dt_s) {
    if (!pid || dt_s <= 0.0f) return 0.0f;

    /* 1. Error computation */
    float error = setpoint - measurement;

    /* 2. Proportional term */
    float p_term = pid->kp * error;

    /* 3. Integral term with clamping anti-windup */
    pid->integrator += pid->ki * error * dt_s;
    if (pid->integrator > pid->integrator_limit) {
        pid->integrator = pid->integrator_limit;
    } else if (pid->integrator < -pid->integrator_limit) {
        pid->integrator = -pid->integrator_limit;
    }

    /* 4. Derivative term on measurement (eliminates setpoint step spikes) */
    float delta_measurement = (measurement - pid->previous_measurement) / dt_s;
    pid->previous_measurement = measurement;

    float raw_dterm = -pid->kd * delta_measurement;

    /* 5. First-order low pass filter on D-term to suppress motor high-frequency noise */
    if (pid->dterm_filter_hz > 0.0f) {
        float rc = 1.0f / (2.0f * M_PI_F * pid->dterm_filter_hz);
        float alpha = dt_s / (rc + dt_s);
        pid->filtered_dterm += alpha * (raw_dterm - pid->filtered_dterm);
    } else {
        pid->filtered_dterm = raw_dterm;
    }

    /* 6. Feedforward term */
    float f_term = pid->kf * setpoint;

    /* 7. Total output with saturation clamp */
    float output = p_term + pid->integrator + pid->filtered_dterm + f_term;

    if (output > pid->output_limit) {
        output = pid->output_limit;
    } else if (output < -pid->output_limit) {
        output = -pid->output_limit;
    }

    return output;
}
