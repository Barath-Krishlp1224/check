'use client';

import React from 'react';

interface IframeComponentProps {
  url: string;
}

const IframeComponent: React.FC<IframeComponentProps> = ({ url }) => {
  return (
    <div className="w-full h-full min-h-[70vh] p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        External Content
      </h2>

      <iframe
        src={url}
        title="External Content"
        className="w-full h-full border border-gray-300 rounded-lg shadow-md"
        style={{ minHeight: '600px' }}
        loading="lazy"
      >
        <p>Your browser does not support iframes.</p>
      </iframe>
    </div>
  );
};

export default IframeComponent;
     