import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { CloseIcon, LoadingSpinner } from './IconComponents';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

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


export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, imageUrl }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !imageUrl) {
      setQrCodeDataUrl('');
      setIsLoading(true);
      return;
    }
    setIsLoading(true);

    const blob = base64ToBlob(imageUrl);
    if (!blob) {
      console.error("Could not create blob from image data for QR code.");
      setQrCodeDataUrl('');
      setIsLoading(false);
      return;
    }
    
    const objectUrl = URL.createObjectURL(blob);
    objectUrlRef.current = objectUrl;

    QRCode.toDataURL(objectUrl, { errorCorrectionLevel: 'L', margin: 2, scale: 6 })
      .then(url => {
        setQrCodeDataUrl(url);
      })
      .catch(err => {
        console.error("Failed to generate QR code", err);
        setQrCodeDataUrl('');
      })
      .finally(() => {
        setIsLoading(false);
      });
      
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [isOpen, imageUrl]);
  
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in-up"
        style={{ animationDuration: '0.4s' }}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-code-title"
    >
      <div 
        ref={modalRef}
        className="bg-surface-glass border border-border-glass p-8 rounded-3xl shadow-aurora max-w-sm w-full mx-4 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors p-1.5 bg-white/10 rounded-full"
          aria-label="Chiudi modale QR code"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        <div className="text-center">
            <h2 id="qr-code-title" className="text-2xl font-display font-bold text-text-primary mb-2">Condividi il tuo Ritratto</h2>
            <p className="text-text-secondary mb-6">Scansiona con il tuo telefono per scaricare l'immagine.</p>
            
            <div className="bg-white p-4 rounded-xl inline-block w-64 h-64 flex items-center justify-center shadow-lg">
              {isLoading && <LoadingSpinner className="w-10 h-10 text-primary" />}
              {!isLoading && qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR Code for image download" className="w-full h-full rounded-md" />}
              {!isLoading && !qrCodeDataUrl && <p className="text-sm text-danger">Impossibile generare il QR code.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};