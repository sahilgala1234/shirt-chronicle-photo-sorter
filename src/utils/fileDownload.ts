
import { PhotoGroup } from '@/pages/Index';

export const downloadGroupsAsZip = async (groups: PhotoGroup[]): Promise<void> => {
  // Simple implementation that creates individual downloads for each group
  // In a real app, you'd use a library like JSZip for true ZIP creation
  
  for (const group of groups) {
    await downloadGroup(group);
    // Add a small delay between downloads to avoid overwhelming the browser
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

const downloadGroup = async (group: PhotoGroup): Promise<void> => {
  for (let i = 0; i < group.photos.length; i++) {
    const photo = group.photos[i];
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `${group.name}_${i + 1}_${photo.file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Small delay between individual file downloads
    await new Promise(resolve => setTimeout(resolve, 200));
  }
};

export const downloadSingleGroup = async (group: PhotoGroup): Promise<void> => {
  await downloadGroup(group);
};
