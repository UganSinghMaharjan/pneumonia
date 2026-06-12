"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import {
  Users,
  Search,
  Loader2,
  User,
  Activity,
  FileText,
  Heart,
  Plus,
  Check,
  Calendar,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface PatientRecord {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string;
  contact_number: string;
  address: string;
  blood_group: string;
}

interface ScanRecord {
  id: number;
  result: string;
  confidence: number;
  doctor_remarks: string;
  image_url: string;
  created_at: string;
}

interface PrescriptionRecord {
  id: number;
  medication: string;
  dosage: string;
  instructions: string;
  doctor_notes: string;
  date_issued: string;
}

interface MedicalHistoryRecord {
  id: number;
  condition: string;
  diagnosis_date: string;
  treatment: string;
  notes: string;
}

export default function DoctorPatientsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Tabs for Patient File details
  const [patientTab, setPatientTab] = useState<
    "history" | "scans" | "prescriptions"
  >("history");

  // Selected Patient Records
  const [patientScans, setPatientScans] = useState<ScanRecord[]>([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState<
    PrescriptionRecord[]
  >([]);
  const [patientHistory, setPatientHistory] = useState<MedicalHistoryRecord[]>(
    [],
  );
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Forms States
  const [historyForm, setHistoryForm] = useState({
    condition: "",
    diagnosis_date: new Date().toISOString().split("T")[0],
    treatment: "",
    notes: "",
  });
  const [prescriptionForm, setPrescriptionForm] = useState({
    medication: "",
    dosage: "",
    instructions: "",
    doctor_notes: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

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
      fetchPatients(storedToken);
    }
  }, [router]);

  const fetchPatients = async (authToken: string) => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8000/api/patients/", {
        headers: { Authorization: `Token ${authToken}` },
      });
      setPatients(response.data);
      if (response.data.length > 0) {
        setSelectedPatient(response.data[0]);
        fetchPatientRecords(response.data[0].id, authToken);
      }
    } catch (err) {
      console.error("Failed to load patients list", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientRecords = async (patientId: number, authToken: string) => {
    setRecordsLoading(true);
    const headers = { Authorization: `Token ${authToken}` };
    try {
      // Scans
      const scansRes = await axios.get("http://localhost:8000/api/scans/", {
        headers,
      });
      setPatientScans(
        scansRes.data.filter((s: any) => s.patient_id === patientId),
      );

      // Prescriptions
      const presRes = await axios.get(
        `http://localhost:8000/api/prescriptions/?patient_id=${patientId}`,
        { headers },
      );
      setPatientPrescriptions(presRes.data);

      // History
      const histRes = await axios.get(
        `http://localhost:8000/api/medical-histories/?patient_id=${patientId}`,
        { headers },
      );
      setPatientHistory(histRes.data);
    } catch (err) {
      console.error("Failed to fetch patient records", err);
    } finally {
      setRecordsLoading(false);
    }
  };

  const selectPatient = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    if (token) {
      fetchPatientRecords(patient.id, token);
    }
  };

  const handleAddHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPatient) return;

    setFormSubmitting(true);
    try {
      await axios.post(
        "http://localhost:8000/api/medical-histories/",
        {
          patient_id: selectedPatient.id,
          condition: historyForm.condition,
          diagnosis_date: historyForm.diagnosis_date,
          treatment: historyForm.treatment,
          notes: historyForm.notes,
        },
        { headers: { Authorization: `Token ${token}` } },
      );

      // Reset form
      setHistoryForm({
        condition: "",
        diagnosis_date: new Date().toISOString().split("T")[0],
        treatment: "",
        notes: "",
      });

      // Reload
      fetchPatientRecords(selectedPatient.id, token);
    } catch (err) {
      console.error("Failed to add medical history", err);
      alert("Failed to save history. Please check details.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPatient) return;

    setFormSubmitting(true);
    try {
      await axios.post(
        "http://localhost:8000/api/prescriptions/",
        {
          patient_id: selectedPatient.id,
          medication: prescriptionForm.medication,
          dosage: prescriptionForm.dosage,
          instructions: prescriptionForm.instructions,
          doctor_notes: prescriptionForm.doctor_notes,
        },
        { headers: { Authorization: `Token ${token}` } },
      );

      // Reset form
      setPrescriptionForm({
        medication: "",
        dosage: "",
        instructions: "",
        doctor_notes: "",
      });

      // Reload
      fetchPatientRecords(selectedPatient.id, token);
    } catch (err) {
      console.error("Failed to issue prescription", err);
      alert("Failed to issue prescription. Please check details.");
    } finally {
      setFormSubmitting(false);
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

  // Filter patients list by search query
  const filteredPatients = patients.filter(
    (p) =>
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.last_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-screen overflow-hidden bg-brand-surface font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col pl-64 h-screen overflow-hidden">
        <Topbar username={username} onLogout={handleLogout} />

        <main className="flex-1 overflow-hidden p-8 flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-navy mb-1">
              Clinic Patient Records
            </h1>
            <p className="text-brand-muted font-medium">
              Access active medical profiles, diagnostic radiograph catalogues,
              and write prescription charts.
            </p>
          </div>

          {loading ? (
            <div className="flex-1 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-brand-indigo animate-spin" />
            </div>
          ) : patients.length === 0 ? (
            <div className="bg-brand-white border border-brand-border rounded-2xl p-12 text-center max-w-xl mx-auto flex flex-col items-center flex-1 justify-center">
              <Users className="w-8 h-8 text-brand-muted mb-3" />
              <h4 className="font-bold text-brand-navy text-sm">
                No registered patients in database
              </h4>
              <p className="text-xs text-brand-muted mt-1">
                Patients will appear here once they register their credentials.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex gap-8 overflow-hidden">
              {/* Left Pane: Patient List */}
              <div className="w-80 bg-brand-white border border-brand-border rounded-2xl flex flex-col overflow-hidden shadow-soft">
                <div className="p-4 border-b border-brand-border bg-brand-white">
                  <div className="relative">
                    <Search className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search patient name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-brand-surface border border-transparent rounded-lg py-2 pl-9 pr-4 text-xs text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo w-full"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-brand-border/40">
                  {filteredPatients.map((p) => {
                    const isSelected = selectedPatient?.id === p.id;
                    const name = `${p.first_name} ${p.last_name}`.trim();
                    return (
                      <button
                        key={p.id}
                        onClick={() => selectPatient(p)}
                        className={`w-full text-left p-4 transition-colors flex items-center space-x-3 ${
                          isSelected
                            ? "bg-brand-indigo/5 border-l-4 border-brand-indigo"
                            : "hover:bg-brand-surface/40 border-l-4 border-transparent"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-brand-indigo/10 flex items-center justify-center border border-brand-indigo/20 flex-shrink-0">
                          <span className="font-bold text-brand-indigo text-sm uppercase">
                            {name ? name[0] : p.email[0]}
                          </span>
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-brand-navy text-xs truncate">
                            {name || "No Name Registered"}
                          </h4>
                          <span className="text-[10px] text-brand-muted block truncate mt-0.5">
                            {p.email}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {filteredPatients.length === 0 && (
                    <div className="text-center py-8 text-brand-muted text-xs font-semibold">
                      No patients match query.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Pane: Selected Patient Details Chart */}
              {selectedPatient && (
                <div className="flex-1 bg-brand-white border border-brand-border rounded-2xl flex flex-col overflow-hidden shadow-soft">
                  {/* Header/Info Card */}
                  <div className="p-6 border-b border-brand-border bg-brand-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-brand-indigo/10 flex items-center justify-center border border-brand-indigo/20">
                        <User className="w-6 h-6 text-brand-indigo" />
                      </div>
                      <div>
                        <h2 className="font-extrabold text-brand-navy text-lg leading-tight">
                          {selectedPatient.first_name ||
                          selectedPatient.last_name
                            ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                            : "No Name Registered"}
                        </h2>
                        <span className="text-xs text-brand-muted font-bold uppercase tracking-wider">
                          {selectedPatient.email}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs text-brand-navy border-l border-brand-border/40 pl-6">
                      <p>
                        <strong className="text-brand-muted uppercase text-[9px] block">
                          Age
                        </strong>{" "}
                        {selectedPatient.age
                          ? `${selectedPatient.age} Yrs`
                          : "—"}
                      </p>
                      <p>
                        <strong className="text-brand-muted uppercase text-[9px] block">
                          Gender
                        </strong>{" "}
                        <span className="capitalize">
                          {selectedPatient.gender || "—"}
                        </span>
                      </p>
                      <p>
                        <strong className="text-brand-muted uppercase text-[9px] block">
                          Blood Group
                        </strong>{" "}
                        {selectedPatient.blood_group || "—"}
                      </p>
                      <p>
                        <strong className="text-brand-muted uppercase text-[9px] block">
                          Contact
                        </strong>{" "}
                        {selectedPatient.contact_number || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Navigation tabs inside Chart */}
                  <div className="flex border-b border-brand-border bg-brand-surface/30 px-6">
                    {[
                      { id: "history", label: "Medical History", icon: Heart },
                      {
                        id: "scans",
                        label: "Scan Diagnostics",
                        icon: Activity,
                      },
                      {
                        id: "prescriptions",
                        label: "Prescription log",
                        icon: FileText,
                      },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setPatientTab(tab.id as any)}
                          className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center space-x-2 transition-all ${
                            patientTab === tab.id
                              ? "border-brand-indigo text-brand-indigo bg-brand-white"
                              : "border-transparent text-brand-muted hover:text-brand-navy"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Body */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {recordsLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 text-brand-indigo animate-spin" />
                      </div>
                    ) : (
                      <>
                        {/* Tab 1: Medical History */}
                        {patientTab === "history" && (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                              <h3 className="text-sm font-bold text-brand-navy border-b border-brand-border/60 pb-2 uppercase tracking-wider">
                                Clinical Records History
                              </h3>
                              {patientHistory.length === 0 ? (
                                <div className="text-center py-8 bg-brand-surface/30 rounded-xl border border-dashed border-brand-border">
                                  <p className="text-brand-muted text-xs font-semibold">
                                    No medical history logged.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {patientHistory.map((hist) => (
                                    <div
                                      key={hist.id}
                                      className="p-4 border border-brand-border rounded-xl bg-brand-surface/20 flex flex-col justify-between"
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-brand-navy text-sm">
                                          {hist.condition}
                                        </h4>
                                        <span className="text-[10px] text-brand-muted font-bold flex items-center space-x-1">
                                          <Calendar className="w-3.5 h-3.5" />
                                          <span>
                                            Diagnosed: {hist.diagnosis_date}
                                          </span>
                                        </span>
                                      </div>
                                      {hist.treatment && (
                                        <p className="text-xs text-brand-navy mb-1">
                                          <strong className="text-brand-muted uppercase text-[9px] block">
                                            Treatment Protocol:
                                          </strong>{" "}
                                          {hist.treatment}
                                        </p>
                                      )}
                                      {hist.notes && (
                                        <p className="text-xs text-brand-muted bg-brand-white border border-brand-border/60 p-2.5 rounded-lg italic mt-1 font-semibold break-words">
                                          "{hist.notes}"
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Add History Form */}
                            <div className="lg:col-span-1">
                              <div className="bg-brand-surface/30 border border-brand-border rounded-2xl p-5">
                                <h3 className="font-bold text-brand-navy text-xs uppercase tracking-wider mb-4 flex items-center space-x-1">
                                  <Plus className="w-4 h-4 text-brand-indigo" />
                                  <span>Log Medical History</span>
                                </h3>
                                <form
                                  onSubmit={handleAddHistory}
                                  className="space-y-4"
                                >
                                  <div>
                                    <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">
                                      Condition
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="e.g. Asthma, Chronic Bronchitis"
                                      value={historyForm.condition}
                                      onChange={(e) =>
                                        setHistoryForm({
                                          ...historyForm,
                                          condition: e.target.value,
                                        })
                                      }
                                      className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-navy focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">
                                      Diagnosis Date
                                    </label>
                                    <input
                                      type="date"
                                      required
                                      value={historyForm.diagnosis_date}
                                      onChange={(e) =>
                                        setHistoryForm({
                                          ...historyForm,
                                          diagnosis_date: e.target.value,
                                        })
                                      }
                                      className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-navy focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">
                                      Treatment Plan
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Albuterol inhaler twice daily"
                                      value={historyForm.treatment}
                                      onChange={(e) =>
                                        setHistoryForm({
                                          ...historyForm,
                                          treatment: e.target.value,
                                        })
                                      }
                                      className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-navy focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">
                                      Clinical Notes
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={historyForm.notes}
                                      onChange={(e) =>
                                        setHistoryForm({
                                          ...historyForm,
                                          notes: e.target.value,
                                        })
                                      }
                                      className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-navy focus:outline-none resize-none"
                                    />
                                  </div>
                                  <button
                                    type="submit"
                                    disabled={formSubmitting}
                                    className="w-full bg-brand-indigo hover:bg-[#2a2853] text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Log History</span>
                                  </button>
                                </form>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tab 2: Scan Records */}
                        {patientTab === "scans" && (
                          <div className="space-y-4">
                            <h3 className="text-sm font-bold text-brand-navy border-b border-brand-border/60 pb-2 uppercase tracking-wider">
                              Radiograph Diagnosis Records
                            </h3>
                            {patientScans.length === 0 ? (
                              <div className="text-center py-8 bg-brand-surface/30 rounded-xl border border-dashed border-brand-border">
                                <p className="text-brand-muted text-xs font-semibold">
                                  No scans conducted for this patient.
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {patientScans.map((scan) => (
                                  <div
                                    key={scan.id}
                                    className="border border-brand-border rounded-xl overflow-hidden hover:shadow-soft bg-brand-white flex flex-col"
                                  >
                                    <div className="h-40 bg-slate-900 flex items-center justify-center overflow-hidden relative">
                                      {scan.image_url ? (
                                        <img
                                          src={scan.image_url}
                                          alt="Radiograph"
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-brand-muted text-[10px]">
                                          No image preview
                                        </span>
                                      )}
                                      <span
                                        className={`absolute top-2.5 right-2.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                                          scan.result === "Normal"
                                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                            : "bg-rose-50 text-rose-600 border-rose-200"
                                        }`}
                                      >
                                        {scan.result}
                                      </span>
                                    </div>
                                    <div className="p-4 space-y-2">
                                      <div className="flex justify-between items-center text-[10px] text-brand-muted font-bold">
                                        <span>
                                          {new Date(
                                            scan.created_at,
                                          ).toLocaleDateString()}
                                        </span>
                                        <span>
                                          AI Conf:{" "}
                                          {(scan.confidence * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                      <p className="text-xs text-brand-navy border-t border-brand-border/40 pt-2 break-words italic">
                                        {scan.doctor_remarks
                                          ? `"${scan.doctor_remarks}"`
                                          : "Remarks pending clinician clinical notes."}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tab 3: Prescriptions */}
                        {patientTab === "prescriptions" && (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                              <h3 className="text-sm font-bold text-brand-navy border-b border-brand-border/60 pb-2 uppercase tracking-wider">
                                Issued Prescription Logs
                              </h3>
                              {patientPrescriptions.length === 0 ? (
                                <div className="text-center py-8 bg-brand-surface/30 rounded-xl border border-dashed border-brand-border">
                                  <p className="text-brand-muted text-xs font-semibold">
                                    No prescriptions logged.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {patientPrescriptions.map((pres) => (
                                    <div
                                      key={pres.id}
                                      className="p-4 border border-brand-border rounded-xl bg-brand-surface/20"
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-brand-navy text-sm">
                                          {pres.medication}
                                        </h4>
                                        <span className="text-[10px] text-brand-muted font-bold">
                                          Issued:{" "}
                                          {new Date(
                                            pres.date_issued,
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-xs text-brand-navy">
                                        <strong className="text-brand-muted uppercase text-[9px]">
                                          Dosage:
                                        </strong>{" "}
                                        {pres.dosage}
                                      </p>
                                      <p className="text-xs text-brand-navy mt-1">
                                        <strong className="text-brand-muted uppercase text-[9px] block">
                                          Instructions:
                                        </strong>{" "}
                                        {pres.instructions}
                                      </p>
                                      {pres.doctor_notes && (
                                        <div className="text-[11px] text-brand-muted mt-2 pt-2 border-t border-brand-border/40">
                                          <strong className="text-brand-navy">
                                            Attending Notes:
                                          </strong>{" "}
                                          {pres.doctor_notes}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Add Prescription Form */}
                            <div className="lg:col-span-1">
                              <div className="bg-brand-surface/30 border border-brand-border rounded-2xl p-5">
                                <h3 className="font-bold text-brand-navy text-xs uppercase tracking-wider mb-4 flex items-center space-x-1">
                                  <Plus className="w-4 h-4 text-brand-indigo" />
                                  <span>Issue Prescription Chart</span>
                                </h3>
                                <form
                                  onSubmit={handleAddPrescription}
                                  className="space-y-4"
                                >
                                  <div>
                                    <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">
                                      Medication Name
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="e.g. Amoxicillin 500mg"
                                      value={prescriptionForm.medication}
                                      onChange={(e) =>
                                        setPrescriptionForm({
                                          ...prescriptionForm,
                                          medication: e.target.value,
                                        })
                                      }
                                      className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-navy focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">
                                      Dosage
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="e.g. 1 capsule three times daily"
                                      value={prescriptionForm.dosage}
                                      onChange={(e) =>
                                        setPrescriptionForm({
                                          ...prescriptionForm,
                                          dosage: e.target.value,
                                        })
                                      }
                                      className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-navy focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">
                                      Attending Instructions
                                    </label>
                                    <textarea
                                      rows={2}
                                      required
                                      placeholder="Take with meals. Complete entire 10-day course."
                                      value={prescriptionForm.instructions}
                                      onChange={(e) =>
                                        setPrescriptionForm({
                                          ...prescriptionForm,
                                          instructions: e.target.value,
                                        })
                                      }
                                      className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-navy focus:outline-none resize-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">
                                      Doctor Notes (Optional)
                                    </label>
                                    <textarea
                                      rows={2}
                                      placeholder="Note any drug allergy checks performed."
                                      value={prescriptionForm.doctor_notes}
                                      onChange={(e) =>
                                        setPrescriptionForm({
                                          ...prescriptionForm,
                                          doctor_notes: e.target.value,
                                        })
                                      }
                                      className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-navy focus:outline-none resize-none"
                                    />
                                  </div>
                                  <button
                                    type="submit"
                                    disabled={formSubmitting}
                                    className="w-full bg-brand-indigo hover:bg-[#2a2853] text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Issue Prescription</span>
                                  </button>
                                </form>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
