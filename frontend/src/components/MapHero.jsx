import React, { useEffect } from 'react';

export default function MapHero({ onAnimationComplete }) {
  useEffect(() => {
    // Call onAnimationComplete after a short delay to show buttons
    const timer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-green-50 via-green-100 to-green-200 flex items-center justify-center">
      {/* TraceX Logo */}
      <div className="text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-2xl border-4 border-green-600">
            <span className="text-6xl">📦</span>
          </div>
        </div>
        <h1 className="text-6xl md:text-7xl font-extrabold text-green-800 mb-4">
          TraceX
        </h1>
        <p className="text-xl md:text-2xl text-green-700 font-medium">
          Herbal Supply Chain Transparency
        </p>
      </div>
    </div>
  );
}
