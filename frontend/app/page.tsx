'use client';
import { useState } from 'react';
import generateImage from './api/stableDiffusion';
import extractScene from './api/extractScene';
import Footer from './components/footer';
import Topbar from './components/topbar';
import * as pdfjsLib from 'pdfjs-dist/webpack';

export default function Home() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>('A beautiful sunset over the ocean');
  const [screenplay, setScreenplay] = useState<string>('');

  const generateImg = async () => {
    const imageBuffer = await generateImage(promptText);
    if (imageBuffer) {
      // Directly set the base64 string as the source
      const imageUrl = `data:image/png;base64,${imageBuffer}`;
      setImageSrc(imageUrl);
    }
  };

  const extractSceneDescription = async () => {
    const sceneDescription = await extractScene(screenplay);
    if (sceneDescription) {
      console.log('Main scene:', sceneDescription);
      setPromptText(sceneDescription);
    }
  }


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const pdfDataUrl = event.target?.result as string;

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ url: pdfDataUrl });
        loadingTask.promise.then(async (pdf: pdfjsLib.PDFDocumentProxy) => {
          const numPages: number = pdf.numPages;
          let fullText: string = '';

          // Extract text from each page
          for (let pageNum: number = 1; pageNum <= numPages; pageNum++) {
            const page: pdfjsLib.PDFPageProxy = await pdf.getPage(pageNum);
            const textContent: pdfjsLib.TextContent = await page.getTextContent();
            const pageText: string = textContent.items.map((item: pdfjsLib.TextItem) => item.str).join(' ');
            fullText += `${pageText}\n\n`; // Add page text with spacing
          }

          console.log('Screenplay text:', fullText);
          setScreenplay(fullText); // Store extracted text in state
        }).catch((error: any) => {
          console.error('Error during PDF processing:', error);
        });
      };
      reader.readAsDataURL(file); // Read file as Data URL
    }
  };

  return (
    <main className='bg-white text-black'>
      <Topbar />
      <div className='grid grid-cols-2 bg-neutral-100 p-5'>
        <div className='left-container bg-red-200 p-5'>
            <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="mb-4"
            />
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Upload your script for automatic prompt generation..."
            className="w-full h-32 p-2 border border-gray-300 rounded-md mb-4"
          />
          <div className={`w-full aspect-video border-2 border-dashed ${imageSrc ? 'border-transparent' : 'border-sky-500'} flex items-center justify-center`}>
            {!imageSrc && <p className="text-sky-500">Image will appear here</p>}
            {imageSrc && <img src={imageSrc} alt="Generated Image" className="w-full h-full object-cover" />}
          </div>
          <button className='rounded-md bg-sky-700 p-2 text-white mt-4' onClick={generateImg}>Generate</button>
        </div>
        <div className='flex flex-col items-center justify-center bg-red-50 p-5'>
          <p>HEllow</p>
        </div>
      </div>
      <Footer />
    </main>
  );
}  