import os
import dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
from torch import autocast
from diffusers import StableDiffusion3Pipeline
from io import BytesIO
import base64

dotenv.load_dotenv()

hf_auth_token = os.getenv("HF_AUTH_TOKEN")


print(torch.__version__)
print(torch.cuda.is_available())




app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from diffusers import BitsAndBytesConfig, SD3Transformer2DModel
from diffusers import StableDiffusion3Pipeline
import torch

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


