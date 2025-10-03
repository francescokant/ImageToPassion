
import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { KeywordForm } from './components/KeywordForm';
import { ResultDisplay } from './components/ResultDisplay';
import { Button } from './components/Button';
import type { Keywords, ImageFile } from './types';
import { generateScenario, generateFinalImage } from './services/geminiService';
import { processImage } from './utils/imageProcessor';
import { LoadingSpinner } from './components/IconComponents';
import { ScenarioEditor } from './components/ScenarioEditor';

const INVALID_FILENAME_CHARS_REGEX = /[\\/:*?"<>|]/;

const App: React.FC = () => {
  const [step, setStep] = useState(0); // 0: input, 1: editingScenario, 2: result
  const [isLoaded, setIsLoaded] = useState(false); // For intro animation
  const [referenceImages, setReferenceImages] = useState<ImageFile[]>([]);
  const [keywords, setKeywords] = useState<Keywords>({ passion: '', name: '' });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [scenario, setScenario] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Trigger intro animation after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const isFormValid = 
    referenceImages.length > 0 && 
    keywords.passion.trim() !== '' && 
    keywords.name.trim() !== '' && 
    !INVALID_FILENAME_CHARS_REGEX.test(keywords.name) &&
    privacyAccepted;

  const handleGenerateScenario = useCallback(async () => {
    if (!isFormValid) {
      setError("Per favore carica almeno un'immagine, compila tutti i campi e accetta il consenso alla privacy.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await generateScenario(referenceImages.map(img => img.file), keywords);
      setScenario(result);
      setStep(1);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Si è verificato un errore sconosciuto.");
    } finally {
      setIsLoading(false);
    }
  }, [referenceImages, keywords, isFormValid]);

  const handleConfirmScenario = useCallback(async (finalScenario: string) => {
    setScenario(finalScenario);
    setIsLoading(true);
    setError(null);
    
    try {
      const rawImageResult = await generateFinalImage(referenceImages.map(img => img.file), finalScenario);
      const processedImage = await processImage(rawImageResult);
      setGeneratedImage(processedImage);
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Si è verificato un errore sconosciuto durante la generazione dell'immagine.");
      setStep(1); // Return to editor on failure
    } finally {
      setIsLoading(false);
    }
  }, [referenceImages]);

  const handleRegenerateImage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null); // Clear previous image to show loader

    try {
        const rawImageResult = await generateFinalImage(referenceImages.map(img => img.file), scenario, true);
        const processedImage = await processImage(rawImageResult);
        setGeneratedImage(processedImage);
        setStep(2); // Stay on the result step
    } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : "Si è verificato un errore sconosciuto durante la rigenerazione dell'immagine.";
        setError(errorMessage);
        setGeneratedImage(null); // Ensure no old image is shown on failure
    } finally {
        setIsLoading(false);
    }
  }, [referenceImages, scenario]);
  
  const handleBackToInput = () => {
    setStep(0);
  };

  const handleReset = () => {
    setReferenceImages([]);
    setKeywords({ passion: '', name: '' });
    setScenario('');
    setGeneratedImage(null);
    setError(null);
    setPrivacyAccepted(false);
    setStep(0);
  };
  
  const cards = [
    // --- Card 1: Input ---
    (
      <div className="space-y-6">
         <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-text-primary">La tua immagine reinventata.</h1>
          <p className="text-text-secondary mt-2 max-w-md mx-auto">Carica una foto, scegli la tua passione e guarda la tua identità trasformarsi in scenari che non hai mai immaginato.</p>
        </div>
        <div>
          <ImageUploader onImagesChange={setReferenceImages} />
        </div>
        <div>
          <KeywordForm keywords={keywords} onKeywordsChange={setKeywords} />
        </div>
        <div className="pt-2">
            <div className="relative flex items-start gap-x-3">
                <div className="flex h-6 items-center">
                    <input
                        id="privacy-consent"
                        name="privacy-consent"
                        type="checkbox"
                        checked={privacyAccepted}
                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-border-glass bg-white/5 shrink-0
                                   checked:bg-primary checked:border-primary
                                   focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background
                                   transition-all"
                        aria-describedby="privacy-description"
                    />
                     <svg
                        className="absolute w-5 h-5 left-0 top-0.5 text-background pointer-events-none hidden peer-checked:block"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <div className="text-sm leading-6">
                    <label htmlFor="privacy-consent" className="font-medium text-text-primary cursor-pointer">
                       Consenso all'uso dell'immagine
                    </label>
                    <p id="privacy-description" className="text-text-secondary text-xs">
                       Acconsento all'uso della mia immagine al solo fine di generare il ritratto, consapevole che verrà elaborata da un'IA.
                    </p>
                </div>
            </div>
        </div>
        <div className="pt-2">
          <Button 
              onClick={handleGenerateScenario} 
              disabled={!isFormValid || isLoading}
              className="w-full"
              variant="primary"
          >
            {isLoading && step === 0 ? <LoadingSpinner className="w-5 h-5" /> : null}
            {isLoading && step === 0 ? 'Creando lo scenario...' : 'Prossimo: Genera Scenario'}
          </Button>
          {error && step === 0 && <p className="text-danger text-center text-sm mt-4">{error}</p>}
        </div>
      </div>
    ),
    // --- Card 2: Scenario Editor ---
    (
      <ScenarioEditor initialScenario={scenario} onConfirm={handleConfirmScenario} onBack={handleBackToInput} isLoading={isLoading && step === 1} />
    ),
    // --- Card 3: Result Display ---
    (
      <ResultDisplay 
        generatedImage={generatedImage} 
        isLoading={isLoading} 
        fileName={keywords.name} 
        onStartOver={handleReset}
        onRegenerate={handleRegenerateImage}
        error={error}
      />
    )
  ];

  return (
    <div className="h-screen font-sans flex items-center justify-center p-4 overflow-hidden">
      <main className="container mx-auto flex items-center justify-center h-full">
        <div className="relative w-full max-w-lg h-full max-h-[740px]">
          {cards.map((card, index) => {
            const displayOrder = index >= step ? index - step : cards.length - step + index;
            
            const style: React.CSSProperties = {
                position: 'absolute',
                inset: '0',
                transition: 'all 0.8s cubic-bezier(0.5, 1.3, 0.4, 1)',
                zIndex: cards.length - displayOrder,
                transitionDelay: isLoaded ? '0s' : `${index * 100 + 500}ms` // Staggered entry after background
            };

            if (!isLoaded) {
              style.transform = 'translateY(40px) scale(0.95)';
              style.opacity = 0;
              style.pointerEvents = 'none';
            } else if (displayOrder === 0) { // Active card
                style.transform = 'translateY(0) scale(1) rotate(0deg)';
                style.opacity = 1;
                style.filter = 'brightness(1)';
                style.pointerEvents = 'auto';
            } else { // Stacked cards
                const scale = 1 - displayOrder * 0.05;
                const translateY = displayOrder * 1.5; // in rem
                const rotation = (index - step) * 5; 
                const translateX = (index - step) * 2; 

                style.transform = `translateX(${translateX}rem) translateY(${translateY}rem) scale(${scale}) rotate(${rotation}deg)`;
                style.opacity = 1;
                style.filter = `brightness(${1 - displayOrder * 0.15})`;
                style.pointerEvents = 'none';
            }

            return (
              <div
                key={index}
                style={style}
                className="bg-surface-glass backdrop-blur-2xl border border-border-glass rounded-3xl shadow-aurora h-full overflow-hidden"
              >
                <div className="h-full p-4 sm:p-6 flex flex-col justify-center">
                  {card}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default App;
