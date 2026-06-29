import { generateDeckViaAI } from "./aiGenerator";

const REPO_OWNER = "fran-mg";
const REPO_NAME = "rumble-decks";
const BRANCH = "main";
const GITHUB_API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

// Safe Base64 encoding/decoding for Unicode/UTF-8 strings in React Native
const utf8ToBase64 = (str: string) => {
  return btoa(unescape(encodeURIComponent(str)));
};
const base64ToUtf8 = (str: string) => {
  return decodeURIComponent(escape(atob(str)));
};

const createSlug = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// Unified GitHub API Fetcher
async function githubRequest(path: string, method: string = "GET", body?: any) {
  const GITHUB_TOKEN = process.env.EXPO_PUBLIC_GITHUB_PAT;
  const response = await fetch(`${GITHUB_API_BASE}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok && response.status !== 404) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `GitHub API Error (${response.status}): ${err.message || response.statusText}`,
    );
  }
  return response;
}

export async function orchestrateCommunityDeckGeneration(categoryName: string) {
  const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  const GITHUB_TOKEN = process.env.EXPO_PUBLIC_GITHUB_PAT;

  if (!GROQ_KEY || !GITHUB_TOKEN) {
    return { success: false, error: "Missing API keys in environment." };
  }

  const slug = createSlug(categoryName);
  const indexPath = "userGeneratedDecks-index.json";
  const deckPath = `generated-packs/${slug}.json`;

  try {
    // 1. Fetch current Community Index
    const indexRes = await githubRequest(indexPath);
    let indexData = { decks: [] as any[] };
    let indexSha = "";

    if (indexRes.status === 200) {
      const json = await indexRes.json();
      indexSha = json.sha;
      indexData = JSON.parse(base64ToUtf8(json.content));
    }

    // 2. Prevent Duplicate Submission
    const exists = indexData.decks.some(
      (d) =>
        d.id === slug || d.name.toLowerCase() === categoryName.toLowerCase(),
    );
    if (exists) {
      return {
        success: false,
        error: `A pack for "${categoryName}" already exists in the community.`,
      };
    }

    // 3. AI Generation
    const aiResult = await generateDeckViaAI(categoryName, GROQ_KEY, slug);
    if (!aiResult.success || !aiResult.deck) {
      return { success: false, error: aiResult.error };
    }
    const newDeck = aiResult.deck;

    // 4. TRANSACTION START: Upload the JSON file
    const deckRes = await githubRequest(deckPath, "PUT", {
      message: `Create generated pack: ${newDeck.name}`,
      content: utf8ToBase64(JSON.stringify(newDeck, null, 2)),
      branch: BRANCH,
    });

    if (!deckRes.ok)
      throw new Error("Failed to upload the new deck JSON to the repository.");
    const deckJsonRes = await deckRes.json();
    const newDeckSha = deckJsonRes.content.sha;

    // 5. Update the Index array
    const newIndexEntry = {
      id: newDeck.id,
      name: newDeck.name,
      category: newDeck.category,
      description: newDeck.description,
      icon: newDeck.icon,
      color: newDeck.color,
      url: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${deckPath}`,
      cardCount: newDeck.cardCount,
    };
    indexData.decks.unshift(newIndexEntry); // Add to top

    // 6. TRANSACTION END: Upload updated index
    const indexUpdateRes = await githubRequest(indexPath, "PUT", {
      message: `Update community index with: ${newDeck.name}`,
      content: utf8ToBase64(JSON.stringify(indexData, null, 2)),
      sha: indexSha || undefined, // undefined for first-time creation
      branch: BRANCH,
    });

    // 7. ALL-OR-NOTHING ROLLBACK
    if (!indexUpdateRes.ok) {
      // Rollback the JSON file we just created
      await githubRequest(deckPath, "DELETE", {
        message: `Rollback: Delete orphaned pack ${newDeck.name}`,
        sha: newDeckSha,
        branch: BRANCH,
      });
      throw new Error(
        "Failed to update the index. Changes were safely rolled back.",
      );
    }

    return {
      success: true,
      message: `"${newDeck.name}" has been published globally!`,
    };
  } catch (error: any) {
    console.error("Orchestration Error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}
