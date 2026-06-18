import { getDb, dbHelpers } from "./database";

export interface CloudDeckIndexItem {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  url: string;
  cardCount: number;
}

// JSON shape of an individual downloaded deck file
interface CloudDeckCard {
  id: string;
  word: string;
  tabooWords: string[];
  charadesHint?: string;
  passwordHint?: string;
}

interface CloudDeckFile {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  description: string;
  difficulty: string;
  tags: string[];
  cardCount: number;
  cards: CloudDeckCard[];
}

const INDEX_URL =
  "https://raw.githubusercontent.com/fran-mg/articulate-decks/main/decks-index.json";

export const fetchCloudDecksIndex = async (): Promise<CloudDeckIndexItem[]> => {
  try {
    const response = await fetch(INDEX_URL);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.decks || [];
  } catch (error) {
    console.error("Failed to fetch decks index:", error);
    throw error;
  }
};

// Syncs already downloaded decks that got stuck with the default CloudDownload icon
export const syncCommunityDecksMeta = async (
  installedDecks: any[],
): Promise<boolean> => {
  const database = getDb();
  if (!database) return false;
  try {
    const hasPotentialOutdatedDecks = installedDecks.some(
      (d) => d.icon === "CloudDownload" || d.icon === "DownloadCloud",
    );
    if (!hasPotentialOutdatedDecks) return false;

    const items = await fetchCloudDecksIndex();
    let updated = false;

    for (const cloudDeck of items) {
      const matchingDecks = installedDecks.filter(
        (d) =>
          (d.name === cloudDeck.name ||
            d.name.startsWith(`${cloudDeck.name}_v`)) &&
          (d.icon === "CloudDownload" || d.icon === "DownloadCloud"),
      );

      for (const deck of matchingDecks) {
        await dbHelpers.updateDeck(Number(deck.id), {
          icon: cloudDeck.icon,
          color: cloudDeck.color,
        });
        updated = true;
      }
    }

    return updated;
  } catch (err) {
    console.error("Failed to sync community decks meta:", err);
    return false;
  }
};

// Helper to generate versioned deck name if name already exists
const getVersionedDeckName = (
  baseName: string,
  existingDecks: any[],
): string => {
  const existingNames = existingDecks.map((d) => d.name);

  // If base name doesn't exist, use it
  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  // Escape special regex characters in baseName
  const escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const versionRegex = new RegExp(`^${escapedBase}_v(\\d+)$`);

  // Find all existing versions
  const versions = existingNames
    .map((name) => {
      const match = name.match(versionRegex);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((v) => v > 0);

  // If no v2 exists, use it
  if (!existingNames.includes(`${baseName}_v2`)) {
    return `${baseName}_v2`;
  }

  // Find highest version and increment
  const maxVersion = Math.max(...versions);
  return `${baseName}_v${maxVersion + 1}`;
};

export const downloadAndImportDeck = async (
  deckItem: CloudDeckIndexItem,
  installedDecks: any[],
): Promise<{ success: boolean; deckName?: string }> => {
  const database = getDb();
  if (!database) return { success: false };

  try {
    const response = await fetch(deckItem.url);
    if (!response.ok) throw new Error("Failed to fetch deck file");
    const deckData = (await response.json()) as CloudDeckFile;

    const finalDeckName = getVersionedDeckName(deckData.name, installedDecks);

    const deckId = await dbHelpers.createDeck(
      finalDeckName,
      deckItem.category || deckData.category,
      "community",
      deckItem.icon || deckData.icon || "CloudDownload",
      deckItem.color || deckData.color || "#6366f1",
      deckItem.description || deckData.description || "",
      deckItem.url || "",
    );

    if (deckId && deckData.cards) {
      for (const card of deckData.cards) {
        await dbHelpers.createCard(
          deckId,
          card.word,
          card.tabooWords,
          card.charadesHint ?? "",
          card.passwordHint ?? "",
        );
      }
    }

    return { success: true, deckName: finalDeckName };
  } catch (error) {
    console.error(
      `Failed to download and import deck ${deckItem.name}:`,
      error,
    );
    return { success: false };
  }
};
