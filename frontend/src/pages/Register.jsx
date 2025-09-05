import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import Camera from '../components/Camera';
import Navbar from '../components/Navbar';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'FARMER',
    organizationName: '',
    profilePhoto: ''
  });
  
  const [showCamera, setShowCamera] = useState(false);
  
  // Clear any previous errors when component mounts
  useEffect(() => {
    setError('');
  }, []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleCameraCapture = (photoData) => {
    setFormData({ ...formData, profilePhoto: photoData });
    setShowCamera(false);
  };
  
  const handleOpenCamera = () => {
    setShowCamera(true);
  };
  
  const handleCloseCamera = () => {
    setShowCamera(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      setError('Passwords do not match');
      return;
    }
    
    // Validate password length
    if (formData.password.length < 6) {
      showError('Password must be at least 6 characters long');
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...dataToSend } = formData;
      
      console.log('Sending registration data:', dataToSend);
      
      const response = await axios.post('/api/users/register', dataToSend);
      console.log('Registration response:', response.data);
      
      if (response.data && response.data.data) {
        localStorage.setItem('userInfo', JSON.stringify(response.data.data));
        
        showSuccess('Registration successful!');
        
        // Redirect to appropriate page based on role
        switch(formData.role) {
          case 'FARMER':
            navigate('/farmer/upload');
            break;
          case 'DISTRIBUTOR':
            navigate('/distributor');
            break;
          case 'LAB':
            navigate('/lab');
            break;
          case 'RETAILER':
            navigate('/retailer');
            break;
          default:
            navigate('/dashboard');
        }
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Check if the error is from the server and has a specific message format
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data?.status === 'error') {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      showError(errorMessage);
      
      // Log detailed error information for debugging
      console.log('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50">
      <Navbar userInfo={null} />
      <div className="flex items-center justify-center p-4 pt-16">
      {showCamera && (
        <Camera onCapture={handleCameraCapture} onClose={handleCloseCamera} />
      )}
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-xl">
            🍃
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-green-700 mb-6">Register for AyurTrace</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="FARMER">Farmer</option>
              <option value="DISTRIBUTOR">Distributor</option>
              <option value="LAB">Laboratory</option>
              <option value="RETAILER">Retailer</option>
              <option value="END_CONSUMER">Consumer</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="organizationName">
              Organization Name (Optional)
            </label>
            <input
              type="text"
              id="organizationName"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Profile Photo (Optional)
            </label>
            <div className="flex items-center space-x-4">
              {formData.profilePhoto ? (
                <div className="relative">
                  <img 
                    src={formData.profilePhoto} 
                    alt="Profile Preview" 
                    className="w-24 h-24 object-cover rounded-full border-2 border-green-500" 
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, profilePhoto: '' })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenCamera}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Take Photo
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-800">
              Login
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Register;