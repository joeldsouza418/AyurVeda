import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const STAGES = [
  { key: 'farm', label: 'Farm', emoji: '🚜', color: 'from-green-500 to-green-600' },
  { key: 'collection', label: 'Collection', emoji: '🚚', color: 'from-blue-500 to-blue-600' },
  { key: 'testing', label: 'Testing', emoji: '🧪', color: 'from-purple-500 to-purple-600' },
  { key: 'distribution', label: 'Distribution', emoji: '📦', color: 'from-amber-500 to-amber-600' },
  { key: 'retail', label: 'Retail', emoji: '🏬', color: 'from-emerald-500 to-emerald-600' }
];

const SAMPLE_BATCHES = [
  {
    batchId: 'NEEM-2024-09-001',
    herb: { name: 'Neem', emoji: '🌿', imageUrl: 'https://images.unsplash.com/photo-1604977043075-0f55c1b436cf?q=80&w=800&auto=format&fit=crop' },
    currentStage: 'testing',
    stages: {
      farm: {
        farmerName: 'Ravi Kumar',
        gps: { lat: 26.9124, lng: 75.7873, label: 'Jaipur • arid plains' },
        harvestedAt: '2025-09-05T10:30:00Z',
        quantityKg: 150,
        tags: ['Organic Certified', 'Soil-Conscious']
      },
      collection: {
        collectorName: 'Asha Singh',
        location: 'Jaipur mandi • block 3',
        collectedAt: '2025-09-06T08:15:00Z',
        transportId: 'RJ14-T-9281',
        custodyStatus: 'Verified',
        approvedZone: true
      },
      testing: {
        labName: 'Ayur Labs',
        location: 'Ahmedabad, GJ',
        results: { moisturePercent: 9.4, pesticidePurityPercent: 99.2, dnaAuthenticityPercent: 97.8 },
        compliance: 'AYUSH/NMPB Passed',
        certificateRef: 'AYL-24-NEEM-001'
      },
      distribution: null,
      retail: null
    }
  },
  {
    batchId: 'BRAHMI-2025-01-010',
    herb: { name: 'Brahmi', emoji: '🧠', imageUrl: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=800&auto=format&fit=crop' },
    currentStage: 'distribution',
    stages: {
      farm: {
        farmerName: 'Meera Joshi',
        gps: { lat: 19.0760, lng: 72.8777, label: 'Mumbai • coastal humid' },
        harvestedAt: '2025-01-15T07:40:00Z',
        quantityKg: 120,
        tags: ['Organic Certified']
      },
      collection: {
        collectorName: 'Karan Patel',
        location: 'Navi Mumbai node 5',
        collectedAt: '2025-01-16T09:10:00Z',
        transportId: 'MH12-C-5542',
        custodyStatus: 'Verified',
        approvedZone: true
      },
      testing: {
        labName: 'HerbalVerify Labs',
        location: 'Thane, MH',
        results: { moisturePercent: 8.2, pesticidePurityPercent: 98.8, dnaAuthenticityPercent: 96.5 },
        compliance: 'AYUSH/NMPB Passed',
        certificateRef: 'HV-25-BRA-010'
      },
      distribution: {
        distributorName: 'GreenFlow Logistics',
        transitLocation: 'NH48 corridor',
        handoverDate: '2025-01-18T11:25:00Z',
        vehicleInfo: 'MH12 XY 1010 • insulated',
        movementVerified: true
      },
      retail: null
    }
  },
  {
    batchId: 'TURM-2024-12-022',
    herb: { name: 'Turmeric', emoji: '🟡', imageUrl: 'https://images.unsplash.com/photo-1505577058444-a3dab90d4253?q=80&w=800&auto=format&fit=crop' },
    currentStage: 'retail',
    stages: {
      farm: {
        farmerName: 'Lakshmi Prasad',
        gps: { lat: 17.3850, lng: 78.4867, label: 'Hyderabad • deccan plateau' },
        harvestedAt: '2024-12-01T06:20:00Z',
        quantityKg: 200,
        tags: ['Organic Certified', 'Water-Smart']
      },
      collection: {
        collectorName: 'S. Narayan',
        location: 'Secunderabad yard',
        collectedAt: '2024-12-02T09:50:00Z',
        transportId: 'TS09-Z-8890',
        custodyStatus: 'Verified',
        approvedZone: true
      },
      testing: {
        labName: 'Deccan Herb Labs',
        location: 'Hyderabad, TS',
        results: { moisturePercent: 7.5, pesticidePurityPercent: 99.7, dnaAuthenticityPercent: 98.4 },
        compliance: 'AYUSH/NMPB Passed',
        certificateRef: 'DHL-24-TURM-022'
      },
      distribution: {
        distributorName: 'Saffron Road Logistics',
        transitLocation: 'ORR West',
        handoverDate: '2024-12-04T10:00:00Z',
        vehicleInfo: 'TS10 AC 3344 • refrigerated',
        movementVerified: true
      },
      retail: {
        retailer: 'Herbica Naturals',
        storeLocation: 'Banjara Hills',
        receivedDate: '2024-12-06T15:00:00Z',
        packagingDate: '2024-12-07',
        expiryDate: '2026-12-06',
        packageId: 'PKG-TURM-022',
        shelfLife: '24 months',
        certifications: ['AYUSH', 'GMP']
      }
    }
  }
];

const formatDateTime = (iso) => new Date(iso).toLocaleString();

const ProgressBar = ({ label, value }) => (
  <div>
    <div className="flex justify-between text-sm mb-1"><span>{label}</span><span>{value}%</span></div>
    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full bg-green-600" style={{ width: `${value}%` }} />
    </div>
  </div>
);

const Badge = ({ children }) => (
  <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 mr-2 mb-2">{children}</span>
);

const Journey = () => {
  const [selectedId, setSelectedId] = useState(SAMPLE_BATCHES[0].batchId);
  const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo')), []);

  const batch = useMemo(() => SAMPLE_BATCHES.find(b => b.batchId === selectedId), [selectedId]);
  const currentIndex = STAGES.findIndex(s => s.key === batch.currentStage);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-green-100">
      <Navbar userInfo={userInfo} />

      <div className="container mx-auto p-6 md:p-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">🍃</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-green-700 mt-4">AyurTrace</h1>
          <p className="text-gray-600 mt-2 text-center">Transparent Ayurvedic Herb Journey</p>
        </div>

        {/* Role Buttons (UI-only) */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Join the Transparent Supply Chain</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {['Farmer','Collector','Lab Tester','Distributor','Retailer','Consumer'].map((role) => (
              <Link key={role} to="/login" className="px-3 py-2 rounded-xl border text-sm hover:bg-green-50 text-center block">{role}</Link>
            ))}
          </div>
        </div>

        {/* Batch Selector */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Select Herb Batch</h2>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-400 focus:outline-none"
          >
            {SAMPLE_BATCHES.map((b) => (
              <option key={b.batchId} value={b.batchId}>
                {b.herb.emoji} {b.herb.name} — {b.batchId} — {b.currentStage.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Journey Visualization */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Journey Visualization</h2>
          <div className="relative">
            <svg viewBox="0 0 1000 160" className="w-full h-40">
              <defs>
                <linearGradient id="progress" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
              </defs>
              {/* Base path */}
              <path d="M40 120 C 220 20, 380 20, 500 120 S 780 220, 960 120" stroke="#e5e7eb" strokeWidth="10" fill="none" />
              {/* Progress path */}
              <clipPath id="clip">
                <path d={`M40 120 C 220 20, 380 20, 500 120 S 780 220, 960 120`} />
              </clipPath>
              <rect x="0" y="0" width={`${(currentIndex/(STAGES.length-1))*1000}`} height="200" fill="url(#progress)" clipPath="url(#clip)" />

              {/* Nodes */}
              {STAGES.map((s, idx) => {
                const x = 40 + (idx*(920/(STAGES.length-1)));
                const completed = idx < currentIndex;
                const current = idx === currentIndex;
                return (
                  <g key={s.key} transform={`translate(${x}, 120)`}>
                    <circle r="18" fill={completed ? '#22c55e' : current ? '#bbf7d0' : '#e5e7eb'} stroke={current ? '#16a34a' : 'transparent'} strokeWidth="3" />
                    {completed ? (
                      <text textAnchor="middle" y="6" fill="#ffffff" fontSize="14">✓</text>
                    ) : null}
                  </g>
                );
              })}
            </svg>
            <div className="grid grid-cols-5 text-sm text-center text-gray-700">
              {STAGES.map((s, idx) => (
                <div key={s.key} className={`flex flex-col items-center ${idx===currentIndex ? 'text-green-700 font-semibold' : ''}`}>
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-md mb-1`}>
                    <span>{s.emoji}</span>
                  </div>
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stage Cards */}
        <div className="space-y-6">
          {/* Farm */}
          {batch.stages.farm && (
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
                <div className="flex items-center gap-2"><Tractor size={20} /><h3 className="text-lg font-semibold">Farm Origin</h3></div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                  <img src={batch.herb.imageUrl} alt={batch.herb.name} className="w-full h-full object-cover" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <p><span className="font-medium">Farmer:</span> {batch.stages.farm.farmerName}</p>
                  <p><span className="font-medium">GPS:</span> {batch.stages.farm.gps.lat.toFixed(4)}, {batch.stages.farm.gps.lng.toFixed(4)} — {batch.stages.farm.gps.label}</p>
                  <p><span className="font-medium">Harvested:</span> {formatDateTime(batch.stages.farm.harvestedAt)}</p>
                  <p><span className="font-medium">Quantity:</span> {batch.stages.farm.quantityKg} kg</p>
                  <div className="mt-2">
                    {batch.stages.farm.tags.map((t) => <Badge key={t}>{t}</Badge>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Collection */}
          {batch.stages.collection && (
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <div className="flex items-center gap-2"><Truck size={20} /><h3 className="text-lg font-semibold">Collection</h3></div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p><span className="font-medium">Collector:</span> {batch.stages.collection.collectorName}</p>
                  <p><span className="font-medium">Location:</span> {batch.stages.collection.location}</p>
                  <p><span className="font-medium">Collected:</span> {formatDateTime(batch.stages.collection.collectedAt)}</p>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">Transport ID:</span> {batch.stages.collection.transportId}</p>
                  <p><span className="font-medium">Chain of Custody:</span> {batch.stages.collection.custodyStatus}</p>
                  {batch.stages.collection.approvedZone && <Badge>✅ Approved Zone</Badge>}
                </div>
              </div>
            </div>
          )}

          {/* Lab Testing */}
          {batch.stages.testing && (
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <div className="flex items-center gap-2"><TestTube2 size={20} /><h3 className="text-lg font-semibold">Lab Testing</h3></div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p><span className="font-medium">Lab:</span> {batch.stages.testing.labName}</p>
                  <p><span className="font-medium">Location:</span> {batch.stages.testing.location}</p>
                  <p><span className="font-medium">Compliance:</span> {batch.stages.testing.compliance}</p>
                  <p><span className="font-medium">Certificate Ref:</span> {batch.stages.testing.certificateRef}</p>
                </div>
                <div className="space-y-3">
                  <ProgressBar label="Moisture Content" value={batch.stages.testing.results.moisturePercent} />
                  <ProgressBar label="Pesticide Purity (Free)" value={batch.stages.testing.results.pesticidePurityPercent} />
                  <ProgressBar label="DNA Authenticity (Match)" value={batch.stages.testing.results.dnaAuthenticityPercent} />
                </div>
              </div>
            </div>
          )}

          {/* Distribution */}
          {batch.stages.distribution && (
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                <div className="flex items-center gap-2"><PackageOpen size={20} /><h3 className="text-lg font-semibold">Distribution</h3></div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p><span className="font-medium">Distributor:</span> {batch.stages.distribution.distributorName}</p>
                  <p><span className="font-medium">Transit Location:</span> {batch.stages.distribution.transitLocation}</p>
                  <p><span className="font-medium">Handover Date:</span> {formatDateTime(batch.stages.distribution.handoverDate)}</p>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">Vehicle:</span> {batch.stages.distribution.vehicleInfo}</p>
                  <p><span className="font-medium">Movement Verified:</span> {batch.stages.distribution.movementVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Retail */}
          {batch.stages.retail && (
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                <div className="flex items-center gap-2"><Store size={20} /><h3 className="text-lg font-semibold">Retail</h3></div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p><span className="font-medium">Retailer:</span> {batch.stages.retail.retailer}</p>
                  <p><span className="font-medium">Store Location:</span> {batch.stages.retail.storeLocation}</p>
                  <p><span className="font-medium">Received:</span> {formatDateTime(batch.stages.retail.receivedDate)}</p>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">Packaging Date:</span> {batch.stages.retail.packagingDate}</p>
                  <p><span className="font-medium">Expiry Date:</span> {batch.stages.retail.expiryDate}</p>
                  <p><span className="font-medium">Package ID:</span> {batch.stages.retail.packageId}</p>
                  <p><span className="font-medium">Shelf Life:</span> {batch.stages.retail.shelfLife}</p>
                  <div className="mt-2">
                    {batch.stages.retail.certifications.map((c) => <Badge key={c}>{c}</Badge>)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Journey;


