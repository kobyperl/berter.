
/**
 * Helps a user write a better barter offer using Gemini via Serverless Function.
 * This avoids exposing the API KEY in the client-side bundle.
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
    const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rawInput }),
    });

    if (!response.ok) {
        console.error("Server API Error:", response.status, response.statusText);
        return null;
    }

    const data = await response.json();

    // Validate and fallback if fields are missing to ensure UI doesn't break
    return {
        title: data.title || "הצעה חדשה",
        description: data.description || rawInput,
        offeredService: data.offeredService || "שירות",
        requestedService: data.requestedService || "שירות",
        location: data.location || "כל הארץ",
        tags: Array.isArray(data.tags) ? data.tags : [],
        durationType: data.durationType === 'ongoing' ? 'ongoing' : 'one-time',
        expirationDate: data.expirationDate
    };

  } catch (error) {
    console.error("Offer optimization failed:", error);
    return null;
  }
};
