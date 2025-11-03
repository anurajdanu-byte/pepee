
import React, { useState, useCallback, FC, useEffect } from 'react';
// FIX: Removed 'ProcessOperation' from this import as it's not exported from the service.
import { processImage, generateImage } from './services/geminiService';
import { fileToImageResult } from './utils/imageUtils';
// FIX: Imported 'ProcessOperation' from './types' where it is defined.
import type { ImageResult, ProcessOperation } from './types';

// --- Helper & UI Components ---

const MagicWandIcon: FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.5 9.5a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v5.5a1 1 0 0 1-1 1zM5 11l-3 3 3 3 3-3-3-3zm11.5 8.5a1 1 0 0 1-1-1V13a1 1 0 0 1 2 0v5.5a1 1 0 0 1-1 1zm-8-8a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 2a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/>
    <path d="M21 12.5a1 1 0 0 1-1-1V9a1 1 0 0 1 2 0v2.5a1 1 0 0 1-1 1zm-19 5a1 1 0 0 1-1-1V14a1 1 0 0 1 2 0v2.5a1 1 0 0 1-1 1z"/>
  </svg>
);

const ResketchIcon: FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const EnhanceIcon: FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.423-1.423L13.25 18.5l1.188-.648a2.25 2.25 0 011.423 1.423l.648 1.188z" />
    </svg>
);

const UpscaleIcon: FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
  </svg>
);

const BrainIcon: FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h13.5m-13.5 7.5h13.5m-13.5-3.75h13.5m-13.5-3.75a3 3 0 11-6 0 3 3 0 016 0zm13.5 0a3 3 0 11-6 0 3 3 0 016 0zm-6.75 3.75a3 3 0 11-6 0 3 3 0 016 0zm13.5 0a3 3 0 11-6 0 3 3 0 016 0zm-6.75 3.75a3 3 0 11-6 0 3 3 0 016 0zm13.5 0a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
  </svg>
);

const Spinner: FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <div className={`animate-spin rounded-full border-b-2 border-white ${className}`}></div>
);

interface ImageFrameProps {
  title: string;
  imageUrl: string | null;
  isLoading?: boolean;
  loadingText?: string;
}

const ImageFrame: FC<ImageFrameProps> = ({ title, imageUrl, isLoading = false, loadingText = "Enhancing pixels..." }) => {
  const downloadImage = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-image.png`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <h2 className="text-xl font-semibold text-gray-300 tracking-wider">{title}</h2>
      <div className="aspect-square w-full bg-gray-800/50 rounded-lg shadow-lg flex items-center justify-center border-2 border-gray-700 overflow-hidden relative group">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 p-4 text-center">
            <Spinner className="h-8 w-8" />
            <p className="text-gray-400">{loadingText}</p>
          </div>
        ) : imageUrl ? (
          <>
            <img src={imageUrl} alt={title} className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button onClick={downloadImage} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors text-sm font-bold">Download</button>
            </div>
          </>
        ) : (
          <div className="text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Mode-specific Components ---

const ImageEnhancer: FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<ImageResult | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [processedImageTitle, setProcessedImageTitle] = useState<string>('AI Processed');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeOperation, setActiveOperation] = useState<ProcessOperation | null>(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = originalImage?.url;
    return () => {
      if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [originalImage]);

  const handleFileChange = (file: File | null) => {
    setProcessedImage(null);
    setError(null);
    setSelectedFile(file);
    setEditText('');

    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Invalid file type. Please select an image.');
        setOriginalImage(null);
        setSelectedFile(null);
        return;
      }
      setOriginalImage({
        url: URL.createObjectURL(file),
        mimeType: file.type,
        base64: ''
      });
    } else {
      setOriginalImage(null);
    }
  };

  const handleProcessImage = useCallback(async (operation: ProcessOperation) => {
    if (!selectedFile || isLoading) return;

    setIsLoading(true);
    setActiveOperation(operation);
    setError(null);
    setProcessedImage(null);

    const titleMap: Record<ProcessOperation, string> = {
      resketch: 'AI Resketched',
      enhance: 'AI Enhanced',
      upscale: 'AI Upscaled 10x',
      thinkingResketch: 'AI Resketched (Thinking Mode)',
      edit: 'AI Edited'
    };
    setProcessedImageTitle(titleMap[operation] || 'AI Processed');

    try {
      const imageDetails = await fileToImageResult(selectedFile);
      const processedData = await processImage(imageDetails.base64, imageDetails.mimeType, operation, editText);
      setProcessedImage(`data:image/png;base64,${processedData}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      setActiveOperation(null);
    }
  }, [selectedFile, isLoading, editText]);

  if (!originalImage) {
    return (
      <>
        <FileInput onFileSelect={handleFileChange} disabled={isLoading} />
        {error && <ErrorDisplay message={error} />}
      </>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
       {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <ImageFrame title="Original" imageUrl={originalImage.url} />
        <ImageFrame title={processedImageTitle} imageUrl={processedImage} isLoading={isLoading} loadingText={activeOperation === 'thinkingResketch' ? 'Thinking deeply to add details...' : 'Enhancing pixels...'} />
      </div>

      <div className="mt-8 flex flex-col items-center">
        <OperationPanel onProcess={handleProcessImage} isLoading={isLoading} activeOperation={activeOperation} />
        <TextEditPanel onProcess={handleProcessImage} isLoading={isLoading} activeOperation={activeOperation} editText={editText} setEditText={setEditText} />
        <button
          onClick={() => handleFileChange(null)}
          disabled={isLoading}
          className="mt-8 px-6 py-3 bg-gray-700 text-white font-bold rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Choose Different Image
        </button>
      </div>
    </div>
  );
};

const ImageGenerator: FC = () => {
    const [prompt, setPrompt] = useState('');
    type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt || isLoading) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const imageData = await generateImage(prompt, aspectRatio);
            setGeneratedImage(`data:image/png;base64,${imageData}`);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An unexpected error occurred while generating the image.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-6">
            <div className="w-full flex flex-col gap-2">
                <label htmlFor="prompt-input" className="text-lg font-semibold text-gray-300">Enter your prompt</label>
                <textarea
                    id="prompt-input"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="e.g., A cinematic shot of a raccoon in a library, wearing a tiny wizard hat"
                    className="w-full p-3 bg-gray-800 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    rows={4}
                    disabled={isLoading}
                />
            </div>
             <div className="w-full flex flex-col gap-3">
                <label className="text-lg font-semibold text-gray-300">Aspect Ratio</label>
                <div className="flex flex-wrap gap-2">
                    {(['1:1', '16:9', '9:16', '4:3', '3:4'] as AspectRatio[]).map(ratio => (
                        <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded-md font-semibold transition-colors disabled:opacity-50 ${aspectRatio === ratio ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            {ratio}
                        </button>
                    ))}
                </div>
            </div>
            <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
                {isLoading ? <><Spinner /> Generating...</> : 'Generate Image'}
            </button>
            {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}
             <div className="w-full mt-6">
                <ImageFrame title="Generated Image" imageUrl={generatedImage} isLoading={isLoading} loadingText="Generating your vision..." />
            </div>
        </div>
    );
};

// --- Enhancer UI Components ---

const FileInput: FC<{ onFileSelect: (file: File) => void; disabled: boolean; }> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); if (disabled) return;
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); if (disabled) return;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) onFileSelect(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) onFileSelect(e.target.files[0]);
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full max-w-3xl mx-auto p-10 sm:p-16 border-2 border-dashed rounded-lg transition-colors duration-300 ${isDragging ? 'border-indigo-400 bg-gray-800' : 'border-gray-600'} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-500'}`}
      onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      aria-disabled={disabled} role="button" tabIndex={0}
    >
      <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleChange} disabled={disabled} />
      <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
      <p className="text-xl text-center text-gray-400"><span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop an image</p>
      <p className="text-sm text-gray-500 mt-2">Supports: PNG, JPG, WEBP</p>
    </div>
  );
};

const OperationPanel: FC<{ onProcess: (op: ProcessOperation) => void; isLoading: boolean; activeOperation: ProcessOperation | null; }> = ({ onProcess, isLoading, activeOperation }) => {
  const operations = [
    { id: 'resketch', name: 'AI Resketch', description: 'Re-draws image with fine details.', icon: <ResketchIcon className="w-6 h-6" />, color: "purple" },
    { id: 'thinkingResketch', name: 'Thinking Resketch', description: 'Advanced redraw for max detail.', icon: <BrainIcon className="w-6 h-6" />, color: "yellow" },
    { id: 'enhance', name: 'Enhance', description: 'Improves colors and clarity.', icon: <EnhanceIcon className="w-6 h-6" />, color: "blue" },
    { id: 'upscale', name: 'Upscale 10x', description: 'Increases resolution by 10x.', icon: <UpscaleIcon className="w-6 h-6" />, color: "green" },
  ];
  const colors = {
    purple: { border: 'hover:border-purple-500', bg: 'group-hover:bg-purple-600', text: 'text-purple-300' },
    yellow: { border: 'hover:border-yellow-500', bg: 'group-hover:bg-yellow-600', text: 'text-yellow-300' },
    blue: { border: 'hover:border-blue-500', bg: 'group-hover:bg-blue-600', text: 'text-blue-300' },
    green: { border: 'hover:border-green-500', bg: 'group-hover:bg-green-600', text: 'text-green-300' },
  };

  return (
    <div className="w-full max-w-4xl">
      <h3 className="text-xl font-semibold text-center text-gray-300 mb-4">Choose an AI Operation</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {operations.map(op => {
           const c = colors[op.color as keyof typeof colors];
           return (
            <button key={op.id} onClick={() => onProcess(op.id as ProcessOperation)} disabled={isLoading}
              className={`flex flex-col items-center justify-start text-center p-4 rounded-lg border-2 border-gray-700 bg-gray-800/50 ${c.border} hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-700 group h-full`}
            >
              <div className={`p-3 rounded-full bg-gray-700 ${c.bg} transition-colors flex items-center justify-center`}>
                {isLoading && activeOperation === op.id ? <Spinner className="w-8 h-8"/> : React.cloneElement(op.icon, { className: `w-8 h-8 ${c.text} group-hover:text-white transition-colors` })}
              </div>
              <h4 className="text-base font-bold mt-3 text-gray-200">{op.name}</h4>
              <p className="text-xs text-gray-400 mt-1 flex-grow">{op.description}</p>
            </button>
           )
        })}
      </div>
    </div>
  );
};

const TextEditPanel: FC<{
  onProcess: (op: ProcessOperation) => void; isLoading: boolean; activeOperation: ProcessOperation | null; editText: string; setEditText: (text: string) => void;
}> = ({ onProcess, isLoading, activeOperation, editText, setEditText }) => (
    <div className="w-full max-w-2xl mt-8">
        <h3 className="text-xl font-semibold text-center text-gray-300 mb-4">Or... Edit With Text</h3>
        <div className="flex flex-col sm:flex-row gap-2">
            <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="e.g., 'Add a retro filter' or 'Make it black and white'"
                disabled={isLoading}
                className="flex-grow p-3 bg-gray-800 border-2 border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50"
                aria-label="Image edit prompt"
            />
            <button
                onClick={() => onProcess('edit')}
                disabled={isLoading || !editText.trim()}
                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
                {isLoading && activeOperation === 'edit' ? <><Spinner /> Applying...</> : 'Apply Edit'}
            </button>
        </div>
    </div>
);

const ErrorDisplay: FC<{ message: string, onClear?: () => void }> = ({ message, onClear }) => (
    <div className="my-6 p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg max-w-3xl mx-auto text-center relative">
        <p className="font-bold">Error</p>
        <p>{message}</p>
        {onClear && (
            <button onClick={onClear} className="absolute top-2 right-2 text-red-300 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        )}
    </div>
);


// --- Main App Component ---

const App: FC = () => {
  const [mode, setMode] = useState<'enhancer' | 'generator'>('enhancer');

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8 md:mb-12">
          <div className="flex justify-center items-center gap-4">
            <MagicWandIcon className="w-10 h-10 text-indigo-400" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
              AI Image Studio
            </h1>
          </div>
          <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
            Generate, edit, and enhance images with the power of AI. From text prompts to intricate resketches.
          </p>
        </header>

        <div className="flex justify-center mb-8 bg-gray-800 rounded-full p-1 max-w-sm mx-auto">
            <button onClick={() => setMode('enhancer')} className={`w-1/2 px-4 py-2 rounded-full font-semibold transition-colors ${mode === 'enhancer' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                Image Enhancer
            </button>
            <button onClick={() => setMode('generator')} className={`w-1/2 px-4 py-2 rounded-full font-semibold transition-colors ${mode === 'generator' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                Image Generator
            </button>
        </div>

        {mode === 'enhancer' ? <ImageEnhancer /> : <ImageGenerator />}

      </div>
    </div>
  );
};

export default App;
