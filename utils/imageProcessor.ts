export const processImage = (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Failed to get canvas context'));
            }

            const TARGET_RESOLUTION = 2048;

            // --- 1. Crop and upscale image to target resolution ---
            const sourceSize = Math.min(img.width, img.height);
            const sx = (img.width - sourceSize) / 2;
            const sy = (img.height - sourceSize) / 2;

            canvas.width = TARGET_RESOLUTION;
            canvas.height = TARGET_RESOLUTION;

            // Draw the cropped source image onto the full-size target canvas, upscaling it.
            ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, TARGET_RESOLUTION, TARGET_RESOLUTION);

            // --- 2. Apply Kodak-style filter (Grain + Color Tint) ---
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const grainAmount = 20; // Controls the intensity of the grain

            const clamp = (value: number) => Math.max(0, Math.min(255, value));

            for (let i = 0; i < data.length; i += 4) {
                // Add grain
                const grain = (Math.random() - 0.5) * grainAmount;
                const r = data[i] + grain;
                const g = data[i + 1] + grain;
                const b = data[i + 2] + grain;

                // Apply Kodak-like color tint (warming filter)
                data[i] = clamp(r * 1.05);     // Increase red
                data[i + 1] = clamp(g * 1.02); // Slightly increase green
                data[i + 2] = clamp(b * 0.9);  // Decrease blue
            }

            ctx.putImageData(imageData, 0, 0);

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            reject(new Error('Failed to load generated image for processing'));
        };
        img.src = base64Image;
    });
};