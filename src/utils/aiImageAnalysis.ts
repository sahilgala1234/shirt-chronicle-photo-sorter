
import { pipeline } from '@huggingface/transformers';

export interface AIColorAnalysis {
  dominantColor: string;
  colorName: string;
  confidence: number;
  aiPrediction: boolean;
}

let imageClassifier: any = null;
let featureExtractor: any = null;

// Initialize AI models
const initializeAIModels = async () => {
  try {
    // Initialize image classification pipeline
    imageClassifier = await pipeline(
      'image-classification',
      'microsoft/resnet-50',
      { device: 'webgpu' }
    );

    // Initialize feature extraction for color analysis
    featureExtractor = await pipeline(
      'feature-extraction',
      'google/vit-base-patch16-224',
      { device: 'webgpu' }
    );

    console.log('AI models initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize WebGPU, falling back to CPU:', error);
    // Fallback to CPU if WebGPU is not available
    try {
      imageClassifier = await pipeline(
        'image-classification',
        'microsoft/resnet-50'
      );
      featureExtractor = await pipeline(
        'feature-extraction',
        'google/vit-base-patch16-224'
      );
      console.log('AI models initialized on CPU');
    } catch (cpuError) {
      console.error('Failed to initialize AI models:', cpuError);
    }
  }
};

// Color mapping from common clothing descriptions to hex colors
const clothingColorMap: { [key: string]: { hex: string; name: string } } = {
  'red': { hex: '#FF0000', name: 'Red' },
  'blue': { hex: '#0000FF', name: 'Blue' },
  'green': { hex: '#008000', name: 'Green' },
  'yellow': { hex: '#FFFF00', name: 'Yellow' },
  'orange': { hex: '#FFA500', name: 'Orange' },
  'purple': { hex: '#800080', name: 'Purple' },
  'pink': { hex: '#FFC0CB', name: 'Pink' },
  'black': { hex: '#000000', name: 'Black' },
  'white': { hex: '#FFFFFF', name: 'White' },
  'gray': { hex: '#808080', name: 'Gray' },
  'grey': { hex: '#808080', name: 'Gray' },
  'brown': { hex: '#A52A2A', name: 'Brown' },
  'navy': { hex: '#000080', name: 'Navy' },
  'maroon': { hex: '#800000', name: 'Maroon' },
  'teal': { hex: '#008080', name: 'Teal' },
  'lime': { hex: '#00FF00', name: 'Lime' },
  'cyan': { hex: '#00FFFF', name: 'Cyan' },
  'magenta': { hex: '#FF00FF', name: 'Magenta' },
  'silver': { hex: '#C0C0C0', name: 'Silver' },
  'gold': { hex: '#FFD700', name: 'Gold' }
};

export const analyzeImageWithAI = async (file: File): Promise<AIColorAnalysis> => {
  // Initialize models if not already done
  if (!imageClassifier || !featureExtractor) {
    await initializeAIModels();
  }

  // If AI models failed to load, fall back to traditional analysis
  if (!imageClassifier) {
    console.warn('AI models not available, using fallback analysis');
    return await fallbackColorAnalysis(file);
  }

  try {
    // Create image element for AI analysis
    const imageUrl = URL.createObjectURL(file);
    
    // Use AI to classify the image and detect clothing
    const classifications = await imageClassifier(imageUrl);
    console.log('AI Image Classifications:', classifications);

    // Look for clothing-related classifications
    const clothingItems = classifications.filter((item: any) => 
      item.label.toLowerCase().includes('shirt') ||
      item.label.toLowerCase().includes('jersey') ||
      item.label.toLowerCase().includes('top') ||
      item.label.toLowerCase().includes('clothing')
    );

    // Extract color information from classification labels
    let detectedColor = extractColorFromLabels(classifications);
    
    // If no color detected from AI, use traditional pixel analysis as backup
    if (!detectedColor) {
      console.log('No color detected from AI, using pixel analysis backup');
      const pixelAnalysis = await fallbackColorAnalysis(file);
      detectedColor = {
        hex: pixelAnalysis.dominantColor,
        name: pixelAnalysis.colorName
      };
    }

    // Calculate confidence based on AI classification scores
    const maxConfidence = Math.max(...classifications.slice(0, 3).map((c: any) => c.score));
    
    // Clean up
    URL.revokeObjectURL(imageUrl);

    return {
      dominantColor: detectedColor.hex,
      colorName: detectedColor.name,
      confidence: maxConfidence,
      aiPrediction: true
    };

  } catch (error) {
    console.error('AI analysis failed, using fallback:', error);
    return await fallbackColorAnalysis(file);
  }
};

// Extract color information from AI classification labels
const extractColorFromLabels = (classifications: any[]): { hex: string; name: string } | null => {
  for (const classification of classifications) {
    const label = classification.label.toLowerCase();
    
    // Check if any color names appear in the classification label
    for (const [colorName, colorInfo] of Object.entries(clothingColorMap)) {
      if (label.includes(colorName)) {
        console.log(`Detected color "${colorInfo.name}" from AI label: ${classification.label}`);
        return colorInfo;
      }
    }
  }
  return null;
};

// Fallback color analysis using traditional pixel analysis
const fallbackColorAnalysis = async (file: File): Promise<AIColorAnalysis> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const size = 200;
      canvas.width = size;
      canvas.height = size;

      if (ctx) {
        ctx.drawImage(img, 0, 0, size, size);
        
        // Focus on the torso area where t-shirts are typically located
        const imageData = ctx.getImageData(
          size * 0.25, 
          size * 0.25, 
          size * 0.5, 
          size * 0.4
        );
        const data = imageData.data;

        const colorCounts: { [key: string]: number } = {};
        let totalPixels = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const alpha = data[i + 3];
          
          if (alpha < 128) continue;
          
          const brightness = (r + g + b) / 3;
          if (brightness < 30 || brightness > 240) continue;
          
          const qR = Math.round(r / 32) * 32;
          const qG = Math.round(g / 32) * 32;
          const qB = Math.round(b / 32) * 32;
          
          const colorKey = `${qR},${qG},${qB}`;
          colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
          totalPixels++;
        }

        let maxCount = 0;
        let dominantColorRgb = '128,128,128';
        
        for (const [color, count] of Object.entries(colorCounts)) {
          if (count > maxCount && count > 5) {
            maxCount = count;
            dominantColorRgb = color;
          }
        }

        const [r, g, b] = dominantColorRgb.split(',').map(Number);
        const dominantColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        
        // Simple color name mapping
        const colorName = getClosestColorName(r, g, b);
        const confidence = Math.min(0.8, maxCount / totalPixels);

        resolve({
          dominantColor,
          colorName,
          confidence,
          aiPrediction: false
        });
      }
    };

    img.src = URL.createObjectURL(file);
  });
};

// Get closest color name based on RGB values
const getClosestColorName = (r: number, g: number, b: number): string => {
  const colorDistances = Object.entries(clothingColorMap).map(([name, info]) => {
    const hex = info.hex.replace('#', '');
    const cr = parseInt(hex.substr(0, 2), 16);
    const cg = parseInt(hex.substr(2, 2), 16);
    const cb = parseInt(hex.substr(4, 2), 16);
    
    const distance = Math.sqrt(
      Math.pow(r - cr, 2) + Math.pow(g - cg, 2) + Math.pow(b - cb, 2)
    );
    
    return { name: info.name, distance };
  });

  colorDistances.sort((a, b) => a.distance - b.distance);
  return colorDistances[0].name;
};
