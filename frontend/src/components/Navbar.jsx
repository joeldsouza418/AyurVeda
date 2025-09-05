import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
const Navbar = ({ userInfo }) => {
  const navigate = useNavigate();

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
      case 'CUSTOMER':
        return '/consumer';
      default:
        return '/dashboard';
    }
  };

  return (
    <nav className="bg-green-200 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-11 h-11 bg-green-700 rounded-full flex items-center justify-center text-2xl text-white">
            🌿
          </div>
          <span className="text-2xl font-bold text-green-900">AyurTrace</span>
        </Link>
        <div className="flex items-center gap-6">
          {userInfo ? (
            <>
              <Link 
                to={getRoleSpecificLink()} 
                className="text-green-800 font-medium py-2 px-4 rounded-full hover:bg-green-300 hover:text-green-900 transition-all duration-300"
              >
                {userInfo.role} Portal
              </Link>
              <Link 
                to="/dashboard" 
                className="text-green-800 font-medium py-2 px-4 rounded-full hover:bg-green-300 hover:text-green-900 transition-all duration-300"
              >
                Dashboard
              </Link>
              <button 
                onClick={handleLogout} 
                className="bg-red-500 text-white font-bold py-2 px-4 rounded-full hover:bg-red-600 transform hover:scale-105 transition-all duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="text-green-800 font-medium py-2 px-4 rounded-full hover:bg-green-300 hover:text-green-900 transition-all duration-300"
              >
                Login
              </Link>
              <Link 
                to="/register"
                className="bg-green-600 text-white font-bold py-2 px-4 rounded-full hover:bg-green-700 transform hover:scale-105 transition-all duration-300"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;