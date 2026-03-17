import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const LabPanel = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

    fetchBatches();
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

      // Refresh batches
      const refreshResponse = await axios.get('/api/batches/my/owned', config);
      setBatches(refreshResponse.data.data);

      // Reset form
      setSelectedBatch(null);
      setTestResults({
        purity: '',
        activeCompounds: '',
        contaminants: '',
        notes: ''
      });
      setTestImage(null);
      setImagePreview('');

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit test results');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="min-h-screen bg-green-50">
      <Navbar userInfo={userInfo} />

      {/* Page Content */}
      <div className="container mx-auto p-8">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold text-green-700">
            Laboratory Panel
          </h1>
          <p className="text-gray-600 mt-2">
            Test and certify herb batches
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Batches List */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Batches for Testing</h2>
            
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : batches.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-600">No batches assigned for testing.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {batches.map((batch) => (
                  <div 
                    key={batch.batchId}
                    className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all ${selectedBatch?.batchId === batch.batchId ? 'ring-2 ring-green-500' : ''}`}
                    onClick={() => setSelectedBatch(batch)}
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
                          onClick={(e) => e.stopPropagation()}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          View Details
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
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Test Results for {selectedBatch.species}
                </h2>
                <p className="text-gray-600 mb-6">Batch ID: {selectedBatch.batchId}</p>

                <form onSubmit={handleSubmitTestResults}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="purity">
                      Purity Level (%)
                    </label>
                    <input
                      type="text"
                      id="purity"
                      name="purity"
                      value={testResults.purity}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="activeCompounds">
                      Active Compounds
                    </label>
                    <input
                      type="text"
                      id="activeCompounds"
                      name="activeCompounds"
                      value={testResults.activeCompounds}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contaminants">
                      Contaminants (if any)
                    </label>
                    <input
                      type="text"
                      id="contaminants"
                      name="contaminants"
                      value={testResults.contaminants}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
                      Additional Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={testResults.notes}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Test Image (Optional)
                    </label>
                    <div className="flex flex-col items-center">
                      {imagePreview ? (
                        <div className="mb-3">
                          <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                          <span className="text-gray-500">No image selected</span>
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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow text-center cursor-pointer w-full"
                      >
                        Upload Test Image
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
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
                      {submitting ? 'Submitting...' : 'Submit Test Results'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-600">Select a batch from the list to enter test results.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabPanel;