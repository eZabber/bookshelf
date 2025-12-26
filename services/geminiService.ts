import { GoogleGenerativeAI } from "@google/generative-ai";

export const getBookInsights = async (title: string, author: string) => {
  try {
    // KORJATTU: Käytetään import.meta.env ja oikeaa muuttujan nimeä
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    
    // Käytetään vakaata mallia (esim. gemini-1.5-flash)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Provide a very short (2-sentence) summary and a one-sentence "vibe" check for the book "${title}" by ${author}. Format: Summary: [summary] Vibe: [vibe]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text() || "No insights found.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate insights at this time.";
  }
};