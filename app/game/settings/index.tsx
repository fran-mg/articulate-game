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
import { useDeckStore } from "../../../stores/useDeckStore"; // Keep for handleStartGame
import {
  PlayStyle,
  ScoringStyle,
  useGameStore,
} from "../../../stores/useGameStore";
import { useRosterStore } from "../../../stores/useRosterStore";
import { getModeAccent, getModeMeta } from "../../../utils/_modeTheme";
import { Participant } from "../../../utils/database";
import DeckSelector from "./_DeckSelector";
import ParticipantSelector from "./_ParticipantSelector";
import ScoringStyleSelector from "./_ScoringStyleSelector";
import RoundsSelector from "./_RoundsSelector";
import TimerSelector from "./_TimerSelector";
import { useAppAlert } from "../../_AppAlert";

export default function SettingsScreen() {
  const params = useLocalSearchParams();
  const [selectedMode] = useState(() => (params.mode as any) || "articulate");

  const accent = getModeAccent(selectedMode);
  const meta = getModeMeta(selectedMode);
  const ModeIcon = meta.Icon;

  const gameStore = useGameStore();
  const { participants, initRoster } = useRosterStore();
  const { showAlert, AlertRender } = useAppAlert();

  const scrollRef = useRef<any>(null);
  const cachedTeamsRef = useRef<Participant[] | null>(null);
  const cachedSolosRef = useRef<Participant[] | null>(null);

  const [scoringStyle, setScoringStyle] = useState<ScoringStyle>("rounds");
  const [targetLimit, setTargetLimit] = useState<number | "Infinity">(3);
  const [playStyle, setPlayStyle] = useState<PlayStyle>("team");
  const [timerDuration, setTimerDuration] = useState(60);
  const [isDecksExpanded, setIsDecksExpanded] = useState(true);

  useEffect(() => {
    initRoster("team");
    cachedTeamsRef.current = null;
    cachedSolosRef.current = null;
  }, []);

  const handlePlayStyleChange = (style: PlayStyle) => {
    if (style === playStyle) return;
    const cur = useRosterStore.getState().participants;
    if (playStyle === "team") cachedTeamsRef.current = cur;
    else cachedSolosRef.current = cur;
    setPlayStyle(style);
    if (style === "team") {
      if (cachedTeamsRef.current)
        useRosterStore.setState({ participants: cachedTeamsRef.current });
      else initRoster("team");
    } else {
      if (cachedSolosRef.current)
        useRosterStore.setState({ participants: cachedSolosRef.current });
      else initRoster("solo");
    }
  };

  const handleScoringStyleChange = (style: ScoringStyle) => {
    setScoringStyle(style);
    if (style === "rounds")
      setTargetLimit((p) =>
        p !== "Infinity" ? Math.min(20, Math.max(1, p)) : 3,
      );
    else
      setTargetLimit((p) =>
        p !== "Infinity" ? Math.min(30, Math.max(5, p)) : 30,
      );
  };

  const handleScrollRequest = (yPos: number) => {
    setTimeout(
      () => scrollRef.current?.scrollTo({ y: yPos, animated: true }),
      300,
    );
  };

  const handleStartGame = async () => {
    await useDeckStore.getState().loadCardsForSelectedDecks();
    const cards = useDeckStore.getState().currentCards;

    if (cards.length === 0) {
      showAlert("No Cards", "Please select at least one deck with cards.");
      setIsDecksExpanded(true);
      return;
    }
    const named = participants.filter((p) => p.name.trim().length > 0);
    if (named.length < 1) {
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
      participants: named,
      cardsInRound: cards,
    });
    router.replace("/game/play");
  };

  const namedCount = participants.filter((p) => p.name.trim()).length;
  const participantLabel = playStyle === "team" ? "Teams" : "Players";

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
                activeOpacity={0.7}
              >
                <LucideIcons.ChevronLeft
                  color="#cbd5e1"
                  size={20}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>

              <View
                style={[styles.modeCard, { borderColor: accent.colorBorder }]}
              >
                <View style={[styles.modeCardShine]} pointerEvents="none" />
                <LinearGradient
                  colors={[accent.colorBg, "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View
                  style={[
                    styles.modeIconWrap,
                    {
                      borderColor: accent.colorBorder,
                      backgroundColor: accent.colorBg,
                    },
                  ]}
                >
                  <ModeIcon size={22} color={accent.color} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeCardTitle}>{meta.label}</Text>
                  <Text style={styles.modeCardDesc}>{meta.description}</Text>
                </View>
                <View
                  style={[
                    styles.orientationBadge,
                    {
                      borderColor: accent.colorBorder,
                      backgroundColor: accent.colorBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.orientationBadgeText,
                      { color: accent.colorMuted },
                    ]}
                  >
                    {meta.orientationBadge}
                  </Text>
                </View>
              </View>
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
            onScrollRequest={handleScrollRequest}
            accent={accent}
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
              {namedCount} {participantLabel}
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
  root: {
    flex: 1,
    backgroundColor: "#020617",
  },
  scroll: {
    padding: 16,
    paddingBottom: 120,
  },

  // ── Page header ─────────────────────────────────────────────────────────────
  pageHeader: {
    marginBottom: 16,
  },
  pageEyebrow: {
    color: "#1e293b",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
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
  modeCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  modeCardShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  modeCardTitle: {
    color: "#f1f5f9",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  modeCardDesc: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
  },
  orientationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
    flexShrink: 0,
  },
  orientationBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
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
  startBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
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
