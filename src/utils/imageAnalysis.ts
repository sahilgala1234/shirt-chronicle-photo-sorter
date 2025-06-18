
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
  '#98FB98': 'Pale Green'
};

export const analyzePhotoColor = async (file: File): Promise<ColorAnalysis> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Set canvas size to a smaller version for faster processing
      const size = 100;
      canvas.width = size;
      canvas.height = size;

      if (ctx) {
        ctx.drawImage(img, 0, 0, size, size);
        
        // Get image data from center region (where t-shirt is likely to be)
        const centerX = size * 0.3;
        const centerY = size * 0.3;
        const regionSize = size * 0.4;
        
        const imageData = ctx.getImageData(centerX, centerY, regionSize, regionSize);
        const data = imageData.data;

        // Calculate dominant color
        const colorCounts: { [key: string]: number } = {};
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const alpha = data[i + 3];
          
          // Skip transparent pixels
          if (alpha < 128) continue;
          
          // Quantize colors to reduce noise
          const qR = Math.round(r / 32) * 32;
          const qG = Math.round(g / 32) * 32;
          const qB = Math.round(b / 32) * 32;
          
          const colorKey = `${qR},${qG},${qB}`;
          colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
        }

        // Find most common color
        let maxCount = 0;
        let dominantColorRgb = '128,128,128';
        
        for (const [color, count] of Object.entries(colorCounts)) {
          if (count > maxCount) {
            maxCount = count;
            dominantColorRgb = color;
          }
        }

        const [r, g, b] = dominantColorRgb.split(',').map(Number);
        const dominantColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        
        // Find closest color name
        let closestColorName = 'Unknown';
        let minDistance = Infinity;
        
        for (const [hexColor, name] of Object.entries(colorNameMap)) {
          const distance = calculateColorDistance(dominantColor, hexColor);
          if (distance < minDistance) {
            minDistance = distance;
            closestColorName = name;
          }
        }

        resolve({
          dominantColor,
          colorName: closestColorName,
          confidence: Math.min(0.9, maxCount / (regionSize * regionSize))
        });
      }
    };

    img.src = URL.createObjectURL(file);
  });
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
  
  return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
};

export const groupPhotosByColor = (photos: PhotoFile[]): PhotoGroup[] => {
  const groups: PhotoGroup[] = [];
  const colorThreshold = 50; // Color similarity threshold

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
