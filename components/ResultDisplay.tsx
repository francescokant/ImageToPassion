import React, { useState, useEffect } from 'react';
import { LoadingSpinner, DownloadIcon, ShareIcon, ResetIcon, SparklesIcon } from './IconComponents';
import { Button } from './Button';
import { LOADING_MESSAGES } from '../constants';

interface ResultDisplayProps {
  generatedImage: string | null;
  isLoading: boolean;
  fileName: string;
  onStartOver: () => void;
  onRegenerate: () => void;
  error: string | null;
}

const AnimatedLoadingMessage: React.FC = () => {
  const [message, setMessage] = useState(LOADING_MESSAGES[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessage(prevMessage => {
        const currentIndex = LOADING_MESSAGES.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
        return LOADING_MESSAGES[nextIndex];
      });
    }, 2500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <p key={message} className="mt-6 text-base font-medium text-center px-4 text-text-primary">
      {message}
    </p>
  );
};

const base64ToBlob = (base64: string): Blob | null => {
  try {
    const parts = base64.split(';base64,');
    if (parts.length !== 2) return null;
    
    const contentType = parts[0].split(':')[1];
    if (!contentType) return null;

    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  } catch (error) {
    console.error("Failed to convert base64 to Blob", error);
    return null;
  }
};

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ generatedImage, isLoading, fileName, onStartOver, onRegenerate, error }) => {
  const [isShareApiSupported, setIsShareApiSupported] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      setIsShareApiSupported(true);
    }
  }, []);

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    const downloadName = fileName.trim() ? `${fileName.trim().replace(/ /g, '_')}.png` : 'passion-portrait.png';
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!generatedImage || !navigator.share) {
      alert("La condivisione non è supportata su questo browser.");
      return;
    }

    try {
      const blob = base64ToBlob(generatedImage);
      if (!blob) throw new Error("Impossibile convertire l'immagine per la condivisione.");

      const shareFileName = fileName.trim() ? `${fileName.trim().replace(/ /g, '_')}.png` : 'passion-portrait.png';
      const file = new File([blob], shareFileName, { type: blob.type });

      const shareData = {
        files: [file],
        title: 'Il mio Ritratto ImageToPassion',
        text: 'Guarda il ritratto che ho creato con ImageToPassion!',
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        alert("La condivisione di file non è supportata da questo browser.");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error("Errore durante la condivisione:", err);
        alert("Si è verificato un errore durante la condivisione dell'immagine.");
      }
    }
  };
  
  const Placeholder = () => (
     <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary bg-black/20 rounded-2xl p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-border-glass" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-4 text-lg font-semibold text-text-primary">Il tuo ritratto apparirà qui</p>
        <p className="mt-1 text-sm">Il capolavoro finale ti attende.</p>
    </div>
  );
  
  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
          <div className="aspect-square bg-black/20 rounded-2xl w-full relative overflow-hidden border border-border-glass shadow-inner-soft p-1.5">
            {isLoading && (
              <div className="absolute inset-0 bg-surface-glass/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 transition-opacity">
                <LoadingSpinner className="w-12 h-12 text-primary" />
                <AnimatedLoadingMessage />
              </div>
            )}

            {!isLoading && !generatedImage && <Placeholder />}

            {generatedImage && (
              <div className="w-full h-full shine-wrapper rounded-xl">
                <img
                  src={generatedImage}
                  alt="Generated portrait"
                  className="w-full h-full object-cover rounded-xl animate-fade-in"
                />
              </div>
            )}
          </div>
        
          <div className="w-full flex flex-col gap-4">
            {generatedImage && !isLoading && (
              <>
                <Button onClick={onRegenerate} variant="primary" className="w-full" disabled={isLoading}>
                    <SparklesIcon className="w-5 h-5" /> Un'altra variazione
                </Button>
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button onClick={handleDownload} variant="secondary">
                      <DownloadIcon className="w-5 h-5" /> Scarica
                    </Button>
                    {isShareApiSupported && (
                      <Button onClick={handleShare} variant="secondary">
                          <ShareIcon className="w-5 h-5" /> Condividi
                      </Button>
                    )}
                </div>
              </>
            )}
            
            <Button onClick={onStartOver} variant="secondary" disabled={isLoading}>
              <ResetIcon className="w-5 h-5" /> 
              {generatedImage ? 'Ricomincia da capo' : 'Ricomincia'}
            </Button>

            {error && !isLoading && (
              <div className="text-center text-danger text-sm bg-danger/10 p-3 rounded-xl border border-danger/20">
                <p className="font-semibold mb-1">Oops! Qualcosa è andato storto.</p>
                <p>{error}</p>
              </div>
            )}
          </div>
    </div>
  );
};