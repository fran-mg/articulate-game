import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Participant } from "../utils/database";

// --- Helper function for Fisher-Yates Shuffle ---
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

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
  playedCardIds: number[]; // <--- NEW: Tracks history globally

  setupMatch: (config: MatchConfig) => void;
  updateSettingsMidGame: (
    config: Partial<Pick<GameState, "targetLimit" | "timerDuration">>,
  ) => void;
  updateCardsMidGame: (newCards: any[]) => void; // <--- NEW: For changing decks in play
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
      playedCardIds: [], // <--- Default value

      setupMatch: (config) => {
        set({
          mode: config.mode,
          scoringStyle: config.scoringStyle,
          playStyle: config.playStyle,
          targetLimit: config.targetLimit,
          timerDuration: config.timerDuration,
          participants: config.participants,
          // Shuffle initially to guarantee randomness
          cardsInRound: shuffleArray([...config.cardsInRound]),
          isPlaying: true,
          currentRound: 1,
          currentTurnIndex: 0,
          roundScores: {},
          turnHistory: [],
          turnScore: 0,
          turnPasses: 0,
          currentCardIndex: 0,
          playedCardIds: [], // Reset history for a new match
        });
      },

      updateSettingsMidGame: (config) => set({ ...config }),

      // <--- NEW logic for safely injecting new decks mid-game without repeating seen cards
      updateCardsMidGame: (newCards) => {
        const { playedCardIds } = get();

        // Filter out cards they've already played this match
        let unplayed = newCards.filter(c => !playedCardIds.includes(c.id));

        // If they exhausted all new cards, reset tracker and use all new cards
        if (unplayed.length === 0 && newCards.length > 0) {
          unplayed = [...newCards];
          set({ playedCardIds: [] });
        }

        set({
          cardsInRound: shuffleArray(unplayed),
          currentCardIndex: 0,
        });
      },

      startTurn: () => {
        set({
          // Notice we DO NOT reset `currentCardIndex` to 0 anymore.
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
        const { turnHistory, turnScore, turnPasses, playedCardIds } = get();
        set({
          turnHistory: [
            ...turnHistory,
            { cardId, word, result, isEdited: false },
          ],
          turnScore: result === "guessed" ? turnScore + 1 : turnScore,
          turnPasses: result === "passed" ? turnPasses + 1 : turnPasses,
          // Track the card ID so we don't repeat it soon
          playedCardIds: [...playedCardIds, cardId],
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

      nextCard: () => {
        const state = get();
        let nextIdx = state.currentCardIndex + 1;
        let newCards = state.cardsInRound;
        let newPlayed = state.playedCardIds;

        // <--- Loop/Reshuffle Logic --->
        if (nextIdx >= state.cardsInRound.length) {
          // Deck exhausted. Reshuffle and start over.
          newCards = shuffleArray([...state.cardsInRound]);
          nextIdx = 0;
          newPlayed = []; // Clear played tracking to allow the next cycle
        }

        set({
          currentCardIndex: nextIdx,
          cardsInRound: newCards,
          playedCardIds: newPlayed,
        });
      },

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
    }
  )
);