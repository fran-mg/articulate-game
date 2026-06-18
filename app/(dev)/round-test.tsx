import { useRouter } from "expo-router";
import * as LucideIcons from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Participant, useGameStore } from "../../stores/useGameStore";

export default function RoundTestScreen() {
  const router = useRouter();

  const handleLaunchRoundTest = () => {
    // 1. Create a couple of players so the game knows who is next
    const mockPlayers: Participant[] = [
      { id: 1, name: "Player One", color: "pink", type: "player" },
      { id: 2, name: "Player Two", color: "blue", type: "player" },
    ];

    // 2. Create the exact history of the 5 cards they interacted with
    const mockTurnHistory: any[] = [
      { cardId: 101, word: "Eiffel Tower", result: "guessed", isEdited: false },
      { cardId: 102, word: "Darth Vader", result: "passed", isEdited: false },
      { cardId: 103, word: "Black Hole", result: "guessed", isEdited: false },
      { cardId: 104, word: "Hogwarts", result: "passed", isEdited: false },
      { cardId: 105, word: "The Matrix", result: "guessed", isEdited: false },
    ];

    // 3. Inject simulated state directly into Zustand
    // We simulate that `endTurn()` was already called (which writes to roundScores)
    useGameStore.setState({
      mode: "catchphrase",
      scoringStyle: "rounds",
      playStyle: "player",
      targetLimit: 3,
      timerDuration: 60,
      participants: mockPlayers,

      // State exactly as it would be when routing to round-summary
      isPlaying: true,
      currentRound: 1,
      currentTurnIndex: 0, // It is still Player 1's index until they press "Next" on the summary

      turnPasses: 2,
      turnScore: 3,
      turnHistory: mockTurnHistory,

      roundScores: {
        1: { 1: 3 }, // Round 1 -> Player 1 (id: 1) -> Scored 3 points
      },

      cardsInRound: [],
    });

    // 4. Route to the new round-summary index file
    router.push("/game/round-summary" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950 px-6 justify-center items-center">
      <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full items-center shadow-2xl">
        <View className="bg-amber-500/10 p-4 rounded-full mb-4 border border-amber-500/20">
          <LucideIcons.ListChecks color="#f59e0b" size={40} />
        </View>

        <Text className="text-white text-2xl font-black text-center tracking-tight mb-2">
          Round Summary Tester
        </Text>

        <Text className="text-slate-400 text-sm text-center font-medium mb-6 leading-relaxed">
          Injects state mimicking Player 1 just finishing Turn 1 of Round 1.
          They guessed 3 cards correctly and passed on 2. Use this to test the
          edit scores UI.
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLaunchRoundTest}
          className="w-full bg-amber-600 rounded-2xl py-4 items-center justify-center shadow-lg"
        >
          <Text className="text-white font-black text-sm uppercase tracking-wider">
            Inject State & View Round
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
