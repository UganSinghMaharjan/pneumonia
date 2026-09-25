"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { downloadDiagnosticReport } from "@/utils/downloadReport";
import {
  Activity,
  FileImage,
  Loader2,
  Calendar,
  Percent,
  CheckCircle,
  AlertCircle,
  Download
} from "lucide-react";

interface ScanRecord {
  id: number;
  result: string;
  confidence: number;
  doctor_remarks: string;
  image_url: string;
  created_at: string;
}

export default function PatientScansPage() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scans, setScans] = useState<ScanRecord[]>([]);

  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    const storedUsername = localStorage.getItem("username");

    if (!storedToken) {
      router.push("/login");
    } else if (storedRole === "doctor") {
      router.push("/doctor-dashboard");
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
      const response = await axios.get("/backend/scans", {
        headers: { Authorization: `Token ${authToken}` },
      });
      setScans(response.data);
    } catch (err) {
      console.error("Failed to fetch scans", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (scan: ScanRecord) => {
    try {
      let profile = null;
      let prescriptions = [];
      if (token) {
        try {
          const profRes = await axios.get("/backend/user", {
            headers: { Authorization: `Token ${token}` }
          });
          profile = profRes.data;
        } catch (e) {}

        try {
          const prescRes = await axios.get("/backend/prescriptions", {
            headers: { Authorization: `Token ${token}` }
          });
          prescriptions = prescRes.data;
        } catch (e) {}
      }

      downloadDiagnosticReport({
        patient_name: profile
          ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email
          : username || "Patient Record",
        patient_email: profile?.email || username || "",
        patient_age: profile?.age,
        patient_gender: profile?.gender,
        patient_blood_group: profile?.blood_group,
        patient_contact: profile?.contact_number,
        scan_id: scan.id,
        scan_result: scan.result,
        scan_confidence: scan.confidence,
        scan_image_url: scan.image_url,
        scan_date: scan.created_at,
        doctor_remarks: scan.doctor_remarks,
        prescriptions: prescriptions
      });
    } catch (err) {
      alert("Failed to generate report download.");
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

  return (
    <div className="flex h-screen overflow-hidden bg-brand-surface font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col pl-64 h-screen overflow-hidden">
        <Topbar username={username} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-navy mb-1">
              My Chest Scans & Radiographs
            </h1>
            <p className="text-brand-muted font-medium">
              View AI diagnostic predictions and clinician scan logs for your
              chest X-rays.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-brand-indigo animate-spin" />
            </div>
          ) : scans.length === 0 ? (
            <div className="bg-brand-white border border-brand-border rounded-xl p-12 text-center max-w-2xl mx-auto flex flex-col items-center">
              <div className="p-4 bg-brand-indigo/10 rounded-full mb-4">
                <FileImage className="w-8 h-8 text-brand-indigo" />
              </div>
              <h3 className="text-lg font-bold text-brand-navy mb-2">
                No chest X-rays recorded yet
              </h3>
              <p className="text-sm text-brand-muted mb-4 max-w-md">
                Chest X-ray records and neural net scan assessments are uploaded
                directly by your clinic doctor.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {scans.map((scan) => (
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
                          scan.result === "Pneumonia"
                            ? "bg-rose-500/15 text-rose-500 border-rose-500/30"
                            : "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
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
                            {new Date(scan.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </span>
                        <span className="text-xs font-bold text-brand-navy flex items-center space-x-0.5">
                          <Percent className="w-3.5 h-3.5" />
                          <span>
                            {(scan.confidence * 100).toFixed(1)}% AI confidence
                          </span>
                        </span>
                      </div>

                      <div className="h-1.5 w-full bg-brand-surface rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            scan.result === "Pneumonia"
                              ? "bg-red-500"
                              : "bg-brand-teal"
                          }`}
                          style={{ width: `${scan.confidence * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="border-t border-brand-border/40 pt-4">
                      <h4 className="text-xs font-bold text-brand-navy flex items-center space-x-1.5 mb-1.5">
                        {scan.result === "Pneumonia" ? (
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-brand-teal shrink-0" />
                        )}
                        <span>Diagnostic Report Summary</span>
                      </h4>
                      <p className="text-xs text-brand-navy bg-brand-surface/40 rounded-lg p-3 italic wrap-break-word leading-relaxed mb-3">
                        {scan.doctor_remarks
                          ? `"${scan.doctor_remarks}"`
                          : "Remarks pending clinician clinical notes."}
                      </p>
                      <button
                        onClick={() => handleDownloadReport(scan)}
                        className="w-full py-2 bg-brand-teal/10 hover:bg-brand-teal text-brand-teal hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Scan & Prescription Report</span>
                      </button>
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
