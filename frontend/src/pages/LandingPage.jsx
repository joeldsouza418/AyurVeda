import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import video1 from '/video1.mp4';
const LandingPage = () => {
  return (
    <div className=" min-h-screen font-sans text-[#0f1720] font-bold">
      <Navbar />
      <main>
        {/* Hero section with standalone video above and content below */}
        <section className="relative  pb-10 overflow-hidden">
          {/* Full-bleed video */}
          <div className="w-full">
            <video
              className="w-full h-[40vh] md:h-[60vh] object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={video1} type="video/mp4" />
            </video>
          </div>

          {/* Content under the video, constrained */}
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="mt-8 grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
              <div>
              <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 rounded-full px-4 py-2 font-bold shadow-md">
                <i className="w-2 h-2 rounded-full bg-green-300 shadow-inner"></i>
                New Update <span className="opacity-70">— QR + GeoTag</span>
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl leading-tight tracking-tight text-[#0f1720] mt-4 mb-3 font-extrabold drop-shadow-md">
                Making Herbal Growth Simple & Trustworthy
              </h1>
              <p className="text-lg text-gray-600 max-w-lg">Grow authenticity with expert verification, GPS-backed provenance, and QR-powered traceability across the entire supply chain.</p>
              <div className="mt-6 flex gap-3">
                <Link to="/login" className="border-0 rounded-full px-4 py-2 font-bold cursor-pointer inline-flex items-center gap-2 bg-green-700 text-white transition-all duration-300 hover:bg-green-800">Start as Farmer</Link>
                <Link to="/farmer/upload" className="border-0 rounded-full px-4 py-2 font-bold cursor-pointer inline-flex items-center gap-2 bg-transparent text-green-800 border-2 border-green-100 transition-all duration-300 hover:bg-green-100">Upload a Herb</Link>
              </div>
              </div>

              {/* Mockup phone display */}
              <div className="relative grid grid-cols-2 gap-4">
              <div className="bg-white rounded-[34px] p-4 shadow-xl border border-gray-100 aspect-[9/16] flex flex-col">
                <div className="h-2.5 mb-2.5"></div>
                <div className="flex-1 rounded-2xl bg-gradient-to-b from-white to-green-50 border border-gray-100 p-4 overflow-hidden relative">
                  <div className="font-bold text-green-800 mb-2">AyurTrace</div>
                  <div className="h-[44%] mt-2.5 rounded-lg border border-green-200 bg-white flex items-center justify-center">
                    <img src="/qr2.png" alt="AyurTrace QR" className="max-h-full max-w-full object-contain p-3" />
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 bg-white border border-green-50 rounded-xl p-3 flex justify-between items-center shadow-md">
                    <div>Target Achieved</div>
                    <div className="h-1.5 bg-green-50 rounded-full overflow-hidden w-2/3">
                      <i className="block w-[60%] h-full bg-gradient-to-r from-green-400 to-green-600"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[34px] p-4 shadow-xl border border-gray-100 aspect-[9/16] flex flex-col">
                <div className="h-2.5 mb-2.5"></div>
                <div className="flex-1 rounded-2xl bg-gradient-to-b from-white to-green-50 border border-gray-100 p-4 overflow-hidden relative">
                  <div className="font-bold text-green-800 mb-2">Purity Check</div>
                  <div className="h-[44%] mt-2.5 rounded-lg border border-green-200 bg-white flex items-center justify-center">
                    <img src="/amla1.jpg" alt="Purity Check QR" className="max-h-full max-w-full object-contain p-3" />
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 bg-white border border-green-50 rounded-xl p-3 flex justify-between items-center shadow-md">
                    <div>Trace Verified</div>
                    <div className="h-1.5 bg-green-50 rounded-full overflow-hidden w-2/3">
                      <i className="block w-[60%] h-full bg-gradient-to-r from-green-400 to-green-600"></i>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </section>

        {/* Video showcased in hero background above; removed separate video section */}
        
        {/* Login selection section */}
        <section className="bg-white rounded-xl shadow-md my-8 p-8">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-center text-green-800 mb-2 text-3xl font-extrabold">Choose Your Role</h2>
            <p className="text-center text-gray-600 text-lg">Select your role to access the appropriate dashboard</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
              <Link to="/login" className="bg-gradient-to-br from-[#4a7c59] to-[#5a8c69] text-white p-6 rounded-2xl text-center transition-transform duration-300 hover:translate-y-[-4px] hover:shadow-xl">
                <div className="text-4xl mb-2">🌱</div>
                <h3 className="text-xl mb-1">Farmer</h3>
                <p className="opacity-90 text-sm mb-4">Upload herb photos, generate QR codes, and track harvests</p>
                <div className="border-0 rounded-full px-4 py-2 font-bold cursor-pointer inline-flex items-center gap-2 bg-white text-green-800 shadow-md transition-all duration-300 hover:shadow-lg">Login as Farmer</div>
              </Link>
              <Link to="/login" className="bg-gradient-to-br from-[#4a7c59] to-[#5a8c69] text-white p-6 rounded-2xl text-center transition-transform duration-300 hover:translate-y-[-4px] hover:shadow-xl">
                <div className="text-4xl mb-2">🚚</div>
                <h3 className="text-xl mb-1">Distributor</h3>
                <p className="opacity-90 text-sm mb-4">Manage logistics and verify transfer events</p>
                <div className="border-0 rounded-full px-4 py-2 font-bold cursor-pointer inline-flex items-center gap-2 bg-white text-green-800 shadow-md transition-all duration-300 hover:shadow-lg">Login as Distributor</div>
              </Link>
              <Link to="/login" className="bg-gradient-to-br from-[#4a7c59] to-[#5a8c69] text-white p-6 rounded-2xl text-center transition-transform duration-300 hover:translate-y-[-4px] hover:shadow-xl">
                <div className="text-4xl mb-2">🧪</div>
                <h3 className="text-xl mb-1">Lab Tester</h3>
                <p className="opacity-90 text-sm mb-4">Record test results and certifications</p>
                <div className="border-0 rounded-full px-4 py-2 font-bold cursor-pointer inline-flex items-center gap-2 bg-white text-green-800 shadow-md transition-all duration-300 hover:shadow-lg">Login as Lab Tester</div>
              </Link>
              <Link to="/login" className="bg-gradient-to-br from-[#4a7c59] to-[#5a8c69] text-white p-6 rounded-2xl text-center transition-transform duration-300 hover:translate-y-[-4px] hover:shadow-xl">
                <div className="text-4xl mb-2">🏪</div>
                <h3 className="text-xl mb-1">Retailer</h3>
                <p className="opacity-90 text-sm mb-4">Verify authenticity and manage inventory</p>
                <div className="border-0 rounded-full px-4 py-2 font-bold cursor-pointer inline-flex items-center gap-2 bg-white text-green-800 shadow-md transition-all duration-300 hover:shadow-lg">Login as Retailer</div>
              </Link>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-10 bg-white mt-6">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-center text-3xl font-extrabold text-green-800 mb-2">Why Choose AyurTrace?</h2>
            <p className="text-center text-gray-600 text-lg mb-6">Transparent, secure, and efficient herbal supply chain management</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-green-50 p-5 rounded-xl text-center border border-green-200 font-bold">
                <div className="text-3xl text-green-700 mb-2">🔍</div>
                <h3 className="text-lg text-green-800 mb-2">QR Code Verification</h3>
                <p className="text-gray-600">Each herb gets a unique QR code for complete traceability from farm to consumer.</p>
              </div>
              <div className="bg-green-50 p-5 rounded-xl text-center border border-green-200 font-bold">
                <div className="text-3xl text-green-700 mb-2">🌍</div>
                <h3 className="text-lg text-green-800 mb-2">Geolocation Tracking</h3>
                <p className="text-gray-600">GPS coordinates ensure herbs are sourced from verified locations.</p>
              </div>
              <div className="bg-green-50 p-5 rounded-xl text-center border border-green-200 font-bold">
                <div className="text-3xl text-green-700 mb-2">🔒</div>
                <h3 className="text-lg text-green-800 mb-2">Secure Blockchain</h3>
                <p className="text-gray-600">Immutable records guarantee authenticity and prevent fraud.</p>
              </div>
              <div className="bg-green-50 p-5 rounded-xl text-center border border-green-200 font-bold">
                <div className="text-3xl text-green-700 mb-2">📊</div>
                <h3 className="text-lg text-green-800 mb-2">Analytics Dashboard</h3>
                <p className="text-gray-600">Comprehensive insights into supply chain performance and herb quality.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer section */}
      <footer className="bg-green-800 text-white text-center py-5 mt-9 font-bold">
        <div className="max-w-[1200px] mx-auto px-6">
          <p>© 2025 AyurTrace. All rights reserved. | Making herbal supply chains transparent and trustworthy.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
