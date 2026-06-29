export interface GenerationResult {
  success: boolean;
  deck?: any;
  error?: string;
}

// Hardcoded safe fallbacks based on your dashboard, just in case the /models endpoint fails
const DEFAULT_FALLBACK_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "qwen/qwen3.6-27b",
  "qwen/qwen3-32b",
];

/**
 * Dynamically fetches all available models from Groq for your account,
 * filtering out utility models (like prompt-guard) that can't generate decks.
 */
const fetchAvailableModels = async (apiKey: string): Promise<string[]> => {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      console.warn("[AI] Failed to fetch dynamic models. Using defaults.");
      return DEFAULT_FALLBACK_MODELS;
    }

    const data = await res.json();

    // Extract IDs and filter out audio/vision/guard models
    const activeModels = data.data
      .map((m: any) => m.id)
      .filter(
        (id: string) =>
          !id.includes("whisper") &&
          !id.includes("prompt-guard") &&
          !id.includes("safeguard"),
      );

    // If we successfully got models, return them. Ensure our preferred model is first.
    if (activeModels.length > 0) {
      // Try to put a smart/versatile model at the top of the queue if it exists
      const preferred = activeModels.find(
        (m: string) => m.includes("70b") || m.includes("llama-3.3"),
      );
      if (preferred) {
        return [
          preferred,
          ...activeModels.filter((m: string) => m !== preferred),
        ];
      }
      return activeModels;
    }

    return DEFAULT_FALLBACK_MODELS;
  } catch (error) {
    console.warn("[AI] Network error fetching models. Using defaults.");
    return DEFAULT_FALLBACK_MODELS;
  }
};

export const generateDeckViaAI = async (
  categoryName: string,
  apiKey: string,
  slugId: string,
): Promise<GenerationResult> => {
  if (!categoryName.trim())
    return { success: false, error: "Category name is blank." };
  if (!apiKey.trim())
    return { success: false, error: "Missing Groq API credentials." };

  const prompt = `You are a professional word game card designer. Create a custom word-guessing game card pack themed specifically around the category: "${categoryName}".
  Generate exactly 15 highly relevant concepts/words. 
  
  Return your complete response as a raw, single JSON object literal without markdown wrappers (no \`\`\`json blocks). Use this exact structure:
  {
    "name": "${categoryName}",
    "category": "Community Generated",
    "description": "A fun short description about ${categoryName}",
    "icon": "Sparkles",
    "color": "#8B5CF6",
    "difficulty": "medium",
    "tags": ["ai", "community"],
    "cards": [
      { "word": "Concept", "tabooWords": ["word1", "word2", "word3", "word4"], "charadesHint": "", "passwordHint": "" }
    ]
  }`;

  let lastError = "Unknown generation error.";

  // 1. Get the live list of models your account is allowed to use right now
  const modelsToTry = await fetchAvailableModels(apiKey);
  console.log(
    `[AI] Retrieved ${modelsToTry.length} models to try:`,
    modelsToTry,
  );

  // 2. Fallback Loop Manager
  for (const model of modelsToTry) {
    try {
      console.log(`[AI Generator] Attempting with model: ${model}`);

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
          }),
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error(`Rate limited on ${model}`);
        }
        if (errData.error?.code === "model_decommissioned") {
          throw new Error(`${model} is decommissioned`);
        }
        throw new Error(
          `API Error ${response.status} on ${model}: ${errData.error?.message || ""}`,
        );
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim() || "";

      // Cleanse markdown formatting if the LLM ignored instructions
      const jsonString = content
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      let parsedData;
      try {
        parsedData = JSON.parse(jsonString);
      } catch (parseError) {
        throw new Error(
          `Malformed JSON output from ${model}. Moving to next model.`,
        );
      }

      // Verify the essential array exists
      if (!parsedData.cards || !Array.isArray(parsedData.cards)) {
        throw new Error(
          `Invalid JSON schema from ${model}. Moving to next model.`,
        );
      }

      // Formatting correctly for the repository
      const completeDeck = {
        id: slugId,
        name: parsedData.name || categoryName,
        category: "Community Generated",
        description:
          parsedData.description || `Community pack about ${categoryName}`,
        icon: parsedData.icon || "Sparkles",
        color: parsedData.color || "#8B5CF6",
        difficulty: parsedData.difficulty || "medium",
        tags: parsedData.tags || ["ai"],
        cardCount: parsedData.cards.length,
        cards: parsedData.cards.map((c: any, index: number) => ({
          id: `${slugId}-card-${index + 1}`,
          word: c.word,
          tabooWords: Array.isArray(c.tabooWords) ? c.tabooWords : [],
          charadesHint: c.charadesHint || "",
          passwordHint: c.passwordHint || "",
        })),
      };

      console.log(`[AI Generator] Success using ${model}!`);
      return { success: true, deck: completeDeck };
    } catch (error: any) {
      console.warn(`[AI Generator] ${model} failed:`, error.message);
      lastError = error.message;
      // Loop continues to try the next model automatically
    }
  }

  return {
    success: false,
    error: `All available models failed. Last error: ${lastError}`,
  };
};
