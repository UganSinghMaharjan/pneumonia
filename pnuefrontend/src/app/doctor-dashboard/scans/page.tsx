"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import {
  Activity,
  Search,
  Filter,
  Loader2,
  Calendar,
  Percent,
  CheckCircle,
  AlertCircle,
  Edit2,
  Check,
  X,
  FileImage,
} from "lucide-react";

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

export default function DoctorScansPage() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterResult, setFilterResult] = useState<
    "All" | "Normal" | "Pneumonia"
  >("All");

  // Edit Remarks State
  const [editingScanId, setEditingScanId] = useState<number | null>(null);
  const [editRemarksText, setEditRemarksText] = useState("");
  const [remarksLoading, setRemarksLoading] = useState(false);

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
      fetchScans(storedToken);
    }
  }, [router]);

  const fetchScans = async (authToken: string) => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8000/api/scans/", {
        headers: { Authorization: `Token ${authToken}` },
      });
      setScans(response.data);
    } catch (err) {
      console.error("Failed to load scans", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRemarks = async (scanId: number) => {
    if (!token) return;

    setRemarksLoading(true);
    try {
      await axios.patch(
        `http://localhost:8000/api/scans/${scanId}/`,
        { doctor_remarks: editRemarksText },
        { headers: { Authorization: `Token ${token}` } },
      );

      // Update local state
      setScans((prev) =>
        prev.map((s) =>
          s.id === scanId ? { ...s, doctor_remarks: editRemarksText } : s,
        ),
      );
      setEditingScanId(null);
      setEditRemarksText("");
    } catch (err) {
      console.error("Failed to update remarks", err);
      alert("Failed to save remarks. Please try again.");
    } finally {
      setRemarksLoading(false);
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
        <Loader2 className="w-8 h-8 text-brand-indigo animate-spin" />
      </div>
    );
  }

  // Filter Scans
  const filteredScans = scans.filter((scan) => {
    const matchesSearch =
      scan.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.patient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.result.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterResult === "All" || scan.result === filterResult;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-brand-surface font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col pl-64 h-screen overflow-hidden">
        <Topbar username={username} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-extrabold text-brand-navy mb-1">
                Clinic Scan Catalogue
              </h1>
              <p className="text-brand-muted font-medium">
                Browse and update diagnostic remarks for patient chest
                radiographs.
              </p>
            </div>

            {/* Filters bar */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search email, patient name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-brand-white border border-brand-border rounded-lg py-2 pl-10 pr-4 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo w-60"
                />
              </div>

              <div className="flex border border-brand-border rounded-lg overflow-hidden bg-brand-white">
                {(["All", "Normal", "Pneumonia"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFilterResult(opt)}
                    className={`px-4 py-2 text-xs font-bold uppercase transition-all ${
                      filterResult === opt
                        ? "bg-brand-indigo text-white"
                        : "text-brand-muted hover:bg-brand-surface"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-brand-indigo animate-spin" />
            </div>
          ) : filteredScans.length === 0 ? (
            <div className="bg-brand-white border border-brand-border rounded-2xl p-12 text-center max-w-xl mx-auto flex flex-col items-center">
              <FileImage className="w-8 h-8 text-brand-muted mb-3" />
              <h4 className="font-bold text-brand-navy text-sm">
                No scans match your criteria
              </h4>
              <p className="text-xs text-brand-muted mt-1">
                Perform a checkup analysis on the main Dashboard to generate
                scans in the database.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredScans.map((scan) => (
                <div
                  key={scan.id}
                  className="bg-brand-white border border-brand-border rounded-2xl overflow-hidden shadow-soft flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="h-56 bg-slate-950 flex items-center justify-center overflow-hidden relative group">
                    {scan.image_url ? (
                      <img
                        src={scan.image_url}
                        alt="Radiograph File"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="text-brand-muted text-xs font-semibold">
                        No image preview
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                          scan.result === "Normal"
                            ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-500 border-rose-500/30"
                        }`}
                      >
                        {scan.result.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-brand-muted uppercase flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {new Date(scan.created_at).toLocaleDateString()}
                          </span>
                        </span>
                        <span className="text-xs font-bold text-brand-navy flex items-center space-x-0.5">
                          <Percent className="w-3.5 h-3.5" />
                          <span>
                            {(scan.confidence * 100).toFixed(1)}% AI confidence
                          </span>
                        </span>
                      </div>

                      <div className="text-xs text-brand-navy font-bold flex items-center space-x-1">
                        <span>Patient: {scan.patient_name}</span>
                        <span className="text-brand-muted text-[10px] font-medium">
                          ({scan.patient_email})
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-brand-border/40 pt-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <h4 className="text-xs font-bold text-brand-navy flex items-center space-x-1.5">
                          {scan.result === "Normal" ? (
                            <CheckCircle className="w-4 h-4 text-brand-teal flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                          )}
                          <span>Diagnostic Clinician Remarks</span>
                        </h4>
                        {editingScanId !== scan.id && (
                          <button
                            onClick={() => {
                              setEditingScanId(scan.id);
                              setEditRemarksText(scan.doctor_remarks || "");
                            }}
                            className="text-brand-indigo hover:text-brand-lavender text-[10px] font-bold flex items-center space-x-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>

                      {editingScanId === scan.id ? (
                        <div className="space-y-2">
                          <textarea
                            rows={3}
                            value={editRemarksText}
                            onChange={(e) => setEditRemarksText(e.target.value)}
                            className="w-full bg-brand-surface border border-transparent rounded-lg px-3 py-2 text-xs text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo resize-none"
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingScanId(null);
                                setEditRemarksText("");
                              }}
                              className="p-1 bg-brand-surface border border-brand-border text-brand-navy rounded hover:bg-brand-border"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateRemarks(scan.id)}
                              disabled={remarksLoading}
                              className="p-1 bg-brand-indigo text-white rounded hover:bg-[#2a2853] flex items-center"
                            >
                              {remarksLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-brand-navy bg-brand-surface/40 rounded-lg p-3 italic break-words leading-relaxed">
                          {scan.doctor_remarks
                            ? `"${scan.doctor_remarks}"`
                            : "Remarks pending clinician clinical notes."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
