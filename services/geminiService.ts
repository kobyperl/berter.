
import { GoogleGenAI, Type, Schema } from "@google/genai";

/**
 * Helps a user write a better barter offer using Gemini via Client SDK.
 */
export const optimizeOfferDescription = async (rawInput: string): Promise<{ 
    title: string, 
    description: string,
    offeredService: string,
    requestedService: string,
    location: string,
    tags: string[],
    durationType: 'one-time' | 'ongoing',
    expirationDate?: string
} | null> => {
  
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API Key is missing");
        return null;
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const today = new Date().toISOString().split('T')[0];
    
    // Define the expected JSON schema
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A professional and catchy title for the barter offer (Hebrew)." },
        description: { type: Type.STRING, description: "A persuasive and clear description of the offer (Hebrew)." },
        offeredService: { type: Type.STRING, description: "Short 2-4 words summarizing what is given (Hebrew)." },
        requestedService: { type: Type.STRING, description: "Short 2-4 words summarizing what is requested (Hebrew)." },
        location: { type: Type.STRING, description: "The city or area mentioned. If none mentioned, return 'כל הארץ'." },
        tags: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Up to 10 relevant tags (professions, skills, or interests)."
        },
        durationType: { 
            type: Type.STRING, 
            enum: ["one-time", "ongoing"],
            description: "ongoing for retainers/subscriptions/long-term, one-time for projects."
        },
        expirationDate: { type: Type.STRING, description: "YYYY-MM-DD format if a deadline is explicitly mentioned." }
      },
      required: ["title", "description", "offeredService", "requestedService", "tags", "durationType"]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Current Date: ${today}
        Analyze this barter offer request and extract structured data: "${rawInput}"
        Output in Hebrew.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
        const data = JSON.parse(response.text);
        // Ensure robust return even if fields are missing
        return {
            title: data.title || "הצעה חדשה",
            description: data.description || rawInput,
            offeredService: data.offeredService || "שירות",
            requestedService: data.requestedService || "שירות",
            location: data.location || "כל הארץ",
            tags: data.tags || [],
            durationType: data.durationType || "one-time",
            expirationDate: data.expirationDate
        };
    }

    return null;

  } catch (error) {
    console.error("Offer optimization failed:", error);
    return null;
  }
};
