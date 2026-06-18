import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Participant } from "../utils/database";

export type GameMode = "headsup" | "catchphrase" | "taboo";
export type ScoringStyle = "rounds" | "boardgame";
export type PlayStyle = "player" | "team" | "just_play";
type CardResult = "guessed" | "passed";

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
  mode: GameMode;
  scoringStyle: ScoringStyle;
  playStyle: PlayStyle;
  targetLimit: number | "Infinity";
  timerDuration: number;
  participants: Participant[];
  isPlaying: boolean;
  isPaused: boolean;
  currentRound: number;
  currentTurnIndex: number;
  roundScores: Record<number, Record<number, number>>;
  turnHistory: TurnHistoryItem[];
  turnScore: number;
  turnPasses: number;
  cardsInRound: any[];
  currentCardIndex: number;

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
  getCurrentParticipant: () => Participant | undefined;
  getParticipantTotalScore: (participantId: number) => number;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
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
      partialize: (state) => ({
        timerDuration: state.timerDuration,
        scoringStyle: state.scoringStyle,
        playStyle: state.playStyle,
      }),
    },
  ),
);
