import os
import dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
from diffusers import BitsAndBytesConfig, SD3Transformer2DModel
from diffusers import StableDiffusion3Pipeline, StableVideoDiffusionPipeline
from io import BytesIO
import base64
from pydantic import BaseModel
from openai import OpenAI, OpenAIError
from diffusers.utils import load_image, export_to_video
import json
import re

test_scene_simba ="In *The Lion King*, a pivotal scene occurs when Simba stands on Pride Rock after the death of his father, Mufasa. The sun rises dramatically behind him, casting a golden glow and symbolizing the transition from darkness to light. As he gazes over the kingdom, a sense of responsibility weighs heavily on him, reflecting his inner conflict between guilt for his father's death and the duty to reclaim his rightful place as king. The iconic music swells, evoking deep emotions, and Simba is joined by Rafiki, who symbolizes wisdom and guidance, reinforcing the themes of legacy and self-discovery. The moment encapsulates Simba’s journey of growth and the enduring cycle of life, as he embraces his identity and destiny as the true king of the Pride Lands."
test_scene_parasite = "The poster for Parasite features a dark color palette dominated by deep greens, blacks, and grays, creating a moody atmosphere that reflects the film's themes of class struggle and social disparity. Central to the design is the stark contrast between the opulent house of the wealthy Park family and the cramped living conditions of the impoverished Kim family, often depicted in a split image that symbolizes their vastly different lives. The title *Parasite* is prominently displayed in bold, white letters, standing out against the dark background, while additional text may include taglines or credits in smaller font at the bottom. The overall mood conveys tension and mystery, inviting viewers to explore the film's commentary on deception, manipulation, and the lengths people will go to for a better life, effectively illustrating the parasitic relationship between the two families."
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


pipe = StableVideoDiffusionPipeline.from_pretrained(
    "stabilityai/stable-video-diffusion-img2vid-xt", torch_dtype=torch.float16, variant="fp16"
)
pipe.enable_model_cpu_offload()
generator = torch.manual_seed(42)



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


        
        print("generating image...")       
        # Load the conditioning image
        image = load_image(image)
        image = image.resize((1024, 576))

        frames = pipe(image, decode_chunk_size=8, generator=generator).frames[0]
        # Export the frames to a video file
        export_to_video(frames, "generated.mp4", fps=7)

        # Read the video file and encode it in base64
        with open("generated.mp4", "rb") as video_file:
            video_str = base64.b64encode(video_file.read()).decode("utf-8")

        # Return the base64-encoded video in JSON format
        return JSONResponse(content={"video": video_str})

    except Exception as e:
        # Handle errors and return a clear message
        return HTTPException(status_code=500, detail=str(e))
    

    
class ExtractResponse(BaseModel):
    scenes: list[str]
    error: str | None = None


class ExtractRequest(BaseModel):
    prompt: str


meta_prompt = """
You are given a movie screenplay script. Your task is to extract the single most significant scene from the script and return it as a prompt. The prompt will then be used for the generation of an image.

Please identify the single most significant scene and return a concise, detailed description of it in full sentences. You MUST return it in a single paragraph.

Here is an example of how the prompt should look like:
Prompt: "Eye-level shot of a rustic, hand-crafted wooden table covered with roasted coffee beans, a burlap sack spilling beans in the foreground. A hot steaming cup of espresso sits beside the sack of coffee beans, with wisps of steam curling into the air."

Return the extracted scene in a single paragraph.
"""


@app.post("/extract", response_model=ExtractResponse)
async def extract(request: ExtractRequest):
    try:
        # Check if the prompt is valid
        if not request.prompt.strip():
            raise HTTPException(status_code=400, detail="The prompt cannot be empty.")

        completion = client.chat.completions.create(
            model="meta-llama/llama-3.2-3b-instruct:free",
            messages=[
                {
                    "role": "system", 
                    "content": meta_prompt},
                {
                    "role": "user",
                    "content": request.prompt
                }
            ],
            temperature=0.1,
        )

        # Extract the response content
        if not completion.choices or not completion.choices[0].message.content:
            raise HTTPException(status_code=502, detail="Invalid response from OpenAI API")

        response_content = completion.choices[0].message.content
        print("response_content", response_content)

        # Return the extracted scenes
        return ExtractResponse(scenes=[response_content])

    except OpenAIError as e:
        # Handle OpenAI-specific API errors
        raise HTTPException(status_code=502, detail=f"OpenAI API error: {str(e)}")

    except Exception as e:
        # Catch any other exceptions
        return ExtractResponse(scenes=[test_scene_parasite, test_scene_simba], error=str(e))


