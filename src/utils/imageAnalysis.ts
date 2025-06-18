
import { PhotoFile, PhotoGroup } from '@/pages/Index';

export interface ColorAnalysis {
  dominantColor: string;
  colorName: string;
  confidence: number;
}

const colorNameMap: { [key: string]: string } = {
  '#FF0000': 'Red',
  '#00FF00': 'Green',
  '#0000FF': 'Blue',
  '#FFFF00': 'Yellow',
  '#FF00FF': 'Magenta',
  '#00FFFF': 'Cyan',
  '#000000': 'Black',
  '#FFFFFF': 'White',
  '#808080': 'Gray',
  '#800000': 'Maroon',
  '#008000': 'Dark Green',
  '#000080': 'Navy',
  '#800080': 'Purple',
  '#008080': 'Teal',
  '#FFA500': 'Orange',
  '#FFC0CB': 'Pink',
  '#A52A2A': 'Brown',
  '#FFFFE0': 'Light Yellow',
  '#E6E6FA': 'Lavender',
  '#98FB98': 'Pale Green',
  '#87CEEB': 'Sky Blue',
  '#DDA0DD': 'Plum',
  '#F0E68C': 'Khaki',
  '#FF6347': 'Tomato',
  '#40E0D0': 'Turquoise',
  '#EE82EE': 'Violet',
  '#90EE90': 'Light Green',
  '#FFB6C1': 'Light Pink',
  '#D3D3D3': 'Light Gray',
  '#A9A9A9': 'Dark Gray',
  '#696969': 'Dim Gray',
  '#2F4F4F': 'Dark Slate Gray',
  '#8B4513': 'Saddle Brown',
  '#CD853F': 'Peru',
  '#DEB887': 'Burlywood',
  '#F5DEB3': 'Wheat',
  '#F0F8FF': 'Alice Blue',
  '#FAEBD7': 'Antique White',
  '#7FFFD4': 'Aquamarine',
  '#F0FFFF': 'Azure',
  '#F5F5DC': 'Beige',
  '#000000': 'Black',
  '#0000FF': 'Blue',
  '#8A2BE2': 'Blue Violet',
  '#A52A2A': 'Brown',
  '#DEB887': 'Burlywood'
};

export const analyzePhotoColor = async (file: File): Promise<ColorAnalysis> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Set canvas size for better analysis
      const size = 200;
      canvas.width = size;
      canvas.height = size;

      if (ctx) {
        ctx.drawImage(img, 0, 0, size, size);
        
        // Analyze multiple regions where t-shirts are typically located
        const regions = [
          // Upper torso region (most likely t-shirt area)
          { x: size * 0.25, y: size * 0.25, width: size * 0.5, height: size * 0.4 },
          // Central torso region
          { x: size * 0.2, y: size * 0.3, width: size * 0.6, height: size * 0.3 },
          // Chest area
          { x: size * 0.3, y: size * 0.2, width: size * 0.4, height: size * 0.3 }
        ];

        let bestAnalysis = null;
        let highestConfidence = 0;

        regions.forEach(region => {
          const analysis = analyzeRegion(ctx, region.x, region.y, region.width, region.height);
          if (analysis.confidence > highestConfidence) {
            highestConfidence = analysis.confidence;
            bestAnalysis = analysis;
          }
        });

        if (bestAnalysis) {
          resolve(bestAnalysis);
        } else {
          // Fallback analysis
          resolve(analyzeRegion(ctx, size * 0.3, size * 0.3, size * 0.4, size * 0.4));
        }
      }
    };

    img.src = URL.createObjectURL(file);
  });
};

const analyzeRegion = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): ColorAnalysis => {
  const imageData = ctx.getImageData(x, y, width, height);
  const data = imageData.data;

  // Color analysis with better filtering
  const colorCounts: { [key: string]: number } = {};
  const colorBrightness: { [key: string]: number[] } = {};
  let totalPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];
    
    // Skip transparent pixels and very dark/light pixels that might be shadows/highlights
    if (alpha < 128) continue;
    
    const brightness = (r + g + b) / 3;
    // Filter out pixels that are too dark (shadows) or too bright (overexposure)
    if (brightness < 30 || brightness > 240) continue;
    
    // Filter out skin tones (rough heuristic)
    if (isSkinTone(r, g, b)) continue;
    
    // Use more precise color quantization
    const qR = Math.round(r / 16) * 16;
    const qG = Math.round(g / 16) * 16;
    const qB = Math.round(b / 16) * 16;
    
    const colorKey = `${qR},${qG},${qB}`;
    colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
    
    if (!colorBrightness[colorKey]) {
      colorBrightness[colorKey] = [];
    }
    colorBrightness[colorKey].push(brightness);
    
    totalPixels++;
  }

  // Find the most prominent color that's not likely to be background/noise
  let maxCount = 0;
  let dominantColorRgb = '128,128,128';
  
  for (const [color, count] of Object.entries(colorCounts)) {
    // Require a minimum number of pixels and percentage to be considered
    if (count > maxCount && count > 10 && (count / totalPixels) > 0.05) {
      maxCount = count;
      dominantColorRgb = color;
    }
  }

  const [r, g, b] = dominantColorRgb.split(',').map(Number);
  const dominantColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  
  // Find closest color name with improved matching
  let closestColorName = 'Unknown';
  let minDistance = Infinity;
  
  for (const [hexColor, name] of Object.entries(colorNameMap)) {
    const distance = calculateColorDistance(dominantColor, hexColor);
    if (distance < minDistance) {
      minDistance = distance;
      closestColorName = name;
    }
  }

  // Calculate confidence based on color prominence and consistency
  const confidence = Math.min(0.95, (maxCount / totalPixels) * 1.5);

  return {
    dominantColor,
    colorName: closestColorName,
    confidence
  };
};

// Helper function to detect skin tones (rough heuristic)
const isSkinTone = (r: number, g: number, b: number): boolean => {
  // Very basic skin tone detection - can be improved
  const isInSkinRange = (
    r > 95 && g > 40 && b > 20 &&
    r > g && r > b &&
    Math.abs(r - g) > 15 &&
    (r - g) > 15 && (r - b) > 15
  ) || (
    // Lighter skin tones
    r > 200 && g > 150 && b > 100 &&
    Math.abs(r - g) < 50 && Math.abs(r - b) < 80
  );
  
  return isInSkinRange;
};

const calculateColorDistance = (color1: string, color2: string): number => {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);
  
  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);
  
  // Use weighted Euclidean distance for better perceptual accuracy
  const deltaR = r2 - r1;
  const deltaG = g2 - g1;
  const deltaB = b2 - b1;
  
  return Math.sqrt(2 * deltaR * deltaR + 4 * deltaG * deltaG + 3 * deltaB * deltaB);
};

export const groupPhotosByColor = (photos: PhotoFile[]): PhotoGroup[] => {
  const groups: PhotoGroup[] = [];
  const colorThreshold = 40; // Slightly tighter grouping

  photos.forEach(photo => {
    if (!photo.analysis) return;

    // Try to find an existing group with similar color
    let assignedGroup = groups.find(group => {
      const distance = calculateColorDistance(group.dominantColor, photo.analysis!.dominantColor);
      return distance < colorThreshold;
    });

    if (!assignedGroup) {
      // Create new group
      assignedGroup = {
        id: Math.random().toString(36).substr(2, 9),
        name: `Day ${groups.length + 1}`,
        dominantColor: photo.analysis.dominantColor,
        photos: []
      };
      groups.push(assignedGroup);
    }

    // Add photo to group
    assignedGroup.photos.push({
      ...photo,
      groupId: assignedGroup.id
    });
  });

  // Sort groups by number of photos (descending)
  return groups.sort((a, b) => b.photos.length - a.photos.length);
};
