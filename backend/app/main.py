from app.auth_token import hf_auth_token
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
import torch
from torch import autocast
from diffusers import StableDiffusion3Pipeline
from io import BytesIO
import base64


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipe = StableDiffusion3Pipeline.from_pretrained("stabilityai/stable-diffusion-3.5-large", torch_dtype=torch.bfloat16, token=hf_auth_token)
pipe = pipe.to("cuda")

@app.get("/generate")
def generate(prompt: str):
    image = pipe(
        prompt,
        num_inference_steps=28,
        guidance_scale=3.5,
    ).images[0]
    image = image.cpu().numpy().clip(0, 1)
    image = (image * 255).astype("uint8")
    image = BytesIO(image)
    image = base64.b64encode(image.getvalue()).decode("utf-8")
    image.save("image.png")
    return Response(content=image, media_type="image/png")

