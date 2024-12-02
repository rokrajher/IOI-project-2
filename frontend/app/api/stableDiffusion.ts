import axios from "axios";

interface ResponseData {
  image: string; // Base64-encoded image
}

/**
 * Generate an image using the FastAPI backend.
 * @param promptText The text prompt for image generation.
 * @returns A base64-encoded string of the image or null if there's an error.
 */
export default async function generateImage(promptText: string): Promise<string | null> {
  try {
    const response = await axios.get<ResponseData>("http://localhost:8000/generate", {
      params: { prompt: promptText },
    });

    if (response.status === 200 && response.data.image) {
      return response.data.image; // Return the base64 image string
    } else {
      throw new Error("Invalid response from backend");
    }
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
}
