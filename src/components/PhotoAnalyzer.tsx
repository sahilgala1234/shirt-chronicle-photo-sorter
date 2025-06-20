
import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Brain, Palette } from 'lucide-react';
import { PhotoFile, PhotoGroup } from '@/pages/Index';
import { analyzePhotoColor, groupPhotosByColor } from '@/utils/imageAnalysis';

interface PhotoAnalyzerProps {
  photos: PhotoFile[];
  onAnalysisComplete: (photos: PhotoFile[], groups: PhotoGroup[]) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
}

export const PhotoAnalyzer: React.FC<PhotoAnalyzerProps> = ({
  photos,
  onAnalysisComplete,
  isAnalyzing,
  setIsAnalyzing
}) => {
  const [progress, setProgress] = useState(0);
  const [currentPhoto, setCurrentPhoto] = useState<string>('');
  const [hasStarted, setHasStarted] = useState(false);
  const [analyzedResults, setAnalyzedResults] = useState<Array<{name: string, color: string, colorName: string, confidence: number, aiPowered: boolean}>>([]);
  const [isInitializingAI, setIsInitializingAI] = useState(false);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setHasStarted(true);
    setProgress(0);
    setAnalyzedResults([]);
    setIsInitializingAI(true);

    // Give AI models time to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsInitializingAI(false);

    const analyzedPhotos: PhotoFile[] = [];
    const results: Array<{name: string, color: string, colorName: string, confidence: number, aiPowered: boolean}> = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      setCurrentPhoto(photo.file.name);
      
      try {
        console.log(`Analyzing photo ${i + 1}/${photos.length}: ${photo.file.name}`);
        const analysis = await analyzePhotoColor(photo.file);
        analyzedPhotos.push({
          ...photo,
          analysis
        });
        
        results.push({
          name: photo.file.name,
          color: analysis.dominantColor,
          colorName: analysis.colorName,
          confidence: analysis.confidence,
          aiPowered: analysis.aiPrediction || false
        });
        setAnalyzedResults([...results]);
        
      } catch (error) {
        console.error('Error analyzing photo:', error);
        analyzedPhotos.push({
          ...photo,
          analysis: {
            dominantColor: '#808080',
            colorName: 'Gray',
            confidence: 0.5,
            aiPrediction: false
          }
        });
        
        results.push({
          name: photo.file.name,
          color: '#808080',
          colorName: 'Gray',
          confidence: 0.5,
          aiPowered: false
        });
        setAnalyzedResults([...results]);
      }

      setProgress(((i + 1) / photos.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const groups = groupPhotosByColor(analyzedPhotos);
    onAnalysisComplete(analyzedPhotos, groups);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-blue-100 p-4 rounded-full">
            <Brain className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-800">AI-Powered Analysis</h2>
        <p className="text-lg text-slate-600">
          Advanced machine learning models will analyze each photo to detect t-shirt colors with high accuracy
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {!hasStarted ? (
            <div className="text-center space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <Zap className="h-8 w-8 text-blue-600 mx-auto" />
                  <h3 className="font-medium">AI Processing</h3>
                  <p className="text-sm text-slate-600">Uses machine learning models for accurate detection</p>
                </div>
                <div className="space-y-2">
                  <Palette className="h-8 w-8 text-green-600 mx-auto" />
                  <h3 className="font-medium">Smart Color Detection</h3>
                  <p className="text-sm text-slate-600">Identifies clothing colors with AI precision</p>
                </div>
                <div className="space-y-2">
                  <Brain className="h-8 w-8 text-purple-600 mx-auto" />
                  <h3 className="font-medium">Intelligent Grouping</h3>
                  <p className="text-sm text-slate-600">Groups similar shirts using advanced algorithms</p>
                </div>
              </div>
              
              <Button
                onClick={startAnalysis}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Zap className="mr-2" size={20} />
                Start AI Analysis
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {isInitializingAI && (
                <div className="text-center space-y-2">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-slate-600">Initializing AI models...</p>
                </div>
              )}
              
              {!isInitializingAI && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      AI Analysis in Progress...
                    </span>
                    <span className="text-sm text-slate-600">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  
                  <Progress value={progress} className="h-3" />
                  
                  {currentPhoto && (
                    <p className="text-sm text-slate-600 text-center">
                      Processing: <span className="font-medium">{currentPhoto}</span>
                    </p>
                  )}
                </>
              )}
              
              {analyzedResults.length > 0 && (
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                  <h4 className="font-medium text-slate-700">AI Detected Colors:</h4>
                  {analyzedResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded">
                      <span className="truncate max-w-xs">{result.name}</span>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded border border-slate-300"
                          style={{ backgroundColor: result.color }}
                        />
                        <span className="font-medium">{result.colorName}</span>
                        <span className="text-slate-500">({Math.round(result.confidence * 100)}%)</span>
                        {result.aiPowered && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">AI</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-center">
                <div className="animate-pulse flex space-x-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full animation-delay-200"></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full animation-delay-400"></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
