import axios from 'axios';

interface ExtractSceneResponse {
  scenes: string[]; // Detailed description of the main scene
  error?: string; // Error message, if any
}

/**
 * Extract the main scene from a movie screenplay using the FastAPI backend.
 * @param screenplay The screenplay script as input.
 * @returns A promise that resolves to the main scene description or null if there's an error.
 */
export default async function extractScene(screenplay: string): Promise<string[] | null> {
  try {
    // Validate input
    if (!screenplay.trim()) {
      throw new Error("Prompt cannot be empty.");
    }

    // console.log("Sending payload to backend:", screenplay);

    // Make the POST request to the backend
    const response = await axios.post<ExtractSceneResponse>('http://localhost:8000/extract', {
      prompt: screenplay,
    });

    console.log("Response from backend:", response);

    // Check for a successful response
    if (response.status != 500 && response.data.scenes) {
      console.log("Main scene extracted successfully:", response.data.scenes);
      return response.data.scenes.slice(0, 3);
    } else if (response.data.error) {
      throw new Error(response.data.error);
    } else {
      throw new Error("Unknown error occurred while extracting the main scene.");
    }
  } catch (error) {
    // Handle errors gracefully
    console.error('Error extracting the main scene:', error);
    return null
  }
}
