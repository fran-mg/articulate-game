export interface GenerationResult {
  success: boolean;
  deck?: any;
  error?: string;
}

// Fallback list of Groq models. It attempts them in order.
const GROQ_MODELS = [
  "llama3-70b-8192",
  "llama3-8b-8192",
  "mixtral-8x7b-32768",
  "gemma-7b-it",
];

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

  // Model Fallback Manager
  for (const model of GROQ_MODELS) {
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
        if (response.status === 429) {
          throw new Error(`Rate limited on ${model}`);
        }
        throw new Error(`API Error ${response.status} on ${model}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim() || "";

      // Cleanse markdown formatting if the LLM ignored instructions
      const jsonString = content
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const parsedData = JSON.parse(jsonString);

      // Verify the essential array exists
      if (!parsedData.cards || !Array.isArray(parsedData.cards)) {
        throw new Error(`Malformed JSON structure from ${model}`);
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

      return { success: true, deck: completeDeck };
    } catch (error: any) {
      console.warn(`[AI Generator] ${model} failed:`, error.message);
      lastError = error.message;
      // Loop continues to try the next model
    }
  }

  return {
    success: false,
    error: `All AI models failed. Last error: ${lastError}`,
  };
};
