import React, { useState, useCallback, useRef } from 'react';
import type { ImageFile } from '../types';
import { UploadIcon, CloseIcon, LoadingSpinner } from './IconComponents';

interface ImageUploaderProps {
  onImagesChange: (images: ImageFile[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesChange }) => {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = useCallback((files: FileList) => {
    const newFiles = Array.from(files).slice(0, 5 - imageFiles.length);
    if (newFiles.length === 0) return;

    const filesToProcess: Omit<ImageFile, 'isProcessing' | 'error'>[] = newFiles.map(file => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImageFiles(prev => [
      ...prev,
      ...filesToProcess.map(f => ({ ...f, isProcessing: true }))
    ]);

    filesToProcess.forEach(fileToProcess => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const isValid = Math.max(img.width, img.height) >= 1024;
          const validatedFile: ImageFile = {
            ...fileToProcess,
            previewUrl: e.target?.result as string,
            isProcessing: false,
            error: isValid ? undefined : 'Min 1024px',
          };
          
          setImageFiles(currentFiles => {
            const updated = currentFiles.map(f => f.id === validatedFile.id ? validatedFile : f);
            onImagesChange(updated.filter(img => !img.error));
            return updated;
          });
          URL.revokeObjectURL(fileToProcess.previewUrl);
        };
        img.onerror = () => {
           const validatedFile: ImageFile = {
            ...fileToProcess,
            previewUrl: e.target?.result as string,
            isProcessing: false,
            error: 'File non valido',
          };
          setImageFiles(currentFiles => {
            const updated = currentFiles.map(f => f.id === validatedFile.id ? validatedFile : f);
            onImagesChange(updated.filter(img => !img.error));
            return updated;
          });
          URL.revokeObjectURL(fileToProcess.previewUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
          const validatedFile: ImageFile = {
            ...fileToProcess,
            isProcessing: false,
            error: 'Errore di lettura',
          };
          setImageFiles(currentFiles => {
            const updated = currentFiles.map(f => f.id === validatedFile.id ? validatedFile : f);
            onImagesChange(updated.filter(img => !img.error));
            return updated;
          });
          URL.revokeObjectURL(fileToProcess.previewUrl);
      };
      reader.readAsDataURL(fileToProcess.file);
    });
  }, [imageFiles.length, onImagesChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAddFiles(e.target.files);
    }
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (idToRemove: string) => {
    const fileToRemove = imageFiles.find(f => f.id === idToRemove);
    if (fileToRemove && fileToRemove.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    const newImages = imageFiles.filter((img) => img.id !== idToRemove);
    setImageFiles(newImages);
    onImagesChange(newImages.filter(img => !img.error));
  };
  
  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-4">
      {imageFiles.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {imageFiles.map((img) => (
            <div key={img.id} className="relative group aspect-square">
              <img
                src={img.previewUrl}
                alt={`Reference ${img.id}`}
                className={`w-full h-full object-cover rounded-2xl transition-all ${img.error ? 'ring-2 ring-danger' : 'ring-1 ring-border-glass'} ${img.isProcessing ? 'opacity-50' : ''}`}
              />
              {img.isProcessing && (
                <div className="absolute inset-0 bg-surface-glass/50 flex items-center justify-center rounded-2xl z-10">
                  <LoadingSpinner className="w-8 h-8 text-primary" />
                </div>
              )}
              {!img.isProcessing && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center z-20">
                  <button
                    onClick={() => removeImage(img.id)}
                    className="p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white transition-transform group-hover:scale-100 scale-75"
                    aria-label="Rimuovi immagine"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
              {img.error && <p className="absolute bottom-1.5 left-1.5 text-[10px] bg-danger text-white px-1.5 py-0.5 rounded-full font-semibold z-10">{img.error}</p>}
            </div>
          ))}
        </div>
      )}
      
      {imageFiles.length < 5 && (
        <div 
          onDragEnter={handleDrag} 
          onDragLeave={handleDrag} 
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-300 ease-in-out bg-white/5 ${dragActive ? 'border-primary bg-primary/10 scale-[1.02]' : 'animate-pulse-border'}`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileChange}
            className="hidden"
            disabled={imageFiles.length >= 5}
          />
          <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
              <UploadIcon className="w-7 h-7 mx-auto text-text-secondary" />
            <p className="font-semibold text-text-primary">
              Clicca per caricare o trascina e rilascia
            </p>
            <p className="text-xs text-text-secondary">
              {imageFiles.length}/5 immagini | JPG, PNG, WEBP
            </p>
          </div>
        </div>
      )}
    </div>
  );
};