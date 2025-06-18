
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PhotoFile } from '@/pages/Index';

interface PhotoUploaderProps {
  onPhotosUploaded: (photos: PhotoFile[]) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onPhotosUploaded }) => {
  const [uploadedFiles, setUploadedFiles] = useState<PhotoFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPhotos = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file)
    }));
    
    setUploadedFiles(prev => [...prev, ...newPhotos]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true
  });

  const removePhoto = (id: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(photo => photo.id !== id);
      return updated;
    });
  };

  const handleProceed = () => {
    if (uploadedFiles.length > 0) {
      onPhotosUploaded(uploadedFiles);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-800">Upload Your Photos</h2>
        <p className="text-lg text-slate-600">
          Drop photos containing people wearing t-shirts. Our AI will analyze and group them by clothing patterns.
        </p>
      </div>

      <Card className="border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`text-center cursor-pointer p-8 rounded-lg transition-colors ${
              isDragActive
                ? 'bg-blue-50 border-blue-300'
                : 'hover:bg-slate-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-16 w-16 text-slate-400 mb-4" />
            {isDragActive ? (
              <p className="text-xl text-blue-600 font-medium">Drop the photos here...</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xl text-slate-700 font-medium">
                  Drag & drop photos here, or click to select
                </p>
                <p className="text-slate-500">
                  Supports JPG, PNG, WebP formats
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-800">
            Uploaded Photos ({uploadedFiles.length})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {uploadedFiles.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                  <img
                    src={photo.url}
                    alt={photo.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X size={16} />
                </button>
                <p className="text-xs text-slate-600 mt-1 truncate">
                  {photo.file.name}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Button
              onClick={handleProceed}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              <ImageIcon className="mr-2" size={20} />
              Analyze Photos ({uploadedFiles.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
