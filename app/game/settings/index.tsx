import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as LucideIcons from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NestableScrollContainer } from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDeckStore } from "../../../stores/useDeckStore";
import {
  PlayStyle,
  ScoringStyle,
  useGameStore,
} from "../../../stores/useGameStore";
import { useRosterStore } from "../../../stores/useRosterStore";
import { useSoundManager } from "../../../hooks/useSoundManager";
import { getModeAccent } from "../../../utils/_modeTheme";
import { Participant } from "../../../utils/database";
import DeckSelector from "./_DeckSelector";
import ParticipantSelector from "./_ParticipantSelector";
import RoundsSelector from "./_RoundsSelector";
import TimerSelector from "./_TimerSelector";
import { useAppAlert } from "../../_AppAlert";
import ModeCard from "../../modes/_ModeCard";

export default function SettingsScreen() {
  const params = useLocalSearchParams();
  const [selectedMode] = useState(() => (params.mode as any) || "articulate");

  const accent = getModeAccent(selectedMode);
  const gameStore = useGameStore();
  const { participants, initRoster } = useRosterStore();
  const { showAlert, AlertRender } = useAppAlert();

  const { playSound } = useSoundManager(["countdown_tick"]);

  const scrollRef = useRef<any>(null);
  const cachedTeamsRef = useRef<Participant[] | null>(null);
  const cachedPlayersRef = useRef<Participant[] | null>(null);

  const [scoringStyle, setScoringStyle] = useState<ScoringStyle>("rounds");
  const [targetLimit, setTargetLimit] = useState<number | "Infinity">(3);
  const [playStyle, setPlayStyle] = useState<PlayStyle>("team");
  const [timerDuration, setTimerDuration] = useState(60);
  const [isDecksExpanded, setIsDecksExpanded] = useState(true);

  useEffect(() => {
    initRoster("team");
    cachedTeamsRef.current = null;
    cachedPlayersRef.current = null;
  }, []);

  const handlePlayStyleChange = (style: PlayStyle) => {
    if (style === playStyle) return;
    const cur = useRosterStore.getState().participants;

    if (playStyle === "team") cachedTeamsRef.current = cur;
    else if (playStyle === "player") cachedPlayersRef.current = cur;

    setPlayStyle(style);

    if (style === "team") {
      if (cachedTeamsRef.current)
        useRosterStore.setState({ participants: cachedTeamsRef.current });
      else initRoster("team");
    } else if (style === "player") {
      if (cachedPlayersRef.current)
        useRosterStore.setState({ participants: cachedPlayersRef.current });
      else initRoster("player");
    } else {
      initRoster("just_play");
    }
  };

  const handleStartGame = async () => {
    await useDeckStore.getState().loadCardsForSelectedDecks();
    const cards = useDeckStore.getState().currentCards;

    if (cards.length === 0) {
      showAlert("No Cards", "Please select at least one deck with cards.");
      setIsDecksExpanded(true);
      return;
    }

    const finalParticipants =
      playStyle === "just_play"
        ? participants
        : participants.filter((p) => p.name.trim().length > 0);

    if (playStyle !== "just_play" && finalParticipants.length < 1) {
      showAlert(
        "Not enough participants",
        `You need at least 1 ${playStyle === "team" ? "team" : "player"}.`,
      );
      return;
    }

    gameStore.setupMatch({
      mode: selectedMode,
      scoringStyle,
      playStyle,
      targetLimit,
      timerDuration,
      participants: finalParticipants,
      cardsInRound: cards,
    });

    if (selectedMode !== "headsup") {
      playSound("countdown_tick");
    }
    router.replace("/game/play");
  };

  const handleResetRoster = () => {
    if (playStyle === "team") cachedTeamsRef.current = null;
    else cachedPlayersRef.current = null;
  };

  const namedCount = participants.filter((p) => p.name.trim()).length;
  const startSubTextLeft =
    playStyle === "just_play"
      ? "Casual Mode"
      : `${namedCount} ${playStyle === "team" ? "Teams" : "Players"}`;

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <NestableScrollContainer
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Page header ── */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageEyebrow}>Match Setup</Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                onPress={() => router.navigate("/")}
                style={styles.iconBtn}
              >
                <LucideIcons.ChevronLeft
                  color="#cbd5e1"
                  size={20}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>

              {/* Universal Mode Card (Soft Variant) */}
              <ModeCard
                modeKey={selectedMode}
                variant="soft"
                style={{ flex: 1 }}
              />
            </View>
          </View>

          <RoundsSelector
            targetLimit={targetLimit}
            onTargetLimitChange={setTargetLimit}
            accent={accent}
          />

          <ParticipantSelector
            playStyle={playStyle}
            onPlayStyleChange={handlePlayStyleChange}
            onScrollRequest={(y) =>
              setTimeout(
                () => scrollRef.current?.scrollTo({ y, animated: true }),
                300,
              )
            }
            accent={accent}
            onResetRoster={handleResetRoster}
          />

          <DeckSelector
            isDecksExpanded={isDecksExpanded}
            setIsDecksExpanded={setIsDecksExpanded}
            accent={accent}
            autoSelectAllOnMount={true}
          />

          <TimerSelector
            timerDuration={timerDuration}
            setTimerDuration={setTimerDuration}
            accent={accent}
          />
        </NestableScrollContainer>
      </KeyboardAvoidingView>

      {/* ── Start game footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleStartGame}
          activeOpacity={0.85}
          style={styles.startBtn}
        >
          <LinearGradient
            colors={[accent.color, `${accent.color}cc`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.startBtnGradient}
          >
            <View style={styles.startBtnInner}>
              <LucideIcons.Play
                size={18}
                color="#ffffff"
                strokeWidth={2.5}
                fill="#ffffff"
              />
              <Text style={styles.startBtnText}>Start Game</Text>
            </View>
            <Text style={styles.startBtnSub}>
              {startSubTextLeft}
              {"  ·  "}
              {scoringStyle === "rounds"
                ? targetLimit === "Infinity"
                  ? "Endless"
                  : `${targetLimit} Rounds`
                : `${targetLimit} Tiles`}
              {"  ·  "}
              {timerDuration}s
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {AlertRender}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#020617" },
  scroll: { padding: 16, paddingBottom: 120 },
  pageHeader: { marginBottom: 16 },
  pageEyebrow: {
    color: "#1e293b",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  modeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: "rgba(2,6,23,0.96)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  startBtn: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  startBtnGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 4,
  },
  startBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  startBtnText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  startBtnSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
