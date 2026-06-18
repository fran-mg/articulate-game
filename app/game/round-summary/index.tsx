import { useRouter } from "expo-router";
import * as LucideIcons from "lucide-react-native";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGameStore } from "../../../stores/useGameStore";
import { getModeAccent } from "../../../utils/_modeTheme";
import { useSoundManager } from "../../../hooks/useSoundManager";
import { useDeckStore } from "../../../stores/useDeckStore";
import { useAppAlert } from "../../_AppAlert";

import HistoryList from "./_HistoryList";
import Modals from "./_Modals";
import ScoreHeader from "./_ScoreHeader";

export default function RoundSummaryScreen() {
  const router = useRouter();
  const gameStore = useGameStore();
  const { showAlert, AlertRender } = useAppAlert(); // Initialize alert

  const {
    mode,
    playStyle,
    participants,
    currentTurnIndex,
    currentRound,
    targetLimit,
    turnHistory,
    turnScore,
    turnPasses,
    roundScores,
    scoringStyle,
    timerDuration,
  } = gameStore;

  const accent = getModeAccent(mode);
  const { playSound } = useSoundManager(["click"]);

  const [editLimit, setEditLimit] = useState<number | "Infinity">(targetLimit);
  const [editTimer, setEditTimer] = useState<number>(timerDuration);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const currentEntity = participants[currentTurnIndex];

  const isLastTurnOfRound = currentTurnIndex === participants.length - 1;
  const nextRound = isLastTurnOfRound ? currentRound + 1 : currentRound;
  const hasLimit = targetLimit !== "Infinity";

  const isMatchOver =
    isLastTurnOfRound && hasLimit && currentRound >= targetLimit;
  const isNextRoundFinal =
    isLastTurnOfRound && hasLimit && nextRound === targetLimit;

  const nextEntity = participants[(currentTurnIndex + 1) % participants.length];

  // ── REBUILT: Make async to fetch new shuffled cards per turn
  const handleNext = async () => {
    playSound("click");
    if (isMatchOver) {
      router.replace("/game/match-summary" as any);
    } else {
      // 1. Fetch newly shuffled cards based on *current* deck selections
      await useDeckStore.getState().loadCardsForSelectedDecks();
      const freshCards = useDeckStore.getState().currentCards;

      // 2. Prevent progression if they unticked all decks in the settings modal
      if (freshCards.length === 0) {
        showAlert(
          "No Decks Selected",
          "Please open settings (top left) and select at least one deck to continue.",
        );
        return;
      }

      // 3. Update game store with the new shuffled cards for this upcoming turn
      useGameStore.setState((state) => ({
        currentTurnIndex:
          state.currentTurnIndex === participants.length - 1
            ? 0
            : state.currentTurnIndex + 1,
        currentRound:
          state.currentTurnIndex === participants.length - 1
            ? state.currentRound + 1
            : state.currentRound,
        cardsInRound: freshCards,
      }));

      router.replace("/game/play" as any);
    }
  };

  const handleSaveSettings = () => {
    // Clamp limit: rounds mode cannot go below currentRound
    let newLim: number | "Infinity" = editLimit;
    if (editLimit !== "Infinity") {
      const parsed = typeof editLimit === "number" ? editLimit : currentRound;
      if (scoringStyle === "rounds")
        newLim = Math.min(20, Math.max(currentRound, parsed));
      else newLim = Math.min(30, Math.max(5, parsed));
    }

    // Clamp timer
    const newTimer = Math.min(180, Math.max(10, editTimer));

    gameStore.updateSettingsMidGame({
      targetLimit: newLim,
      timerDuration: newTimer,
    });

    // Sync local state to clamped values so UI stays consistent
    setEditLimit(newLim);
    setEditTimer(newTimer);
    setShowSettingsModal(false);
  };

  // Re-open the modal with fresh store values each time
  const handleOpenSettings = () => {
    setEditLimit(gameStore.targetLimit);
    setEditTimer(gameStore.timerDuration);
    setShowSettingsModal(true);
  };

  const headerText = isLastTurnOfRound
    ? `Round ${currentRound} Complete`
    : `Round ${currentRound}`;

  const getButtonText = () => {
    if (isMatchOver) return "Reveal Final Scores";
    const entityName = nextEntity?.name ?? "Next";
    if (isNextRoundFinal) return `${entityName} — Start Final Round`;
    if (isLastTurnOfRound) return `${entityName} — Start Round ${nextRound}`;
    return `${entityName} — Start Turn`;
  };
  const buttonText = getButtonText();

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-row justify-between px-6 pt-4">
        <TouchableOpacity onPress={handleOpenSettings}>
          <LucideIcons.Settings color="#94A3B8" size={28} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowExitModal(true)}>
          <LucideIcons.DoorOpen color="#EF4444" size={28} />
        </TouchableOpacity>
      </View>

      <ScoreHeader
        headerText={headerText}
        currentEntity={currentEntity}
        roundScores={roundScores}
        turnPasses={turnPasses}
        turnScore={turnScore}
      />

      <HistoryList
        turnHistory={turnHistory}
        toggleHistoryResult={gameStore.toggleHistoryResult}
      />

      <View className="p-6 pt-2">
        <TouchableOpacity
          onPress={handleNext}
          className="bg-blue-600 rounded-2xl py-5 items-center shadow-lg"
        >
          <Text className="text-white font-black text-lg uppercase tracking-wide">
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>

      <Modals
        showExitModal={showExitModal}
        setShowExitModal={setShowExitModal}
        showSettingsModal={showSettingsModal}
        setShowSettingsModal={setShowSettingsModal}
        editLimit={editLimit}
        setEditLimit={setEditLimit}
        editTimer={editTimer}
        setEditTimer={setEditTimer}
        currentRound={currentRound}
        scoringStyle={scoringStyle}
        accent={accent}
        handleSaveSettings={handleSaveSettings}
      />

      {/* Render Alert Overlay */}
      {AlertRender}
    </SafeAreaView>
  );
}
