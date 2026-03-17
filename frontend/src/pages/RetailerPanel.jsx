import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Camera from '../components/Camera';
import Navbar from '../components/Navbar';

const RetailerPanel = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [saleData, setSaleData] = useState({
    customerName: '',
    customerEmail: '',
    price: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [actionType, setActionType] = useState(null); // 'receive' or 'sell'
  const [retailers, setRetailers] = useState([]);
  const [nextRetailer, setNextRetailer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and is a retailer
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!storedUserInfo) {
      navigate('/login');
      return;
    } else if (storedUserInfo.role !== 'RETAILER') {
      navigate('/dashboard');
      return;
    }
    setUserInfo(storedUserInfo);

    // Fetch batches owned by the retailer
    const fetchBatches = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${storedUserInfo.token}`,
          },
        };

        const response = await axios.get('/api/batches/my/owned', config);
        setBatches(response.data.data);
        
        // Also fetch other retailers for transfer
        const retailersResponse = await axios.get('/api/users/retailers', config);
        setRetailers(retailersResponse.data.data.filter(r => r._id !== storedUserInfo._id));
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to fetch batches');
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, [navigate]);

  const handleChange = (e) => {
    setSaleData({ ...saleData, [e.target.name]: e.target.value });
  };

  const handleSubmitSale = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const metadata = {
        customerName: saleData.customerName,
        customerEmail: saleData.customerEmail,
        price: saleData.price,
        notes: saleData.notes
      };

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.put(
        `/api/batches/${selectedBatch.batchId}/add-event`,
        { 
          stage: 'RETAIL_STOCK',
          newStatus: 'SOLD',
          coordinates: '[0, 0]',
          metadata 
        },
        config
      );

      // Refresh batches
      const refreshResponse = await axios.get('/api/batches/my/owned', config);
      setBatches(refreshResponse.data.data);

      // Reset form and show success message
      setSelectedBatch(null);
      setSaleData({
        customerName: '',
        customerEmail: '',
        price: '',
        notes: ''
      });
      setSuccess(`Batch ${selectedBatch.batchId} has been marked as sold successfully.`);

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to record sale');
    } finally {
      setSubmitting(false);
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
        formData.append('stage', 'RETAIL_STOCK');
        formData.append('newStatus', 'IN_RETAIL');
        formData.append('coordinates', JSON.stringify(locationCoords));
      } else if (actionType === 'transfer' && nextRetailer) {
        formData.append('stage', 'RETAIL_STOCK');
        formData.append('newStatus', 'IN_RETAIL');
        formData.append('coordinates', JSON.stringify(locationCoords));
        formData.append('metadata', JSON.stringify({ 
          transferredTo: nextRetailer.name,
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
      
      // If transferring to another retailer, update owner
      if (actionType === 'transfer' && nextRetailer) {
        await axios.put(
          `/api/batches/${selectedBatch._id}/transfer`,
          { recipientId: nextRetailer._id },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${userInfo.token}`,
            },
          }
        );
        
        setSuccess(`Successfully transferred ${selectedBatch.species} to ${nextRetailer.name}`);
      } else if (actionType === 'receive') {
        setSuccess(`Successfully received ${selectedBatch.species} batch`);
      }
      
      // Refresh batches
      const response = await axios.get('/api/batches/my/owned', config);
      setBatches(response.data.data);
      
      // Reset state
      setSelectedBatch(null);
      setActionType(null);
      setNextRetailer(null);
      
    } catch (error) {
      console.error('Error processing batch:', error);
      setError(error.response?.data?.message || 'Failed to process batch');
    }
  };

  const handleReceiveBatch = (batch) => {
    setSelectedBatch(batch);
    setActionType('receive');
    setShowCamera(true);
  };

  const handleTransferToRetailer = (batch) => {
    setSelectedBatch(batch);
    setActionType('transfer');
  };

  const confirmTransferToRetailer = () => {
    if (!nextRetailer) {
      setError('Please select a retailer to transfer to');
      return;
    }
    setShowCamera(true);
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

  return (
    <div className="min-h-screen bg-green-50">
      <Navbar userInfo={userInfo} />

      {/* Page Content */}
      <div className="container mx-auto p-8">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold text-green-700">
            Retailer Panel
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and sell herb batches
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
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

        {/* Retailer Selection Modal */}
        {actionType === 'transfer' && selectedBatch && !showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Transfer Batch to Another Retailer</h2>
              <p className="mb-4">
                Select a retailer to transfer <strong>{selectedBatch.species}</strong>
              </p>
              
              <div className="max-h-60 overflow-y-auto mb-4">
                {retailers.length > 0 ? (
                  <div className="space-y-2">
                    {retailers.map(retailer => (
                      <div 
                        key={retailer._id}
                        onClick={() => setNextRetailer(retailer)}
                        className={`p-3 border rounded cursor-pointer ${
                          nextRetailer?._id === retailer._id ? 'bg-green-50 border-green-500' : 'hover:bg-gray-50'
                        }`}
                      >
                        <p className="font-medium">{retailer.name}</p>
                        <p className="text-sm text-gray-600">{retailer.organizationName || 'Independent Retailer'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">No other retailers available</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedBatch(null);
                    setActionType(null);
                    setNextRetailer(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTransferToRetailer}
                  disabled={!nextRetailer}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Batches List */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Available Batches</h2>
            
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : batches.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-600">No batches available for sale.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {batches.map((batch) => (
                  <div 
                    key={batch.batchId}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{batch.species}</h3>
                          <p className="text-sm text-gray-600">Batch ID: {batch.batchId}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Status: <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(batch.currentStatus)}`}>
                              {formatStatus(batch.currentStatus)}
                            </span>
                          </p>
                          {batch.pendingOwner && batch.pendingOwner._id === userInfo._id && (
                            <div className="mt-3">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const otp = window.prompt(`Enter the 6-digit OTP provided by the sender for batch ${batch.species}:`);
                                  if (!otp) return;
                                  try {
                                    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                                    await axios.put(`/api/batches/${batch._id}/accept-transfer`, { otp }, config);
                                    const resp = await axios.get('/api/batches/my/owned', config);
                                    setBatches(resp.data.data);
                                    alert("Successfully verified OTP and claimed batch!");
                                  } catch (err) {
                                    alert("Failed to claim batch: Invalid OTP");
                                  }
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm w-full font-bold"
                              >
                                Accept Transfer (OTP)
                              </button>
                            </div>
                          )}
                        </div>
                        <Link 
                          to={`/batch/${batch.batchId}`}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        {batch.currentStatus === 'IN_TRANSIT_TO_RETAILER' && (
                          <button
                            onClick={() => handleReceiveBatch(batch)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                          >
                            Receive Batch & Geotag
                          </button>
                        )}
                        
                        {batch.currentStatus === 'IN_RETAIL' && (
                          <>
                            <button
                              onClick={() => handleTransferToRetailer(batch)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-2"
                            >
                              Transfer to Another Retailer
                            </button>
                            
                            <button
                              onClick={() => setSelectedBatch(batch)}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded"
                            >
                              Record Sale to Consumer
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sale Form */}
          <div>
            {selectedBatch && actionType !== 'transfer' && !showCamera ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Record Sale for {selectedBatch.species}
                </h2>
                <p className="text-gray-600 mb-6">Batch ID: {selectedBatch.batchId}</p>

                <form onSubmit={handleSubmitSale}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="customerName">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      name="customerName"
                      value={saleData.customerName}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="customerEmail">
                      Customer Email
                    </label>
                    <input
                      type="email"
                      id="customerEmail"
                      name="customerEmail"
                      value={saleData.customerEmail}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
                      Sale Price
                    </label>
                    <input
                      type="text"
                      id="price"
                      name="price"
                      value={saleData.price}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
                      Additional Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={saleData.notes}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBatch(null);
                        setSaleData({
                          customerName: '',
                          customerEmail: '',
                          price: '',
                          notes: ''
                        });
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      disabled={submitting}
                    >
                      {submitting ? 'Processing...' : 'Record Sale'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-600">Select a batch from the list to perform an action.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetailerPanel;