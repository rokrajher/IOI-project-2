import os
import dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
from diffusers import BitsAndBytesConfig, SD3Transformer2DModel
from diffusers import StableDiffusion3Pipeline
from io import BytesIO
import base64
from pydantic import BaseModel
from openai import OpenAI, OpenAIError

dotenv.load_dotenv()

hf_auth_token = os.getenv("HF_AUTH_TOKEN")
chatbot_api_key = os.getenv("CHATBOT_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=chatbot_api_key,
)

model_id = "stabilityai/stable-diffusion-3.5-large"

nf4_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16
)
model_nf4 = SD3Transformer2DModel.from_pretrained(
    model_id,
    subfolder="transformer",
    quantization_config=nf4_config,
    torch_dtype=torch.bfloat16
)

pipeline = StableDiffusion3Pipeline.from_pretrained(
    model_id, 
    transformer=model_nf4,
    torch_dtype=torch.bfloat16
)
pipeline.enable_model_cpu_offload()



@app.get("/generate")
async def generate(prompt: str):
    try:
        # Generate the image using the pipeline
        image = pipeline(
            prompt=prompt,
            num_inference_steps=28,
            guidance_scale=4.5,
            max_sequence_length=512,
        ).images[0]

        # Save the image to a buffer
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode("utf-8")

        # Return the base64-encoded image in JSON format
        return JSONResponse(content={"image": img_str})

    except Exception as e:
        # Handle errors and return a clear message
        return HTTPException(status_code=500, detail=str(e))
    

    
class ExtractResponse(BaseModel):
    scenes: list[str]
    error: str | None = None


class ExtractRequest(BaseModel):
    prompt: str

@app.post("/extract", response_model=ExtractResponse)
async def extract(request: ExtractRequest):
    try:
        # Check if the prompt is valid
        if not request.prompt.strip():
            raise HTTPException(status_code=400, detail="The prompt cannot be empty.")

        completion = client.chat.completions.create(
            model="google/gemini-exp-1121:free",
            messages=[
                {
                    "role": "user",
                    "content": (
                        "You are given a movie screenplay script. Your task is to extract up to three main scenes from the script. "
                        "The main scenes are the most important or central parts of the screenplay, which typically include key actions, dialogue, or events that define the story's progression. "
                        "Please identify up to three main scenes and return detailed descriptions of them in full sentences, including the location, characters involved, and what happens in each scene:\n\n" + request.prompt
                    )
                }
            ]
        )

        # Extract the response content
        if not completion.choices or not completion.choices[0].message.content:
            raise HTTPException(status_code=502, detail="Invalid response from OpenAI API")

        response_content = completion.choices[0].message.content
        scenes = response_content.split("\n\n")[:3]  # Split the response into scenes and limit to 3

        # Return the extracted scenes
        return ExtractResponse(scenes=scenes)

    except OpenAIError as e:
        # Handle OpenAI-specific API errors
        raise HTTPException(status_code=502, detail=f"OpenAI API error: {str(e)}")

    except Exception as e:
        # Catch any other exceptions
        return ExtractResponse(scenes=["Girl with the red ballon scene from Shindlerz list"], error=str(e))


