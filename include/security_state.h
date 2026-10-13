#ifndef SECURITY_STATE_H
#define SECURITY_STATE_H

#include <Arduino.h>

enum SecurityState {
    NORMAL,
    UNKNOWN_DEVICE,
    CRITICAL_THREAT
};

// Security State Manager API
void initSecurityState();
void setSecurityState(SecurityState state);
SecurityState getSecurityState();
const char* getSecurityStateString();
void updateSecurityState(); // Non-blocking millis()-based hardware state controller

#endif // SECURITY_STATE_H
