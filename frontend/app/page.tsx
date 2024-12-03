'use client';
import { useState, useEffect } from 'react';
import generateImage from './api/stableDiffusion';
import extractScene from './api/extractScene';
import Footer from './components/footer';
import Topbar from './components/topbar';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import updatePromptText from './utils/helpers';

enum ImageStyle {
  'Realism' = 'Realism',
  "Cartoon" = "Cartoon",
  "Cyberpunk" = "Cyberpunk",
}

enum Brightness {
  'Bright' = 'Bright',
  "Normal" = "Normal",
  'Dark' = 'Dark',
}

enum Color {
  'Color' = 'Color',
  'Black & White' = 'Black & White',
}

export default function Home() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>('');
  const [screenplay, setScreenplay] = useState<string>('');
  const [allScenes, setAllScenes] = useState<string[]>([]);
  const [loadingExtracting, setLoadingExtracting] = useState<boolean>(false);
  const [loadingImage, setLoadingImage] = useState<boolean>(false);
  const [imageStyle, setImageStyle] = useState<ImageStyle>();
  const [brightness, setBrightness] = useState<Brightness>();
  const [color, setColor] = useState<Color>();
  const [promptToSubmit, setPromptToSubmit] = useState<string>('');


  const allEmpty = promptText.trim() === '' || (!imageStyle && !brightness && !color);

  const generateImg = async () => {
    setLoadingImage(true); // Start loading
    try {
      const imageBuffer = await generateImage(promptToSubmit);
      if (imageBuffer) {
        const imageUrl = `data:image/png;base64,${imageBuffer}`;
        setImageSrc(imageUrl);
      }
    } finally {
      setLoadingImage(false); // End loading
    }
  };

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted');
    if (promptText.trim() === '') {
      return;
    }
    const updatedPrompt = updatePromptText(promptText, imageStyle, brightness, color);
    setPromptToSubmit(updatedPrompt);

    window.alert('Your parameters have been set successfully!');

    console.log('Updated prompt:', updatedPrompt);


  };

  const extractSceneDescription = async () => {
    setLoadingExtracting(true); // Start loading
    try {
      const sceneDescription = await extractScene(screenplay);
      if (sceneDescription) {
        setAllScenes(sceneDescription);
        if (sceneDescription.length > 0) {
          setPromptText(sceneDescription[0]);
          setPromptToSubmit(sceneDescription[0]);
        }
      }
    } finally {
      setLoadingExtracting(false); // End loading
    }
  };

  useEffect(() => {
    if (screenplay) {
      extractSceneDescription();
    }
  }, [screenplay]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setBrightness(undefined)
    setColor(undefined)
    setImageStyle(undefined)
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const pdfDataUrl = event.target?.result as string;

        const loadingTask = pdfjsLib.getDocument({ url: pdfDataUrl });
        loadingTask.promise.then(async (pdf: pdfjsLib.PDFDocumentProxy) => {
          const numPages: number = 1; // For testing purposes
          let fullText: string = '';

          for (let pageNum: number = 1; pageNum <= numPages; pageNum++) {
            const page: pdfjsLib.PDFPageProxy = await pdf.getPage(pageNum);
            const textContent: pdfjsLib.TextContent = await page.getTextContent();
            const pageText: string = textContent.items.map((item: pdfjsLib.TextItem) => item.str).join(' ');
            fullText += `${pageText}\n\n`;
          };

          setScreenplay(fullText);
        }).catch((error: any) => {
          console.error('Error during PDF processing:', error);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSceneSelect = (scene: string) => {
    setPromptText(scene);
  };

  return (
    <main className='bg-white text-black'>
      <Topbar />
      <div className='grid grid-cols-2 bg-neutral-100 p-5'>
        <div className='left-container p-5'>
          <h1 className='text-2xl font-semibold mb-4 text-neutral-800'>Generate your scene from a pdf file</h1>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="mb-4"
          />

          {loadingExtracting ? (
            <p className='text-green-500'>Loading scenes...</p>
          ) : (
            allScenes.length > 0 && (
              <div>
                <ul className='flex space-x-3'>
                  {allScenes.map((scene, index) => (
                    <li
                      className='bg-sky-200 font-semibold text-neutral-700 p-2 rounded-t-md shadow-md hover:cursor-pointer hover:bg-sky-300'
                      key={index}
                      onClick={() => handleSceneSelect(scene)}
                    >
                      Scene {index + 1}
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Upload your script for automatic prompt generation..."
            className="w-full h-32 p-2 border border-gray-300 rounded-md mb-4"
          />
          <div className={`w-full bg-gradient-to-tr from-red-300 to-sky-300 aspect-video border-2 border-dashed ${imageSrc ? 'border-transparent' : 'border-neutral-700'} flex items-center justify-center`}>
            {!imageSrc && !loadingImage && <p className="text-2xl text-neutral-800 font-semibold">Image will appear here</p>}
            {loadingImage && <p className='text-2xl text-neutral-600'>Generating image...</p>}
            {imageSrc && <img src={imageSrc} alt="Generated Image" className="w-full h-full object-cover" />}
          </div>
          <button className='rounded-md bg-sky-700 p-2 text-white mt-4' onClick={generateImg} disabled={loadingImage}>
            {loadingImage ? 'Generating...' : 'Generate'}
          </button>
        </div>
        <div className='right-container p-5'>
          <h1 className='text-2xl font-semibold mb-4 text-neutral-800'>Set parameters</h1>
          <div className='flex flex-col space-y-4'>
            <div>
              <span>Image Style</span>
              <div className='flex space-x-2'>
                {Object.values(ImageStyle).map((style) => (
                  <button
                    key={style}
                    id={`image-style-${style}`}
                    className={`p-2 rounded-md ${imageStyle === style ? 'bg-sky-600 text-white' : 'bg-gray-200 text-black'} hover:bg-sky-500`}
                    onClick={() => setImageStyle(style as ImageStyle)}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span>Brightness</span>
              <div className='flex space-x-2'>
                {Object.values(Brightness).map((level) => (
                  <button
                    key={level}
                    id={`brigtness-${level}`}
                    className={`p-2 rounded-md ${brightness === level ? 'bg-sky-600 text-white' : 'bg-gray-200 text-black'} hover:bg-sky-500`}
                    onClick={() => setBrightness(level as Brightness)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span>Color</span>
              <div className='flex space-x-2'>
                {Object.values(Color).map((colorOption) => (
                  <button
                    key={colorOption}
                    id={`color-${colorOption}`}
                    className={`p-2 rounded-md ${color === colorOption ? 'bg-sky-600 text-white' : 'bg-gray-200 text-black'} hover:bg-sky-500`}
                    onClick={() => setColor(colorOption as Color)}
                  >
                    {colorOption}
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={onFormSubmit} className='w-full flex items-center justify-center'>
              <button id="submit-button" className={`rounded-md w-full bg-sky-700 p-2 text-white ${allEmpty ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={allEmpty} type="submit">
                Apply
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
