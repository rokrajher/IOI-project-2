import axios from 'axios';

interface ResponseData {
  image: string; // The backend sends a base64-encoded image string
  error?: string; // Error message, if any
}

/**
 * Generate an image using the FastAPI backend.
 * @param promptText The text prompt for image generation.
 * @returns A base64-encoded string of the image or null if there's an error.
 */
export default async function generateImage(promptText: string): Promise<string | null> {
  try {
    const response = await axios.get<ResponseData>('http://0.0.0.0:8000/generate', {
      params: { prompt: promptText },
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 200 && response.data.image) {
      return response.data.image; // Base64 image string
    } else if (response.data.error) {
      throw new Error(response.data.error);
    } else {
      throw new Error('Unknown error occurred');
    }
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}
