import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Participant } from "../utils/database";

export type GameMode = "headsup" | "catchphrase" | "taboo";
export type ScoringStyle = "rounds" | "boardgame";
export type PlayStyle = "player" | "team";
type CardResult = "guessed" | "passed";

// Re-export so consumers only need to import from one store file
export type { Participant };

interface TurnHistoryItem {
  cardId: number;
  word: string;
  result: CardResult;
  isEdited: boolean;
}

interface MatchConfig {
  mode: GameMode;
  scoringStyle: ScoringStyle;
  playStyle: PlayStyle;
  targetLimit: number | "Infinity";
  timerDuration: number;
  participants: Participant[];
  cardsInRound: any[];
}

interface GameState {
  // ── Match config ────────────────────────────────────────────────────────────
  mode: GameMode;
  scoringStyle: ScoringStyle;
  playStyle: PlayStyle;
  targetLimit: number | "Infinity";
  timerDuration: number;

  /**
   * The single source of truth for who is playing.
   * player mode → one entry per player
   * team mode → one entry per team
   * The game engine never needs to know which type it is — both are treated
   * identically for turns, scoring, and history.
   */
  participants: Participant[];

  // ── Session state ────────────────────────────────────────────────────────────
  isPlaying: boolean;
  isPaused: boolean;
  currentRound: number;
  currentTurnIndex: number;

  // ── Scoring ──────────────────────────────────────────────────────────────────
  // roundScores[roundNumber][participantId] = score
  roundScores: Record<number, Record<number, number>>;
  turnHistory: TurnHistoryItem[];
  turnScore: number;
  turnPasses: number;

  // ── Cards ────────────────────────────────────────────────────────────────────
  cardsInRound: any[];
  currentCardIndex: number;

  // ── Actions ──────────────────────────────────────────────────────────────────
  setupMatch: (config: MatchConfig) => void;
  updateSettingsMidGame: (
    config: Partial<Pick<GameState, "targetLimit" | "timerDuration">>,
  ) => void;
  startTurn: () => void;
  endTurn: () => void;
  endMatch: () => void;
  recordCardResult: (cardId: number, word: string, result: CardResult) => void;
  toggleHistoryResult: (index: number) => void;
  nextCard: () => void;
  setPaused: (paused: boolean) => void;

  // ── Derived helpers (computed on the fly, no extra state) ───────────────────
  getCurrentParticipant: () => Participant | undefined;
  getParticipantTotalScore: (participantId: number) => number;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // ── Defaults ─────────────────────────────────────────────────────────────
      mode: "headsup",
      scoringStyle: "rounds",
      playStyle: "team",
      targetLimit: 3,
      timerDuration: 60,
      participants: [],
      isPlaying: false,
      isPaused: false,
      currentRound: 1,
      currentTurnIndex: 0,
      roundScores: {},
      turnHistory: [],
      turnScore: 0,
      turnPasses: 0,
      cardsInRound: [],
      currentCardIndex: 0,

      // ── Actions ──────────────────────────────────────────────────────────────

      setupMatch: (config) => {
        set({
          mode: config.mode,
          scoringStyle: config.scoringStyle,
          playStyle: config.playStyle,
          targetLimit: config.targetLimit,
          timerDuration: config.timerDuration,
          participants: config.participants,
          cardsInRound: config.cardsInRound,
          isPlaying: true,
          currentRound: 1,
          currentTurnIndex: 0,
          roundScores: {},
          turnHistory: [],
          turnScore: 0,
          turnPasses: 0,
          currentCardIndex: 0,
        });
      },

      updateSettingsMidGame: (config) => set({ ...config }),

      startTurn: () => {
        set({
          currentCardIndex: 0,
          turnScore: 0,
          turnPasses: 0,
          turnHistory: [],
          isPaused: false,
        });
      },

      endTurn: () => {
        const {
          currentRound,
          currentTurnIndex,
          turnScore,
          roundScores,
          participants,
        } = get();
        const currentParticipant = participants[currentTurnIndex];
        if (!currentParticipant) return;

        const newRoundScores = { ...roundScores };
        if (!newRoundScores[currentRound]) newRoundScores[currentRound] = {};
        newRoundScores[currentRound][currentParticipant.id] = turnScore;

        set({ roundScores: newRoundScores });
      },

      endMatch: () =>
        set({
          isPlaying: false,
          currentRound: 1,
          currentTurnIndex: 0,
          turnScore: 0,
          turnPasses: 0,
        }),

      recordCardResult: (cardId, word, result) => {
        const { turnHistory, turnScore, turnPasses } = get();
        set({
          turnHistory: [
            ...turnHistory,
            { cardId, word, result, isEdited: false },
          ],
          turnScore: result === "guessed" ? turnScore + 1 : turnScore,
          turnPasses: result === "passed" ? turnPasses + 1 : turnPasses,
        });
      },

      toggleHistoryResult: (index) => {
        const { turnHistory, turnScore, turnPasses } = get();
        const newHistory = [...turnHistory];
        const item = { ...newHistory[index] };

        if (item.result === "guessed") {
          item.result = "passed";
          item.isEdited = !item.isEdited;
          newHistory[index] = item;
          set({
            turnHistory: newHistory,
            turnScore: turnScore - 1,
            turnPasses: turnPasses + 1,
          });
        } else {
          item.result = "guessed";
          item.isEdited = !item.isEdited;
          newHistory[index] = item;
          set({
            turnHistory: newHistory,
            turnScore: turnScore + 1,
            turnPasses: turnPasses - 1,
          });
        }
      },

      nextCard: () =>
        set((state) => ({ currentCardIndex: state.currentCardIndex + 1 })),

      setPaused: (paused) => set({ isPaused: paused }),

      // ── Derived ──────────────────────────────────────────────────────────────

      getCurrentParticipant: () => {
        const { participants, currentTurnIndex } = get();
        return participants[currentTurnIndex];
      },

      getParticipantTotalScore: (participantId) => {
        const { roundScores } = get();
        return Object.values(roundScores).reduce(
          (acc, round) => acc + (round[participantId] ?? 0),
          0,
        );
      },
    }),
    {
      name: "game-session-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist lightweight preferences — full game state lives in memory
      partialize: (state) => ({
        timerDuration: state.timerDuration,
        scoringStyle: state.scoringStyle,
        playStyle: state.playStyle,
      }),
    },
  ),
);
