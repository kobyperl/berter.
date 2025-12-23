
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rawInput } = req.body || {};

  if (!rawInput) {
    return res.status(400).json({ error: 'Missing rawInput in request body' });
  }

  if (!process.env.API_KEY) {
    console.error("API_KEY is missing in environment variables");
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const today = new Date().toISOString().split('T')[0];
    
    const prompt = `
      Current Date: ${today}
      Analyze this barter offer request: "${rawInput}"
      Extract structured data in Hebrew.
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A professional and catchy title (Hebrew)." },
        description: { type: Type.STRING, description: "A persuasive and clear description (Hebrew)." },
        offeredService: { type: Type.STRING, description: "Short summary of what is given (Hebrew)." },
        requestedService: { type: Type.STRING, description: "Short summary of what is requested (Hebrew)." },
        location: { type: Type.STRING, description: "The city or 'כל הארץ'." },
        tags: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Up to 5 relevant tags."
        },
        durationType: { 
          type: Type.STRING, 
          enum: ["one-time", "ongoing"],
          description: "Duration of the barter."
        },
        expirationDate: { type: Type.STRING, description: "YYYY-MM-DD if mentioned." }
      },
      required: ["title", "description", "offeredService", "requestedService", "tags", "durationType"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      },
    });

    const jsonStr = response.text;
    if (!jsonStr) {
      throw new Error("Empty response from Gemini");
    }

    const jsonResponse = JSON.parse(jsonStr.trim());
    return res.status(200).json(jsonResponse);

  } catch (error: any) {
    console.error("Gemini optimization error:", error);
    return res.status(500).json({ error: 'Failed to optimize offer', details: error.message });
  }
}
