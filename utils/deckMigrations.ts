import { getDb } from "./database";
import { BUNDLED_DECK_NAME } from "./deckImporter";

// Pulled separately to avoid a circular import (database ← deckMigrations,
// deckImporter ← database, deckMigrations ← deckImporter is fine one-way).

const GENERAL_DECK = require("../assets/decks/general_deck.json") as {
  name: string;
  icon: string;
  color: string;
  description: string;
};

// Old deck names that were seeded by the previous multi-deck importer.
// We delete them so the library isn't polluted with colour-less ghost decks.
const LEGACY_BUNDLED_DECK_NAMES = [
  "Global Landmarks",
  "Sci-Fi & Fantasy",
  "Stem Cell & Cosmos",
];

export const runMigrations = async (): Promise<void> => {
  const database = getDb();
  if (!database) return;
  try {
    await removeLegacyBundledDecks();
    await syncBundledDeckMeta();
  } catch (error) {
    console.error("Migration error:", error);
  }
};

// Delete old seeded decks that no longer exist in the bundled JSON.
// Only touches source = 'bundled' rows so community/AI decks are safe.
const removeLegacyBundledDecks = async (): Promise<void> => {
  const database = getDb();
  if (!database) return;
  for (const name of LEGACY_BUNDLED_DECK_NAMES) {
    await database.runAsync(
      "DELETE FROM decks WHERE name = ? AND source = 'bundled';",
      [name],
    );
  }
};

// Keep the bundled deck's metadata in sync with the JSON file.
// Safe to run on every cold start — only fires an UPDATE when something differs.
const syncBundledDeckMeta = async (): Promise<void> => {
  const database = getDb();
  if (!database) return;
  await database.runAsync(
    `UPDATE decks
     SET icon        = ?,
         color       = ?,
         description = ?,
         updated_at  = (strftime('%s', 'now'))
     WHERE name = ? AND source = 'bundled';`,
    [
      GENERAL_DECK.icon,
      GENERAL_DECK.color,
      GENERAL_DECK.description,
      BUNDLED_DECK_NAME,
    ],
  );
};
