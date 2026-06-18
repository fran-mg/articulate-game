import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useForeheadDetector,
  useTiltControl,
} from "../../../hooks/useTiltControl";
import { useGameStore } from "../../../stores/useGameStore";
import { getModeTheme } from "../../../utils/_modeTheme";
import { useSoundManager } from "../../../hooks/useSoundManager";
import CountdownScreen from "./_CountdownScreen";
import PlayingCard from "./_PlayingCard";
import ProgressBar from "./_ProgressBar";
import TimeUpScreen from "./_TimeUpScreen";
import WaitingForehead from "./_WaitingForehead";

export type CardFlashState = "default" | "pass" | "done";

export default function PlayScreen() {
  const router = useRouter();

  const { playSound } = useSoundManager([
    "countdown",
    "time_up",
    "correct",
    "pass",
  ]);

  const [dims, setDims] = useState(Dimensions.get("window"));

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ window }) =>
      setDims(window),
    );
    return () => sub?.remove();
  }, []);

  const isLandscape = dims.width > dims.height;

  const {
    mode,
    participants,
    currentTurnIndex,
    cardsInRound,
    currentCardIndex,
    timerDuration,
    startTurn,
    endTurn,
    recordCardResult,
    nextCard,
  } = useGameStore();

  const { meta } = getModeTheme(mode);

  const [gameState, setGameState] = useState<
    "waiting-forehead" | "countdown" | "playing" | "timeup"
  >();
  const [countdown, setCountdown] = useState(3);
  const [flashState, setFlashState] = useState<CardFlashState>("default");
  const [displayTime, setDisplayTime] = useState(timerDuration);

  const latestFlashState = useRef<CardFlashState>(flashState);
  latestFlashState.current = flashState;

  const progress = useSharedValue(1);
  const currentEntity = participants[currentTurnIndex];
  const currentCard = cardsInRound[currentCardIndex];
  const continuousIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;
    const applyOrientation = async () => {
      try {
        if (meta.orientation === "landscape") {
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.LANDSCAPE,
          );
        } else if (meta.orientation === "portrait") {
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT_UP,
          );
        } else {
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.ALL,
          );
        }
      } catch (error) {
        console.log("Orientation lock bypassed: Not supported.");
      } finally {
        if (isMounted) {
          setGameState(
            meta.orientation === "landscape" ? "waiting-forehead" : "countdown",
          );
        }
      }
    };

    applyOrientation();

    return () => {
      isMounted = false;
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      ).catch(() => {});
    };
  }, [meta.orientation]);

  useEffect(() => {
    let countInterval: ReturnType<typeof setInterval>;
    if (gameState === "countdown") {
      startTurn();
      setCountdown(3);
      setDisplayTime(timerDuration);
      progress.value = 1;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      playSound("countdown");

      countInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countInterval);
            setGameState("playing");
            return 0;
          }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countInterval) clearInterval(countInterval);
    };
  }, [gameState, timerDuration, startTurn, progress]);

  useEffect(() => {
    if (gameState === "playing") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      progress.value = withTiming(
        0,
        { duration: timerDuration * 1000, easing: Easing.linear },
        (finished) => {
          if (finished) runOnJS(triggerTimeUp)();
        },
      );

      continuousIntervalRef.current = setInterval(() => {
        setDisplayTime((prev) => {
          if (prev <= 1) {
            if (continuousIntervalRef.current)
              clearInterval(continuousIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (continuousIntervalRef.current)
        clearInterval(continuousIntervalRef.current);
    };
  }, [gameState, timerDuration, progress]);

  const triggerTimeUp = () => {
    setGameState("timeup");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    playSound("time_up");

    // Record currently visible card as a "pass" before ending the turn.
    const state = useGameStore.getState();
    const latestCard = state.cardsInRound[state.currentCardIndex];
    if (latestFlashState.current === "default" && latestCard) {
      // If the flash state isn't default, it means they clicked "pass" or "got it" right at the buzzer.
      state.recordCardResult(latestCard.id, latestCard.word, "passed");
    }

    setTimeout(() => {
      endTurn();
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
      router.replace("/game/round-summary" as any);
    }, 1500);
  };

  useForeheadDetector(gameState === "waiting-forehead", () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setGameState("countdown");
  });

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: progress.value * dims.width,
  }));

  const handleAction = (action: "guessed" | "passed") => {
    if (gameState !== "playing" || flashState !== "default" || !currentCard)
      return;

    setFlashState(action === "guessed" ? "done" : "pass");

    playSound(action === "guessed" ? "correct" : "pass");

    Haptics.impactAsync(
      action === "guessed"
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Medium,
    );
    recordCardResult(currentCard.id, currentCard.word, action);

    setTimeout(() => {
      setFlashState("default");
      if (currentCardIndex + 1 >= cardsInRound.length) {
        cancelAnimation(progress);
        if (continuousIntervalRef.current)
          clearInterval(continuousIntervalRef.current);
        triggerTimeUp();
      } else {
        nextCard();
      }
    }, 200);
  };

  useTiltControl(
    gameState === "playing" && flashState === "default" && meta.usesTilt,
    () => handleAction("passed"),
    () => handleAction("guessed"),
  );

  if (gameState === "waiting-forehead") return <WaitingForehead />;
  if (gameState === "countdown")
    return (
      <CountdownScreen entityName={currentEntity?.name} countdown={countdown} />
    );
  if (gameState === "timeup") return <TimeUpScreen />;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#020617" }}
      edges={["left", "right", "bottom", "top"]}
    >
      <ProgressBar animatedStyle={animatedProgressStyle} />

      <View
        style={{
          paddingVertical: isLandscape ? 40 : 50,
          paddingHorizontal: isLandscape ? 20 : 10,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <PlayingCard
          currentCard={currentCard}
          flashState={flashState}
          mode={mode}
          displayTime={displayTime}
          timerDuration={timerDuration}
          onAction={handleAction}
          showButtons={meta.showsButtons}
        />
      </View>
    </SafeAreaView>
  );
}
