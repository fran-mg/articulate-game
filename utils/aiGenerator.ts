export interface GenerationResult {
  success: boolean;
  indexMeta?: any;
  deckFile?: any;
  error?: string;
}

const DEFAULT_FALLBACK_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "qwen/qwen3.6-27b",
  "qwen/qwen3-32b",
];

const fetchAvailableModels = async (apiKey: string): Promise<string[]> => {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) return DEFAULT_FALLBACK_MODELS;

    const data = await res.json();
    const activeModels = data.data
      .map((m: any) => m.id)
      .filter(
        (id: string) =>
          !id.includes("whisper") &&
          !id.includes("prompt-guard") &&
          !id.includes("safeguard"),
      );

    if (activeModels.length > 0) {
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
    return DEFAULT_FALLBACK_MODELS;
  }
};

// Helper to ensure proper capitalization of category names
const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
  );
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

  const titleCasedName = toTitleCase(categoryName);

  const prompt = `You are a professional word game card designer. Create a custom word-guessing game card pack themed around: "${titleCasedName}".
  
  CRITICAL INSTRUCTION: You MUST generate EXACTLY 60 highly relevant cards. Do not stop early. Do not abbreviate. Output exactly 60 objects in the cards array.
  
  Return your complete response as a raw, single JSON object literal without markdown wrappers (no \`\`\`json blocks). Use this EXACT dual-structure:
  {
    "indexMeta": {
      "category": "Actual Category (e.g. Science, Entertainment, Lifestyle)",
      "icon": "LucideIconName (e.g. Rocket, Film, Heart)",
      "color": "#HEXCODE"
    },
    "deckFile": {
      "id": "${slugId}",
      "name": "${titleCasedName}",
      "category": "Actual Category",
      "description": "Short, fun description about ${titleCasedName}",
      "difficulty": "Medium",
      "tags": ["tag1", "tag2"],
      "cardCount": 60,
      "cards": [
        {
          "word": "TARGET WORD",
          "tabooWords": ["forbidden1", "forbidden2", "forbidden3", "forbidden4", "forbidden5"],
          "charadesHint": "action hint",
          "passwordHint": "short hint"
        }
      ]
    }
  }`;

  let lastError = "Unknown generation error.";
  const modelsToTry = await fetchAvailableModels(apiKey);

  for (const model of modelsToTry) {
    try {
      console.log(`[AI] Attempting with model: ${model}`);

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
            max_tokens: 7500, // Required to ensure the LLM has space to output 60 full cards
          }),
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 429)
          throw new Error(`Rate limited on ${model}`);
        if (errData.error?.code === "model_decommissioned")
          throw new Error(`${model} is decommissioned`);
        throw new Error(`API Error ${response.status} on ${model}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim() || "";

      // Cleanse markdown if present
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

      if (
        !parsedData.deckFile?.cards ||
        !Array.isArray(parsedData.deckFile.cards)
      ) {
        throw new Error(
          `Invalid JSON schema from ${model}. Moving to next model.`,
        );
      }

      // Enforce the exact IDs and formatting required by your deckFile schema
      const formattedDeckFile = {
        id: parsedData.deckFile.id || slugId,
        name: parsedData.deckFile.name || titleCasedName,
        category:
          parsedData.deckFile.category ||
          parsedData.indexMeta?.category ||
          "Community",
        description:
          parsedData.deckFile.description ||
          `A community pack about ${titleCasedName}`,
        difficulty: parsedData.deckFile.difficulty || "Medium",
        tags: parsedData.deckFile.tags || [slugId],
        cardCount: parsedData.deckFile.cards.length,
        cards: parsedData.deckFile.cards.map((c: any, index: number) => ({
          id: `${slugId}-${String(index + 1).padStart(3, "0")}`, // e.g. "christmas-001"
          word: c.word?.toUpperCase() || "UNKNOWN",
          tabooWords: Array.isArray(c.tabooWords)
            ? c.tabooWords.slice(0, 5)
            : [],
          charadesHint: c.charadesHint || "",
          passwordHint: c.passwordHint || "",
        })),
      };

      const formattedIndexMeta = {
        category: parsedData.indexMeta?.category || "Community",
        icon: parsedData.indexMeta?.icon || "Sparkles",
        color: parsedData.indexMeta?.color || "#8B5CF6",
      };

      console.log(
        `[AI] Success using ${model}! Generated ${formattedDeckFile.cardCount} cards.`,
      );
      return {
        success: true,
        deckFile: formattedDeckFile,
        indexMeta: formattedIndexMeta,
      };
    } catch (error: any) {
      console.warn(`[AI] ${model} failed:`, error.message);
      lastError = error.message;
    }
  }

  return {
    success: false,
    error: `All models failed. Last error: ${lastError}`,
  };
};
