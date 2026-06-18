import { useEffect } from "react";

export function useAutoUpdates() {
  useEffect(() => {
    // 1. Make sure we are actually in a browser that supports Service Workers
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        // 2. Force the browser to ping your server/GitHub for a new version
        registration.update();

        // 3. Listen for a new version downloading in the background
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              // 4. If the new version finishes downloading, prompt the user!
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // Using standard browser confirm dialog for simplicity
                if (
                  window.confirm(
                    "A new update of Rumble is available! Reload to apply?",
                  )
                ) {
                  // Nuke the old PWA caches
                  caches.keys().then((names) => {
                    for (let name of names) caches.delete(name);
                  });

                  // Force a hard refresh to load the new code
                  window.location.reload();
                }
              }
            });
          }
        });
      }
    });
  }, []);
}
