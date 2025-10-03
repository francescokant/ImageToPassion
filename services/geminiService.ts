import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import type { Keywords } from '../types';
import { IMAGE_GENERATION_PROMPT_TEMPLATE, SCENARIO_GENERATION_PROMPT_TEMPLATE, CREATIVE_PASSION_PROMPT, REALISTIC_PASSION_PROMPT, IMAGE_VARIATION_INSTRUCTION } from '../constants';

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
  return prompt;
};

const generatePassion = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  try {
     const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
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
        const code = parsedError?.error?.code;
        if (code === 429) {
          throw new Error("Limite di richieste superato. L'applicazione è molto richiesta in questo momento. Per favore, riprova più tardi.");
        }
        if (code >= 500 && code < 600) {
           throw new Error("Si è verificato un problema temporaneo con il servizio di generazione. Per favore, attendi un momento e riprova.");
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
        const code = parsedError?.error?.code;
        if (code === 429) {
          throw new Error("Limite di richieste superato. L'applicazione è molto richiesta in questo momento. Per favore, riprova più tardi.");
        }
        if (code >= 500 && code < 600) {
           throw new Error("Si è verificato un problema temporaneo con il servizio di generazione. Per favore, attendi un momento e riprova.");
        }
      } catch (e) {
        // Not a JSON error message
      }
    }
    throw new Error("Impossibile generare lo scenario. Controlla la console per maggiori dettagli.");
  }
};


export const generateFinalImage = async (referenceImages: File[], scenario: string, isVariation: boolean = false): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
    
  if (referenceImages.length === 0) {
    throw new Error("È richiesta almeno un'immagine di riferimento.");
  }

  let finalPrompt = buildImageGenerationPrompt(scenario);
  
  if (isVariation) {
    finalPrompt = `${IMAGE_VARIATION_INSTRUCTION}\n\n${finalPrompt}`;
  }

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
      model: 'gemini-2.5-flash-image',
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
    
    // Check if there are any candidates at all
    if (!response.candidates || response.candidates.length === 0) {
        console.error('Image generation failed: No candidates in response.', { response });
        throw new Error("Il modello non ha restituito alcun risultato. Ciò potrebbe essere dovuto a filtri di sicurezza o a un problema con il prompt.");
    }
    
    const candidate = response.candidates[0];

    if (candidate.finishReason === 'SAFETY') {
      console.error('Image generation finished with reason: SAFETY.', { ratings: candidate.safetyRatings });
      throw new Error("La generazione dell'immagine è stata bloccata per motivi di sicurezza. Per favore, prova a modificare lo scenario.");
    }

    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        const reason = candidate.finishReason || 'UNKNOWN';
        console.error('Image generation failed: Candidate has no content parts.', { reason, candidate });
        throw new Error(`Il modello ha restituito una risposta vuota (motivo: ${reason}). Questo è spesso dovuto a filtri di sicurezza interni non specificati.`);
    }

    let foundImage: string | null = null;
    let foundText: string | null = null;

    for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
            const base64ImageBytes: string = part.inlineData.data;
            foundImage = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        } else if (part.text) {
            foundText = (foundText || '') + part.text;
        }
    }
    
    if (foundImage) {
      return foundImage;
    }

    if (foundText) {
      console.error('Image generation failed. Model returned text response:', foundText);
      throw new Error(`Il modello non ha potuto generare un'immagine e ha restituito questo messaggio: "${foundText}". Prova a modificare lo scenario.`);
    }

    console.error('Image generation failed: No image or text part found in response parts.', { response });
    throw new Error("Nessuna immagine è stata generata. La richiesta potrebbe essere stata bloccata o il modello non è riuscito a produrre un'immagine nonostante una risposta valida. Prova a modificare lo scenario.");

  } catch (error) {
    console.error("Gemini API call failed:", error);
    
    // Re-throw our custom, user-facing errors directly. This prevents them from being overwritten by the generic error below.
    if (error instanceof Error) {
        const customErrorMessages = [
            "bloccata per motivi di sicurezza",
            "modello non ha potuto generare un'immagine",
            "Nessuna immagine è stata generata",
            "modello non ha restituito alcun risultato",
            "risposta vuota"
        ];
        if (customErrorMessages.some(msg => error.message.includes(msg))) {
            throw error;
        }
    }
    
    // Check for specific API errors (like rate limiting)
    if (error instanceof Error) {
      try {
        const parsedError = JSON.parse(error.message);
        const code = parsedError?.error?.code;
        if (code === 429) {
          throw new Error("Limite di richieste superato. L'applicazione è molto richiesta in questo momento. Per favore, riprova più tardi.");
        }
        if (code >= 500 && code < 600) {
           throw new Error("Si è verificato un problema temporaneo con il servizio di generazione. Per favore, attendi un momento e riprova.");
        }
      } catch (e) {
        // Not a JSON error message, fall through to the generic error
      }
    }

    // Generic fallback for all other errors
    throw new Error("Impossibile generare l'immagine. Controlla la console per maggiori dettagli.");
  }
};