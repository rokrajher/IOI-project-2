import axios from "axios";

interface ResponseData {
  video: string; // Base64-encoded video string
}

/**
 * Generate a video using the FastAPI backend.
 * @param promptText The text prompt for video generation.
 * @returns A base64-encoded string of the video or null if there's an error.
 */
export default async function generateVideo(promptText: string): Promise<string | null> {
  try {
    const response = await axios.get<ResponseData>("http://localhost:8000/generate", {
      params: { prompt: promptText },
    });

    if (response.status === 200 && response.data.video) {
      return response.data.video; // Return the base64 video string
    } else {
      console.error("Unexpected response structure:", response.data);
      return null;
    }
  } catch (error) {
    console.error("Error generating video:", error);
    return null;
  }
}
