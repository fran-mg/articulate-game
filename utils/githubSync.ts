import { generateDeckViaAI } from "./aiGenerator";

const REPO_OWNER = "fran-mg";
const REPO_NAME = "articulate-decks";
const BRANCH = "main";
const GITHUB_API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

const utf8ToBase64 = (str: string) => btoa(unescape(encodeURIComponent(str)));
const base64ToUtf8 = (str: string) => decodeURIComponent(escape(atob(str)));

const createSlug = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

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

  if (!GROQ_KEY || !GITHUB_TOKEN)
    return { success: false, error: "Missing API keys." };

  const slug = createSlug(categoryName);
  const indexPath = "userGeneratedDecks-index.json";
  const deckPath = `generated-packs/${slug}.json`;

  try {
    const indexRes = await githubRequest(indexPath);
    let indexData = { decks: [] as any[] };
    let indexSha = "";

    if (indexRes.status === 200) {
      const json = await indexRes.json();
      indexSha = json.sha;
      indexData = JSON.parse(base64ToUtf8(json.content));
    }

    const exists = indexData.decks.some(
      (d) =>
        d.id === slug || d.name.toLowerCase() === categoryName.toLowerCase(),
    );
    if (exists)
      return {
        success: false,
        error: `A pack for "${categoryName}" already exists.`,
      };

    // AI Generation
    const aiResult = await generateDeckViaAI(categoryName, GROQ_KEY, slug);
    if (!aiResult.success || !aiResult.deckFile || !aiResult.indexMeta) {
      return { success: false, error: aiResult.error };
    }

    const deckFile = aiResult.deckFile;
    const indexMeta = aiResult.indexMeta;

    // 1. Upload EXACT strict Deck JSON file (no icon/color metadata inside)
    const deckRes = await githubRequest(deckPath, "PUT", {
      message: `Create generated pack: ${deckFile.name}`,
      content: utf8ToBase64(JSON.stringify(deckFile, null, 2)),
      branch: BRANCH,
    });

    if (!deckRes.ok) throw new Error("Failed to upload the new deck JSON.");
    const newDeckSha = (await deckRes.json()).content.sha;

    // 2. Build the Index Entry (This is where icon/color are injected)
    const newIndexEntry = {
      id: deckFile.id,
      name: deckFile.name,
      category: indexMeta.category,
      description: deckFile.description,
      icon: indexMeta.icon,
      color: indexMeta.color,
      url: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${deckPath}`,
      cardCount: deckFile.cardCount,
    };
    indexData.decks.unshift(newIndexEntry);

    // 3. Upload updated Index
    const indexUpdateRes = await githubRequest(indexPath, "PUT", {
      message: `Update community index with: ${deckFile.name}`,
      content: utf8ToBase64(JSON.stringify(indexData, null, 2)),
      sha: indexSha || undefined,
      branch: BRANCH,
    });

    if (!indexUpdateRes.ok) {
      await githubRequest(deckPath, "DELETE", {
        message: `Rollback: Delete orphaned pack ${deckFile.name}`,
        sha: newDeckSha,
        branch: BRANCH,
      });
      throw new Error("Failed to update index. Changes rolled back.");
    }

    return {
      success: true,
      deckFile,
      indexMeta,
      message: `"${deckFile.name}" has been published to the community and added to your library! It may take time before apprearing in the Community Decks.`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}
