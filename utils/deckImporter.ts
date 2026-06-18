import { getDb, dbHelpers } from "./database";

const GENERAL_DECK = require("../assets/decks/general_deck.json") as DeckJson;

// ── Types — match the JSON format exactly ─────────────────────────────────────

interface DeckCard {
  id: string;
  word: string;
  tabooWords: string[];
  charadesHint?: string;
  passwordHint?: string;
}

interface DeckJson {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  description: string;
  difficulty: string;
  tags: string[];
  cardCount: number;
  cards: DeckCard[];
}

// ── Seed ──────────────────────────────────────────────────────────────────────

export const seedStarterDecksIfEmpty = async (): Promise<void> => {
  const database = getDb();
  if (!database) return;

  try {
    const rows = await database.getAllAsync(
      "SELECT COUNT(*) as count FROM decks;",
    );
    const count = (rows[0] as { count: number }).count;

    if (count > 0) return;

    // 3. REMOVED withTransactionAsync for Web stability
    const deckId = await dbHelpers.createDeck(
      GENERAL_DECK.name,
      GENERAL_DECK.category,
      "bundled",
      GENERAL_DECK.icon,
      GENERAL_DECK.color,
      GENERAL_DECK.description,
    );

    if (!deckId) return;

    for (const card of GENERAL_DECK.cards) {
      await dbHelpers.createCard(
        deckId,
        card.word,
        card.tabooWords,
        card.charadesHint ?? "",
        card.passwordHint ?? "",
      );
    }

    console.log(
      `Seeded "${GENERAL_DECK.name}" — ${GENERAL_DECK.cards.length} cards.`,
    );
  } catch (error) {
    console.error("Failed to seed starter deck:", error);
  }
};

export const BUNDLED_DECK_NAME = GENERAL_DECK.name;
