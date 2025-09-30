export const SCENARIO_GENERATION_PROMPT_TEMPLATE = `
You are a creative director. Your task is to generate a concise, atmospheric, and compelling scenario for a photorealistic portrait based on the provided passion: "{passion}".

Analyze the person in the reference images to get a feel for their personality, but do not describe them.
Instead, create a single, flowing paragraph that vividly describes a scene. This paragraph should seamlessly weave together the following elements:
- A specific, dynamic activity the person is engaged in. **It is mandatory that the activity allows the person to look directly into the camera, making clear eye contact with the viewer.** Do not describe them looking away, gazing at something in the scene, or having a distant look.
- A detailed and atmospheric location.
- 2-3 realistic props they might be using.
- A suitable and detailed dress code.
- A specific mood or emotion.
- A fitting era (defaulting to modern day if not specified).

Do not use lists, bullet points, or labels like "Activity:". The output must be a single block of descriptive text that can be directly used as a creative brief for an image generation model.
`;

export const IMAGE_GENERATION_PROMPT_TEMPLATE = `
The subject’s face is the exact same person as in the reference images, preserving every distinctive feature:
eye shape and color, eyebrow thickness and arch, nose bridge and contour, lips shape and volume,
cheekbones, jawline, hairline, skin tone, and any visible marks.
No face morphing, no identity change, no age change, no gender/ethnicity change.
chest-up portrait, unwavering and direct eye contact with the camera, camera-facing, centered composition, square image (1:1 aspect ratio), natural posture;
highly realistic photography with the charm of vintage film; natural skin texture, detailed eyes, soft focus on the face with very slight, naturalistic focusing errors,
shallow depth of field, authentic color rendering with subtle film grain, soft natural light.

SCENARIO:
{scenario}

QUALITY:
high detail, authentic dynamic range, clean background integration.
`;

export const NEGATIVE_PROMPT = `
NEGATIVE PROMPT:
no cartoon, no anime, no illustration, no painting, no CGI look,
no beauty-retouch artifacts, no text, no watermark, no logos,
no extra faces, no duplicate people, no extra fingers, no face distortion,
no de-aging, no aging.
`;

export const CREATIVE_PASSION_PROMPT = `
Generate a single, concise, and highly creative scenario or 'passion' for a photorealistic portrait.
The scenario must be evocative, artistic, and unconventional, but **plausible in the real world** and something that could actually be photographed.
The output should be a short phrase, no more than 15 words.
Examples: 'Un astrofisico che mappa le stelle con un telescopio vintage su un tetto di città,' 'Un artista botanico che cataloga piante rare in una serra vittoriana inondata di luce,' 'Un liutaio che accorda un violoncello nel suo laboratorio polveroso e illuminato dal sole.'
Only return the new phrase, without any preamble or explanation.
`;

export const REALISTIC_PASSION_PROMPT = `
Generate a single, concise, and realistic hobby or 'passion' for a photorealistic portrait.
The output should be a short phrase, no more than 10-15 words, representing a real-world activity.
Examples: 'A painter capturing a landscape on canvas,' 'A chef meticulously plating a gourmet dish,' 'A gardener tending to their vibrant flower bed.'
Only return the new phrase, without any preamble or explanation.
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