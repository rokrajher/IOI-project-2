import axios from 'axios';
import FormData from 'form-data';

const MYAPIKEY = 'sk-nqXFdq71kVgrmN2bNs4ngqBn2EGl7QUPDODIrt88LZzwxNcI';
const authString = `Bearer ${MYAPIKEY}`;

interface ResponseData {
  status: number;
  data: Buffer;
}

export default async function generateImage(): Promise<Buffer | null> {
  const form = new FormData();
  form.append('prompt', 'Lighthouse on a cliff overlooking the ocean');
  form.append('output_format', 'jpeg');

  try {
    const response: ResponseData = await axios.post(
      'https://api.stability.ai/v2beta/stable-image/generate/sd3',
      form,
      {
        headers: {
          Authorization: authString,
          Accept: 'image/*',
        },
        responseType: 'arraybuffer',
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`${response.status}: ${response.data.toString()}`);
    }
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}
