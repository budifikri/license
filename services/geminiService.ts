import { GoogleGenAI } from "@google/genai";

// Per Gemini API guidelines, the API key is expected to be available in the environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateDescription = async (productName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a short, compelling marketing description for a software product named "${productName}". Keep it under 50 words.`,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating description with Gemini API:", error);
    throw new Error("Failed to generate description. Please check your API key and network connection.");
  }
};
