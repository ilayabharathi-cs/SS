#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>

void connectWiFi();
void reconnectWiFi();
bool isConnected();
IPAddress getIPAddress();
int getRSSI();

#endif // WIFI_MANAGER_H
