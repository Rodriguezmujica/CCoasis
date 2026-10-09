import React from 'react';
import { Hammer } from 'lucide-react';

interface ConstructionViewProps {
  title: string;
}

export const ConstructionView: React.FC<ConstructionViewProps> = ({ title }) => {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Hammer className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{title}</h1>
        <p className="text-base text-slate-500 font-medium">En construcción</p>
      </div>
    </div>
  );
};
