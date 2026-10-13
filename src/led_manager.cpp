#include "led_manager.h"
#include "config.h"

void initLEDs() {
    pinMode(RED_LED, OUTPUT);
    pinMode(YELLOW_LED, OUTPUT);
    pinMode(GREEN_LED, OUTPUT);
    allOff();
}

void redOn() {
    digitalWrite(RED_LED, HIGH);
}

void redOff() {
    digitalWrite(RED_LED, LOW);
}

void yellowOn() {
    digitalWrite(YELLOW_LED, HIGH);
}

void yellowOff() {
    digitalWrite(YELLOW_LED, LOW);
}

void greenOn() {
    digitalWrite(GREEN_LED, HIGH);
}

void greenOff() {
    digitalWrite(GREEN_LED, LOW);
}

void allOff() {
    digitalWrite(RED_LED, LOW);
    digitalWrite(YELLOW_LED, LOW);
    digitalWrite(GREEN_LED, LOW);
}

void selfTest() {
    allOff();
    
    // Red ON -> 500 ms
    redOn();
    delay(500);
    redOff();
    
    // Yellow ON -> 500 ms
    yellowOn();
    delay(500);
    yellowOff();
    
    // Green ON -> 500 ms
    greenOn();
    delay(500);
    greenOff();
    
    allOff();
}

void initBuzzer() {
    pinMode(BUZZER, OUTPUT);
    buzzerOff();
}

void buzzerOn() {
    digitalWrite(BUZZER, HIGH);
}

void buzzerOff() {
    digitalWrite(BUZZER, LOW);
}

void buzzerBeep(unsigned int durationMs) {
    buzzerOn();
    delay(durationMs);
    buzzerOff();
}
