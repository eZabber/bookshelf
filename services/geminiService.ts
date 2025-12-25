
import { GoogleGenAI } from "@google/genai";

export const getBookInsights = async (title: string, author: string) => {
  try {
    // Fixed: Always use the process.env.API_KEY directly and initialize inside the function
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a very short (2-sentence) summary and a one-sentence "vibe" check for the book "${title}" by ${author}. Format: Summary: [summary] Vibe: [vibe]`,
      config: {
        temperature: 0.7,
        // Fixed: Removed maxOutputTokens as recommended to avoid blocking responses when using thinking models
      }
    });

    // Fixed: response.text is a property, not a method
    return response.text || "No insights found.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate insights at this time.";
  }
};
