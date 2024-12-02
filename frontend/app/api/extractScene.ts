import axios from 'axios';

interface ExtractSceneResponse {
  scene: string; // Detailed description of the main scene
  error?: string; // Error message, if any
}

/**
 * Extract the main scene from a movie screenplay using the FastAPI backend.
 * @param prompt The screenplay script as input.
 * @returns A promise that resolves to the main scene description or null if there's an error.
 */
export default async function extractScene(prompt: string): Promise<string | null> {
  try {
    // Validate input
    if (!prompt.trim()) {
      throw new Error("Prompt cannot be empty.");
    }

    // Make the POST request to the backend
    const response = await axios.post<ExtractSceneResponse>('http://localhost:8000/extract', {
      prompt: prompt,
    });

    // Check for a successful response
    if (response.status === 200 && response.data.scene) {
      return response.data.scene;
    } else if (response.data.error) {
      throw new Error(response.data.error);
    } else {
      throw new Error("Unknown error occurred while extracting the main scene.");
    }
  } catch (error) {
    // Handle errors gracefully
    console.error('Error extracting the main scene:', error);
    return null;
  }
}
