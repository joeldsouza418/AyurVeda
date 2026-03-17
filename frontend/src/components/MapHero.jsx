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
    <div className="w-full h-full relative overflow-hidden">
      <video
        className="w-full h-full"
        autoPlay
        muted
        loop
        playsInline
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover'
        }}
      >
        <source src="/video1.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
