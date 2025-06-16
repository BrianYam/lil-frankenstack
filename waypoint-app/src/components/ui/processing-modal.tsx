import React from 'react';

interface ProcessingModalProps {
  isVisible: boolean;
  title: string;
  description: string;
}

export function ProcessingModal({ isVisible, title, description }: ProcessingModalProps) {
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-indigo-900 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full border border-blue-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-100 border-b-indigo-600 mb-6"></div>
          <h3 className="text-xl font-semibold text-indigo-700 mb-3">{title}</h3>
          <p className="text-base text-gray-600 text-center">{description}</p>
        </div>
      </div>
    </div>
  );
}
