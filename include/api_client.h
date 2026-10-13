#ifndef API_CLIENT_H
#define API_CLIENT_H

#include <Arduino.h>

bool sendHeartbeat();
bool fetchSecurityState();
bool hasUntrustedDevicesDetected();
bool hasAttackAlertDetected();

#endif // API_CLIENT_H
