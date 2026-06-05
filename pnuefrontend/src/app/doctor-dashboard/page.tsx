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
  Clock,
} from "lucide-react";

interface ScanRecord {
  id: string;
  date: string;
  type: string;
  result: string;
  conf: string;
  status: "success" | "danger";
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);

  const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);

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
    }

    const storedScans = localStorage.getItem("recentScans");
    if (storedScans) {
      try {
        setRecentScans(JSON.parse(storedScans));
      } catch (e) {
        console.error("Failed to parse stored scans", e);
      }
    } else {
      setRecentScans([
        {
          id: "PT-8472",
          date: "Today, 10:42 AM",
          type: "Chest AP",
          result: "Normal",
          conf: "98.2%",
          status: "success",
        },
        {
          id: "PT-3921",
          date: "Today, 09:15 AM",
          type: "Chest PA",
          result: "Pneumonia",
          conf: "94.5%",
          status: "danger",
        },
        {
          id: "PT-1104",
          date: "Yesterday, 16:30 PM",
          type: "Chest AP",
          result: "Normal",
          conf: "99.1%",
          status: "success",
        },
        {
          id: "PT-5529",
          date: "Yesterday, 14:22 PM",
          type: "Chest PA",
          result: "Normal",
          conf: "87.4%",
          status: "success",
        },
      ]);
    }
  }, [router]);

  useEffect(() => {
    if (recentScans.length > 0) {
      localStorage.setItem("recentScans", JSON.stringify(recentScans));
    }
  }, [recentScans]);

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
        "http://localhost:9000/api/predict/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Token ${token}`,
          },
        },
      );
      const newResult = response.data;
      setResult(newResult);

      const now = new Date();
      const timeString = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const newScan: ScanRecord = {
        id: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
        date: `Today, ${timeString}`,
        type: "Chest X-Ray",
        result: newResult.predicted_class,
        conf: `${(newResult.confidence * 100).toFixed(1)}%`,
        status: newResult.predicted_class === "Normal" ? "success" : "danger",
      };

      setRecentScans((prev) => [newScan, ...prev]);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
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
      <div className="min-h-screen flex items-center justify-center bg-brand-surface">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-brand-indigo animate-spin" />
          <p className="text-brand-muted font-medium text-sm">
            Securing workspace portal...
          </p>
        </div>
      </div>
    );
  }

  // Compute Live Statistics
  const totalScansToday = recentScans.filter((scan) =>
    scan.date.startsWith("Today"),
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
            <h1 className="text-3xl font-bold text-brand-navy mb-2">
              Doctor Administration Dashboard
            </h1>
            <p className="text-brand-muted font-medium">
              Global overview of patients, system statistics, and clinical operations.
            </p>
          </div>

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
                color: "text-red-500",
                bg: "bg-red-500/10",
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
                className="bg-brand-white rounded-xl p-5 border border-brand-border shadow-soft flex items-center space-x-4"
              >
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-brand-muted font-semibold">
                    {stat.label}
                  </p>
                  <h3 className="text-2xl font-bold text-brand-navy mt-1">
                    {stat.value}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Area */}
            <div className="lg:col-span-1 flex flex-col">
              <div className="bg-brand-white rounded-xl p-6 border border-brand-border shadow-soft flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-brand-navy mb-4 flex items-center">
                  <UploadCloud className="mr-2 w-5 h-5 text-brand-indigo" />
                  New Scan Analysis
                </h3>

                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 flex-1 flex flex-col items-center justify-center ${
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
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-4 bg-brand-white rounded-full shadow-sm border border-brand-border group-hover:scale-105 transition-transform">
                        <FileImage className="w-8 h-8 text-brand-lavender" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-brand-navy font-semibold text-sm">
                          Click or drag file here
                        </p>
                        <p className="text-brand-muted text-xs font-medium">
                          PNG, JPG, JPEG up to 10MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden w-full">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-auto max-h-48 object-contain mx-auto"
                      />
                      <div className="absolute inset-0 bg-brand-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-brand-white font-medium text-sm">
                          Replace Image
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={analyzeImage}
                  disabled={!image || loading}
                  className={`w-full mt-6 py-3 rounded-lg font-semibold text-sm flex items-center justify-center transition-all ${
                    !image || loading
                      ? "bg-brand-surface text-brand-muted cursor-not-allowed border border-brand-border"
                      : "bg-brand-indigo hover:bg-[#2a2853] text-white shadow-md active:scale-[0.98]"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 w-4 h-4" />
                      Processing...
                    </>
                  ) : (
                    "Analyze Radiograph"
                  )}
                </button>
              </div>
            </div>

            {/* Results Area */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="bg-brand-white rounded-xl p-6 border border-brand-border shadow-soft flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-brand-navy mb-6 flex items-center">
                  <TrendingUp className="mr-2 w-5 h-5 text-brand-teal" />
                  Diagnostic Results
                </h3>

                {!result && !error && !loading && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="p-4 bg-brand-surface rounded-full mb-4">
                      <Activity className="w-8 h-8 text-brand-muted" />
                    </div>
                    <p className="text-brand-muted font-medium">
                      Upload a radiograph to view the AI analysis results here.
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-brand-surface rounded-full border-t-brand-indigo animate-spin"></div>
                    <p className="text-brand-indigo font-semibold animate-pulse">
                      Running Neural Networks...
                    </p>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                {result && !loading && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div
                      className={`p-6 rounded-xl border flex items-center justify-between ${
                        result.predicted_class === "Normal"
                          ? "bg-brand-teal/5 border-brand-teal/20"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                          Primary Assessment
                        </span>
                        <h4
                          className={`text-3xl font-extrabold mt-1 ${
                            result.predicted_class === "Normal"
                              ? "text-brand-teal"
                              : "text-red-600"
                          }`}
                        >
                          {result.predicted_class === "Normal"
                            ? "NORMAL"
                            : "PNEUMONIA"}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                          Confidence Level
                        </span>
                        <div className="flex items-center space-x-2 mt-1 justify-end">
                          <CheckCircle
                            className={`w-5 h-5 ${
                              result.predicted_class === "Normal"
                                ? "text-brand-teal"
                                : "text-red-500"
                            }`}
                          />
                          <span className="text-2xl font-bold text-brand-navy">
                            {(result.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mt-6">
                      <h5 className="text-sm font-bold text-brand-navy border-b border-brand-border pb-2">
                        Detailed Probabilities
                      </h5>
                      {Object.entries(result.probabilities).map(
                        ([className, prob]: [string, any]) => (
                          <div key={className} className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
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

          {/* Data Table */}
          <div className="bg-brand-white rounded-xl border border-brand-border shadow-soft overflow-hidden mt-8">
            <div className="p-5 border-b border-brand-border bg-brand-white flex justify-between items-center">
              <h3 className="text-lg font-semibold text-brand-navy">
                Recent Scans
              </h3>
              <button className="text-sm font-medium text-brand-indigo hover:text-[#2a2853]">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-surface text-brand-muted text-xs uppercase tracking-wider font-semibold border-b border-brand-border">
                    <th className="px-6 py-4">Patient ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Scan Type</th>
                    <th className="px-6 py-4">Result</th>
                    <th className="px-6 py-4">Confidence</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentScans.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-brand-border/50 hover:bg-brand-surface/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-brand-navy">
                        {row.id}
                      </td>
                      <td className="px-6 py-4 text-brand-muted">{row.date}</td>
                      <td className="px-6 py-4 text-brand-muted">{row.type}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            row.status === "success"
                              ? "bg-brand-teal/10 text-brand-teal"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {row.result}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-brand-navy">
                        {row.conf}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
