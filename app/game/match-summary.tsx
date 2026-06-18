import { useRouter } from "expo-router";
import * as LucideIcons from "lucide-react-native";
import React, { useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGameStore } from "../../stores/useGameStore";
import { useSoundManager } from "../../hooks/useSoundManager";

export default function MatchSummaryScreen() {
  const router = useRouter();
  const { playStyle, participants, roundScores, endMatch } = useGameStore();

  const { playSound } = useSoundManager(["score_reveal"]);

  useEffect(() => {
    playSound("soft_score_reveal");
  }, []);

  const isJustPlay = playStyle === "just_play";

  const totals: Record<number, number> = {};
  participants.forEach((entity) => {
    totals[entity.id] = Object.values(roundScores).reduce(
      (acc, round) => acc + (round[entity.id] || 0),
      0,
    );
  });

  const sortedEntities = [...participants].sort(
    (a, b) => totals[b.id] - totals[a.id],
  );

  const winner = sortedEntities[0];
  const isTie =
    sortedEntities.length > 1 &&
    totals[sortedEntities[0].id] === totals[sortedEntities[1].id];

  const roundKeys = Object.keys(roundScores)
    .map(Number)
    .sort((a, b) => a - b);

  const handleHome = () => {
    endMatch();
    router.replace("/" as any);
  };

  // ── CASUAL MODE SUMMARY UI ────────────────────────────────────────────────
  if (isJustPlay) {
    const casualId = winner?.id;
    const casualScores = roundKeys.map((r) => ({
      round: r,
      score: roundScores[r]?.[casualId] || 0,
    }));
    const bestScore =
      casualScores.length > 0
        ? Math.max(...casualScores.map((c) => c.score))
        : 0;

    return (
      <SafeAreaView className="flex-1 bg-slate-950 p-4">
        <View className="items-center mt-4 mb-6">
          <LucideIcons.Gamepad2 color="#3B82F6" size={56} className="mb-2" />
          <Text className="text-slate-400 font-bold uppercase tracking-widest mb-1 text-xs">
            Session Complete
          </Text>
          <Text className="text-white text-3xl font-black text-center mb-1">
            Well Played!
          </Text>
          <View className="bg-amber-500/10 border border-amber-500/30 px-5 py-2 rounded-full flex-row items-center mt-2">
            <LucideIcons.Trophy color="#F59E0B" size={14} strokeWidth={3} />
            <Text className="text-amber-500 font-bold text-sm ml-2 tracking-wide">
              Top Score: {bestScore}
            </Text>
          </View>
        </View>

        <View className="bg-slate-900 rounded-3xl border border-slate-800 flex-1 overflow-hidden mx-6">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Table Header */}
            <View className="flex-row justify-between px-6 h-12 border-b border-slate-800 items-end pb-3">
              <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                Round
              </Text>
              <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-wider text-right">
                Score
              </Text>
            </View>

            {/* Table Rows */}
            {casualScores.map(({ round, score }, index) => {
              // Ties for best score naturally highlight multiple rounds!
              const isBest = score === bestScore && score > 0;
              const isLast = index === casualScores.length - 1;

              return (
                <View
                  key={round}
                  className={`flex-row justify-between items-center px-6 h-16 ${
                    !isLast ? "border-b border-slate-800/50" : ""
                  }`}
                >
                  <View className="flex-row items-center">
                    <Text
                      className={`font-bold text-base ${
                        isBest ? "text-amber-500" : "text-slate-300"
                      }`}
                    >
                      Round {round}
                    </Text>
                    {isBest && (
                      <View className="ml-3 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                        <Text className="text-amber-500 text-[9px] font-black uppercase tracking-wider">
                          Best
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    className={`font-black text-2xl ${
                      isBest ? "text-amber-500" : "text-white"
                    }`}
                  >
                    {score}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View className="p-6 pt-2">
          <TouchableOpacity
            onPress={handleHome}
            className="bg-blue-600 rounded-2xl py-5 mt-6 items-center shadow-lg"
          >
            <Text className="text-white font-black text-lg uppercase tracking-wide">
              Back to Home
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── STANDARD MULTIPLAYER SUMMARY UI (Players/Teams) ───────────────────────
  return (
    <SafeAreaView className="flex-1 bg-slate-950 p-4">
      <View className="items-center mt-4 mb-8">
        <LucideIcons.Trophy color="#F59E0B" size={56} className="mb-2" />
        <Text className="text-slate-400 font-bold uppercase tracking-widest mb-1 text-xs">
          Match Complete
        </Text>
        <Text className="text-amber-500 text-4xl font-black text-center">
          {isTie ? "It's a Tie!" : `${winner?.name} Wins!`}
        </Text>
      </View>

      <View className="bg-slate-900 rounded-3xl border border-slate-800 flex-1 overflow-hidden mx-2">
        {/* Main Vertical Scroll */}
        <ScrollView className="flex-1 p-3" showsVerticalScrollIndicator={false}>
          <View className="flex-row">
            {/* Left Static Column (Competitor) */}
            <View className="w-[140px] border-r border-slate-800 pr-3">
              <View className="h-10 border-b border-slate-800 mb-2 justify-end pb-2">
                <Text className="text-slate-400 font-bold uppercase text-[10px]">
                  Competitor
                </Text>
              </View>
              {sortedEntities.map((entity, index) => (
                <View
                  key={entity.id}
                  className="h-14 flex-row items-center border-b border-slate-800/50"
                >
                  <Text
                    className={`font-black text-sm w-5 ${
                      index === 0 ? "text-amber-500" : "text-slate-600"
                    }`}
                  >
                    #{index + 1}
                  </Text>
                  <Text
                    className="text-white font-bold text-base ml-1 flex-1"
                    numberOfLines={1}
                  >
                    {entity.name}
                  </Text>
                </View>
              ))}
            </View>

            {/* Middle Horizontally Scrollable Area (Rounds) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-1"
              bounces={false}
            >
              <View>
                <View className="flex-row h-10 border-b border-slate-800 mb-2 items-end pb-2">
                  {roundKeys.map((r) => (
                    <Text
                      key={r}
                      className="w-10 text-center text-slate-500 font-bold uppercase text-[10px]"
                    >
                      R{r}
                    </Text>
                  ))}
                </View>
                {sortedEntities.map((entity) => (
                  <View
                    key={entity.id}
                    className="flex-row h-14 items-center border-b border-slate-800/50"
                  >
                    {roundKeys.map((r) => (
                      <Text
                        key={r}
                        className="w-10 text-center text-slate-400 font-medium text-sm"
                      >
                        {roundScores[r]?.[entity.id] ?? "-"}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Right Static Column (Total) */}
            <View className="w-12 border-l border-slate-800 pl-0">
              <View className="h-10 border-b border-slate-800 mb-2 justify-end pb-2">
                <Text className="text-slate-400 font-bold uppercase text-[10px] text-right">
                  Total
                </Text>
              </View>
              {sortedEntities.map((entity, index) => (
                <View
                  key={entity.id}
                  className="h-14 justify-center border-b border-slate-800/50"
                >
                  <Text
                    className={`text-center font-black text-xl ${
                      index === 0 ? "text-amber-500" : "text-white"
                    }`}
                  >
                    {totals[entity.id]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <View className="p-6 pt-2">
        <TouchableOpacity
          onPress={handleHome}
          className="bg-blue-600 rounded-2xl py-5 mt-6 items-center shadow-lg"
        >
          <Text className="text-white font-black text-lg uppercase tracking-wide">
            Back to Home
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
