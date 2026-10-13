#include <Arduino.h>
#include "config.h"
#include "led_manager.h"
#include "wifi_manager.h"
#include "device_info.h"
#include "api_client.h"
#include "security_state.h"

void setup() {
    // 1. Serial initialization
    Serial.begin(SERIAL_BAUD);
    
    // Wait up to 4 seconds for Serial monitor connection (ESP32-S3 CDC)
    unsigned long start = millis();
    while (!Serial && (millis() - start < 4000)) {
        delay(10);
    }
    delay(500);

    Serial.println("\n[SYSTEM] Starting SmartShield Security State Firmware...");

    // 2. Initialize Security State Manager (LEDs & Buzzer)
    initSecurityState();

    // 3. LED self-test
    Serial.println("[SYSTEM] Running LED self-test...");
    selfTest();

    // 4. Buzzer test
    Serial.println("[SYSTEM] Running Buzzer test...");
    buzzerBeep(150);

    // 5. Wi-Fi connection
    connectWiFi();

    // 6. Device information
    printDeviceInfo();

    // 7. Initial security state fetch & heartbeat telemetry
    if (isConnected()) {
        fetchSecurityState();
        sendHeartbeat();
    }
}

void loop() {
    static unsigned long lastHealthCheck = 0;
    static unsigned long lastHeartbeat = 0;
    static unsigned long lastStateFetch = 0;
    unsigned long currentMillis = millis();

    // 1. Non-blocking hardware LED & Buzzer state controller (runs on every iteration)
    if (isConnected()) {
        updateSecurityState();
    }

    // 2. Periodic system health check every 5 seconds
    if (currentMillis - lastHealthCheck >= 5000) {
        lastHealthCheck = currentMillis;

        if (!isConnected()) {
            Serial.println("[HEALTH WARNING] Wi-Fi Disconnected! Attempting reconnection...");
            allOff();
            buzzerOff();
            reconnectWiFi();
        }
    }

    // 3. Non-blocking security state sync from FastAPI every 3 seconds
    if (currentMillis - lastStateFetch >= 3000) {
        lastStateFetch = currentMillis;
        if (isConnected()) {
            fetchSecurityState();
        }
    }

    // 4. Periodic telemetry heartbeat every 10 seconds (HEARTBEAT_INTERVAL)
    if (currentMillis - lastHeartbeat >= HEARTBEAT_INTERVAL) {
        lastHeartbeat = currentMillis;
        if (isConnected()) {
            sendHeartbeat();
        }
    }
}