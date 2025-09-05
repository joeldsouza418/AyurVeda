import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

const Camera = ({ onCapture, onClose, captureLocation = true }) => {
  const webcamRef = useRef(null);
  const [isCameraReady, setCameraReady] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');

  const videoConstraints = {
    width: 720,
    height: 720,
    facingMode: 'environment' // Use the back camera if available
  };

  useEffect(() => {
    // Get location when camera component mounts
    if (captureLocation && navigator.geolocation) {
      setLocationStatus('Getting location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setCoordinates([longitude, latitude]);
          setLocationStatus('Location acquired');
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationStatus('Failed to get location');
        }
      );
    }
  }, [captureLocation]);

  const handleUserMedia = () => {
    setCameraReady(true);
  };

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      onCapture(imageSrc, coordinates);
    }
  }, [webcamRef, onCapture, coordinates]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Take a Photo</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="relative">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMedia={handleUserMedia}
            className="w-full rounded-md"
          />
          {!isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-md">
              <p className="text-gray-600">Loading camera...</p>
            </div>
          )}
        </div>
        
        {captureLocation && (
          <div className="mt-2 px-2">
            <p className={`text-sm ${
              locationStatus === 'Location acquired' ? 'text-green-600' : 
              locationStatus === 'Failed to get location' ? 'text-red-600' : 
              'text-yellow-600'
            }`}>
              {locationStatus || 'Waiting for location...'}
            </p>
            {coordinates && (
              <p className="text-xs text-gray-500">
                GPS: {coordinates[1].toFixed(6)}, {coordinates[0].toFixed(6)}
              </p>
            )}
          </div>
        )}
        
        <div className="mt-4 flex justify-center">
          <button
            onClick={capture}
            disabled={!isCameraReady || (captureLocation && !coordinates)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Capture Photo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Camera;