'use client';
import { useState } from 'react';
import generateImage from './api/stableDiffusion';

export default function Home() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>('A beautiful sunset over the ocean');

  const onClick = async () => {
    const imageBuffer = await generateImage(promptText);

    if (imageBuffer) {
      // Convert the buffer to a Blob URL for image display
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      const imageUrl = URL.createObjectURL(blob);
      setImageSrc(imageUrl);
    }
  };

  return (
    <main className='bg-white text-black'>
      <div className='flex justify-between p-5'>
        <h1 className='text-2xl font-bold text-sky-800'>IOI movie set generator</h1>
        <h2 className='text-xl font-semibold text-neutral-500'>By Rok Rajher</h2>
      </div>
  
      <div className='grid grid-cols-2 bg-neutral-100 p-5'>
        <div className='flex flex-col items-center justify-center bg-red-50 p-5'>
          <button className='rounded-md bg-sky-700 p-2 text-white' onClick={onClick}>Generate</button>
          
          {/* Image container with a border and placeholder text */}
          <div 
            className={`w-48 h-48 border-2 border-dashed ${imageSrc ? 'border-transparent' : 'border-sky-500'} flex items-center justify-center`}
          >
            {!imageSrc && <p className="text-sky-500">Image will appear here</p>}
            {imageSrc && <img src={imageSrc} alt="Generated Image" className="w-full h-full object-cover" />}
          </div>
        </div>
        <div className='flex flex-col items-center justify-center bg-red-50 p-5'>
          <p>HEllow</p>
        </div>
      </div>
    </main>
  );
}  