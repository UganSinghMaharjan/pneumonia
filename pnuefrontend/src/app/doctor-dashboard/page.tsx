"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import {
  UploadCloud,
  FileImage,
  Loader2,
  AlertCircle,
  CheckCircle,
  Activity,
  TrendingUp,
  Image as ImageIcon,
  User,
  ExternalLink,
  ShieldCheck,
  FileText,
} from "lucide-react";

interface PatientRecord {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface ScanRecord {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_email: string;
  result: string;
  confidence: number;
  doctor_remarks: string;
  image_url: string;
  created_at: string;
}

export default function DoctorDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  // Scan analysis state
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Core Data
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);
  const [remarks, setRemarks] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");

    if (!storedToken) {
      router.push("/login");
    } else if (storedRole !== "doctor") {
      router.push("/patient-dashboard");
    } else {
      setToken(storedToken);
      setUsername(storedUsername);
      setAuthorized(true);
      fetchInitialData(storedToken);
    }
  }, [router]);

  const fetchInitialData = async (authToken: string) => {
    setInitLoading(true);
    const headers = { Authorization: `Token ${authToken}` };
    try {
      // Fetch patients
      const patientsRes = await axios.get(
        "http://localhost:8000/api/patients/",
        { headers },
      );
      setPatients(patientsRes.data);

      // Fetch all scans
      const scansRes = await axios.get("http://localhost:8000/api/scans/", {
        headers,
      });
      setRecentScans(scansRes.data);
    } catch (err: any) {
      console.error("Failed to load doctor dashboard data", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setInitLoading(false);
    }
  };

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

    if (!selectedPatientId) {
      setError("Please select a patient before scanning.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", image);
    formData.append("patient_id", selectedPatientId);
    formData.append("doctor_remarks", remarks);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/predict/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Token ${token}`,
          },
        },
      );

      setResult(response.data);

      // Reset upload inputs except remarks
      setImage(null);
      setPreview(null);
      setRemarks("");

      // Reload scans list
      fetchInitialData(token);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    router.push("/login");
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-surface">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-brand-indigo animate-spin" />
          <p className="text-brand-muted font-medium text-sm">
            Securing doctor clinical dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Compute Live Statistics
  const today = new Date().toDateString();
  const totalScansToday = recentScans.filter(
    (scan) => new Date(scan.created_at).toDateString() === today,
  ).length;
  const normalResults = recentScans.filter(
    (scan) => scan.result === "Normal",
  ).length;
  const pneumoniaDetected = recentScans.filter(
    (scan) => scan.result === "Pneumonia",
  ).length;

  return (
    <div className="flex h-screen overflow-hidden bg-brand-surface font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col pl-64 h-screen overflow-hidden">
        <Topbar username={username} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold text-brand-navy mb-1 tracking-tight">
              Doctor Administration Portal
            </h1>
            <p className="text-brand-muted font-medium">
              Analyze chest X-rays, manage patient profiles, and view
              clinic-wide statistics.
            </p>
          </div>

          {initLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 text-brand-indigo animate-spin" />
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    label: "Total Scans Today",
                    value: totalScansToday.toString(),
                    icon: ImageIcon,
                    color: "text-brand-indigo",
                    bg: "bg-brand-indigo/10",
                  },
                  {
                    label: "Normal Results",
                    value: normalResults.toString(),
                    icon: CheckCircle,
                    color: "text-brand-teal",
                    bg: "bg-brand-teal/10",
                  },
                  {
                    label: "Pneumonia Detected",
                    value: pneumoniaDetected.toString(),
                    icon: AlertCircle,
                    color: "text-rose-500",
                    bg: "bg-rose-500/10",
                  },
                  {
                    label: "Total Lifetime Scans",
                    value: recentScans.length.toString(),
                    icon: Activity,
                    color: "text-brand-lavender",
                    bg: "bg-brand-lavender/20",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-brand-white rounded-xl p-5 border border-brand-border shadow-soft flex items-center space-x-4 hover:shadow-md transition-shadow"
                  >
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-brand-muted font-bold uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <h3 className="text-2xl font-black text-brand-navy mt-1">
                        {stat.value}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Area & Patient Selector */}
                <div className="lg:col-span-1 flex flex-col">
                  <div className="bg-brand-white rounded-2xl p-6 border border-brand-border shadow-soft flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-brand-navy mb-4 flex items-center space-x-2">
                      <UploadCloud className="w-5 h-5 text-brand-indigo" />
                      <span>Radiograph Scan Diagnosis</span>
                    </h3>

                    <form className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        {/* Patient Selection Dropdown */}
                        <div>
                          <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                            Select Patient
                          </label>
                          <select
                            required
                            value={selectedPatientId}
                            onChange={(e) =>
                              setSelectedPatientId(e.target.value)
                            }
                            className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-sm text-brand-navy font-semibold focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                          >
                            <option value="">
                              -- Choose Patient Profile --
                            </option>
                            {patients.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.first_name || p.last_name
                                  ? `${p.first_name} ${p.last_name} (${p.email})`
                                  : p.email}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Drag and Drop File Input */}
                        <div
                          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[160px] ${
                            preview
                              ? "border-brand-indigo bg-brand-indigo/5"
                              : "border-brand-border bg-brand-surface/30 hover:border-brand-lavender hover:bg-brand-lavender/5"
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
                            <div className="flex flex-col items-center space-y-3">
                              <div className="p-3 bg-brand-white rounded-full border border-brand-border shadow-sm group-hover:scale-105 transition-transform">
                                <FileImage className="w-6 h-6 text-brand-lavender" />
                              </div>
                              <div>
                                <p className="text-brand-navy font-bold text-xs uppercase tracking-wider">
                                  Drag X-Ray image here
                                </p>
                                <p className="text-brand-muted text-[10px] font-semibold mt-1">
                                  PNG, JPG, JPEG up to 10MB
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="relative rounded-lg overflow-hidden w-full max-h-40">
                              <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-auto max-h-40 object-contain mx-auto"
                              />
                              <div className="absolute inset-0 bg-brand-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-brand-white font-bold text-xs uppercase">
                                  Replace Radiograph
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Doctor Notes / Remarks Input */}
                        <div>
                          <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                            Attending Doctor Remarks
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Add diagnostic notes or comments for the patient..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-sm text-brand-navy placeholder:text-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-indigo resize-none"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={analyzeImage}
                        disabled={!image || loading}
                        className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all ${
                          !image || loading
                            ? "bg-brand-surface text-brand-muted cursor-not-allowed border border-brand-border"
                            : "bg-brand-indigo hover:bg-[#2a2853] text-white shadow-md active:scale-[0.98] mt-6"
                        }`}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin mr-2 w-4 h-4" />
                            <span>Running CNN Model...</span>
                          </>
                        ) : (
                          "Analyze & Save Radiograph"
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Results & AI Probabilities Area */}
                <div className="lg:col-span-2 flex flex-col">
                  <div className="bg-brand-white rounded-2xl p-6 border border-brand-border shadow-soft flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-brand-navy mb-6 flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-brand-teal" />
                      <span>Diagnostic AI Feedback</span>
                    </h3>

                    {!result && !error && !loading && (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                        <div className="p-4 bg-brand-surface rounded-full mb-3">
                          <Activity className="w-8 h-8 text-brand-muted" />
                        </div>
                        <p className="text-brand-navy font-bold text-sm">
                          Awaiting Diagnostic Input
                        </p>
                        <p className="text-brand-muted text-xs max-w-sm mt-1">
                          Select a patient, drop a chest radiograph, and run
                          analysis to query the neural network.
                        </p>
                      </div>
                    )}

                    {loading && (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12">
                        <div className="w-12 h-12 border-4 border-brand-surface rounded-full border-t-brand-indigo animate-spin" />
                        <p className="text-brand-indigo font-bold text-sm animate-pulse">
                          Running Neural Networks & Softmax Classification...
                        </p>
                      </div>
                    )}

                    {error && (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="text-xs font-semibold">{error}</p>
                      </div>
                    )}

                    {result && !loading && (
                      <div className="space-y-6 animate-in fade-in duration-500 flex-1 flex flex-col justify-between">
                        <div
                          className={`p-6 rounded-xl border flex items-center justify-between ${
                            result.predicted_class === "Normal"
                              ? "bg-brand-teal/5 border-brand-teal/20"
                              : "bg-rose-50 border-rose-200"
                          }`}
                        >
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-muted">
                              Primary Classification Result
                            </span>
                            <h4
                              className={`text-3xl font-black mt-1 ${
                                result.predicted_class === "Normal"
                                  ? "text-brand-teal"
                                  : "text-rose-600"
                              }`}
                            >
                              {result.predicted_class.toUpperCase()}
                            </h4>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-muted">
                              Model Confidence Score
                            </span>
                            <div className="flex items-center space-x-2 mt-1 justify-end">
                              <CheckCircle
                                className={`w-5 h-5 ${
                                  result.predicted_class === "Normal"
                                    ? "text-brand-teal"
                                    : "text-rose-500"
                                }`}
                              />
                              <span className="text-2xl font-black text-brand-navy">
                                {(result.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 pt-4">
                          <h5 className="text-xs font-bold text-brand-navy border-b border-brand-border pb-2 uppercase tracking-wider">
                            Detailed Class Distribution
                          </h5>
                          {Object.entries(result.probabilities).map(
                            ([className, prob]: [string, any]) => (
                              <div key={className} className="space-y-2">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span className="text-brand-navy">
                                    {className}
                                  </span>
                                  <span className="text-brand-muted font-bold">
                                    {(prob * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-brand-surface rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-1000 ${
                                      className === "Normal"
                                        ? "bg-brand-teal"
                                        : "bg-rose-500"
                                    }`}
                                    style={{ width: `${prob * 100}%` }}
                                  />
                                </div>
                              </div>
                            ),
                          )}
                        </div>

                        <div className="p-4 bg-brand-surface/40 border border-brand-border/40 rounded-xl mt-4 text-xs font-semibold text-brand-navy">
                          <span className="font-bold text-brand-muted uppercase block text-[10px] tracking-wider mb-1">
                            Diagnosed Patient Profile
                          </span>
                          <span>
                            Name: {result.patient_name} ({result.patient_email})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Table of Scans */}
              <div className="bg-brand-white rounded-2xl border border-brand-border shadow-soft overflow-hidden mt-8">
                <div className="p-5 border-b border-brand-border bg-brand-white flex justify-between items-center">
                  <h3 className="text-lg font-bold text-brand-navy">
                    Clinic Scan Logs
                  </h3>
                  <button
                    onClick={() => router.push("/doctor-dashboard/scans")}
                    className="text-xs font-bold text-brand-indigo hover:text-[#2a2853] flex items-center space-x-1"
                  >
                    <span>Manage Scan Catalogue</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-surface text-brand-muted text-[10px] uppercase tracking-wider font-extrabold border-b border-brand-border">
                        <th className="px-6 py-4">Patient Email</th>
                        <th className="px-6 py-4">Patient Name</th>
                        <th className="px-6 py-4">Scan Date</th>
                        <th className="px-6 py-4">Result</th>
                        <th className="px-6 py-4">Confidence</th>
                        <th className="px-6 py-4">attending remarks</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {recentScans.slice(0, 5).map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-brand-border/50 hover:bg-brand-surface/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-bold text-brand-indigo">
                            {row.patient_email}
                          </td>
                          <td className="px-6 py-4 font-semibold text-brand-navy">
                            {row.patient_name}
                          </td>
                          <td className="px-6 py-4 text-brand-muted">
                            {new Date(row.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                row.result === "Normal"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {row.result}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-brand-navy">
                            {(row.confidence * 100).toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 text-brand-muted font-medium italic max-w-xs truncate">
                            {row.doctor_remarks || "—"}
                          </td>
                        </tr>
                      ))}
                      {recentScans.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-8 text-brand-muted font-semibold"
                          >
                            No scan records present in database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Clinician Verification Footer */}
          <div className="bg-brand-white border border-brand-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/10 rounded-full">
                <ShieldCheck className="w-5 h-5 text-brand-teal" />
              </div>
              <div>
                <h4 className="font-bold text-brand-navy text-sm">
                  Clinician Dashboard Authenticated
                </h4>
                <p className="text-xs text-brand-muted font-semibold">
                  Access is regulated under HIPAA security protocols. All
                  uploads log physician credential details.
                </p>
              </div>
            </div>
            <div className="text-xs text-brand-muted font-semibold flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-brand-indigo" />
              <span>
                Assigned Credentials: <strong>{username} (Doctor)</strong>
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
