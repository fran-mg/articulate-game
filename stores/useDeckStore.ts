import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { dbHelpers, DeckRow } from "../utils/database";

export interface Deck {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  url: string;
  cardCount: number;
  source: string;
}

export interface Card {
  id: number;
  deck_id: number;
  word: string;
  tabooWords: string | null; // JSON string → parse to string[]
  charadesHint: string | null;
  passwordHint: string | null;
  is_hidden: number;
  times_played: number;
  times_guessed: number;
  created_at: number;
}

interface DeckState {
  decks: Deck[];
  selectedDeckIds: string[];
  currentCards: Card[];

  loadDecks: () => Promise<void>;
  selectDeck: (deckId: string) => void;
  deselectDeck: (deckId: string) => void;
  toggleDeckSelection: (deckId: string) => void;
  selectAllDecks: () => void;
  deselectAllDecks: () => void;
  loadCardsForSelectedDecks: () => Promise<void>;
  createDeck: (name: string, category: string) => Promise<void>;
  deleteDeck: (deckId: string) => Promise<void>;
}

function toPublicDeck(row: DeckRow): Deck {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    icon: row.icon,
    color: row.color,
    url: row.url,
    cardCount: row.cardCount,
    source: row.source,
  };
}

export const useDeckStore = create<DeckState>()(
  persist(
    (set, get) => ({
      decks: [],
      selectedDeckIds: [],
      currentCards: [],

      loadDecks: async () => {
        const rows = await dbHelpers.getAllDecks();
        set({ decks: rows.map(toPublicDeck) });
      },

      selectDeck: (deckId) => {
        set((state) => ({
          selectedDeckIds: state.selectedDeckIds.includes(deckId)
            ? state.selectedDeckIds
            : [...state.selectedDeckIds, deckId],
        }));
      },

      deselectDeck: (deckId) => {
        set((state) => ({
          selectedDeckIds: state.selectedDeckIds.filter((id) => id !== deckId),
        }));
      },

      toggleDeckSelection: (deckId) => {
        set((state) => ({
          selectedDeckIds: state.selectedDeckIds.includes(deckId)
            ? state.selectedDeckIds.filter((id) => id !== deckId)
            : [...state.selectedDeckIds, deckId],
        }));
      },

      selectAllDecks: () => {
        set((state) => ({
          selectedDeckIds: state.decks.map((d) => d.id),
        }));
      },

      deselectAllDecks: () => {
        set({ selectedDeckIds: [] });
      },

      loadCardsForSelectedDecks: async () => {
        const { selectedDeckIds } = get();
        if (selectedDeckIds.length === 0) {
          set({ currentCards: [] });
          return;
        }
        const numericIds = selectedDeckIds
          .map((id) => Number(id))
          .filter((n) => !Number.isNaN(n) && n > 0);

        const cards = (await dbHelpers.getShuffledCardsFromDecks(
          numericIds,
        )) as Card[];
        set({ currentCards: cards });
      },

      createDeck: async (name, category) => {
        await dbHelpers.createDeck(name, category, "user-created");
        await get().loadDecks();
      },

      deleteDeck: async (deckId) => {
        await dbHelpers.deleteDeck(Number(deckId));
        set((state) => ({
          selectedDeckIds: state.selectedDeckIds.filter((id) => id !== deckId),
        }));
        await get().loadDecks();
      },
    }),
    {
      name: "deck-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ selectedDeckIds: state.selectedDeckIds }),
    },
  ),
);
