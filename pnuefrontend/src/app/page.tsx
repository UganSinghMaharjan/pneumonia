"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  UploadCloud,
  FileImage,
  Loader2,
  AlertCircle,
  CheckCircle,
  Activity,
  LogOut,
  User,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if token exists in localStorage
    const storedToken = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    
    if (!storedToken) {
      router.push("/login");
    } else {
      setToken(storedToken);
      setUsername(storedUsername);
      setAuthorized(true);
    }
  }, [router]);

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
    if (!image || !token) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/predict/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Token ${token}`,
          },
        },
      );
      setResult(response.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        // Token might be expired or invalid
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        router.push("/login");
      }
      setError(
        err.response?.data?.error ||
          "An error occurred while analyzing the image.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/20">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-light text-sm">Securing workspace portal...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col pb-16">
      {/* Premium Minimal Navigation Bar */}
      <nav className="w-full bg-white/70 backdrop-blur-md border-b border-slate-200/60 py-4 px-6 sm:px-8 shadow-sm shadow-slate-100/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="font-bold text-slate-800 tracking-tight text-lg sm:text-xl">
              Pneumonix AI
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-2xl">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-600">
                {username || "Clinical Practitioner"}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-300 font-medium text-sm"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Workspace Grid */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-10 flex-1 flex flex-col">
        {/* Header Hero Section */}
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-indigo-50/70 border border-indigo-100 px-3 py-1 rounded-full text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AI-Powered Medical Diagnosis Assistance</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mb-3">
            Chest Radiograph Classification
          </h2>
          <p className="text-slate-500 font-light text-base sm:text-lg leading-relaxed">
            Upload patient chest X-Ray scans to analyze for normal pulmonary structures 
            or indications of Pneumonia with deep learning models.
          </p>
        </div>

        {/* Diagnostic Workspace panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          {/* Upload Section (Left Panel) */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200/60 shadow-xl shadow-slate-100/50">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <UploadCloud className="mr-2.5 w-5 h-5 text-indigo-500" /> 
                Patient Scan Upload
              </h3>

              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                  preview
                    ? "border-indigo-400 bg-indigo-50/10"
                    : "border-slate-200 bg-slate-50/30 hover:border-indigo-300 hover:bg-indigo-50/5"
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
                    <div className="p-4 bg-slate-100 rounded-full group-hover:scale-105 transition-transform duration-300">
                      <FileImage className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-700 font-medium">
                        Drag and drop radiograph here
                      </p>
                      <p className="text-slate-400 text-xs font-light">
                        Supports standard PNG, JPG, JPEG files
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden shadow-md border border-slate-100 bg-white">
                    <img
                      src={preview}
                      alt="X-Ray preview"
                      className="w-full h-auto max-h-[280px] object-contain mx-auto"
                    />
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-slate-800 font-semibold bg-white/90 px-4 py-2 rounded-xl shadow-sm text-sm">
                        Replace Scan
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={analyzeImage}
                disabled={!image || loading}
                className={`w-full mt-6 py-3.5 rounded-2xl font-semibold text-base flex items-center justify-center transition-all duration-300 shadow-md ${
                  !image || loading
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200/50"
                    : "bg-slate-900 hover:bg-slate-800 text-white hover:shadow-lg hover:shadow-slate-900/10 active:scale-[0.99]"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 w-5 h-5" /> 
                    <span>AI Diagnostic Run...</span>
                  </>
                ) : (
                  <span>Analyze Scan</span>
                )}
              </button>
            </div>
          </div>

          {/* Results Section (Right Panel) */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200/60 shadow-xl shadow-slate-100/50 flex-1 flex flex-col">
              <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                <TrendingUp className="mr-2.5 w-5 h-5 text-indigo-500" /> 
                Diagnostic Findings
              </h3>

              {!result && !error && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16 space-y-4">
                  <div className="p-4 bg-slate-50 rounded-full border border-slate-100">
                    <Activity className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="font-light text-slate-500">Upload a patient radiograph and execute analyze scan.</p>
                </div>
              )}

              {loading && (
                <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 border-2 border-slate-100 rounded-full"></div>
                    <div className="w-12 h-12 border-2 border-indigo-600 rounded-full border-t-transparent animate-spin absolute"></div>
                  </div>
                  <p className="text-indigo-600 font-medium animate-pulse text-sm">
                    Neural network processing scan features...
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl text-red-600 flex items-start space-x-3 mb-6">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {result && !loading && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Diagnosis Card */}
                  <div className={`p-6 rounded-2xl border transition-all ${
                    result.predicted_class === "Normal"
                      ? "bg-emerald-50/40 border-emerald-100/60"
                      : "bg-red-50/40 border-red-100/60"
                  }`}>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      Primary Medical Assessment
                    </span>
                    <div className="flex items-center justify-between mt-2">
                      <h4 className={`text-2xl sm:text-3xl font-extrabold ${
                        result.predicted_class === "Normal"
                          ? "text-emerald-700"
                          : "text-red-700"
                      }`}>
                        {result.predicted_class === "Normal" ? "NORMAL SCAN" : "PNEUMONIA DETECTED"}
                      </h4>
                      <div className="flex items-center space-x-1 bg-white border border-slate-100 px-3 py-1 rounded-full shadow-sm">
                        <CheckCircle className={`w-4 h-4 ${
                          result.predicted_class === "Normal" ? "text-emerald-500" : "text-red-500"
                        }`} />
                        <span className="text-slate-700 font-bold font-mono text-sm">
                          {(result.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Probability Breakdown */}
                  <div className="space-y-4 pt-2">
                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                      Classification Confidence Details
                    </h5>

                    {Object.entries(result.probabilities).map(
                      ([className, prob]: [string, any]) => (
                        <div key={className} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-700 font-medium">{className}</span>
                            <span className="text-slate-500 font-semibold font-mono">
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${
                                className === "Normal"
                                  ? "bg-emerald-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${prob * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                  
                  {/* Clinic Disclaimer */}
                  <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed font-light">
                    Disclaimer: This AI analysis tool is designed as a primary evaluation assistant. 
                    Predictions should be cross-examined by certified clinical radiologists. 
                    Treatment paths should rely on multi-stage diagnostic models and professional physician reviews.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
