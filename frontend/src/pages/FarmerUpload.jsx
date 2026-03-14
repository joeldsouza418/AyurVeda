import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Camera from "../components/Camera";

export default function FarmerUpload() {
  const navigate = useNavigate();

  const [farmerName, setFarmerName] = useState("");
  const [species, setSpecies] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [distributors, setDistributors] = useState([]);
  const [selectedDistributor, setSelectedDistributor] = useState("");
  const [loadingDistributors, setLoadingDistributors] = useState(false);
  const fileInputRef = useRef(null);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  useEffect(() => {
    if (!userInfo || userInfo.role !== "FARMER") {
      navigate("/login");
      return;
    }
    setFarmerName(userInfo?.name || "");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => setError("Please enable location services to continue.")
      );
    }
    const fetchDistributors = async () => {
      try {
        setLoadingDistributors(true);
        const config = {
          headers: {
            Authorization: userInfo?.token ? `Bearer ${userInfo.token}` : undefined,
          },
        };
        const { data } = await axios.get("/api/users/distributors", config);
        setDistributors(data.data || []);
      } catch (err) {
        // Keep this non-blocking for batch creation
      } finally {
        setLoadingDistributors(false);
      }
    };

    fetchDistributors();
  }, [navigate]);

  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      const byteNumbers = new Array(slice.length);
      for (let j = 0; j < slice.length; j++) byteNumbers[j] = slice.charCodeAt(j);
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: mimeType });
  };

  const handleCapture = (dataUri) => {
    setImagePreview(dataUri);
    const base64Data = dataUri.split(",")[1];
    const blob = base64ToBlob(base64Data, "image/jpeg");
    const file = new File([blob], "herb-image.jpg", { type: "image/jpeg" });
    setImageFile(file);
    setShowCamera(false);
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!species.trim()) return setError("Please enter herb name.");
    if (!imageFile) return setError("Please add a photo.");
    if (!coordinates) return setError("Location required.");

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("species", species);
      formData.append("image", imageFile);

      formData.append(
        "coordinates",
        JSON.stringify([coordinates.longitude, coordinates.latitude])
      );

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: userInfo?.token ? `Bearer ${userInfo.token}` : undefined,
        },
      };

      const { data } = await axios.post("/api/batches", formData, config);

      if (selectedDistributor) {
        try {
          await axios.put(
            `/api/batches/${data.data._id}/assign`,
            { distributorId: selectedDistributor },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: userInfo?.token ? `Bearer ${userInfo.token}` : undefined,
              },
            }
          );
        } catch (assignError) {
          // If assignment fails, we still let the batch be created and navigated to
        }
      }

      setSpecies("");
      setHarvestDate("");
      setImageFile(null);
      setImagePreview(null);
      setSelectedDistributor("");
      navigate(`/batch/${data.data.batchId}`);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create batch";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <Navbar userInfo={userInfo} />

      <div className="flex flex-col items-center p-6 md:p-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
            <span role="img" aria-label="leaf">🍃</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-green-700 mt-4">
            Farmer Upload
          </h1>
          <p className="text-gray-600 mt-2 text-center">
            Add a new herb batch to the supply chain
          </p>
        </div>

        <div className="w-full max-w-3xl bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6 md:p-8">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl shadow transition"
            >
              <span className="text-lg">📷</span> Live Camera
            </button>
            <label className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-semibold py-3 rounded-xl shadow cursor-pointer transition">
              <span className="text-lg">🖼</span> Upload Photo
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
          </div>

          {imagePreview && (
            <div className="mb-6">
              <img src={imagePreview} alt="Preview" className="w-full rounded-xl border" />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition"
                >
                  <span>🗑</span> Remove image
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={farmerName}
              onChange={(e) => setFarmerName(e.target.value)}
              placeholder="Farmer Name"
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-400 focus:outline-none"
            />
            <input
              type="text"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="Herb Name (e.g., Neem, Brahmi)"
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-400 focus:outline-none"
            />
            <input
              type="date"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-gray-700 focus:ring-2 focus:ring-green-400 focus:outline-none"
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Assign to Distributor (optional)
              </label>
              <select
                value={selectedDistributor}
                onChange={(e) => setSelectedDistributor(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border bg-white focus:ring-2 focus:ring-green-400 focus:outline-none"
              >
                <option value="">
                  {loadingDistributors ? "Loading distributors..." : "Select a distributor"}
                </option>
                {distributors.map((dist) => (
                  <option key={dist._id} value={dist._id}>
                    {dist.name} {dist.organizationName ? `- ${dist.organizationName}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit & Generate QR"}
            </button>
          </form>
        </div>
      </div>

      {showCamera && (
        <Camera onCapture={handleCapture} onClose={() => setShowCamera(false)} />
      )}

      {/* Minimal page-specific CSS to match the soft aesthetic */}
      <style>{`
        .backdrop-blur{backdrop-filter:saturate(140%) blur(4px)}
      `}</style>
    </div>
  );
}