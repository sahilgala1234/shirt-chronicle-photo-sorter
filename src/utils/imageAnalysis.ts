
import { PhotoFile, PhotoGroup } from '@/pages/Index';
import { analyzeImageWithAI, AIColorAnalysis } from './aiImageAnalysis';

export interface ColorAnalysis {
  dominantColor: string;
  colorName: string;
  confidence: number;
  aiPrediction?: boolean;
}

export const analyzePhotoColor = async (file: File): Promise<ColorAnalysis> => {
  try {
    console.log(`Starting AI analysis for: ${file.name}`);
    const aiAnalysis: AIColorAnalysis = await analyzeImageWithAI(file);
    
    console.log(`AI Analysis Result for ${file.name}:`, {
      color: aiAnalysis.dominantColor,
      name: aiAnalysis.colorName,
      confidence: aiAnalysis.confidence,
      aiPowered: aiAnalysis.aiPrediction
    });

    return {
      dominantColor: aiAnalysis.dominantColor,
      colorName: aiAnalysis.colorName,
      confidence: aiAnalysis.confidence,
      aiPrediction: aiAnalysis.aiPrediction
    };
  } catch (error) {
    console.error('Error in AI photo analysis:', error);
    
    // Fallback to a simple default
    return {
      dominantColor: '#808080',
      colorName: 'Gray',
      confidence: 0.5,
      aiPrediction: false
    };
  }
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
  
  const deltaR = r2 - r1;
  const deltaG = g2 - g1;
  const deltaB = b2 - b1;
  
  return Math.sqrt(2 * deltaR * deltaR + 4 * deltaG * deltaG + 3 * deltaB * deltaB);
};

export const groupPhotosByColor = (photos: PhotoFile[]): PhotoGroup[] => {
  const groups: PhotoGroup[] = [];
  const colorThreshold = 40;

  photos.forEach(photo => {
    if (!photo.analysis) return;

    let assignedGroup = groups.find(group => {
      const distance = calculateColorDistance(group.dominantColor, photo.analysis!.dominantColor);
      return distance < colorThreshold;
    });

    if (!assignedGroup) {
      assignedGroup = {
        id: Math.random().toString(36).substr(2, 9),
        name: `Day ${groups.length + 1}`,
        dominantColor: photo.analysis.dominantColor,
        photos: []
      };
      groups.push(assignedGroup);
    }

    assignedGroup.photos.push({
      ...photo,
      groupId: assignedGroup.id
    });
  });

  return groups.sort((a, b) => b.photos.length - a.photos.length);
};
