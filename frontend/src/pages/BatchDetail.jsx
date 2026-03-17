import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import { showError } from '../utils/toast';
import Navbar from '../components/Navbar';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix generic leaflet icon issue with webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const createCustomIcon = (emoji) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: white; border: 2px solid #16a34a; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">${emoji}</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const truckIcon = createCustomIcon('🚚');
const personIcon = createCustomIcon('👤');
const labIcon = createCustomIcon('🧪');
const storeIcon = createCustomIcon('🏬');

const BatchDetail = () => {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [liveGps, setLiveGps] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    setUserInfo(storedUserInfo); // Set to null if not logged in

    // Fetch batch details
    const fetchBatchDetails = async () => {
      try {
        const config = storedUserInfo ? {
          headers: {
            Authorization: `Bearer ${storedUserInfo.token}`,
          },
        } : {};

        const response = await axiosInstance.get(`/api/batches/${batchId}`, config);
        setBatch(response.data.data);
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to fetch batch details';
        setError(errorMsg);
        showError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchDetails();
  }, [batchId]); // Removed navigate from dependency array as it's stable

  const fetchLiveGps = async () => {
    if (!batch?.gpsTracking?.isActive) {
      setLiveGps(null);
      return;
    }

    try {
      const response = await axiosInstance.get(`/api/gps/${batchId}`);
      const data = response.data?.data;

      if (data?.location) {
        setLiveGps({
          coordinates: [data.location.longitude, data.location.latitude],
          lastUpdated: data.lastUpdated,
          history: data.history || [],
        });
        setGpsError('');
      } else {
        setGpsError('Live GPS data is unavailable for this batch.');
      }
    } catch (err) {
      setGpsError(err.response?.data?.message || 'Unable to load live GPS location.');
    }
  };

  useEffect(() => {
    if (!batch?.gpsTracking?.isActive) {
      return;
    }

    fetchLiveGps();
    const intervalId = setInterval(fetchLiveGps, 15000); // refresh every 15 seconds
    return () => clearInterval(intervalId);
  }, [batch, batchId]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const getRoleSpecificLink = () => {
    if (!userInfo) return '/';

    switch (userInfo.role) {
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
    if (!status) return '';
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  const routeOrigin = batch?.collectionDetails?.location ? {
    latitude: batch.collectionDetails.location.coordinates[1],
    longitude: batch.collectionDetails.location.coordinates[0]
  } : null;

  const currentLiveLocation = liveGps?.coordinates ? {
    latitude: liveGps.coordinates[1],
    longitude: liveGps.coordinates[0]
  } : batch?.gpsTracking?.currentLocation?.coordinates ? {
    latitude: batch.gpsTracking.currentLocation.coordinates[1],
    longitude: batch.gpsTracking.currentLocation.coordinates[0]
  } : null;

  const historyPoints = liveGps?.history?.length ? liveGps.history : batch?.gpsTracking?.history?.map(point => ({
    latitude: point.coordinates[1],
    longitude: point.coordinates[0]
  })) || [];

  function getDirectionUrl(origin, destination, history) {
    if (!origin || !destination) return null;

    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = `${destination.latitude},${destination.longitude}`;

    let waypoints = '';
    if (history && history.length > 1) {
      const middlePoints = history.slice(1, -1);
      if (middlePoints.length > 0) {
        waypoints = middlePoints
          .map(p => `${p.latitude},${p.longitude}`)
          .join('%7C'); // encoded pipe
      }
    }

    const base = 'https://www.google.com/maps/dir/?api=1';
    const parts = [`origin=${originStr}`, `destination=${destStr}`];
    if (waypoints) parts.push(`waypoints=${waypoints}`);
    return `${base}&${parts.join('&')}`;
  }

  const routeUrl = getDirectionUrl(routeOrigin, currentLiveLocation, historyPoints);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };


  const handleDownloadQR = async () => {
    if (!batch?.qrCodeURL) return;

    try {
      const imageUrl = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${batch.qrCodeURL}`;
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `qrcode-${batch.batchId}.png`);
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('QR Code download failed:', error);
      showError('Failed to download QR code.');
    }
  };

  return (
    <div className="min-h-screen bg-green-50">
      <Navbar userInfo={userInfo} />

      {/* Page Content */}
      <div className="container mx-auto p-8">
        {userInfo && (
          <div className="mb-6">
            <Link to="/dashboard" className="text-green-600 hover:text-green-800">
              ← Back to Dashboard
            </Link>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : batch ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Batch Header */}
            <div className="relative">
              {batch.collectionDetails?.imageURL && (
                <div className="h-64 bg-gray-200">
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${batch.collectionDetails.imageURL}`}
                    alt={batch.species}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClass(batch.currentStatus)}`}>
                  {formatStatus(batch.currentStatus)}
                </span>
              </div>
            </div>

            {/* Batch Info */}
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{batch.species}</h1>
                  <p className="text-gray-600">Batch ID: {batch.batchId}</p>
                </div>
                <div>
                  {batch.qrCodeURL && (
                    <div
                      onClick={handleDownloadQR}
                      className="block cursor-pointer group"
                      title="Download QR Code"
                    >
                      <img
                        src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${batch.qrCodeURL}`}
                        alt="QR Code"
                        className="w-24 h-24"
                      />
                      <span className="text-xs text-center block mt-1 text-green-600 group-hover:underline">Download QR</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Collection Details */}
                {batch.collectionDetails && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3 flex items-center">
                      <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white mr-2">🌿</span>
                      Collection Details
                    </h2>
                    <div className="space-y-2">
                      <p><span className="font-medium">Date:</span> {formatDate(batch.collectionDetails.timestamp)}</p>
                      {batch.collectionDetails.location?.coordinates && (
                        <div>
                          <p>
                            <span className="font-medium">Location:</span> {batch.collectionDetails.location.coordinates[1].toFixed(6)}, {batch.collectionDetails.location.coordinates[0].toFixed(6)}
                          </p>
                          <div className="mt-2 rounded-lg overflow-hidden shadow-md" style={{ height: '200px' }}>
                            <MapContainer 
                              center={[batch.collectionDetails.location.coordinates[1], batch.collectionDetails.location.coordinates[0]]} 
                              zoom={13} 
                              scrollWheelZoom={false} 
                              style={{ height: '100%', width: '100%' }}
                            >
                              <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                              />
                              <Marker 
                                position={[batch.collectionDetails.location.coordinates[1], batch.collectionDetails.location.coordinates[0]]}
                                icon={personIcon}
                              >
                                <Popup>Farm Location</Popup>
                              </Marker>
                            </MapContainer>
                          </div>
                        </div>
                      )}
                      <p><span className="font-medium">Farmer:</span> {batch.farmer?.name || 'Unknown'}</p>
                      <p><span className="font-medium">Organization:</span> {batch.farmer?.organizationName || 'Independent'}</p>
                    </div>
                  </div>
                )}

                {/* Current Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white mr-2">📊</span>
                    Current Status
                  </h2>
                  <div className="space-y-2">
                    <p><span className="font-medium">Status:</span>
                      <span className={`ml-2 inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(batch.currentStatus)}`}>
                        {formatStatus(batch.currentStatus)}
                      </span>
                    </p>
                    <p><span className="font-medium">Current Owner:</span> {batch.currentOwner?.name || 'Unknown'}</p>
                    <p><span className="font-medium">Owner Organization:</span> {batch.currentOwner?.organizationName || 'Independent'}</p>
                    <p><span className="font-medium">Last Updated:</span> {formatDate(batch.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* GPS Tracking */}
              {batch.gpsTracking?.isActive && (
                <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white mr-2">🛰️</span>
                    Live GPS Tracking
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="h-4 w-4 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-green-600 font-medium">Live Tracking Active</span>
                    </div>
                    {gpsError && (
                      <div className="bg-red-100 border border-red-300 text-red-700 p-2 rounded">
                        {gpsError}
                      </div>
                    )}

                    {(batch.gpsTracking.currentLocation?.coordinates || liveGps) ? (
                      <>
                        <p>
                          <span className="font-medium">Current Location:</span>{' '}
                          {((liveGps?.coordinates ?? batch.gpsTracking.currentLocation.coordinates)[1]).toFixed(6)},
                          {((liveGps?.coordinates ?? batch.gpsTracking.currentLocation.coordinates)[0]).toFixed(6)}
                        </p>
                        <p>
                          <span className="font-medium">Last Updated:</span>{' '}
                          {formatDate(liveGps?.lastUpdated ?? batch.gpsTracking.lastUpdated)}
                        </p>

                        <div className="mt-2 rounded-lg overflow-hidden shadow-md" style={{ height: '260px' }}>
                          <MapContainer 
                            center={[(liveGps?.coordinates ?? batch.gpsTracking.currentLocation.coordinates)[1], (liveGps?.coordinates ?? batch.gpsTracking.currentLocation.coordinates)[0]]} 
                            zoom={13} 
                            scrollWheelZoom={false} 
                            style={{ height: '100%', width: '100%' }}
                          >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            />
                            <Marker 
                                position={[(liveGps?.coordinates ?? batch.gpsTracking.currentLocation.coordinates)[1], (liveGps?.coordinates ?? batch.gpsTracking.currentLocation.coordinates)[0]]}
                                icon={truckIcon}
                            >
                                <Popup>Current Location</Popup>
                            </Marker>
                          </MapContainer>
                        </div>

                        {historyPoints.length > 0 || (routeOrigin && currentLiveLocation) ? (
                          <div className="mt-4 rounded-lg overflow-hidden shadow-md" style={{ height: '300px' }}>
                            <h3 className="font-medium mb-2 px-2 pt-2">Route Path</h3>
                            <div style={{ height: 'calc(100% - 36px)' }}>
                              <MapContainer
                                bounds={
                                  historyPoints.length > 1 
                                    ? historyPoints.map(p => [p.latitude, p.longitude]) 
                                    : [[routeOrigin?.latitude || 0, routeOrigin?.longitude || 0], [currentLiveLocation?.latitude || 0, currentLiveLocation?.longitude || 0]]
                                }
                                zoom={10}
                                scrollWheelZoom={false}
                                style={{ height: '100%', width: '100%' }}
                              >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                />
                                {routeOrigin && (
                                  <Marker position={[routeOrigin.latitude, routeOrigin.longitude]} icon={personIcon}>
                                    <Popup>Origin (Farm)</Popup>
                                  </Marker>
                                )}
                                {currentLiveLocation && (
                                  <Marker position={[currentLiveLocation.latitude, currentLiveLocation.longitude]} icon={truckIcon}>
                                    <Popup>Current Location</Popup>
                                  </Marker>
                                )}
                                <Polyline 
                                  positions={
                                    [
                                      ...(routeOrigin ? [[routeOrigin.latitude, routeOrigin.longitude]] : []),
                                      ...historyPoints.map(p => [p.latitude, p.longitude]),
                                      ...(currentLiveLocation ? [[currentLiveLocation.latitude, currentLiveLocation.longitude]] : [])
                                    ]
                                  } 
                                  color="#16a34a" 
                                  weight={4} 
                                  dashArray="10, 10" 
                                />
                              </MapContainer>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-600">Origin or destination data missing for route display.</p>
                        )}

                        {historyPoints.length > 0 && (
                          <div className="mt-4 bg-white p-3 rounded border border-gray-200">
                            <h4 className="font-semibold">Tracked route points</h4>
                            <ol className="list-decimal list-inside text-sm mt-2">
                              {historyPoints.map((p, idx) => (
                                <li key={idx}>{p.latitude.toFixed(6)}, {p.longitude.toFixed(6)}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-600">Waiting for initial GPS coordinate data...</p>
                    )}
                  </div>
                </div>
              )}

              {/* Provenance Chain */}
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white mr-2">🔄</span>
                  Herb Journey & Provenance Chain
                </h2>

                {batch.provenanceChain && batch.provenanceChain.length > 0 ? (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-green-200"></div>

                    <div className="space-y-8 pl-12">
                      {/* Initial harvest event */}
                      {batch.collectionDetails && (
                        <div className="relative">
                          <div className="absolute -left-12 mt-1.5 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                            🌿
                          </div>
                          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-gray-800">Harvested</h3>
                                <p className="text-sm text-gray-600">{formatDate(batch.collectionDetails.timestamp)}</p>
                              </div>
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                First Stage
                              </span>
                            </div>
                            <div className="mt-2 flex items-center text-gray-700">
                              <span className="font-medium mr-2">By:</span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                {batch.farmer?.name || 'Unknown'} ({batch.farmer?.organizationName || 'Independent'})
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Provenance events */}
                      {batch.provenanceChain.map((event, index) => {
                        const stageIcons = { 'DISTRIBUTION': '🚚', 'LAB_TEST': '🧪', 'RETAIL_STOCK': '🏪' };
                        const stageColors = { 'DISTRIBUTION': 'bg-blue-500', 'LAB_TEST': 'bg-yellow-500', 'RETAIL_STOCK': 'bg-purple-500' };
                        const stageBgColors = { 'DISTRIBUTION': 'bg-blue-50 border-blue-100', 'LAB_TEST': 'bg-yellow-50 border-yellow-100', 'RETAIL_STOCK': 'bg-purple-50 border-purple-100' };
                        const stageNames = { 'DISTRIBUTION': 'Transport', 'LAB_TEST': 'Laboratory Testing', 'RETAIL_STOCK': 'Retail Handling' };

                        return (
                          <div className="relative" key={index}>
                            <div className={`absolute -left-12 mt-1.5 w-8 h-8 ${stageColors[event.stage] || 'bg-gray-500'} rounded-full flex items-center justify-center text-white`}>
                              {stageIcons[event.stage] || '📦'}
                            </div>
                            <div className={`p-4 rounded-lg shadow-sm border ${stageBgColors[event.stage] || 'bg-white border-gray-100'}`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-gray-800">
                                    {stageNames[event.stage] || formatStatus(event.stage)}
                                  </h3>
                                  <p className="text-sm text-gray-600">{formatDate(event.timestamp)}</p>
                                </div>
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                  Stage {index + 2}
                                </span>
                              </div>

                              <div className="mt-2 flex items-center text-gray-700">
                                <span className="font-medium mr-2">Handled by:</span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                  {event.actor?.name || 'Unknown'} ({event.actor?.organizationName || 'Independent'}) - {event.actor?.role || 'Unknown Role'}
                                </span>
                              </div>

                              <div className="mt-3">
                                {event.location?.coordinates && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Location:</span> {event.location.coordinates[1].toFixed(6)}, {event.location.coordinates[0].toFixed(6)}
                                  </p>
                                )}

                                {event.metadata && Object.keys(event.metadata).length > 0 && (
                                  <div className="mt-3 bg-white p-3 rounded border border-gray-100">
                                    <h4 className="font-medium text-sm mb-2">Additional Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {Object.entries(event.metadata).map(([key, value]) => (
                                        <>
                                          {String(value)}
                                        </>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                    <p className="text-gray-600">No journey events recorded yet. This batch is currently with the farmer.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {userInfo && batch.currentOwner && userInfo._id === batch.currentOwner._id && (
                <div className="mt-8 border-t pt-6">
                  <h2 className="text-lg font-semibold mb-4">Actions</h2>
                  <div className="flex flex-wrap gap-4">
                    {userInfo.role === 'DISTRIBUTOR' &&
                      (batch.currentStatus === 'HARVESTED' || batch.currentStatus === 'UNDER_TESTING') && (
                        <Link to={`/distributor/transport/${batch.batchId}`} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">
                          Start Transport
                        </Link>
                      )}

                    {userInfo.role === 'LAB' && batch.currentStatus === 'IN_TRANSIT_TO_LAB' && (
                      <Link to={`/lab/test/${batch.batchId}`} className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded">
                        Start Testing
                      </Link>
                    )}

                    {userInfo.role === 'RETAILER' && batch.currentStatus === 'IN_TRANSIT_TO_RETAILER' && (
                      <Link to={`/retailer/receive/${batch.batchId}`} className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded">
                        Receive Shipment
                      </Link>
                    )}

                    {userInfo.role === 'RETAILER' && batch.currentStatus === 'IN_RETAIL' && (
                      <Link to={`/retailer/sell/${batch.batchId}`} className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">
                        Mark as Sold
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {!userInfo && (
                <div className="mt-8 border-t pt-6 text-center">
                  <h2 className="text-lg font-semibold mb-4">Authenticated Herb Verification</h2>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-green-800">
                      This herb has been tracked through our secure blockchain-based supply chain system, with verification at each step of its journey from the farm to you.
                    </p>
                    <div className="mt-4">
                      <p className="font-medium text-gray-800">To become part of our supply chain network:</p>
                      <div className="flex justify-center gap-4 mt-2">
                        <Link to="/register" className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">
                          Register
                        </Link>
                        <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">
                          Login
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">Batch not found.</p>
            {userInfo ? (
              <Link
                to="/dashboard"
                className="inline-block mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              >
                Return to Dashboard
              </Link>
            ) : (
              <Link
                to="/"
                className="inline-block mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              >
                Return to Home
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchDetail;