// hooks/useTiltControl.ts
import { Accelerometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

type TiltDirection = "up" | "down" | "center";

export function useTiltControl(
  isActive: boolean,
  onTiltUp: () => void, // Face to Sky -> Pass
  onTiltDown: () => void, // Face to Floor -> Correct
) {
  const [tilt, setTilt] = useState<TiltDirection>("center");
  const isCooldown = useRef(false);

  // Use refs for callbacks so we don't constantly recreate the sensor listener
  const upRef = useRef(onTiltUp);
  const downRef = useRef(onTiltDown);

  useEffect(() => {
    upRef.current = onTiltUp;
    downRef.current = onTiltDown;
  }, [onTiltUp, onTiltDown]);

  useEffect(() => {
    if (!isActive || Platform.OS === "web") {
      return;
    }

    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener(({ z }) => {
      if (isCooldown.current) return;

      // Higher threshold means less sensitive - user must deliberately tilt
      const threshold = 0.65;

      // Z < -0.65: Phone screen is facing the floor (Tilt Down -> Correct)
      if (z < -threshold && tilt !== "down") {
        setTilt("down");
        triggerAction(downRef.current);
      }
      // Z > 0.65: Phone screen is facing the sky (Tilt Up -> Pass)
      else if (z > threshold && tilt !== "up") {
        setTilt("up");
        triggerAction(upRef.current);
      }
      // Z between -0.4 and 0.4: Phone is back upright on the forehead
      else if (z >= -0.4 && z <= 0.4 && tilt !== "center") {
        setTilt("center");
      }
    });

    return () => subscription.remove();
  }, [isActive, tilt]);

  const triggerAction = (action: () => void) => {
    isCooldown.current = true;
    action();
    setTimeout(() => {
      isCooldown.current = false;
    }, 400); // 400ms cooldown before next tilt is allowed
  };

  return tilt;
}

export function useForeheadDetector(isActive: boolean, onDetected: () => void) {
  const onDetectedRef = useRef(onDetected);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    if (!isActive || Platform.OS === "web") {
      return;
    }

    Accelerometer.setUpdateInterval(100);
    let triggered = false;
    let consecutiveFrames = 0;
    const requiredFrames = 6; // Requires phone to be held steady for 600ms (6 * 100ms)

    const sub = Accelerometer.addListener(({ x, z }) => {
      if (triggered) return;

      // Landscape upright check:
      // Math.abs(x) > 0.7 ensures it's horizontally level (left or right edge down)
      // Math.abs(z) < 0.3 ensures the screen is roughly perfectly vertical
      if (Math.abs(x) > 0.7 && Math.abs(z) < 0.3) {
        consecutiveFrames++;
        if (consecutiveFrames >= requiredFrames) {
          triggered = true;
          onDetectedRef.current();
        }
      } else {
        consecutiveFrames = 0; // Reset count if phone is wobbling or being swung
      }
    });

    return () => sub.remove();
  }, [isActive]);
}
