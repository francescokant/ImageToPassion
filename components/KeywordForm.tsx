import React, { useState, useEffect } from 'react';
import type { Keywords } from '../types';
import { generateCreativePassion, generateRealisticPassion } from '../services/geminiService';
import { LoadingSpinner, SparklesIcon, PaintBrushIcon } from './IconComponents';

interface KeywordFormProps {
  keywords: Keywords;
  onKeywordsChange: (keywords: Keywords) => void;
}

const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/;
const INVALID_FILENAME_ERROR = 'Caratteri non validi: / \\ : * ? " < > |';

const TooltipButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tooltip: string }> = ({ tooltip, children, ...props }) => {
  return (
    <button {...props} className="relative group p-1.5 text-primary/80 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-wait">
      {children}
      <span 
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 
                   bg-background border border-border-glass rounded-md text-xs text-text-primary whitespace-nowrap 
                   opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
                   transform group-hover:translate-y-0 translate-y-1"
        role="tooltip"
      >
        {tooltip}
      </span>
    </button>
  );
};


const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | null; children?: React.ReactNode }> = ({ label, id, error, children, ...props }) => {
  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={id} className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
        {children}
      </div>
      <input
        id={id}
        {...props}
        className={`w-full bg-white/5 py-3 px-4 text-text-primary rounded-xl border transition-colors duration-300
          shadow-inner-soft
          ${error ? 'border-danger/50' : 'border-border-glass focus:border-border-focus'}
          focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder-text-secondary/60`}
      />
      {error && <p id={`${id}-error`} className="text-danger text-xs mt-1.5">{error}</p>}
    </div>
  );
};

export const KeywordForm: React.FC<KeywordFormProps> = ({ keywords, onKeywordsChange }) => {
  const [nameError, setNameError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (INVALID_FILENAME_CHARS.test(keywords.name)) {
      setNameError(INVALID_FILENAME_ERROR);
    } else {
      setNameError(null);
    }
  }, [keywords.name]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onKeywordsChange({
      ...keywords,
      [name]: value,
    });
  };

  const handleGeneratePassion = async (type: 'creative' | 'realistic') => {
    setIsGenerating(true);
    try {
      const passion = type === 'creative'
        ? await generateCreativePassion()
        : await generateRealisticPassion();

      onKeywordsChange({
        ...keywords,
        passion,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <form className="space-y-6">
      <FormInput
        label="Passione"
        id="passion"
        name="passion"
        type="text"
        value={keywords.passion}
        onChange={handleChange}
        placeholder="es. Un biologo che disegna in una giungla nebbiosa"
      >
         <div className="flex items-center gap-1">
            {isGenerating ? (
              <div className="px-1.5 py-1.5"><LoadingSpinner className="w-5 h-5 text-primary" /></div>
            ) : (
              <>
                <TooltipButton
                  type="button"
                  onClick={() => handleGeneratePassion('creative')}
                  aria-label="Genera una passione creativa"
                  tooltip="Scintilla Creativa"
                  disabled={isGenerating}
                >
                  <SparklesIcon className="w-5 h-5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                </TooltipButton>
                <TooltipButton
                  type="button"
                  onClick={() => handleGeneratePassion('realistic')}
                  aria-label="Genera una passione realistica"
                  tooltip="Passione Reale"
                  disabled={isGenerating}
                >
                  <PaintBrushIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                </TooltipButton>
              </>
            )}
          </div>
      </FormInput>
      
      <FormInput
        label="Nome del File"
        id="name"
        name="name"
        type="text"
        value={keywords.name}
        onChange={handleChange}
        placeholder="es. Ritratto-Biologo-Giungla"
        error={nameError}
        aria-invalid={!!nameError}
        aria-describedby="name-error"
      />
    </form>
  );
};