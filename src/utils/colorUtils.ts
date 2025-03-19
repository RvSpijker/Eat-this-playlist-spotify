export async function getAverageColor(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let r = 0, g = 0, b = 0;
      let count = 0;

      for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
        count++;
      }

      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);

      resolve(`rgb(${r}, ${g}, ${b})`);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

export function mixColors(colors: string[]): string {
  if (colors.length === 0) return 'rgb(40, 40, 40)';
  
  const rgbColors = colors.map(color => {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return [40, 40, 40];
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  });

  const mixed = rgbColors.reduce((acc, curr) => [
    acc[0] + curr[0],
    acc[1] + curr[1],
    acc[2] + curr[2]
  ]);

  const r = Math.floor(mixed[0] / colors.length);
  const g = Math.floor(mixed[1] / colors.length);
  const b = Math.floor(mixed[2] / colors.length);

  return `rgb(${r}, ${g}, ${b})`;
}