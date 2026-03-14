import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Camera from '../components/Camera';
import Navbar from '../components/Navbar';

const DistributorPanel = () => {
  const [batches, setBatches] = useState([]);
  const [unassignedBatches, setUnassignedBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUnassigned, setLoadingUnassigned] = useState(true);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [trackingBatch, setTrackingBatch] = useState(null);
  const [coordinates, setCoordinates] = useState([0, 0]);
  const [locationStatus, setLocationStatus] = useState('Waiting for location...');
  const [trackingActive, setTrackingActive] = useState(false);
  const [trackingInterval, setTrackingInterval] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [actionType, setActionType] = useState(null); // 'receive' or 'transfer'
  const [transferToLab, setTransferToLab] = useState(null);
  const [labs, setLabs] = useState([]);
  const [transferSuccess, setTransferSuccess] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and is a distributor
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!storedUserInfo) {
      navigate('/login');
      return;
    } else if (storedUserInfo.role !== 'DISTRIBUTOR') {
      navigate('/dashboard');
      return;
    }
    setUserInfo(storedUserInfo);

    // Fetch batches owned by the distributor and unassigned batches
    const fetchBatches = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${storedUserInfo.token}`,
          },
        };

        const response = await axios.get('/api/batches/my/owned', config);
        setBatches(response.data.data);
        
        // Also fetch labs for transfer
        const labsResponse = await axios.get('/api/users/labs', config);
        setLabs(labsResponse.data.data);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to fetch batches');
      } finally {
        setLoading(false);
      }
    };

    const fetchUnassignedBatches = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${storedUserInfo.token}`,
          },
        };
        const response = await axios.get('/api/batches/unassigned', config);
        setUnassignedBatches(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch unassigned batches:', error);
      } finally {
        setLoadingUnassigned(false);
      }
    };

    fetchBatches();
    fetchUnassignedBatches();

    // Cleanup tracking interval on unmount
    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
    };
  }, [navigate]);

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
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
    } else {
      setLocationStatus('Geolocation not supported');
    }
  };

  // Start GPS tracking for a batch
  const startTracking = (batch) => {
    setTrackingBatch(batch);
    getCurrentLocation();
    
    // Set up interval to update location every 30 seconds
    const interval = setInterval(() => {
      getCurrentLocation();
      if (coordinates[0] !== 0 && coordinates[1] !== 0) {
        updateBatchLocation(batch.batchId);
      }
    }, 30000); // 30 seconds
    
    setTrackingInterval(interval);
    setTrackingActive(true);
    
    // Initial update
    if (coordinates[0] !== 0 && coordinates[1] !== 0) {
      updateBatchLocation(batch.batchId);
    }
  };

  // Stop GPS tracking
  const stopTracking = () => {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      setTrackingInterval(null);
    }
    setTrackingActive(false);
    setTrackingBatch(null);
  };

  // Update batch location in the backend
  const updateBatchLocation = async (batchId) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.put(
        `/api/gps/${batchId}/update`,
        { coordinates: JSON.stringify(coordinates) },
        config
      );

      // Update the local batch data
      setBatches(prevBatches => 
        prevBatches.map(batch => 
          batch.batchId === batchId 
            ? { 
                ...batch, 
                gpsTracking: { 
                  isActive: true, 
                  currentLocation: { 
                    type: 'Point', 
                    coordinates 
                  }, 
                  lastUpdated: new Date() 
                } 
              } 
            : batch
        )
      );
    } catch (error) {
      console.error('Error updating location:', error);
      setError('Failed to update location. Please try again.');
    }
  };

  const handleCameraCapture = async (imageSrc, locationCoords) => {
    setShowCamera(false);
    
    if (!selectedBatch || !actionType) return;
    
    try {
      // Convert base64 image to a Blob
      const byteString = atob(imageSrc.split(',')[1]);
      const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const imageFile = new File([blob], `geotagged-image-${Date.now()}.jpg`, { type: mimeString });

      const formData = new FormData();
      formData.append('image', imageFile);
      
      // Add appropriate stage and new status based on action type
      if (actionType === 'receive') {
        formData.append('stage', 'DISTRIBUTION');
        formData.append('newStatus', 'IN_TRANSIT_TO_LAB');
        formData.append('coordinates', JSON.stringify(locationCoords));
      } else if (actionType === 'transfer' && transferToLab) {
        formData.append('stage', 'DISTRIBUTION');
        formData.append('newStatus', 'UNDER_TESTING');
        formData.append('coordinates', JSON.stringify(locationCoords));
        formData.append('metadata', JSON.stringify({ 
          destinationLab: transferToLab.name,
          transferTime: new Date().toISOString()
        }));
      }
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      await axios.put(
        `/api/batches/${selectedBatch.batchId}/add-event`,
        formData,
        config
      );
      
      // If transferring to lab, update owner
      if (actionType === 'transfer' && transferToLab) {
        await axios.put(
          `/api/batches/${selectedBatch._id}/transfer`,
          { recipientId: transferToLab._id },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${userInfo.token}`,
            },
          }
        );
        
        setTransferSuccess(`Successfully transferred ${selectedBatch.species} to ${transferToLab.name}`);
      }
      
      // Refresh batches
      const response = await axios.get('/api/batches/my/owned', config);
      setBatches(response.data.data);
      
      // Reset state
      setSelectedBatch(null);
      setActionType(null);
      setTransferToLab(null);
      
    } catch (error) {
      console.error('Error processing batch:', error);
      setError(error.response?.data?.message || 'Failed to process batch');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'HARVESTED':
        return 'bg-green-100 text-green-800';
      case 'IN_TRANSIT_TO_LAB':
        return 'bg-blue-100 text-blue-800';
      case 'UNDER_TESTING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_TRANSIT_TO_RETAILER':
        return 'bg-indigo-100 text-indigo-800';
      case 'IN_RETAIL':
        return 'bg-purple-100 text-purple-800';
      case 'SOLD':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  const isTransitStatus = (status) => {
    return status === 'IN_TRANSIT_TO_LAB' || status === 'IN_TRANSIT_TO_RETAILER';
  };

  const handleReceiveBatch = (batch) => {
    setSelectedBatch(batch);
    setActionType('receive');
    setShowCamera(true);
  };

  const handleTransferToLab = (batch) => {
    setSelectedBatch(batch);
    setActionType('transfer');
  };

  const confirmTransferToLab = () => {
    if (!transferToLab) {
      setError('Please select a lab to transfer to');
      return;
    }
    setShowCamera(true);
  };

  const handleClaimBatch = async (batch) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      await axios.put(`/api/batches/${batch._id}/assign`, { distributorId: userInfo._id }, config);
      // Refresh both lists
      const ownedResponse = await axios.get('/api/batches/my/owned', config);
      setBatches(ownedResponse.data.data);
      const unassignedResponse = await axios.get('/api/batches/unassigned', config);
      setUnassignedBatches(unassignedResponse.data.data || []);
      setTransferSuccess(`Successfully claimed ${batch.species}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to claim batch');
    }
  };

  return (
    <div className="min-h-screen bg-green-50">
      <Navbar userInfo={userInfo} />

      {/* Page Content */}
      <div className="container mx-auto p-8">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold text-green-700">
            Distributor Panel
          </h1>
          <p className="text-gray-600 mt-2">
            Manage shipments and track batches in transit
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {transferSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {transferSuccess}
          </div>
        )}

        {/* Active Tracking Section */}
        {trackingActive && trackingBatch && (
          <div className="bg-blue-50 rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-blue-800 mb-2">
                  Actively Tracking: {trackingBatch.species}
                </h2>
                <p className="text-gray-700">Batch ID: {trackingBatch.batchId}</p>
                <p className="text-gray-700 mt-2">
                  Status: <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(trackingBatch.currentStatus)}`}>
                    {formatStatus(trackingBatch.currentStatus)}
                  </span>
                </p>
                <p className="text-gray-700 mt-2">
                  Location Status: <span className={locationStatus === "Location acquired" ? "text-green-600" : "text-yellow-600"}>{locationStatus}</span>
                </p>
                {coordinates[0] !== 0 && coordinates[1] !== 0 && (
                  <p className="text-gray-700 mt-1">
                    Current Coordinates: {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}
                  </p>
                )}
              </div>
              <button
                onClick={stopTracking}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
              >
                Stop Tracking
              </button>
            </div>
          </div>
        )}

        {/* Lab Selection Modal */}
        {actionType === 'transfer' && selectedBatch && !showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Transfer Batch to Lab</h2>
              <p className="mb-4">
                Select a laboratory to transfer <strong>{selectedBatch.species}</strong>
              </p>
              
              <div className="max-h-60 overflow-y-auto mb-4">
                {labs.length > 0 ? (
                  <div className="space-y-2">
                    {labs.map(lab => (
                      <div 
                        key={lab._id}
                        onClick={() => setTransferToLab(lab)}
                        className={`p-3 border rounded cursor-pointer ${
                          transferToLab?._id === lab._id ? 'bg-green-50 border-green-500' : 'hover:bg-gray-50'
                        }`}
                      >
                        <p className="font-medium">{lab.name}</p>
                        <p className="text-sm text-gray-600">{lab.organizationName || 'Independent Lab'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">No labs available</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedBatch(null);
                    setActionType(null);
                    setTransferToLab(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTransferToLab}
                  disabled={!transferToLab}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Camera Component */}
        {showCamera && (
          <Camera 
            onCapture={handleCameraCapture} 
            onClose={() => {
              setShowCamera(false);
              setSelectedBatch(null);
              setActionType(null);
            }}
            captureLocation={true}
          />
        )}

        {/* Available Shipments Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Shipments</h2>
          {loadingUnassigned ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : unassignedBatches.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600">No unassigned shipments available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {unassignedBatches.map((batch) => (
                <div key={batch._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{batch.species}</h3>
                        <p className="text-sm text-gray-600">Batch ID: {batch.batchId}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Farmer: {batch.farmer?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Org: {batch.farmer?.organizationName || 'N/A'}
                        </p>
                      </div>
                      <Link
                        to={`/batch/${batch.batchId}`}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                    <button
                      onClick={() => handleClaimBatch(batch)}
                      className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                    >
                      Claim Shipment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Your Shipments</h2>

            {batches.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-600">No batches assigned to you.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {batches.map((batch) => (
                  <div 
                    key={batch.batchId}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{batch.species}</h3>
                          <p className="text-sm text-gray-600">Batch ID: {batch.batchId}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Status: <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(batch.currentStatus)}`}>
                              {formatStatus(batch.currentStatus)}
                            </span>
                          </p>
                        </div>
                        <Link 
                          to={`/batch/${batch.batchId}`}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </div>

                      <div className="mt-4 space-y-2">
                        {batch.currentStatus === 'HARVESTED' && (
                          <button
                            onClick={() => handleReceiveBatch(batch)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                            disabled={trackingActive}
                          >
                            Receive Batch & Geotag
                          </button>
                        )}
                        
                        {batch.currentStatus === 'IN_TRANSIT_TO_LAB' && (
                          <>
                            <button
                              onClick={() => handleTransferToLab(batch)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-2"
                              disabled={trackingActive}
                            >
                              Transfer to Lab
                            </button>
                            
                            {!trackingActive ? (
                              <button
                                onClick={() => startTracking(batch)}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
                              >
                                Start GPS Tracking
                              </button>
                            ) : trackingBatch?.batchId === batch.batchId ? (
                              <p className="text-green-600 font-medium text-center">✓ Actively tracking</p>
                            ) : (
                              <button
                                disabled
                                className="w-full bg-gray-400 text-white py-2 px-4 rounded cursor-not-allowed"
                              >
                                Finish current tracking first
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributorPanel;