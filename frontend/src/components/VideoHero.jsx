import React, { useRef, useEffect, useState } from 'react';

const VideoHero = ({ onAnimationComplete }) => {
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    console.log('VideoHero component mounted');
    const video = videoRef.current;
    if (video) {
      console.log('Video element found, setting up event listeners');
      
      const handleLoadedData = () => {
        console.log('Video loaded successfully');
        setVideoLoaded(true);
        video.play().then(() => {
          console.log('Video is now playing and should be visible');
        }).catch((error) => {
          console.error('Video autoplay failed:', error);
          setVideoError(true);
        });
      };

      const handleError = (e) => {
        console.error('Video failed to load:', e);
        setVideoError(true);
      };

      const handleCanPlay = () => {
        console.log('Video can play');
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);
      video.addEventListener('canplay', handleCanPlay);
      
      // Call onAnimationComplete after a short delay to show buttons
      const timer = setTimeout(() => {
        console.log('Calling onAnimationComplete');
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 1000);

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
        video.removeEventListener('canplay', handleCanPlay);
        clearTimeout(timer);
      };
    } else {
      console.error('Video element not found');
    }
  }, [onAnimationComplete]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-green-100">
      {!videoError ? (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-cover border-2 border-red-500"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            controls
            style={{ display: videoLoaded ? 'block' : 'none' }}
          >
            <source src="/video1.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Loading indicator */}
          {!videoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-green-100 to-green-200">
              <div className="text-center text-green-800">
                <div className="animate-spin text-4xl mb-4">🌿</div>
                <p>Loading video...</p>
              </div>
            </div>
          )}
          
          {/* Optional overlay for better text readability */}
          {videoLoaded && (
            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-green-100 to-green-200">
          <div className="text-center text-green-800">
            <div className="text-6xl mb-4">🌿</div>
            <h2 className="text-3xl font-bold mb-2">AyurTrace</h2>
            <p className="text-xl">Herbal Supply Chain Transparency</p>
            <p className="text-sm mt-2 opacity-70">Video could not be loaded</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoHero;