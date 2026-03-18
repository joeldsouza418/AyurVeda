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
      setSuccess(`✓ Batch ${selectedBatch.batchId} has been marked as sold successfully.`);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);

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

        setSuccess(`✓ Successfully transferred ${selectedBatch.species} to ${nextRetailer.name}`);
      } else if (actionType === 'receive') {
        setSuccess(`✓ Successfully received ${selectedBatch.species} batch and geotagged location`);
      }

      // Refresh batches
      const response = await axios.get('/api/batches/my/owned', config);
      setBatches(response.data.data);

      // Reset state
      setSelectedBatch(null);
      setActionType(null);
      setNextRetailer(null);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);

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
    switch (status) {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'HARVESTED':
        return '🌾';
      case 'IN_TRANSIT_TO_LAB':
        return '🚛';
      case 'UNDER_TESTING':
        return '🧪';
      case 'IN_TRANSIT_TO_RETAILER':
        return '📦';
      case 'IN_RETAIL':
        return '🏪';
      case 'SOLD':
        return '✓';
      default:
        return '📦';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar userInfo={userInfo} />

      {/* Page Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-10">
          <div className="text-5xl mb-3">🏪</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Retailer Panel
          </h1>
          <p className="text-gray-600 mt-3 text-lg">
            Manage inventory and process retail sales
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-md animate-pulse">
            <p className="font-semibold">⚠ Error</p>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-6 py-4 rounded-lg mb-6 shadow-md animate-pulse">
            <p className="font-semibold">{success}</p>
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
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">🏪 Transfer Batch</h2>
                <p className="text-gray-600 mt-2 text-sm">
                  Select a retailer to transfer <strong>{selectedBatch.species}</strong>
                </p>
              </div>

              <div className="max-h-60 overflow-y-auto mb-6 space-y-2">
                {retailers.length > 0 ? (
                  retailers.map(retailer => (
                    <div
                      key={retailer._id}
                      onClick={() => setNextRetailer(retailer)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all transform hover:scale-102 ${nextRetailer?._id === retailer._id
                          ? 'bg-green-50 border-green-500 shadow-md'
                          : 'border-gray-200 bg-white hover:border-green-400 hover:bg-gray-50'
                        }`}
                    >
                      <p className="font-bold text-gray-800">{retailer.name}</p>
                      <p className="text-sm text-gray-600">{retailer.organizationName || 'Independent Retailer'}</p>
                      {nextRetailer?._id === retailer._id && (
                        <p className="text-green-600 text-sm font-bold mt-1">✓ Selected</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-center py-4">No other retailers available</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedBatch(null);
                    setActionType(null);
                    setNextRetailer(null);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-all"
                >
                  ✕ Cancel
                </button>
                <button
                  onClick={confirmTransferToRetailer}
                  disabled={!nextRetailer}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  📷 Capture & Transfer
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Batches List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📦 Inventory</h2>
              <span className="bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full text-sm">
                {batches.length}
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin">
                  <div className="rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
                </div>
              </div>
            ) : batches.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
                <p className="text-gray-600 text-lg">📭 No batches in inventory yet.</p>
                <p className="text-gray-500 text-sm mt-2">Batches from distributors will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {batches.map((batch) => (
                  <div
                    key={batch.batchId}
                    className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all transform hover:scale-105 hover:shadow-xl cursor-pointer border-l-4 ${selectedBatch?.batchId === batch.batchId
                        ? 'border-purple-600 ring-2 ring-purple-400'
                        : 'border-transparent hover:border-purple-300'
                      }`}
                    onClick={() => setSelectedBatch(batch)}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{getStatusIcon(batch.currentStatus)}</span>
                            <h3 className="font-bold text-xl text-gray-800">🌿 {batch.species}</h3>
                          </div>
                          <p className="text-sm text-gray-500 font-mono mb-2">Batch ID: {batch.batchId}</p>
                          <p className="text-sm text-gray-600">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(batch.currentStatus)}`}>
                              {formatStatus(batch.currentStatus)}
                            </span>
                          </p>

                          {batch.pendingOwner && batch.pendingOwner._id === userInfo._id && (
                            <div className="mt-4">
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
                                    setSuccess('✓ Successfully verified OTP and claimed batch!');
                                  } catch (err) {
                                    setError('Failed to claim batch: Invalid OTP');
                                  }
                                }}
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2 px-4 rounded-lg text-sm w-full font-bold transition-all shadow-md"
                              >
                                ✓ Accept Transfer (OTP)
                              </button>
                            </div>
                          )}
                        </div>
                        <Link
                          to={`/batch/${batch.batchId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-purple-600 hover:text-purple-800 text-lg font-bold ml-4"
                        >
                          👁️
                        </Link>
                      </div>

                      <div className="mt-4 space-y-2">
                        {batch.currentStatus === 'IN_TRANSIT_TO_RETAILER' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReceiveBatch(batch);
                            }}
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2 px-4 rounded-lg font-bold transition-all shadow-md transform hover:scale-105"
                          >
                            📸 Receive & Geotag
                          </button>
                        )}

                        {batch.currentStatus === 'IN_RETAIL' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTransferToRetailer(batch);
                              }}
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 px-4 rounded-lg font-bold transition-all shadow-md transform hover:scale-105 mb-2"
                            >
                              🚚 Transfer to Retailer
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBatch(batch);
                              }}
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-4 rounded-lg font-bold transition-all shadow-md transform hover:scale-105"
                            >
                              💳 Record Sale
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
              <div className="bg-white rounded-xl shadow-xl p-8 sticky top-20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    💳 Record Sale
                  </h2>
                  <span className="text-sm font-semibold text-gray-500">Customer Details</span>
                </div>
                <p className="text-gray-600 mb-6 text-sm bg-purple-50 px-4 py-2 rounded-lg border-l-4 border-purple-400">
                  Batch: <span className="font-mono font-bold">{selectedBatch.batchId}</span> - {selectedBatch.species}
                </p>

                <form onSubmit={handleSubmitSale}>
                  <div className="space-y-5 bg-gray-50 p-6 rounded-lg mb-6">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">👤 Customer Name</label>
                      <input
                        type="text"
                        id="customerName"
                        name="customerName"
                        value={saleData.customerName}
                        onChange={handleChange}
                        placeholder="Full name of customer"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">📧 Customer Email</label>
                      <input
                        type="email"
                        id="customerEmail"
                        name="customerEmail"
                        value={saleData.customerEmail}
                        onChange={handleChange}
                        placeholder="customer@example.com"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">💰 Sale Price</label>
                      <input
                        type="text"
                        id="price"
                        name="price"
                        value={saleData.price}
                        onChange={handleChange}
                        placeholder="e.g., 299.99"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">📝 Notes</label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={saleData.notes}
                        onChange={handleChange}
                        placeholder="Any special notes about the sale..."
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all h-20 resize-none"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
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
                        setError('');
                        setSuccess('');
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-md"
                    >
                      ✕ Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={submitting}
                    >
                      {submitting ? '⏳ Processing...' : '✓ Record Sale'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-xl p-12 text-center border-2 border-dashed border-gray-300 sticky top-20">
                <p className="text-gray-600 text-xl mb-2">👈</p>
                <p className="text-gray-600 text-lg">Select a batch from inventory to record a sale.</p>
                <p className="text-gray-500 text-sm mt-2">Click on any batch to begin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetailerPanel;