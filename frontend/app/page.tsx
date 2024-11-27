'use client';
import { useState } from 'react';
import generateImage from './api/stableDiffusion';

export default function Home() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const onClick = async () => {
    const imageBuffer = await generateImage();

    if (imageBuffer) {
      // Convert the buffer to a Blob URL for image display
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      const imageUrl = URL.createObjectURL(blob);
      setImageSrc(imageUrl);
    }
  };

  return (
    <main>
      <h1>Generate Image</h1>
      <button onClick={onClick}>Generate</button>

      {imageSrc && <img src={imageSrc} alt="Generated Image" />}
    </main>
  );
}
