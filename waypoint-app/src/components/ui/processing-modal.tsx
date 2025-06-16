import React from 'react';

interface ProcessingModalProps {
  isVisible: boolean;
  title: string;
  description: string;
}

export function ProcessingModal({ isVisible, title, description }: ProcessingModalProps) {
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 text-center">{description}</p>
        </div>
      </div>
    </div>
  );
}
