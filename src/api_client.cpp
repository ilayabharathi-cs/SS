#include "api_client.h"
#include "security_state.h"
#include "config.h"
#include "wifi_manager.h"
#include "led_manager.h"
#include <WiFi.h>
#include <HTTPClient.h>

static bool g_hasUntrustedDevices = false;
static bool g_hasAttackAlert = false;

bool hasUntrustedDevicesDetected() {
    return g_hasUntrustedDevices;
}

bool hasAttackAlertDetected() {
    return g_hasAttackAlert;
}

bool fetchSecurityState() {
    if (!isConnected()) {
        return false;
    }

    HTTPClient http;
    String url = "http://" + String(API_HOST) + ":" + String(API_PORT) + "/api/security/state";
    
    http.begin(url);
    http.setTimeout(3000);

    int httpResponseCode = http.GET();
    bool success = false;

    if (httpResponseCode == HTTP_CODE_OK || httpResponseCode == 200) {
        String responseStr = http.getString();
        success = true;

        if (responseStr.indexOf("\"CRITICAL_THREAT\"") != -1) {
            g_hasAttackAlert = true;
            g_hasUntrustedDevices = false;
            setSecurityState(CRITICAL_THREAT);
        } else if (responseStr.indexOf("\"UNKNOWN_DEVICE\"") != -1) {
            g_hasAttackAlert = false;
            g_hasUntrustedDevices = true;
            setSecurityState(UNKNOWN_DEVICE);
        } else {
            g_hasAttackAlert = false;
            g_hasUntrustedDevices = false;
            setSecurityState(NORMAL);
        }
    }

    http.end();
    return success;
}

bool sendHeartbeat() {
    if (!isConnected()) {
        Serial.println("[API] Cannot send heartbeat: Wi-Fi Disconnected!");
        return false;
    }

    Serial.println("\n[API] Sending heartbeat...");

    HTTPClient http;
    
    // Construct target URL dynamically from config
    String url = "http://" + String(API_HOST) + ":" + String(API_PORT) + String(API_HEARTBEAT_PATH);
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(4000); // 4-second timeout to prevent indefinite blocking

    // Collect device metrics
    String ipStr = getIPAddress().toString();
    String macStr = WiFi.macAddress();
    int rssiVal = getRSSI();

    // Construct JSON payload matching FastAPI schema
    String jsonPayload = "{";
    jsonPayload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
    jsonPayload += "\"ip\":\"" + ipStr + "\",";
    jsonPayload += "\"mac\":\"" + macStr + "\",";
    jsonPayload += "\"rssi\":" + String(rssiVal) + ",";
    jsonPayload += "\"firmware\":\"" + String(FIRMWARE_VERSION) + "\",";
    jsonPayload += "\"status\":\"online\"";
    jsonPayload += "}";

    int httpResponseCode = http.POST(jsonPayload);

    bool success = false;
    bool hasUntrusted = false;
    bool hasAttack = false;

    if (httpResponseCode > 0) {
        Serial.printf("[API] HTTP Status: %d\n", httpResponseCode);
        if (httpResponseCode == HTTP_CODE_OK || httpResponseCode == 201) {
            String responseStr = http.getString();
            Serial.println("[API] Heartbeat accepted");
            success = true;

            if (responseStr.indexOf("\"has_untrusted_devices\":true") != -1 ||
                responseStr.indexOf("\"has_untrusted_devices\": true") != -1) {
                hasUntrusted = true;
            }

            if (responseStr.indexOf("\"has_attack_alert\":true") != -1 ||
                responseStr.indexOf("\"has_attack_alert\": true") != -1) {
                hasAttack = true;
            }
        } else {
            Serial.printf("[API] Heartbeat rejected by server. Response: %s\n", http.getString().c_str());
        }
    } else {
        Serial.printf("[API] Heartbeat failed. Error: %s\n", http.errorToString(httpResponseCode).c_str());
    }

    http.end();

    // Update global alert states
    g_hasUntrustedDevices = hasUntrusted;
    g_hasAttackAlert = hasAttack;

    if (g_hasAttackAlert) {
        setSecurityState(CRITICAL_THREAT);
    } else if (g_hasUntrustedDevices) {
        setSecurityState(UNKNOWN_DEVICE);
    } else {
        setSecurityState(NORMAL);
    }

    return success;
}
