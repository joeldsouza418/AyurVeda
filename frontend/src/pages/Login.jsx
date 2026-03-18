import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import Navbar from '../components/Navbar';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate email and password
    if (!formData.email || !formData.password) {
      const errorMsg = 'Please enter both email and password';
      setError(errorMsg);
      showError(errorMsg);
      return;
    }
    
    setLoading(true);

    try {
      console.log('Sending login data:', { email: formData.email });
      
      const response = await axios.post('/api/users/login', formData);
      console.log('Login response:', response.data);
      
      if (response.data && response.data.data) {
        localStorage.setItem('userInfo', JSON.stringify(response.data.data));
        
        showSuccess('Login successful!');
        
        // Redirect based on user role
        const { role } = response.data.data;
        switch(role) {
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
          case 'CUSTOMER':
            navigate('/consumer');
            break;
          case 'ADMIN':
            navigate('/dashboard');
            break;
          default:
            navigate('/consumer');
        }
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Check if the error is from the server and has a specific message format
      let errorMessage = 'Login failed. Please try again.';
      
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
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-xl">
            🍃
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-green-700 mb-6">Login to TraceX</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
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
          
          <div className="mb-6">
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
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-green-600 hover:text-green-800">
              Register
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Login;