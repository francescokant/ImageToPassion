import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import type { Keywords } from '../types';
import { IMAGE_GENERATION_PROMPT_TEMPLATE, NEGATIVE_PROMPT, SCENARIO_GENERATION_PROMPT_TEMPLATE, CREATIVE_PASSION_PROMPT, REALISTIC_PASSION_PROMPT } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

const buildImageGenerationPrompt = (scenario: string): string => {
  const prompt = IMAGE_GENERATION_PROMPT_TEMPLATE.replace('{scenario}', scenario);
  return `${prompt}\n${NEGATIVE_PROMPT}`;
};

const generatePassion = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  try {
     const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
    });
    
    const text = response.text;
    if (text) {
      return text.trim();
    }
    
    throw new Error("Il modello non ha restituito un suggerimento.");
  } catch (error) {
    console.error("Gemini API call for passion generation failed:", error);
    if (error instanceof Error) {
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError?.error?.code === 429) {
          throw new Error("Limite di richieste superato. L'applicazione è molto richiesta in questo momento. Per favore, riprova più tardi.");
        }
      } catch (e) {
        // Not a JSON error message, proceed with generic message
      }
    }
    throw new Error("Impossibile generare un suggerimento. Riprova.");
  }
}

export const generateCreativePassion = async (): Promise<string> => {
  return generatePassion(CREATIVE_PASSION_PROMPT);
};

export const generateRealisticPassion = async (): Promise<string> => {
  return generatePassion(REALISTIC_PASSION_PROMPT);
};


export const generateScenario = async (referenceImages: File[], keywords: Keywords): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }

  if (referenceImages.length === 0) {
    throw new Error("È richiesta almeno un'immagine di riferimento per la generazione dello scenario.");
  }

  const scenarioPrompt = SCENARIO_GENERATION_PROMPT_TEMPLATE.replace('{passion}', keywords.passion);

  const imageParts = await Promise.all(
    referenceImages.map(async (file) => {
      const base64Data = await fileToBase64(file);
      return {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      };
    })
  );

  const textPart = { text: scenarioPrompt };
  const parts = [...imageParts, textPart];

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
    });

    const text = response.text;
    if (text) {
      return text;
    }

    throw new Error("Il modello non ha restituito uno scenario testuale. Potrebbe aver rifiutato il prompt.");
  } catch (error) {
    console.error("Gemini API call for scenario generation failed:", error);
    if (error instanceof Error) {
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError?.error?.code === 429) {
          throw new Error("Limite di richieste superato. L'applicazione è molto richiesta in questo momento. Per favore, riprova più tardi.");
        }
      } catch (e) {
        // Not a JSON error message
      }
    }
    throw new Error("Impossibile generare lo scenario. Controlla la console per maggiori dettagli.");
  }
};


export const generateFinalImage = async (referenceImages: File[], scenario: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
    
  if (referenceImages.length === 0) {
    throw new Error("È richiesta almeno un'immagine di riferimento.");
  }

  const finalPrompt = buildImageGenerationPrompt(scenario);

  const imageParts = await Promise.all(
    referenceImages.map(async (file) => {
      const base64Data = await fileToBase64(file);
      return {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      };
    })
  );

  const textPart = { text: finalPrompt };

  const parts = [...imageParts, textPart];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    // Check for explicit block reasons first
    if (response.promptFeedback?.blockReason) {
      console.error('Image generation blocked by API.', { reason: response.promptFeedback.blockReason, ratings: response.promptFeedback.safetyRatings });
      throw new Error(`La generazione dell'immagine è stata bloccata per motivi di sicurezza (${response.promptFeedback.blockReason}). Prova a modificare lo scenario.`);
    }

    if (response.candidates?.[0]?.finishReason === 'SAFETY') {
      console.error('Image generation finished with reason: SAFETY.', { ratings: response.candidates[0].safetyRatings });
      throw new Error("La generazione dell'immagine è stata bloccata per motivi di sicurezza. Per favore, prova a modificare lo scenario.");
    }

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData && part.inlineData.mimeType.startsWith('image/')
    );

    if (imagePart?.inlineData) {
      const base64ImageBytes: string = imagePart.inlineData.data;
      return `data:${imagePart.inlineData.mimeType};base64,${base64ImageBytes}`;
    }

    console.error('Image generation failed: No image part in response.', { response });
    throw new Error("Nessuna immagine è stata generata. La richiesta potrebbe essere stata bloccata o il modello non è riuscito a produrre un'immagine. Prova a modificare lo scenario.");
  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error) {
      // Re-throw our custom safety errors directly
      if (error.message.startsWith("La generazione dell'immagine è stata bloccata")) {
        throw error;
      }
      
      // Check for rate limit error (429) by parsing the error message
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError?.error?.code === 429) {
          throw new Error("Limite di richieste superato. L'applicazione è molto richiesta in questo momento. Per favore, riprova più tardi.");
        }
      } catch (e) {
        // Not a JSON error message, so we'll fall through to the generic error
      }
    }
    // Generic fallback for all other errors
    throw new Error("Impossibile generare l'immagine. Controlla la console per maggiori dettagli.");
  }
};