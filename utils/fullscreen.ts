import { Platform } from "react-native";

export const enterFullScreen = () => {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  try {
    const elem = document.documentElement as any;

    // Some browsers require a slight delay if the user interaction is tied to navigation
    setTimeout(() => {
      const requestMethod =
        elem.requestFullscreen ||
        elem.webkitRequestFullscreen ||
        elem.webkitRequestFullScreen ||
        elem.mozRequestFullScreen ||
        elem.msRequestFullscreen;

      if (requestMethod) {
        requestMethod.call(elem).catch((err: any) => {
          console.log("Fullscreen blocked (Likely iOS Safari):", err.message);
        });
      }
    }, 50);
  } catch (e) {
    console.warn("Fullscreen API failed", e);
  }
};
