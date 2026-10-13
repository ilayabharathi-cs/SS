#ifndef CONFIG_H
#define CONFIG_H

// Firmware configuration
#define FIRMWARE_VERSION "1.0"
#define DEVICE_ID "smartshield-01"

// Wi-Fi configuration
#define WIFI_SSID "Red"
#define WIFI_PASS "112233445566"
#define WIFI_TIMEOUT_MS 15000

// API Configuration
#define API_HOST "10.204.56.120"
#define API_PORT 8000
#define API_HEARTBEAT_PATH "/api/device/heartbeat"
#define HEARTBEAT_INTERVAL 10000

// GPIO Pin mappings
#define RED_LED     2
#define YELLOW_LED  4
#define GREEN_LED   5
#define BUZZER      18

// Serial configuration
#define SERIAL_BAUD 115200

#endif // CONFIG_H
