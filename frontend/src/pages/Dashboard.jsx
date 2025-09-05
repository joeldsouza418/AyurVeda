import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!storedUserInfo) {
      navigate('/login');
      return;
    }
    setUserInfo(storedUserInfo);

    // Fetch batches based on user role
    const fetchBatches = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${storedUserInfo.token}`,
          },
        };

        let endpoint = '/api/batches';
        
        // Different endpoints based on user role
        if (storedUserInfo.role === 'FARMER') {
          endpoint = '/api/batches/my/farmed';
        } else if (storedUserInfo.role !== 'ADMIN') {
          endpoint = '/api/batches/my/owned';
        }

        const response = await axios.get(endpoint, config);
        if (storedUserInfo.role === 'FARMER' && response.data.data.batches) {
          setBatches(response.data.data.batches);
        } else {
          setBatches(response.data.data);
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to fetch batches');
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const getRoleSpecificLink = () => {
    if (!userInfo) return '/';
    
    switch(userInfo.role) {
      case 'FARMER':
        return '/farmer/upload';
      case 'DISTRIBUTOR':
        return '/distributor';
      case 'LAB':
        return '/lab';
      case 'RETAILER':
        return '/retailer';
      default:
        return '/dashboard';
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
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome, {userInfo?.name || 'User'} ({userInfo?.role || 'User'})
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Your Herb Batches</h2>
              {userInfo?.role === 'FARMER' && (
                <Link 
                  to="/farmer/upload" 
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                >
                  + New Batch
                </Link>
              )}
            </div>

            {batches.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-600">No batches found.</p>
                {userInfo?.role === 'FARMER' && (
                  <Link 
                    to="/farmer/upload" 
                    className="inline-block mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                  >
                    Create Your First Batch
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {batches.map((batch) => (
                  <Link 
                    to={`/batch/${batch.batchId}`} 
                    key={batch.batchId}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="h-48 bg-gray-200 relative">
                      {batch.collectionDetails?.imageURL && (
                        <img 
                          src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${batch.collectionDetails.imageURL}`} 
                          alt={batch.species} 
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(batch.currentStatus)}`}>
                          {formatStatus(batch.currentStatus)}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{batch.species}</h3>
                          <p className="text-sm text-gray-600">Batch ID: {batch.batchId.substring(0, 8)}...</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(batch.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          {batch.provenanceChain?.length || 0} events
                        </div>
                        <div className="text-green-600 text-sm font-medium">
                          View Details →
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;