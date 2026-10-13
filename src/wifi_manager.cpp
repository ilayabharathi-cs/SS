#include "wifi_manager.h"
#include "config.h"
#include "led_manager.h"

void connectWiFi() {
    Serial.printf("[WIFI] Connecting to '%s'...\n", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    // While connecting: Yellow LED ON
    yellowOn();
    greenOff();
    redOff();

    unsigned long startAttemptTime = millis();

    while (WiFi.status() != WL_CONNECTED && (millis() - startAttemptTime < WIFI_TIMEOUT_MS)) {
        Serial.print(".");
        delay(500);
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        // When connected: Yellow OFF, Green ON
        yellowOff();
        greenOn();
        redOff();
        Serial.print("[WIFI] Connected! IP: ");
        Serial.println(WiFi.localIP());
    } else {
        // When connection fails: Yellow OFF, Red ON
        yellowOff();
        greenOff();
        redOn();
        Serial.printf("[WIFI] Connection Failed! Status code: %d\n", WiFi.status());
    }
}

void reconnectWiFi() {
    if (!isConnected()) {
        connectWiFi();
    }
}

bool isConnected() {
    return WiFi.status() == WL_CONNECTED;
}

IPAddress getIPAddress() {
    return WiFi.localIP();
}

int getRSSI() {
    return WiFi.RSSI();
}
