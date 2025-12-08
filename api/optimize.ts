
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rawInput } = req.body;

  if (!rawInput) {
    return res.status(400).json({ error: 'Missing rawInput' });
  }

  // Securely access the API key from Vercel Environment Variables
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("Gemini API Key missing in server environment variables.");
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
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
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (text) {
      const jsonResponse = JSON.parse(text);
      return res.status(200).json(jsonResponse);
    } else {
      return res.status(500).json({ error: 'No content generated' });
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: 'Failed to optimize offer' });
  }
}
