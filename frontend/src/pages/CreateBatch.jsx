import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Camera from "../components/Camera";
import { showError, showSuccess } from '../utils/toast';
// Import axios with our config instead of API_URL
import axiosConfig from '../utils/axiosConfig';
import Navbar from '../components/Navbar';

const CreateBatch = () => {
  const navigate = useNavigate();
  const [species, setSpecies] = useState("");
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [newBatch, setNewBatch] = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo || userInfo.role !== "FARMER") {
      navigate("/login");
    } else {
      // Get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCoordinates({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (err) => {
            setError("Could not get location. Please enable location services.");
            showError("Could not get location. Please enable location services.");
          }
        );
      } else {
        setError("Geolocation is not supported by this browser.");
        showError("Geolocation is not supported by this browser.");
      }
    }
  }, [navigate]);

  const handleCapture = (dataUri, capturedCoordinates) => {
    setImage(dataUri);
    
    // Convert base64 image to file
    if (dataUri) {
      const base64Data = dataUri.split(',')[1];
      const blob = base64ToBlob(base64Data, 'image/jpeg');
      const file = new File([blob], 'herb-image.jpg', { type: 'image/jpeg' });
      setImageFile(file);
    }
    
    if (capturedCoordinates) {
      setCoordinates(capturedCoordinates);
    }
    
    // Close camera after capturing
    setShowCamera(false);
  };
  
  // Helper function to convert base64 to blob
  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: mimeType });
  };
  
  const handleCloseCamera = () => {
    setShowCamera(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setNewBatch(null);

    if (!species.trim()) {
      setError('Please enter a species name');
      setIsLoading(false);
      return;
    }

    if (!imageFile) {
      setError('Please capture an image');
      setIsLoading(false);
      return;
    }

    if (!coordinates) {
      setError('Location data is required');
      setIsLoading(false);
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const formData = new FormData();
      formData.append("species", species);
      formData.append("image", imageFile);
      formData.append("coordinates", JSON.stringify([coordinates.longitude, coordinates.latitude]));

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${userInfo.token}`,
        }
      };

      const { data } = await axios.post(`/api/batches`, formData, config);
      setNewBatch(data.data);
      showSuccess("Batch created successfully!");
      setSpecies("");
      setImage(null);
      setImageFile(null);
    } catch (err) {
      console.error('Error creating batch:', err);
      const message = err.response?.data?.message || "Failed to create batch";
      setError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar userInfo={JSON.parse(localStorage.getItem("userInfo"))} />
      <div className="p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Herb Batch</h1>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Herb Species
            </label>
            <input
              type="text"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="Enter herb species name"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Batch Image
            </label>
            <div className="mt-1 p-4 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center">
              {image ? (
                <div className="relative w-full max-w-md">
                  <img 
                    src={image} 
                    alt="Captured herb" 
                    className="w-full h-auto rounded-md" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="mt-3 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Retake Photo
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="w-full flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="mt-2 block text-sm font-medium text-gray-700">
                    Take a Photo
                  </span>
                </button>
              )}
              {imageFile && <p className="text-sm text-gray-500 mt-2">Image captured: {imageFile.name}</p>}
            </div>
          </div>
          
          {showCamera && (
            <Camera 
              onCapture={handleCapture} 
              onClose={handleCloseCamera}
              captureLocation={false} // We already have coordinates from the page
            />
          )}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading || !coordinates}
            >
              {isLoading ? "Creating..." : "Create Batch and Generate QR Code"}
            </button>
            {!coordinates && <p className="text-xs text-red-500 mt-1">Waiting for location...</p>}
          </div>
        </form>

        {newBatch && (
          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <h2 className="text-xl font-semibold text-green-800">Batch Created!</h2>
            <p className="text-gray-600"><strong>Species:</strong> {newBatch.species}</p>
            <p className="text-gray-600"><strong>Batch ID:</strong> {newBatch.batchId}</p>
            <div className="mt-4 flex flex-col items-center">
              <img 
                src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${newBatch.qrCodeURL}`} 
                alt="QR Code" 
                className="w-48 h-48" 
              />
              <a 
                href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${newBatch.qrCodeURL}`} 
                download={`qrcode-${newBatch.batchId}.png`}
                className="mt-2 text-indigo-600 hover:text-indigo-800"
              >
                Download QR Code
              </a>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default CreateBatch;
