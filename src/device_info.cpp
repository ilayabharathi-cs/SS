#include "device_info.h"
#include "config.h"
#include "wifi_manager.h"
#include <WiFi.h>
#include "esp_chip_info.h"

void printDeviceInfo() {
    Serial.println();
    Serial.println("==========================================");
    Serial.println("         SmartShield Device Info          ");
    Serial.println("==========================================");

    Serial.printf("Firmware Version : %s\n", FIRMWARE_VERSION);
    
    esp_chip_info_t chip_info;
    esp_chip_info(&chip_info);
    Serial.printf("ESP32 Chip Model : %s (Revision %d)\n", ESP.getChipModel(), chip_info.revision);
    Serial.printf("CPU Cores        : %d\n", chip_info.cores);
    Serial.printf("CPU Frequency    : %d MHz\n", ESP.getCpuFreqMHz());
    Serial.printf("Flash Size       : %u MB\n", ESP.getFlashChipSize() / (1024 * 1024));
    Serial.printf("PSRAM Size       : %u MB\n", ESP.getPsramSize() / (1024 * 1024));
    Serial.printf("Free Heap        : %u KB\n", ESP.getFreeHeap() / 1024);
    Serial.printf("MAC Address      : %s\n", WiFi.macAddress().c_str());

    if (isConnected()) {
        Serial.println("Wi-Fi Status     : CONNECTED");
        Serial.printf("IP Address       : %s\n", getIPAddress().toString().c_str());
        Serial.printf("RSSI             : %d dBm\n", getRSSI());
    } else {
        Serial.println("Wi-Fi Status     : DISCONNECTED");
    }

    Serial.println("==========================================");
    Serial.println();
}
