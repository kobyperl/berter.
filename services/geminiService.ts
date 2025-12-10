
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
    durationType: 'one-time' | 'ongoing',
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
        let errorMessage = response.statusText;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.details || response.statusText;
            console.error("Serverless function error details:", errorData);
        } catch (e) {
            console.error("Could not parse error JSON");
        }
        
        console.error(`Server error (${response.status}):`, errorMessage);
        return null;
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Offer optimization failed (Network/Client error):", error);
    return null;
  }
};
