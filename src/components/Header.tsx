
import React from 'react';
import { Camera, Shirt } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-blue-600">
            <Camera size={28} />
            <Shirt size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Shirt Chronicle</h1>
            <p className="text-sm text-slate-600">AI-Powered Photo Organizer</p>
          </div>
        </div>
      </div>
    </header>
  );
};
