#ifndef LED_MANAGER_H
#define LED_MANAGER_H

#include <Arduino.h>

// LED Control Functions
void initLEDs();
void redOn();
void redOff();
void yellowOn();
void yellowOff();
void greenOn();
void greenOff();
void allOff();
void selfTest();

// Buzzer Control Functions
void initBuzzer();
void buzzerOn();
void buzzerOff();
void buzzerBeep(unsigned int durationMs = 100);

#endif // LED_MANAGER_H
