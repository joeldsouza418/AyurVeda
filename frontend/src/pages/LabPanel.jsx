import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const LabPanel = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [testResults, setTestResults] = useState({
    purity: '',
    activeCompounds: '',
    contaminants: '',
    notes: ''
  });
  const [testImage, setTestImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Retailer selection states
  const [retailers, setRetailers] = useState([]);
  const [loadingRetailers, setLoadingRetailers] = useState(false);
  const [showRetailerModal, setShowRetailerModal] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [successBatch, setSuccessBatch] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and is a lab
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!storedUserInfo) {
      navigate('/login');
      return;
    } else if (storedUserInfo.role !== 'LAB') {
      navigate('/dashboard');
      return;
    }
    setUserInfo(storedUserInfo);

    // Fetch batches owned by the lab
    const fetchBatches = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${storedUserInfo.token}`,
          },
        };

        const response = await axios.get('/api/batches/my/owned', config);
        setBatches(response.data.data);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to fetch batches');
      } finally {
        setLoading(false);
      }
    };

    // Fetch retailers
    const fetchRetailers = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${storedUserInfo.token}`,
          },
        };
        const response = await axios.get('/api/users/retailers', config);
        setRetailers(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch retailers:', error);
      }
    };

    fetchBatches();
    fetchRetailers();
  }, [navigate]);

  const handleChange = (e) => {
    setTestResults({ ...testResults, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTestImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitTestResults = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();

      // Add test results as metadata
      const metadata = {
        purity: testResults.purity,
        activeCompounds: testResults.activeCompounds,
        contaminants: testResults.contaminants,
        notes: testResults.notes
      };

      formData.append('metadata', JSON.stringify(metadata));
      formData.append('stage', 'LAB_TEST');
      formData.append('newStatus', 'IN_TRANSIT_TO_RETAILER');

      // Use batch's location coordinates or default
      const coordinates = selectedBatch.collectionDetails?.location?.coordinates || [0, 0];
      formData.append('coordinates', JSON.stringify(coordinates));

      if (testImage) {
        formData.append('image', testImage);
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

      // Show retailer selection modal
      setSuccessBatch(selectedBatch);
      setShowRetailerModal(true);
      setSuccess(`✓ Test results submitted successfully!`);

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit test results');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferToRetailer = async () => {
    if (!selectedRetailer) {
      setError('Please select a retailer');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      // Transfer batch to selected retailer
      await axios.put(
        `/api/batches/${successBatch._id}/transfer`,
        { recipientId: selectedRetailer._id },
        config
      );

      // Refresh batches
      const refreshResponse = await axios.get('/api/batches/my/owned', config);
      setBatches(refreshResponse.data.data);

      // Reset form and close modal
      setShowRetailerModal(false);
      setSelectedBatch(null);
      setSelectedRetailer(null);
      setSuccessBatch(null);
      setTestResults({
        purity: '',
        activeCompounds: '',
        contaminants: '',
        notes: ''
      });
      setTestImage(null);
      setImagePreview('');
      setSuccess(`✓ Batch successfully transferred to ${selectedRetailer.organizationName || selectedRetailer.name}`);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to transfer batch');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar userInfo={userInfo} />

      {/* Page Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-10">
          <div className="text-5xl mb-3">🧪</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Laboratory Panel
          </h1>
          <p className="text-gray-600 mt-3 text-lg">
            Test and certify herb batches with precision
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
            <p>{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Batches List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📦 Batches for Testing</h2>
              <span className="bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full text-sm">
                {batches.length}
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin">
                  <div className="rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
                </div>
              </div>
            ) : batches.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
                <p className="text-gray-600 text-lg">📭 No batches assigned for testing yet.</p>
                <p className="text-gray-500 text-sm mt-2">Batches will appear here once distributor assigns them.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {batches.map((batch) => (
                  <div
                    key={batch.batchId}
                    className={`bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all transform hover:scale-105 hover:shadow-xl ${
                      selectedBatch?.batchId === batch.batchId
                        ? 'ring-2 ring-green-500 border-l-4 border-green-600'
                        : 'border-l-4 border-transparent hover:border-green-400'
                    }`}
                    onClick={() => setSelectedBatch(batch)}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-gray-800 mb-1">🌿 {batch.species}</h3>
                          <p className="text-sm text-gray-500 font-mono">Batch ID: {batch.batchId}</p>
                          <p className="text-sm text-gray-600 mt-3">
                            Status:{' '}
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
                                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm w-full font-bold transition-all shadow-md"
                              >
                                ✓ Accept Transfer (OTP)
                              </button>
                            </div>
                          )}
                        </div>
                        <Link
                          to={`/batch/${batch.batchId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-green-600 hover:text-green-800 text-lg font-bold ml-4"
                        >
                          👁️
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Results Form */}
          <div>
            {selectedBatch ? (
              <div className="bg-white rounded-xl shadow-xl p-8 sticky top-20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    🧬 Test Results
                  </h2>
                  <span className="text-sm font-semibold text-gray-500">Step 1 of 2</span>
                </div>
                <p className="text-gray-600 mb-6 text-sm bg-blue-50 px-4 py-2 rounded-lg border-l-4 border-blue-400">
                  Batch: <span className="font-mono font-bold">{selectedBatch.batchId}</span>
                </p>

                <form onSubmit={handleSubmitTestResults}>
                  {/* Form Section Background */}
                  <div className="space-y-5 bg-gray-50 p-6 rounded-lg mb-6">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">🔬 Purity Level (%)</label>
                      <input
                        type="text"
                        id="purity"
                        name="purity"
                        value={testResults.purity}
                        onChange={handleChange}
                        placeholder="e.g., 95.5"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">⚗️ Active Compounds</label>
                      <input
                        type="text"
                        id="activeCompounds"
                        name="activeCompounds"
                        value={testResults.activeCompounds}
                        onChange={handleChange}
                        placeholder="e.g., Alkaloids, Glycosides"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">⚠️ Contaminants (if any)</label>
                      <input
                        type="text"
                        id="contaminants"
                        name="contaminants"
                        value={testResults.contaminants}
                        onChange={handleChange}
                        placeholder="e.g., None detected or specify contaminants"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">📝 Additional Notes</label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={testResults.notes}
                        onChange={handleChange}
                        placeholder="Add any additional observations or recommendations..."
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all h-20 resize-none"
                      />
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div className="mb-6 bg-gray-50 p-6 rounded-lg">
                    <label className="block text-gray-700 text-sm font-bold mb-3">📸 Test Image (Optional)</label>
                    <div className="flex flex-col items-center">
                      {imagePreview ? (
                        <div className="mb-4 w-full">
                          <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg shadow-md" />
                          <button
                            type="button"
                            onClick={() => {
                              setTestImage(null);
                              setImagePreview('');
                            }}
                            className="mt-2 text-red-600 hover:text-red-800 text-sm font-semibold"
                          >
                            ✕ Remove Image
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
                          <span className="text-gray-400 text-lg">📷 No image selected</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="test-image-upload"
                      />
                      <label
                        htmlFor="test-image-upload"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md text-center cursor-pointer w-full font-bold transition-all transform hover:scale-105"
                      >
                        📤 Choose Image
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBatch(null);
                        setTestResults({
                          purity: '',
                          activeCompounds: '',
                          contaminants: '',
                          notes: ''
                        });
                        setTestImage(null);
                        setImagePreview('');
                        setError('');
                        setSuccess('');
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-md"
                    >
                      ✕ Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={submitting}
                    >
                      {submitting ? '⏳ Processing...' : '✓ Submit Test Results'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-xl p-12 text-center border-2 border-dashed border-gray-300 sticky top-20">
                <p className="text-gray-600 text-xl mb-2">👈</p>
                <p className="text-gray-600 text-lg">Select a batch from the list to enter test results.</p>
                <p className="text-gray-500 text-sm mt-2">Click on any batch card to begin testing</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Retailer Selection Modal */}
      {showRetailerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 transform transition-all">
            <div className="text-center mb-6">
              <h3 className="text-3xl mb-2">🏪</h3>
              <h2 className="text-2xl font-bold text-gray-800">Select Retailer</h2>
              <p className="text-gray-600 mt-2">Choose which retailer to send this batch to</p>
            </div>

            <div className="mb-6 max-h-80 overflow-y-auto space-y-3">
              {loadingRetailers ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : retailers.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <p>No retailers available</p>
                </div>
              ) : (
                retailers.map((retailer) => (
                  <div
                    key={retailer._id}
                    onClick={() => setSelectedRetailer(retailer)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-102 ${
                      selectedRetailer?._id === retailer._id
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-green-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{retailer.name}</p>
                        <p className="text-sm text-gray-600">{retailer.organizationName || 'Retail Store'}</p>
                      </div>
                      {selectedRetailer?._id === retailer._id && (
                        <span className="text-green-600 text-xl font-bold">✓</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {error && selectedRetailer === null && (
              <div className="mb-4 text-red-600 text-sm text-center">
                Please select a retailer
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRetailerModal(false);
                  setSelectedRetailer(null);
                  setSuccessBatch(null);
                  setError('');
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all"
              >
                ✕ Cancel
              </button>
              <button
                onClick={handleTransferToRetailer}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedRetailer || submitting}
              >
                {submitting ? '⏳ Transferring...' : '✓ Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabPanel;