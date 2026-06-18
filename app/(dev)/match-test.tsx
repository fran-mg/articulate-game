import { useRouter } from "expo-router";
import * as LucideIcons from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Participant, useGameStore } from "../../stores/useGameStore";

export default function MatchTestScreen() {
  const router = useRouter();

  const handleLaunchStressTest = () => {
    // 1. Generate 20 Mock Competitor Names
    const mockNames = [
      "Alpha Squad",
      "Beta Avengers",
      "Charlie Crew",
      "Delta Force",
      "Echo Elite",
      "Foxtrot Team",
      "Golf Gamers",
      "Hotel Heroes",
      "India Icons",
      "Juliet Jesters",
      "Kilo Kings",
      "Lima Legends",
      "Mike Mavericks",
      "November Ninjas",
      "Oscar Outlaws",
      "Papa Prophets",
      "Quebec Queens",
      "Romeo Rebels",
      "Sierra Stars",
      "Tango Titans",
    ];

    // Use strictly numbers for IDs and map required teamId values
    const mockPlayers: Participant[] = mockNames.map((name, index) => {
      const numericId = index + 1;
      return {
        id: numericId,
        name: name,
        color: "pink",
        type: "player",
      };
    });

    // 2. Generate 10 Rounds of Variable Mock Scores (roundNum -> playerNum -> score)
    const mockRoundScores: Record<number, Record<number, number>> = {};

    for (let round = 1; round <= 10; round++) {
      mockRoundScores[round] = {};
      mockPlayers.forEach((player) => {
        // Pseudo-random points spread per round combo matching new numerical ids
        const calculatedPoints = Math.floor(
          Math.abs(Math.sin(player.id * 4 + round * 9)) * 13,
        );
        mockRoundScores[round][player.id] = calculatedPoints;
      });
    }

    // 3. Inject simulated state directly into Zustand using setState
    // (setupMatch forces roundScores to {} so we must bypass it)
    useGameStore.setState({
      mode: "catchphrase",
      scoringStyle: "rounds",
      playStyle: "player",
      targetLimit: 10,
      timerDuration: 60,
      participants: mockPlayers,
      roundScores: mockRoundScores,
      cardsInRound: [],
      currentRound: 10,
      isPlaying: false, // Set false since we are simulating the end of a match
    });

    // 4. Route instantly to your summary interface
    router.push("/game/match-summary" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950 px-6 justify-center items-center">
      <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full items-center shadow-2xl">
        <View className="bg-indigo-500/10 p-4 rounded-full mb-4 border border-indigo-500/20">
          <LucideIcons.Layers color="#6366f1" size={40} />
        </View>

        <Text className="text-white text-2xl font-black text-center tracking-tight mb-2">
          Scoreboard Stress Tester
        </Text>

        <Text className="text-slate-400 text-sm text-center font-medium mb-6 leading-relaxed">
          Populate production storage with 20 numeric mock single competitors
          across 10 complete high-volume scoring intervals and test layout
          boundaries.
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLaunchStressTest}
          className="w-full bg-indigo-600 rounded-2xl py-4 items-center justify-center shadow-lg"
        >
          <Text className="text-white font-black text-sm uppercase tracking-wider">
            Inject State & View Summary
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
