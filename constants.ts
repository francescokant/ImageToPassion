
export const SCENARIO_GENERATION_PROMPT_TEMPLATE = `
You are a creative director. Your task is to generate a concise, atmospheric, and compelling scenario for a photorealistic portrait based on the provided passion: "{passion}". The entire output must be in English.

Analyze the person in the reference images to get a feel for their personality, but do not describe them.
Instead, create a single, flowing paragraph that vividly describes a scene. This paragraph should seamlessly weave together the following elements:
- **The composition must be a tightly framed, chest-up portrait. The person's face is the absolute protagonist. Describe the scene from this close-up perspective.**
- A specific, dynamic activity the person is engaged in. **It is mandatory that the activity allows the person to look directly into the camera, making clear eye contact with the viewer.** Do not describe them looking away, gazing at something in the scene, or having a distant look.
- A detailed and atmospheric location (visible in the background).
- 2-3 realistic props they might be using.
- A suitable and detailed dress code.
- A specific mood or emotion.
- A fitting era (defaulting to modern day if not specified).

Do not use lists, bullet points, or labels like "Activity:". The output must be a single block of descriptive text in English that can be directly used as a creative brief for an image generation model.
`;

export const IMAGE_GENERATION_PROMPT_TEMPLATE = `
You are an expert photo editor. Your task is to edit the provided reference photo.
**Goal:** Transform the person from the reference image into a completely new scene, while perfectly preserving their identity (facial features, age, gender, ethnicity).

**New Scene Description:**
{scenario}

**Artistic Style Requirements:**
- **Style:** Highly realistic, vintage film photograph.
- **Lighting:** Soft, natural lighting.
- **Focus:** Shallow depth of field.
- **Texture:** Subtle film grain.
- **Authenticity:** Must look like a real photo, not CGI.

**Output Format:**
- **Aspect Ratio:** Square (1:1).
- **Overlays:** No text, watermarks, or logos.

Edit the reference image to create this new portrait.
`;

export const CREATIVE_PASSION_PROMPT = `
Generate a single, concise, and highly creative scenario or 'passion' for a photorealistic portrait, in English.
The scenario must be evocative, artistic, and unconventional, but **plausible in the real world** and something that could actually be photographed.
The output should be a short phrase, no more than 15 words.
Examples: 'An astrophysicist mapping stars with a vintage telescope on a city rooftop,' 'A botanical artist cataloging rare plants in a light-flooded Victorian greenhouse,' 'A luthier tuning a cello in their dusty, sunlit workshop.'
Only return the new phrase, without any preamble or explanation.
`;

export const REALISTIC_PASSION_PROMPT = `
Generate a single, concise, and realistic hobby or 'passion' for a photorealistic portrait, in English.
The output should be a short phrase, no more than 10-15 words, representing a real-world activity.
Examples: 'A painter capturing a landscape on canvas,' 'A chef meticulously plating a gourmet dish,' 'A gardener tending to their vibrant flower bed.'
Only return the new phrase, without any preamble or explanation.
`;

export const IMAGE_VARIATION_INSTRUCTION = `
This is a request for a creative variation. Start again from the original reference image and the scene description. Generate a new version by changing elements like the background, clothing, lighting, and camera angle. The person's identity MUST be preserved, but the overall mood and composition should be different from the previous result.
`;

export const LOADING_MESSAGES = [
  "Mescolando i colori del tuo sogno...",
  "Consultando le stelle per l'ispirazione...",
  "Sviluppando il negativo della tua passione...",
  "Riscaldando il motore della creatività...",
  "Disegnando la prima bozza...",
  "Aggiungendo i tocchi finali e magici...",
  "Lucidando i pixel alla perfezione...",
];