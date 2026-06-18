import { useEffect, useRef, useState } from "react";

type TiltDirection = "up" | "down" | "center";

export function useTiltControl(
  isActive: boolean,
  onTiltUp: () => void,
  onTiltDown: () => void,
) {
  const [tilt, setTilt] = useState<TiltDirection>("center");
  const isCooldown = useRef(false);
  const upRef = useRef(onTiltUp);
  const downRef = useRef(onTiltDown);

  useEffect(() => {
    upRef.current = onTiltUp;
    downRef.current = onTiltDown;
  }, [onTiltUp, onTiltDown]);

  useEffect(() => {
    // If we are on a desktop without motion sensors, do nothing
    if (!isActive || typeof window === "undefined" || !window.DeviceMotionEvent)
      return;

    const handleMotion = (event: DeviceMotionEvent) => {
      if (isCooldown.current) return;

      let z = event.accelerationIncludingGravity?.z;
      if (z === null || z === undefined) return;

      // Translate HTML5 m/s^2 into Expo G-force (-1 to 1)
      z = z / 9.81;

      const threshold = 0.65;
      if (z < -threshold && tilt !== "down") {
        setTilt("down");
        triggerAction(downRef.current);
      } else if (z > threshold && tilt !== "up") {
        setTilt("up");
        triggerAction(upRef.current);
      } else if (z >= -0.4 && z <= 0.4 && tilt !== "center") {
        setTilt("center");
      }
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [isActive, tilt]);

  const triggerAction = (action: () => void) => {
    isCooldown.current = true;
    action();
    setTimeout(() => {
      isCooldown.current = false;
    }, 400);
  };
  return tilt;
}

export function useForeheadDetector(isActive: boolean, onDetected: () => void) {
  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    if (!isActive || typeof window === "undefined" || !window.DeviceMotionEvent)
      return;

    let triggered = false;
    let consecutiveFrames = 0;
    // Web devicemotion fires ~60 times a second.
    // 35 frames at 60hz = approx 600ms (matching the native Expo timing!)
    const requiredFrames = 35;

    const handleMotion = (event: DeviceMotionEvent) => {
      if (triggered) return;

      let x = event.accelerationIncludingGravity?.x;
      let z = event.accelerationIncludingGravity?.z;
      if (x === null || x === undefined || z === null || z === undefined)
        return;

      x = x / 9.81;
      z = z / 9.81;

      if (Math.abs(x) > 0.7 && Math.abs(z) < 0.3) {
        consecutiveFrames++;
        if (consecutiveFrames >= requiredFrames) {
          triggered = true;
          onDetectedRef.current();
        }
      } else {
        consecutiveFrames = 0;
      }
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [isActive]);
}
