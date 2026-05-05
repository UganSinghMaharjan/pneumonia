"use client";

import { useState, useRef } from "react";
import axios from "axios";
import {
  UploadCloud,
  FileImage,
  Loader2,
  AlertCircle,
  CheckCircle,
  Activity,
} from "lucide-react";

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const analyzeImage = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await axios.post(
        "http://localhost:8001/api/predict/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setResult(response.data);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          "An error occurred while analyzing the image.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-500/20 rounded-2xl backdrop-blur-sm border border-blue-500/30">
            <Activity className="w-10 h-10 text-blue-400" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4 tracking-tight">
          Pneumonix AI
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto font-light">
          Advanced X-Ray analysis for detecting Pneumonia and Normal chest
          conditions with high accuracy.
        </p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="flex flex-col space-y-6">
          <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center">
              <UploadCloud className="mr-2 w-5 h-5 text-blue-400" /> Upload
              X-Ray
            </h2>

            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                preview
                  ? "border-blue-500/50 bg-blue-500/5"
                  : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/30"
              } cursor-pointer group`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />

              {!preview ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-slate-700/50 rounded-full group-hover:scale-110 transition-transform duration-300">
                    <FileImage className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-300 font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-slate-500 text-sm">
                      PNG, JPG, JPEG up to 10MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden shadow-lg border border-slate-700">
                  <img
                    src={preview}
                    alt="X-Ray preview"
                    className="w-full h-auto max-h-[300px] object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-medium bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                      Change Image
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={analyzeImage}
              disabled={!image || loading}
              className={`w-full mt-6 py-4 rounded-xl font-semibold text-lg flex items-center justify-center transition-all duration-300 shadow-lg ${
                !image || loading
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-blue-500/25 hover:-translate-y-1"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 w-5 h-5" /> Analyzing...
                </>
              ) : (
                "Analyze X-Ray"
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="flex flex-col space-y-6">
          <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-2xl h-full flex flex-col">
            <h2 className="text-xl font-semibold text-slate-100 mb-6 flex items-center">
              <Activity className="mr-2 w-5 h-5 text-purple-400" /> Analysis
              Results
            </h2>

            {!result && !error && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
                <AlertCircle className="w-12 h-12 opacity-50" />
                <p>Upload an image and click analyze to see results.</p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-700 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute inset-0"></div>
                </div>
                <p className="text-blue-400 font-medium animate-pulse">
                  AI is examining the scan...
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-start">
                <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-700">
                  <p className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">
                    Primary Diagnosis
                  </p>
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-3xl font-bold ${
                        result.predicted_class === "Normal"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {result.predicted_class}
                    </h3>
                    <div className="flex items-center space-x-1 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                      <CheckCircle className="w-4 h-4 text-slate-300" />
                      <span className="text-slate-300 font-mono text-sm">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wider border-b border-slate-700 pb-2">
                    Confidence Breakdown
                  </h4>

                  {Object.entries(result.probabilities).map(
                    ([className, prob]: [string, any]) => (
                      <div key={className} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-200">{className}</span>
                          <span className="text-slate-400 font-mono">
                            {(prob * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              className === "Normal"
                                ? "bg-green-500"
                                : className === "Pneumonia"
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${prob * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
