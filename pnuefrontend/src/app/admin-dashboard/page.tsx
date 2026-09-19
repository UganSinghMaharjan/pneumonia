"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useToast } from "@/context/ToastContext";
import { downloadDiagnosticReport } from "@/utils/downloadReport";
import {
  Users,
  Stethoscope,
  Activity,
  Calendar,
  Plus,
  Trash2,
  Search,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  UserPlus,
  Download
} from "lucide-react";

interface AdminStats {
  total_doctors: number;
  total_patients: number;
  total_scans: number;
  normal_scans: number;
  pneumonia_scans: number;
  total_appointments: number;
  pending_appointments: number;
  recent_scans: Array<{
    id: number;
    patient_name: string;
    patient_email: string;
    result: string;
    confidence: number;
    created_at: string;
  }>;
}

interface Doctor {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  contact_number: string;
  address: string;
  clinic_id?: number | null;
  clinic_name?: string | null;
  date_joined: string;
}

interface Patient {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string;
  contact_number: string;
  address: string;
  blood_group: string;
  date_joined: string;
}

interface ScanRecord {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_email: string;
  result: string;
  confidence: number;
  doctor_remarks: string | null;
  image_url: string | null;
  created_at: string;
}

export default function AdminDashboard({ initialTab = "overview" }: { initialTab?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [username, setUsername] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Stats State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Doctors State
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    contact_number: "",
    address: "",
    clinic_id: "",
  });

  // Patients State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    age: "",
    gender: "Other",
    contact_number: "",
    address: "",
    blood_group: "O+"
  });

  // Scans State
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);
  const [scanFilter, setScanFilter] = useState<"ALL" | "Pneumonia" | "Normal">("ALL");
  const [scanSearch, setScanSearch] = useState("");
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);

  // Global submission / error state
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const storedUsername = localStorage.getItem("username");

    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }

    setUsername(storedUsername || "Admin User");
    fetchStats();
    fetchDoctors();
    fetchClinics();
    fetchPatients();
    fetchScans();
  }, [router]);

  const handleLogout = () => {
    toast.info("Logged out successfully.", "Signed Out");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    router.push("/login");
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Token ${token}` };
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axios.get("/backend/admin/stats/", { headers: getAuthHeaders() });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const res = await axios.get("/backend/admin/doctors/", { headers: getAuthHeaders() });
      setDoctors(res.data);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchClinics = async () => {
    try {
      const res = await axios.get("/backend/clinics/");
      setClinics(res.data);
    } catch (err) {
      console.error("Failed to fetch clinics", err);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const res = await axios.get("/backend/admin/patients/", { headers: getAuthHeaders() });
      setPatients(res.data);
    } catch (err) {
      console.error("Failed to fetch patients", err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchScans = async () => {
    try {
      setLoadingScans(true);
      const res = await axios.get("/backend/scans/", { headers: getAuthHeaders() });
      setScans(res.data);
    } catch (err) {
      console.error("Failed to fetch scans", err);
    } finally {
      setLoadingScans(false);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);

    try {
      await axios.post("/backend/admin/doctors/", newDoctor, { headers: getAuthHeaders() });
      setShowAddDoctorModal(false);
      setNewDoctor({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        contact_number: "",
        address: "",
        clinic_id: "",
      });
      fetchDoctors();
      fetchStats();
      toast.success("Doctor account created successfully.", "Doctor Registered");
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Failed to create doctor account.";
      setModalError(errMsg);
      toast.error(errMsg, "Registration Failed");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteDoctor = async (id: number) => {
    if (!confirm("Are you sure you want to remove this doctor account?")) return;
    try {
      await axios.delete(`/backend/admin/doctors/${id}/`, { headers: getAuthHeaders() });
      fetchDoctors();
      fetchStats();
      toast.success("Doctor account removed.", "Doctor Deleted");
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Failed to delete doctor.";
      toast.error(errMsg, "Delete Failed");
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);

    try {
      await axios.post("/backend/admin/patients/", newPatient, { headers: getAuthHeaders() });
      setShowAddPatientModal(false);
      setNewPatient({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        age: "",
        gender: "Other",
        contact_number: "",
        address: "",
        blood_group: "O+"
      });
      fetchPatients();
      fetchStats();
      toast.success("Patient account created successfully.", "Patient Registered");
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Failed to create patient account.";
      setModalError(errMsg);
      toast.error(errMsg, "Registration Failed");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeletePatient = async (id: number) => {
    if (!confirm("Are you sure you want to remove this patient account?")) return;
    try {
      await axios.delete(`/backend/admin/patients/${id}/`, { headers: getAuthHeaders() });
      fetchPatients();
      fetchStats();
      toast.success("Patient account removed.", "Patient Deleted");
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Failed to delete patient.";
      toast.error(errMsg, "Delete Failed");
    }
  };

  const handleDeleteScan = async (id: number) => {
    if (!confirm("Are you sure you want to delete this scan record?")) return;
    try {
      await axios.delete(`/backend/scans/${id}/`, { headers: getAuthHeaders() });
      if (selectedScan?.id === id) setSelectedScan(null);
      fetchScans();
      fetchStats();
      toast.success("Scan record deleted.", "Scan Removed");
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Failed to delete scan.";
      toast.error(errMsg, "Delete Failed");
    }
  };

  const handleDownloadScanReport = async (scan: ScanRecord) => {
    try {
      let prescriptions = [];
      try {
        const res = await axios.get(`/backend/prescriptions/?patient_id=${scan.patient_id}`, {
          headers: getAuthHeaders()
        });
        prescriptions = res.data;
      } catch (e) {
        console.error("Prescriptions fetch optional error", e);
      }

      const pat = patients.find((p) => p.id === scan.patient_id);

      downloadDiagnosticReport({
        patient_name: scan.patient_name,
        patient_email: scan.patient_email,
        patient_age: pat?.age,
        patient_gender: pat?.gender,
        patient_blood_group: pat?.blood_group,
        patient_contact: pat?.contact_number,
        scan_id: scan.id,
        scan_result: scan.result,
        scan_confidence: scan.confidence,
        scan_image_url: scan.image_url,
        scan_date: scan.created_at,
        doctor_remarks: scan.doctor_remarks,
        prescriptions: prescriptions
      });
    } catch (err) {
      alert("Failed to generate download report.");
    }
  };

  // Filtered lists
  const filteredDoctors = doctors.filter(
    (d) =>
      d.email.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      `${d.first_name} ${d.last_name}`.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const filteredPatients = patients.filter(
    (p) =>
      p.email.toLowerCase().includes(patientSearch.toLowerCase()) ||
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const filteredScans = scans.filter((s) => {
    const matchesFilter =
      scanFilter === "ALL" || s.result.toLowerCase() === scanFilter.toLowerCase();
    const matchesSearch =
      s.patient_email.toLowerCase().includes(scanSearch.toLowerCase()) ||
      s.patient_name.toLowerCase().includes(scanSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-brand-surface flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Topbar username={username} onLogout={handleLogout} />

        <main className="p-8 flex-1 max-w-7xl mx-auto w-full space-y-8">
          {/* Header Banner */}
          <div className="bg-linear-to-r from-brand-navy via-brand-navy to-brand-indigo rounded-2xl p-6 text-brand-white shadow-soft flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold tracking-wide uppercase mb-2 border border-white/20">
                <ShieldAlert className="w-3.5 h-3.5 text-brand-teal" />
                <span>Administrator Controls</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Management Hub</h1>
              <p className="text-sm text-brand-surface/80 mt-1">
                Full platform control for doctor registration, patient records, and radiograph scan archives.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  fetchStats();
                  fetchDoctors();
                  fetchPatients();
                  fetchScans();
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-white/15"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-brand-border space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "overview"
                  ? "border-brand-indigo text-brand-indigo"
                  : "border-transparent text-brand-muted hover:text-brand-navy"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Overview Stats</span>
            </button>
            <button
              onClick={() => setActiveTab("doctors")}
              className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "doctors"
                  ? "border-brand-indigo text-brand-indigo"
                  : "border-transparent text-brand-muted hover:text-brand-navy"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctors ({doctors.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("patients")}
              className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "patients"
                  ? "border-brand-indigo text-brand-indigo"
                  : "border-transparent text-brand-muted hover:text-brand-navy"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Patients ({patients.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("scans")}
              className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "scans"
                  ? "border-brand-indigo text-brand-indigo"
                  : "border-transparent text-brand-muted hover:text-brand-navy"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Scan Records ({scans.length})</span>
            </button>
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-brand-white p-6 rounded-2xl border border-brand-border shadow-soft flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
                      Total Doctors
                    </p>
                    <p className="text-3xl font-bold text-brand-navy mt-1">
                      {loadingStats ? "..." : stats?.total_doctors ?? 0}
                    </p>
                    <p className="text-xs text-brand-muted mt-1">Registered Practitioners</p>
                  </div>
                  <div className="p-3 bg-brand-indigo/10 rounded-2xl text-brand-indigo">
                    <Stethoscope className="w-7 h-7" />
                  </div>
                </div>

                <div className="bg-brand-white p-6 rounded-2xl border border-brand-border shadow-soft flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
                      Total Patients
                    </p>
                    <p className="text-3xl font-bold text-brand-navy mt-1">
                      {loadingStats ? "..." : stats?.total_patients ?? 0}
                    </p>
                    <p className="text-xs text-brand-muted mt-1">Enrolled Clinical Patients</p>
                  </div>
                  <div className="p-3 bg-brand-teal/10 rounded-2xl text-brand-teal">
                    <Users className="w-7 h-7" />
                  </div>
                </div>

                <div className="bg-brand-white p-6 rounded-2xl border border-brand-border shadow-soft flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
                      Diagnostic Scans
                    </p>
                    <p className="text-3xl font-bold text-brand-navy mt-1">
                      {loadingStats ? "..." : stats?.total_scans ?? 0}
                    </p>
                    <p className="text-xs text-brand-muted mt-1">AI Radiographs Processed</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-600">
                    <Activity className="w-7 h-7" />
                  </div>
                </div>

                <div className="bg-brand-white p-6 rounded-2xl border border-brand-border shadow-soft flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
                      Appointments
                    </p>
                    <p className="text-3xl font-bold text-brand-navy mt-1">
                      {loadingStats ? "..." : stats?.total_appointments ?? 0}
                    </p>
                    <p className="text-xs text-brand-muted mt-1">
                      {stats?.pending_appointments ?? 0} Pending Approval
                    </p>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600">
                    <Calendar className="w-7 h-7" />
                  </div>
                </div>
              </div>

              {/* Quick Actions & Pneumonia Ratio Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Diagnostic Ratio Card */}
                <div className="bg-brand-white p-6 rounded-2xl border border-brand-border shadow-soft lg:col-span-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-brand-navy mb-1">
                      AI Diagnostic Outcomes
                    </h3>
                    <p className="text-xs text-brand-muted mb-6">
                      Distribution of normal vs pneumonia detections across scans.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Pneumonia Positive
                          </span>
                          <span className="text-brand-navy">
                            {stats?.pneumonia_scans ?? 0} scans
                          </span>
                        </div>
                        <div className="w-full bg-brand-surface rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-red-500 h-3 rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                stats?.total_scans
                                  ? Math.round((stats.pneumonia_scans / stats.total_scans) * 100)
                                  : 0
                              }%`
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Normal / Healthy
                          </span>
                          <span className="text-brand-navy font-semibold">
                            {stats?.normal_scans ?? 0} scans
                          </span>
                        </div>
                        <div className="w-full bg-brand-surface rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                stats?.total_scans
                                  ? Math.round((stats.normal_scans / stats.total_scans) * 100)
                                  : 0
                              }%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-brand-border mt-6 flex justify-between items-center text-xs text-brand-muted font-medium">
                    <span>Positivity Rate:</span>
                    <span className="text-sm font-bold text-brand-navy">
                      {stats?.total_scans
                        ? `${Math.round((stats.pneumonia_scans / stats.total_scans) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>

                {/* Quick Management Actions */}
                <div className="bg-brand-white p-6 rounded-2xl border border-brand-border shadow-soft lg:col-span-2 space-y-4">
                  <h3 className="text-base font-semibold text-brand-navy">
                    Administrator Quick Actions
                  </h3>
                  <p className="text-xs text-brand-muted mb-4">
                    Fast shortcut options to onboard clinical staff, register patients, or inspect scans.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => {
                        setActiveTab("doctors");
                        setShowAddDoctorModal(true);
                      }}
                      className="p-4 bg-brand-surface hover:bg-brand-indigo/5 border border-brand-border hover:border-brand-indigo/30 rounded-xl text-left transition-all group"
                    >
                      <div className="p-2.5 bg-brand-indigo/10 text-brand-indigo rounded-lg w-fit mb-3 group-hover:scale-105 transition-transform">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-brand-navy mb-1">Add New Doctor</h4>
                      <p className="text-xs text-brand-muted">Register practitioner account credentials</p>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("patients");
                        setShowAddPatientModal(true);
                      }}
                      className="p-4 bg-brand-surface hover:bg-brand-teal/5 border border-brand-border hover:border-brand-teal/30 rounded-xl text-left transition-all group"
                    >
                      <div className="p-2.5 bg-brand-teal/10 text-brand-teal rounded-lg w-fit mb-3 group-hover:scale-105 transition-transform">
                        <Plus className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-brand-navy mb-1">Add New Patient</h4>
                      <p className="text-xs text-brand-muted">Register clinical patient record</p>
                    </button>

                    <button
                      onClick={() => setActiveTab("scans")}
                      className="p-4 bg-brand-surface hover:bg-purple-500/5 border border-brand-border hover:border-purple-500/30 rounded-xl text-left transition-all group"
                    >
                      <div className="p-2.5 bg-purple-500/10 text-purple-600 rounded-lg w-fit mb-3 group-hover:scale-105 transition-transform">
                        <Activity className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-brand-navy mb-1">Browse All Scans</h4>
                      <p className="text-xs text-brand-muted">View X-Ray predictions & confidence</p>
                    </button>
                  </div>

                  {/* Recent Activity Table */}
                  <div className="pt-4">
                    <h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">
                      Recent Diagnostic Activity
                    </h4>
                    {stats?.recent_scans && stats.recent_scans.length > 0 ? (
                      <div className="space-y-2">
                        {stats.recent_scans.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between p-3 bg-brand-surface rounded-lg text-xs"
                          >
                            <div className="flex items-center space-x-3">
                              <span
                                className={`px-2 py-0.5 font-semibold rounded-full text-[10px] ${
                                  s.result === "Pneumonia"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {s.result}
                              </span>
                              <span className="font-semibold text-brand-navy">{s.patient_name}</span>
                              <span className="text-brand-muted">({s.patient_email})</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="text-brand-muted font-medium">
                                {(s.confidence * 100).toFixed(1)}% confidence
                              </span>
                              <span className="text-brand-muted text-[11px]">
                                {new Date(s.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-brand-muted">No diagnostic scan records available yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOCTORS TAB */}
          {activeTab === "doctors" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search doctor by name or email..."
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    className="w-full bg-brand-white border border-brand-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo"
                  />
                </div>
                <button
                  onClick={() => {
                    setModalError(null);
                    setShowAddDoctorModal(true);
                  }}
                  className="px-4 py-2.5 bg-brand-indigo text-brand-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-soft hover:bg-brand-indigo/90"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Doctor</span>
                </button>
              </div>

              {/* Doctors Table */}
              <div className="bg-brand-white rounded-2xl border border-brand-border shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-brand-navy">
                    <thead className="bg-brand-surface text-brand-muted uppercase text-xs tracking-wider border-b border-brand-border">
                      <tr>
                        <th className="py-3.5 px-6 font-semibold">Doctor Profile</th>
                        <th className="py-3.5 px-6 font-semibold">Contact Email</th>
                        <th className="py-3.5 px-6 font-semibold">Phone Number</th>
                        <th className="py-3.5 px-6 font-semibold">Address / Clinic</th>
                        <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border font-medium">
                      {loadingDoctors ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-brand-muted text-sm">
                            Loading doctor directory...
                          </td>
                        </tr>
                      ) : filteredDoctors.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-brand-muted text-sm">
                            No doctor accounts found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredDoctors.map((doc) => (
                          <tr key={doc.id} className="hover:bg-brand-surface/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-full bg-brand-indigo/10 flex items-center justify-center text-brand-indigo font-bold text-sm">
                                  {doc.first_name ? doc.first_name[0] : doc.email[0].toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-brand-navy">
                                    Dr. {doc.first_name || doc.last_name ? `${doc.first_name} ${doc.last_name}` : "Practitioner"}
                                  </div>
                                  <div className="text-xs text-brand-muted font-normal">Medical Staff</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-brand-navy">{doc.email}</td>
                            <td className="py-4 px-6 text-brand-muted">
                              {doc.contact_number || "Not provided"}
                            </td>
                            <td className="py-4 px-6 text-brand-muted">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-brand-indigo/10 text-brand-indigo mb-1">
                                {doc.clinic_name || "Unassigned"}
                              </span>
                              <span className="block text-[11px] text-brand-muted">
                                {doc.address || "Main Medical Center"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleDeleteDoctor(doc.id)}
                                className="p-2 text-brand-muted hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                                title="Remove Doctor Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PATIENTS TAB */}
          {activeTab === "patients" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search patient by name or email..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full bg-brand-white border border-brand-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo"
                  />
                </div>
                <button
                  onClick={() => {
                    setModalError(null);
                    setShowAddPatientModal(true);
                  }}
                  className="px-4 py-2.5 bg-brand-teal text-brand-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-soft hover:bg-brand-teal/90"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Patient</span>
                </button>
              </div>

              {/* Patients Table */}
              <div className="bg-brand-white rounded-2xl border border-brand-border shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-brand-navy">
                    <thead className="bg-brand-surface text-brand-muted uppercase text-xs tracking-wider border-b border-brand-border">
                      <tr>
                        <th className="py-3.5 px-6 font-semibold">Patient Name</th>
                        <th className="py-3.5 px-6 font-semibold">Email</th>
                        <th className="py-3.5 px-6 font-semibold">Age / Gender</th>
                        <th className="py-3.5 px-6 font-semibold">Blood Group</th>
                        <th className="py-3.5 px-6 font-semibold">Contact Phone</th>
                        <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border font-medium">
                      {loadingPatients ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-brand-muted text-sm">
                            Loading patient registry...
                          </td>
                        </tr>
                      ) : filteredPatients.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-brand-muted text-sm">
                            No patient records found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredPatients.map((pat) => (
                          <tr key={pat.id} className="hover:bg-brand-surface/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-semibold text-brand-navy">
                                {pat.first_name || pat.last_name
                                  ? `${pat.first_name} ${pat.last_name}`
                                  : pat.email}
                              </div>
                              <div className="text-xs text-brand-muted font-normal">
                                Enrolled: {new Date(pat.date_joined).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-brand-navy">{pat.email}</td>
                            <td className="py-4 px-6 text-brand-muted">
                              {pat.age ? `${pat.age} yrs` : "N/A"} • {pat.gender || "Not specified"}
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-md border border-red-200">
                                {pat.blood_group || "Unknown"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-brand-muted">
                              {pat.contact_number || "Not provided"}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleDeletePatient(pat.id)}
                                className="p-2 text-brand-muted hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                                title="Remove Patient Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SCANS TAB */}
          {activeTab === "scans" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setScanFilter("ALL")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      scanFilter === "ALL"
                        ? "bg-brand-indigo text-brand-white"
                        : "bg-brand-white text-brand-navy border border-brand-border hover:bg-brand-surface"
                    }`}
                  >
                    All Scans ({scans.length})
                  </button>
                  <button
                    onClick={() => setScanFilter("Pneumonia")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      scanFilter === "Pneumonia"
                        ? "bg-red-600 text-white"
                        : "bg-brand-white text-red-600 border border-brand-border hover:bg-red-50"
                    }`}
                  >
                    Pneumonia Positive ({scans.filter((s) => s.result === "Pneumonia").length})
                  </button>
                  <button
                    onClick={() => setScanFilter("Normal")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      scanFilter === "Normal"
                        ? "bg-emerald-600 text-white"
                        : "bg-brand-white text-emerald-600 border border-brand-border hover:bg-emerald-50"
                    }`}
                  >
                    Normal ({scans.filter((s) => s.result === "Normal").length})
                  </button>
                </div>

                <div className="relative max-w-xs">
                  <Search className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by patient name or email..."
                    value={scanSearch}
                    onChange={(e) => setScanSearch(e.target.value)}
                    className="w-full bg-brand-white border border-brand-border rounded-lg py-2 pl-9 pr-4 text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo"
                  />
                </div>
              </div>

              {/* Scans Grid */}
              {loadingScans ? (
                <div className="py-12 text-center text-brand-muted text-sm">
                  Loading diagnostic scans archive...
                </div>
              ) : filteredScans.length === 0 ? (
                <div className="bg-brand-white p-12 text-center rounded-2xl border border-brand-border text-brand-muted text-sm">
                  No diagnostic scans match the active search criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredScans.map((scan) => (
                    <div
                      key={scan.id}
                      className="bg-brand-white rounded-2xl border border-brand-border shadow-soft overflow-hidden flex flex-col hover:border-brand-indigo/30 transition-all group"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative h-48 bg-slate-950 overflow-hidden flex items-center justify-center">
                        {scan.image_url ? (
                          <img
                            src={scan.image_url}
                            alt="Chest Radiograph"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Activity className="w-12 h-12 text-slate-700" />
                        )}

                        <div className="absolute top-3 left-3">
                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-full shadow-md ${
                              scan.result === "Pneumonia"
                                ? "bg-red-600 text-white"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            {scan.result}
                          </span>
                        </div>

                        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm">
                          {(scan.confidence * 100).toFixed(1)}% confidence
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-brand-navy text-base">{scan.patient_name}</h4>
                          <p className="text-xs text-brand-muted font-medium mb-3">{scan.patient_email}</p>

                          {scan.doctor_remarks && (
                            <p className="text-xs text-brand-navy bg-brand-surface p-2.5 rounded-lg border border-brand-border/60 italic mb-3">
                              "{scan.doctor_remarks}"
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-brand-border flex items-center justify-between">
                          <span className="text-[11px] text-brand-muted font-medium">
                            {new Date(scan.created_at).toLocaleString()}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDownloadScanReport(scan)}
                              className="p-1.5 text-brand-teal hover:bg-brand-teal/10 rounded-lg transition-colors"
                              title="Download Report & Prescription"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setSelectedScan(scan)}
                              className="px-3 py-1.5 bg-brand-indigo/10 text-brand-indigo hover:bg-brand-indigo text-xs font-semibold rounded-lg hover:text-white transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Detail</span>
                            </button>
                            <button
                              onClick={() => handleDeleteScan(scan.id)}
                              className="p-1.5 text-brand-muted hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete Scan Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ADD DOCTOR MODAL */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-white rounded-2xl border border-brand-border max-w-lg w-full p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-brand-border mb-4">
              <div className="flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-brand-indigo" />
                <h3 className="font-bold text-brand-navy text-lg">Add New Doctor Account</h3>
              </div>
              <button
                onClick={() => setShowAddDoctorModal(false)}
                className="text-brand-muted hover:text-brand-navy p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robert"
                    value={newDoctor.first_name}
                    onChange={(e) => setNewDoctor({ ...newDoctor, first_name: e.target.value })}
                    className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-navy focus:outline-none focus:border-brand-indigo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chen"
                    value={newDoctor.last_name}
                    onChange={(e) => setNewDoctor({ ...newDoctor, last_name: e.target.value })}
                    className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-navy focus:outline-none focus:border-brand-indigo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="doctor@hospital.org"
                  value={newDoctor.email}
                  onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-navy focus:outline-none focus:border-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newDoctor.password}
                  onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-navy focus:outline-none focus:border-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 019-2834"
                  value={newDoctor.contact_number}
                  onChange={(e) => setNewDoctor({ ...newDoctor, contact_number: e.target.value })}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-navy focus:outline-none focus:border-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                  Assign Clinic / Medical Center
                </label>
                <select
                  value={newDoctor.clinic_id}
                  onChange={(e) => setNewDoctor({ ...newDoctor, clinic_id: e.target.value })}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-navy focus:outline-none focus:border-brand-indigo font-medium"
                >
                  <option value="">-- Choose Clinic Center --</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.specialty ? `• ${c.specialty}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                  Department / Room Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pulmonology Wing B, Room 302"
                  value={newDoctor.address}
                  onChange={(e) => setNewDoctor({ ...newDoctor, address: e.target.value })}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-navy focus:outline-none focus:border-brand-indigo"
                />
              </div>

              <div className="pt-4 border-t border-brand-border flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-brand-indigo text-white rounded-lg text-sm font-semibold hover:bg-brand-indigo/90 disabled:opacity-50"
                >
                  {modalLoading ? "Creating..." : "Save Doctor Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PATIENT MODAL */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-white rounded-2xl border border-brand-border max-w-lg w-full p-6 shadow-xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-brand-border mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-brand-teal" />
                <h3 className="font-bold text-brand-navy text-lg">Add New Patient Record</h3>
              </div>
              <button
                onClick={() => setShowAddPatientModal(false)}
                className="text-brand-muted hover:text-brand-navy p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John"
                    value={newPatient.first_name}
                    onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
                    className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-navy focus:outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Doe"
                    value={newPatient.last_name}
                    onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
                    className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-navy focus:outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="patient@gmail.com"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-navy focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPatient.password}
                  onChange={(e) => setNewPatient({ ...newPatient, password: e.target.value })}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-navy focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    placeholder="45"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-navy focus:outline-none focus:border-brand-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                    Gender
                  </label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-navy focus:outline-none focus:border-brand-teal"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                    Blood Group
                  </label>
                  <select
                    value={newPatient.blood_group}
                    onChange={(e) => setNewPatient({ ...newPatient, blood_group: e.target.value })}
                    className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-navy focus:outline-none focus:border-brand-teal"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 482-9012"
                  value={newPatient.contact_number}
                  onChange={(e) => setNewPatient({ ...newPatient, contact_number: e.target.value })}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-navy focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase mb-1">
                  Residential Address
                </label>
                <textarea
                  rows={2}
                  placeholder="742 Evergreen Terrace, Springfield"
                  value={newPatient.address}
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-navy focus:outline-none focus:border-brand-teal resize-none"
                />
              </div>

              <div className="pt-4 border-t border-brand-border flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddPatientModal(false)}
                  className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-brand-teal text-white rounded-lg text-sm font-semibold hover:bg-brand-teal/90 disabled:opacity-50"
                >
                  {modalLoading ? "Registering..." : "Save Patient Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCAN LIGHTBOX DETAIL MODAL */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-brand-white rounded-2xl border border-brand-border max-w-3xl w-full p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-brand-border mb-4">
              <div>
                <h3 className="font-bold text-brand-navy text-xl">{selectedScan.patient_name}</h3>
                <p className="text-xs text-brand-muted">{selectedScan.patient_email}</p>
              </div>
              <button
                onClick={() => setSelectedScan(null)}
                className="text-brand-muted hover:text-brand-navy p-1 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Radiograph Image Display */}
              <div className="bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center min-h-65">
                {selectedScan.image_url ? (
                  <img
                    src={selectedScan.image_url}
                    alt="Radiograph Detail"
                    className="max-h-87.5 w-full object-contain"
                  />
                ) : (
                  <div className="text-slate-600 text-xs">No preview image file available</div>
                )}
              </div>

              {/* Diagnostic Prediction Breakdown */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-brand-surface border border-brand-border">
                    <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block mb-1">
                      AI Radiographic Prediction
                    </span>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xl font-bold ${
                          selectedScan.result === "Pneumonia" ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        {selectedScan.result}
                      </span>
                      <span className="px-3 py-1 bg-brand-white rounded-full text-xs font-bold text-brand-navy border border-brand-border shadow-xs">
                        {(selectedScan.confidence * 100).toFixed(1)}% confidence
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block mb-1">
                      Doctor Clinical Remarks
                    </span>
                    <p className="text-sm text-brand-navy bg-brand-surface p-3 rounded-xl border border-brand-border italic min-h-17.5">
                      {selectedScan.doctor_remarks || "No clinical remarks added by practitioner."}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block mb-1">
                      Scan Timestamp
                    </span>
                    <p className="text-xs text-brand-navy font-medium">
                      {new Date(selectedScan.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-border flex justify-end space-x-3">
                  <button
                    onClick={() => handleDownloadScanReport(selectedScan)}
                    className="px-4 py-2 bg-brand-teal text-white hover:bg-brand-teal/90 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Report & Prescription</span>
                  </button>
                  <button
                    onClick={() => handleDeleteScan(selectedScan.id)}
                    className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Record</span>
                  </button>
                  <button
                    onClick={() => setSelectedScan(null)}
                    className="px-4 py-2 bg-brand-navy text-white rounded-lg text-xs font-semibold hover:bg-brand-navy/90"
                  >
                    Close Viewer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
