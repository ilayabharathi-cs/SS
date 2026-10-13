# SmartShield IoT Security System

SmartShield is an ESP32-S3 based IoT security monitoring system built with PlatformIO and Arduino framework.

## Project Structure (Phase 2 - Modular Firmware)

```
SmartShield-IoT/
│
├── include/
│   ├── config.h          # Global configuration (credentials, pins, rates)
│   ├── led_manager.h     # LED and Buzzer function declarations
│   ├── wifi_manager.h    # Wi-Fi connection manager header
│   └── device_info.h     # System metrics and diagnostics header
│
├── src/
│   ├── main.cpp          # System entry point and lifecycle loop
│   ├── led_manager.cpp   # LED/Buzzer implementation & self-test
│   ├── wifi_manager.cpp  # Wi-Fi connection & status LED logic
│   └── device_info.cpp   # Diagnostic logging implementation
│
├── platformio.ini        # PlatformIO build configuration
└── README.md             # Project documentation
```

## Hardware Pinout
- **Red LED**: GPIO 2
- **Yellow LED**: GPIO 4
- **Green LED**: GPIO 5
- **Active Buzzer**: GPIO 18 (via BC547 transistor)

## Build & Upload Commands
```bash
# Build firmware
pio run

# Upload to ESP32-S3
pio run -t upload

# Open Serial Monitor
pio device monitor -b 115200
```
