export interface Keywords {
  passion: string;
  name: string;
}

export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  error?: string;
  isProcessing?: boolean;
}