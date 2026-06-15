import { createAudioPlayer } from "expo-audio";
import { Asset } from "expo-asset";

// 1. STATIC ASSETS: This guarantees the files are bundled into the APK.
const audioSources = {
  bin: require("../assets/audio/bin.m4a"),
  card_flip: require("../assets/audio/card_flip.mp3"),
  click: require("../assets/audio/click.m4a"),
  correct: require("../assets/audio/correct.m4a"),
  countdown: require("../assets/audio/countdown_3_ticks_go.m4a"),
  download: require("../assets/audio/download_staple.m4a"),
  score_reveal: require("../assets/audio/loud_score_reveal.m4a"),
  pass: require("../assets/audio/pass.m4a"),
  soft_score_reveal: require("../assets/audio/soft_score_reveal.m4a"),
  time_up: require("../assets/audio/time_up_buzzer.m4a"),
};

export type SoundKey = keyof typeof audioSources;

// 2. THE CACHE: We store players here.
// When the app opens, this is empty. ZERO decoders are loaded, preventing the startup crash.
const playerCache: Partial<Record<SoundKey, any>> = {};

// We accept the requestedSounds array to keep compatibility with your components,
// but we don't actually need to use it anymore because we are lazy loading!
export const useSoundManager = (requestedSounds?: SoundKey[]) => {
  const playSound = async (soundName: SoundKey) => {
    try {
      if (!playerCache[soundName]) {
        // Extract the physical file path using expo-asset
        const [asset] = await Asset.loadAsync(audioSources[soundName]);
        const nativeUri = asset.localUri || asset.uri;

        if (!nativeUri) {
          console.error(`Could not resolve native URI for sound: ${soundName}`);
          return;
        }

        // Pass the resolved file track to the sound instance creator
        playerCache[soundName] = createAudioPlayer(nativeUri);
      }

      const player = playerCache[soundName];
      if (player) {
        // 1. Verify the function exists
        if (typeof player.seekTo === "function") {
          try {
            // 2. Await the call so it finishes before player.play() is called
            // Try the standard SDK 54 number format first
            await player.seekTo(0);
          } catch {
            // Fallback for object-based syntax variations
            await player.seekTo({ position: 0 });
          }
        }
        player.play();
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  return { playSound };
};
