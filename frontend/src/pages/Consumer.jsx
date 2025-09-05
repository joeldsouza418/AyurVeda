import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { BrowserMultiFormatReader } from '@zxing/browser';

const Consumer = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const zxingControls = useRef(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('userInfo'));
    setUserInfo(stored || null);
  }, []);

  const parseBatchFromText = (text) => {
    if (!text) return '';
    try {
      // if it's a URL that ends with /batch/<id> or contains ?batchId=<id>
      const url = new URL(text);
      const pathname = url.pathname || '';
      const parts = pathname.split('/').filter(Boolean);
      const batchIndex = parts.findIndex((p) => p.toLowerCase() === 'batch');
      if (batchIndex !== -1 && parts[batchIndex + 1]) return parts[batchIndex + 1];
      const param = url.searchParams.get('batchId') || url.searchParams.get('id');
      if (param) return param;
    } catch (_) {
      // not a URL, treat as direct code
    }
    return text.trim();
  };

  const handleResolvedCode = (raw) => {
    const code = parseBatchFromText(raw);
    if (!code) {
      setError('Unable to read QR content. Try again or use manual entry.');
      return;
    }
    navigate(`/batch/${code}`);
  };

  const stopStream = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    // The useEffect cleanup will handle stopping the stream via zxingControls
    setIsScanning(false);
  };

  const startLiveScan = () => {
    setError('');
    setIsScanning(true);
  };

  useEffect(() => {
    if (!isScanning) return;

    const codeReader = new BrowserMultiFormatReader();
    let controls;

    const startScan = async () => {
      try {
        // Use decodeFromVideoDevice which handles stream acquisition
        controls = await codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
          if (result) {
            stopStream();
            handleResolvedCode(result.getText());
          }
          if (err && !(err instanceof DOMException && err.name === 'NotFoundError')) {
            // You might want to log other errors, but NotFoundError is common and can be ignored if the scan continues
          }
        });
        zxingControls.current = controls;
      } catch (err) {
        console.error('Camera access error:', err);
        let message = 'Unable to access camera. Please allow permissions or use upload/manual.';
        if (err.name === 'NotAllowedError') {
          message = 'Camera access was denied. Please enable it in your browser settings.';
        } else if (err.name === 'NotFoundError') {
          message = 'No camera found on this device.';
        }
        setError(message);
        setIsScanning(false);
      }
    };

    startScan();

    return () => {
      if (zxingControls.current) {
        zxingControls.current.stop();
        zxingControls.current = null;
      }
    };
  }, [isScanning]);

  const handleImageUpload = async (file) => {
    setError('');
    if (!file) return;
    try {
      if ('BarcodeDetector' in window) {
        const bitmap = await createImageBitmap(file);
        // @ts-ignore
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const results = await detector.detect(bitmap);
        if (results && results.length > 0) {
          handleResolvedCode(results[0].rawValue);
          return;
        }
      }
      // Fallback using ZXing from image file
      const reader = new FileReader();
      reader.onload = async () => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width; canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const codeReader = new BrowserMultiFormatReader();
          try {
            const result = await codeReader.decodeFromImageElement(img);
            if (result?.getText()) {
              handleResolvedCode(result.getText());
            } else {
              setError('No QR code found in the image.');
            }
          } catch {
            setError('No QR code found in the image.');
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to read the image. Try another file.');
    }
  };

  const onSubmitManual = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setError('Please enter a batch ID or QR content.');
      return;
    }
    handleResolvedCode(manualCode.trim());
  };

  useEffect(() => () => stopStream(), []);

  return (
    <div className="min-h-screen bg-green-50">
      <Navbar userInfo={userInfo} />
      <div className="container mx-auto p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">🧾</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-green-700 mt-4">QR Code Scanner</h1>
          <p className="text-gray-600 mt-2 text-center">Scan or upload QR codes to trace your herbs</p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow p-6">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-xl mb-4">
              <span role="img" aria-label="camera">📷</span>
              <span>Live Camera</span>
            </div>
            <p className="text-gray-600 mb-4">Point camera at QR code</p>
            <button
              type="button"
              onClick={startLiveScan}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl shadow"
            >
              Open Camera Scanner
            </button>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-2xl shadow p-6">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-xl mb-4">
              <span role="img" aria-label="upload">⤴️</span>
              <span>Upload Image</span>
            </div>
            <p className="text-gray-600 mb-4">Upload photo with QR code</p>
            <label className="block w-full">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
                className="w-full border rounded-xl p-3 cursor-pointer bg-white text-gray-700"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 bg-white/90 backdrop-blur rounded-2xl shadow p-6">
          <div className="flex items-center gap-2 text-green-700 font-semibold text-xl mb-4">
            <span role="img" aria-label="manual">🔎</span>
            <span>Manual Entry</span>
          </div>
          <form onSubmit={onSubmitManual} className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter batch ID or QR code text..."
              className="flex-1 px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-400 focus:outline-none"
            />
            <button type="submit" className="md:w-40 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl shadow">Search</button>
          </form>
        </div>

        {isScanning && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-4 w-full max-w-md">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-lg">Scanning...</h2>
                <button onClick={stopStream} className="text-gray-500 hover:text-gray-800">Close</button>
              </div>
              <div className="relative rounded-lg overflow-hidden">
                <video ref={videoRef} className="w-full" playsInline muted />
                <div className="absolute inset-0 border-4 border-green-500/60 m-8 rounded-xl pointer-events-none"></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Align the QR within the frame</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Consumer;


