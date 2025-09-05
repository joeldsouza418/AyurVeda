import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

// Pages
import FarmerUpload from './pages/FarmerUpload'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BatchDetail from './pages/BatchDetail'
import DistributorPanel from './pages/DistributorPanel'
import LabPanel from './pages/LabPanel'
import RetailerPanel from './pages/RetailerPanel'
import CreateBatch from './pages/CreateBatch'
import Consumer from './pages/Consumer'
import Journey from './pages/Journey'
import LandingPage from './pages/LandingPage'
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/farmer/upload" element={<FarmerUpload />} />
        <Route path="/farmer/create" element={<CreateBatch />} />
        <Route path="/batch/:batchId" element={<BatchDetail />} />
        <Route path="/distributor" element={<DistributorPanel />} />
        <Route path="/lab" element={<LabPanel />} />
        <Route path="/retailer" element={<RetailerPanel />} />
        <Route path="/consumer" element={<Consumer />} />
        <Route path="/scan" element={<Consumer />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  )
}

export default App
