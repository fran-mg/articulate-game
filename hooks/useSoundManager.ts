import { useAudioPlayer } from "expo-audio";

// 1. STATICALLY map all assets so EAS packs them into the APK
// The keys here exactly match the strings you pass to playSound() in your app!
const audioSources = {
  bin: require("../assets/audio/bin.m4a"),
  card_flip: require("../assets/audio/card_flip.mp3"),
  click: require("../assets/audio/click.m4a"),
  correct: require("../assets/audio/correct.m4a"),
  countdown: require("../assets/audio/countdown-3-ticks-go.m4a"),
  download: require("../assets/audio/download_staple.m4a"),
  score_reveal: require("../assets/audio/loud_score_reveal.m4a"),
  pass: require("../assets/audio/pass.m4a"),
  soft_score_reveal: require("../assets/audio/soft_score_reveal.m4a"),
  time_up: require("../assets/audio/time_up_buzzer.m4a"),
};

export type SoundKey = keyof typeof audioSources;

// 2. Selective Loading Hook
export const useSoundManager = (requestedSounds: SoundKey[]) => {
  // By passing `null` to the sounds we DON'T need for the current screen,
  // we prevent Android from hitting the hardware decoder limit!
  const players = {
    bin: useAudioPlayer(
      requestedSounds.includes("bin") ? audioSources.bin : null,
    ),
    card_flip: useAudioPlayer(
      requestedSounds.includes("card_flip") ? audioSources.card_flip : null,
    ),
    click: useAudioPlayer(
      requestedSounds.includes("click") ? audioSources.click : null,
    ),
    correct: useAudioPlayer(
      requestedSounds.includes("correct") ? audioSources.correct : null,
    ),
    countdown: useAudioPlayer(
      requestedSounds.includes("countdown") ? audioSources.countdown : null,
    ),
    download: useAudioPlayer(
      requestedSounds.includes("download") ? audioSources.download : null,
    ),
    score_reveal: useAudioPlayer(
      requestedSounds.includes("score_reveal")
        ? audioSources.score_reveal
        : null,
    ),
    pass: useAudioPlayer(
      requestedSounds.includes("pass") ? audioSources.pass : null,
    ),
    soft_score_reveal: useAudioPlayer(
      requestedSounds.includes("soft_score_reveal")
        ? audioSources.soft_score_reveal
        : null,
    ),
    time_up: useAudioPlayer(
      requestedSounds.includes("time_up") ? audioSources.time_up : null,
    ),
  };

  const playSound = (soundName: SoundKey) => {
    try {
      const player = players[soundName];
      if (player) {
        if (typeof player.seekTo === "function") {
          player.seekTo(0);
        }
        player.play();
      } else {
        console.warn(`Sound "${soundName}" was not requested by this screen.`);
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  return { playSound };
};
