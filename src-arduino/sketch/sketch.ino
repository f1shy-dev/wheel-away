#include <AccelStepper.h>

const int ledPin = 8;  // LED connected to pin 8

// Define stepper motors
// Motor 1 pins: 4, 5, 6, 7
AccelStepper stepper1(AccelStepper::FULL4WIRE, 6,7,5,4);
// Motor 2 pins: 4, 3, 22, 23
AccelStepper stepper2(AccelStepper::FULL4WIRE, 2,3,22,23);

// Parameters for random movement
const int minSpeed = 500;
const int maxSpeed = 1500;
const int minDistance = 1000;
const int maxDistance = 5000;

void setup() {
  // Initialize serial communication at 9600 baud
  Serial.begin(9600);
  
  // Initialize the LED pin as an output
  pinMode(ledPin, OUTPUT);
  
  // Turn off the LED initially
  digitalWrite(ledPin, LOW);
  
  // Configure stepper motors
  stepper1.setMaxSpeed(1500);
  stepper1.setAcceleration(500);
  stepper2.setMaxSpeed(1500);
  stepper2.setAcceleration(500);
  
  // Send a ready message
  Serial.println("Arduino ready");
}

void loop() {
  // Check if data is available to read
  if (Serial.available() > 0) {
    // Read the incoming byte
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    // Process the command
    if (command == "ON") {
      // Turn on LED
      digitalWrite(ledPin, HIGH);
      Serial.println("LED ON");
      
      // Move motors backward
      stepper1.setSpeed(1000);
      stepper2.setSpeed(1000);
      stepper1.move(-2000);  // Move backward 2000 steps
      stepper2.move(2000);
      
      // Run until they reach position
      while (stepper1.distanceToGo() != 0 || stepper2.distanceToGo() != 0) {
        stepper1.run();
        stepper2.run();
      }
      
      delay(500);  // Short pause
      
      // Move motors forward
      stepper1.move(2000);  // Move forward 2000 steps
      stepper2.move(-2000);
      
      // Run until they reach position
      while (stepper1.distanceToGo() != 0 || stepper2.distanceToGo() != 0) {
        stepper1.run();
        stepper2.run();
      }
      
      // Reset positions
      stepper1.setCurrentPosition(0);
      stepper2.setCurrentPosition(0);
      
      Serial.println("Motors stopped");
    } 
    else if (command == "OFF") {
      digitalWrite(ledPin, LOW);
      Serial.println("LED OFF");
    }
    else if (command == "BLINK") {
      // Blink the LED 3 times
      for (int i = 0; i < 3; i++) {
        digitalWrite(ledPin, HIGH);
        delay(200);
        digitalWrite(ledPin, LOW);
        delay(200);
      }
      Serial.println("LED BLINKED");
    }
    else {
      Serial.println("Unknown command: " + command);
    }
  }
  
  // Small delay to prevent CPU hogging
  delay(10);
}
