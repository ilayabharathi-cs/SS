#include "security_state.h"
#include "config.h"
#include "led_manager.h"

static SecurityState g_currentState = NORMAL;

// Non-blocking timing variables for UNKNOWN_DEVICE buzzer pattern
static unsigned long g_lastBuzzerToggle = 0;
static bool g_buzzerState = false;

void initSecurityState() {
    initLEDs();
    initBuzzer();
    g_currentState = NORMAL;
    g_lastBuzzerToggle = 0;
    g_buzzerState = false;
    allOff();
    buzzerOff();
}

void setSecurityState(SecurityState state) {
    if (g_currentState != state) {
        g_currentState = state;
        g_lastBuzzerToggle = 0;
        g_buzzerState = false;
        
        Serial.printf("[SECURITY_STATE] State changed to: %s\n", getSecurityStateString());
        
        // Reset outputs immediately on state transition
        allOff();
        buzzerOff();
    }
}

SecurityState getSecurityState() {
    return g_currentState;
}

const char* getSecurityStateString() {
    switch (g_currentState) {
        case NORMAL: return "NORMAL";
        case UNKNOWN_DEVICE: return "UNKNOWN_DEVICE";
        case CRITICAL_THREAT: return "CRITICAL_THREAT";
        default: return "UNKNOWN";
    }
}

void updateSecurityState() {
    unsigned long currentMillis = millis();

    switch (g_currentState) {
        case NORMAL:
            // State 1: Normal -> GREEN LED ON, Yellow OFF, Red OFF, Buzzer OFF
            greenOn();
            yellowOff();
            redOff();
            buzzerOff();
            g_buzzerState = false;
            break;

        case UNKNOWN_DEVICE:
            // State 2: Unknown/Untrusted Device -> YELLOW LED ON, Green OFF, Red OFF
            greenOff();
            yellowOn();
            redOff();

            // Non-blocking buzzer timing: Beep 200ms -> Wait 3000ms -> Repeat
            if (g_buzzerState) {
                // Currently beeping (Buzzer ON)
                if (currentMillis - g_lastBuzzerToggle >= 200) {
                    buzzerOff();
                    g_buzzerState = false;
                    g_lastBuzzerToggle = currentMillis;
                }
            } else {
                // Currently silent (Buzzer OFF)
                if (currentMillis - g_lastBuzzerToggle >= 3000) {
                    buzzerOn();
                    g_buzzerState = true;
                    g_lastBuzzerToggle = currentMillis;
                }
            }
            break;

        case CRITICAL_THREAT:
            // State 3: Security Attack / Critical Threat -> RED LED ON, Green OFF, Yellow OFF, Buzzer CONTINUOUS ON
            greenOff();
            yellowOff();
            redOn();
            buzzerOn();
            g_buzzerState = true;
            break;
    }
}
