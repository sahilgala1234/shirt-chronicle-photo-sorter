
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RefreshCw, Calendar, Image, Palette } from 'lucide-react';
import { PhotoGroup } from '@/pages/Index';
import { downloadGroupsAsZip } from '@/utils/fileDownload';

interface PhotoGroupsProps {
  groups: PhotoGroup[];
  onStartOver: () => void;
}

export const PhotoGroups: React.FC<PhotoGroupsProps> = ({ groups, onStartOver }) => {
  const totalPhotos = groups.reduce((sum, group) => sum + group.photos.length, 0);

  const handleDownload = async () => {
    try {
      await downloadGroupsAsZip(groups);
    } catch (error) {
      console.error('Error creating download:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-800">Sorting Complete!</h2>
        <p className="text-lg text-slate-600">
          Found {groups.length} different t-shirt{groups.length !== 1 ? 's' : ''} across {totalPhotos} photos
        </p>
      </div>

      <div className="flex justify-center space-x-4">
        <Button
          onClick={handleDownload}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Download className="mr-2" size={20} />
          Download All Groups
        </Button>
        
        <Button
          onClick={onStartOver}
          variant="outline"
          size="lg"
        >
          <RefreshCw className="mr-2" size={20} />
          Start Over
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group, index) => (
          <Card key={group.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Calendar size={20} className="text-blue-600" />
                  <span>{group.name}</span>
                </CardTitle>
                <div 
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: group.dominantColor }}
                  title={`Color: ${group.dominantColor}`}
                />
              </div>
              <p className="text-sm text-slate-600 flex items-center space-x-1">
                <Image size={16} />
                <span>{group.photos.length} photo{group.photos.length !== 1 ? 's' : ''}</span>
              </p>
              
              {/* Show detected colors for this group */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center space-x-1 text-xs text-slate-600">
                  <Palette size={14} />
                  <span>Detected Colors:</span>
                </div>
                <div className="space-y-1">
                  {group.photos.slice(0, 3).map((photo) => (
                    <div key={photo.id} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-24">{photo.file.name}</span>
                      <div className="flex items-center space-x-1">
                        <div 
                          className="w-3 h-3 rounded border border-slate-300"
                          style={{ backgroundColor: photo.analysis?.dominantColor || '#808080' }}
                        />
                        <span className="text-slate-600">{photo.analysis?.colorName || 'Unknown'}</span>
                      </div>
                    </div>
                  ))}
                  {group.photos.length > 3 && (
                    <div className="text-xs text-slate-500">
                      +{group.photos.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2">
                {group.photos.slice(0, 6).map((photo) => (
                  <div key={photo.id} className="aspect-square rounded-md overflow-hidden bg-slate-100">
                    <img
                      src={photo.url}
                      alt={photo.file.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      title={`${photo.file.name} - ${photo.analysis?.colorName || 'Unknown'} (${photo.analysis?.dominantColor || '#808080'})`}
                    />
                  </div>
                ))}
                {group.photos.length > 6 && (
                  <div className="aspect-square rounded-md bg-slate-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-600">
                      +{group.photos.length - 6}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {groups.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <div className="space-y-4">
              <div className="text-slate-400">
                <Image size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-slate-700">No groups found</h3>
              <p className="text-slate-600">
                Try uploading photos with people wearing different colored t-shirts
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
