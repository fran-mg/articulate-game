import { createAudioPlayer } from "expo-audio";
import { Asset } from "expo-asset";

const audioSources = {
  bin: require("../assets/audio/bin.m4a"),
  card_flip: require("../assets/audio/card_flip.mp3"),
  click: require("../assets/audio/click.m4a"),
  correct: require("../assets/audio/correct.m4a"),
  countdown_tick: require("../assets/audio/countdown_tick.m4a"),
  countdown_go: require("../assets/audio/countdown_go.m4a"),
  download: require("../assets/audio/download_staple.m4a"),
  score_reveal: require("../assets/audio/loud_score_reveal.m4a"),
  pass: require("../assets/audio/pass.m4a"),
  soft_score_reveal: require("../assets/audio/soft_score_reveal.m4a"),
  time_up: require("../assets/audio/time_up_buzzer.m4a"),
};

export type SoundKey = keyof typeof audioSources;

const playerCache: Partial<Record<SoundKey, any>> = {};

export const useSoundManager = (requestedSounds?: SoundKey[]) => {
  const playSound = async (soundName: SoundKey) => {
    try {
      if (!playerCache[soundName]) {
        const [asset] = await Asset.loadAsync(audioSources[soundName]);
        let nativeUri = asset.localUri || asset.uri;

        if (!nativeUri) {
          console.error(`Could not resolve native URI for sound: ${soundName}`);
          return;
        }

        // Converts "file:///data/user/0/..." into a clean path "/data/user/0/..."
        if (nativeUri.startsWith("file://")) {
          nativeUri = nativeUri.replace(/^file:\/\//, "");
        }

        playerCache[soundName] = createAudioPlayer({ uri: nativeUri });
      }

      const player = playerCache[soundName];
      if (player) {
        if (typeof player.seekTo === "function") {
          try {
            await player.seekTo(0);
          } catch {
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
