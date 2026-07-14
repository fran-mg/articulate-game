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
  const { showAlert, AlertRender } = useAppAlert();

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

  // In 'just_play', there's only 1 participant, so it is ALWAYS the last turn of the round.
  const isLastTurnOfRound = currentTurnIndex === participants.length - 1;
  const nextRound = isLastTurnOfRound ? currentRound + 1 : currentRound;
  const hasLimit = targetLimit !== "Infinity";

  const isMatchOver =
    isLastTurnOfRound && hasLimit && currentRound >= targetLimit;
  const isNextRoundFinal =
    isLastTurnOfRound && hasLimit && nextRound === targetLimit;

  const nextEntity = participants[(currentTurnIndex + 1) % participants.length];

  const handleNext = () => {
    playSound("click");
    if (isMatchOver) {
      router.replace("/game/match-summary" as any);
    } else {
      // Check if there are still cards in the store (Deck is preserved across turns now!)
      if (gameStore.cardsInRound.length === 0) {
        showAlert(
          "No Decks Selected",
          "Please open settings (top left) and select at least one deck to continue.",
        );
        return;
      }

      useGameStore.setState((state) => ({
        currentTurnIndex:
          state.currentTurnIndex === participants.length - 1
            ? 0
            : state.currentTurnIndex + 1,
        currentRound:
          state.currentTurnIndex === participants.length - 1
            ? state.currentRound + 1
            : state.currentRound,
      }));

      router.replace("/game/play" as any);
    }
  };

  // Convert to async so we can fetch new cards if decks were modified
  const handleSaveSettings = async () => {
    let newLim: number | "Infinity" = editLimit;
    if (editLimit !== "Infinity") {
      const parsed = typeof editLimit === "number" ? editLimit : currentRound;
      if (scoringStyle === "rounds")
        newLim = Math.min(20, Math.max(currentRound, parsed));
      else newLim = Math.min(30, Math.max(5, parsed));
    }

    const newTimer = Math.min(180, Math.max(10, editTimer));

    gameStore.updateSettingsMidGame({
      targetLimit: newLim,
      timerDuration: newTimer,
    });

    // 1. Fetch the cards for whatever decks are currently selected in the UI
    await useDeckStore.getState().loadCardsForSelectedDecks();
    const freshCards = useDeckStore.getState().currentCards;

    if (freshCards.length === 0) {
      showAlert(
        "No Cards",
        "You deselected all cards! Please select at least one deck.",
      );
      return; // Stop them from closing the modal if they disabled all decks
    }

    // 2. Inject them into the game store!
    // This will smartly filter out already played cards and shuffle the remaining!
    gameStore.updateCardsMidGame(freshCards);

    setEditLimit(newLim);
    setEditTimer(newTimer);
    setShowSettingsModal(false);
  };

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

    if (playStyle === "just_play") {
      if (isNextRoundFinal) return "Start Final Round";
      return `Start Round ${nextRound}`;
    }

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

      {AlertRender}
    </SafeAreaView>
  );
}