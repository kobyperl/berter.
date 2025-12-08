import { GoogleGenAI } from "@google/genai";

const API_KEY = "AIzaSyDQpdTeRrPk-6iYgz8zOlgdW7UitohoWzA";

/**
 * Helps a user write a better barter offer using Gemini.
 */
export const optimizeOfferDescription = async (rawInput: string): Promise<{ 
    title: string, 
    description: string,
    offeredService: string,
    requestedService: string,
    location: string,
    tags: string[],
    expirationDate?: string
} | null> => {
  
  if (!API_KEY) {
    console.warn("Gemini API Key missing.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
      Current Date: ${today}
      Analyze this barter offer request: "${rawInput}"
      
      Return a JSON object with:
      - title (Hebrew, professional)
      - description (Hebrew, persuasive)
      - offeredService (Short Hebrew)
      - requestedService (Short Hebrew)
      - location (Hebrew, City or 'Remote')
      - tags (Array of strings)
      - expirationDate (YYYY-MM-DD, only if a deadline is explicitly mentioned relative to today)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Offer optimization failed:", error);
    return null;
  }
};