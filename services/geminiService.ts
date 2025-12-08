
/**
 * Helps a user write a better barter offer using Gemini via Vercel Serverless Function.
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
  
  try {
    // Call the server-side API route (hosted on Vercel)
    const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rawInput }),
    });

    if (!response.ok) {
        console.error("Serverless function error:", response.statusText);
        return null;
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Offer optimization failed:", error);
    return null;
  }
};
