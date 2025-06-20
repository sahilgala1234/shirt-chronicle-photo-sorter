
import React, { useState } from 'react';
import { PhotoUploader } from '@/components/PhotoUploader';
import { PhotoAnalyzer } from '@/components/PhotoAnalyzer';
import { PhotoGroups } from '@/components/PhotoGroups';
import { Header } from '@/components/Header';
import { UploadIcon, Zap, FolderOpen } from 'lucide-react';

export interface PhotoFile {
  id: string;
  file: File;
  url: string;
  analysis?: {
    dominantColor: string;
    colorName: string;
    confidence: number;
    aiPrediction?: boolean;
  };
  groupId?: string;
}

export interface PhotoGroup {
  id: string;
  name: string;
  dominantColor: string;
  photos: PhotoFile[];
}

const Index = () => {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [groups, setGroups] = useState<PhotoGroup[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'results'>('upload');

  const handlePhotosUploaded = (uploadedPhotos: PhotoFile[]) => {
    setPhotos(uploadedPhotos);
    setCurrentStep('analyze');
  };

  const handleAnalysisComplete = (analyzedPhotos: PhotoFile[], photoGroups: PhotoGroup[]) => {
    setPhotos(analyzedPhotos);
    setGroups(photoGroups);
    setCurrentStep('results');
    setIsAnalyzing(false);
  };

  const handleStartOver = () => {
    setPhotos([]);
    setGroups([]);
    setCurrentStep('upload');
    setIsAnalyzing(false);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 space-x-4">
      <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-blue-600' : currentStep === 'analyze' || currentStep === 'results' ? 'text-green-600' : 'text-gray-400'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'upload' ? 'bg-blue-600 text-white' : currentStep === 'analyze' || currentStep === 'results' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
          <UploadIcon size={16} />
        </div>
        <span className="font-medium">Upload</span>
      </div>
      
      <div className={`w-8 h-1 ${currentStep === 'analyze' || currentStep === 'results' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
      
      <div className={`flex items-center space-x-2 ${currentStep === 'analyze' ? 'text-blue-600' : currentStep === 'results' ? 'text-green-600' : 'text-gray-400'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'analyze' ? 'bg-blue-600 text-white' : currentStep === 'results' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
          <Zap size={16} />
        </div>
        <span className="font-medium">Analyze</span>
      </div>
      
      <div className={`w-8 h-1 ${currentStep === 'results' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
      
      <div className={`flex items-center space-x-2 ${currentStep === 'results' ? 'text-blue-600' : 'text-gray-400'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'results' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          <FolderOpen size={16} />
        </div>
        <span className="font-medium">Results</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {renderStepIndicator()}

        {currentStep === 'upload' && (
          <PhotoUploader onPhotosUploaded={handlePhotosUploaded} />
        )}

        {currentStep === 'analyze' && (
          <PhotoAnalyzer 
            photos={photos}
            onAnalysisComplete={handleAnalysisComplete}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
          />
        )}

        {currentStep === 'results' && (
          <PhotoGroups 
            groups={groups}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
