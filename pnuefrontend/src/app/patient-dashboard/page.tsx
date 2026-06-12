"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import {
  User,
  Calendar,
  Clock,
  Activity,
  FileText,
  MapPin,
  Search,
  AlertCircle,
  CheckCircle,
  Clock3,
  Edit2,
  Check,
  X,
  Heart,
  Phone,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

interface UserProfile {
  id: number;
  username: string;
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

interface AppointmentRecord {
  id: number;
  requested_date: string;
  requested_time: string;
  appointment_date: string | null;
  appointment_time: string | null;
  reason: string;
  notes: string;
  doctor_notes: string;
  status: "Pending" | "Accepted" | "Rejected" | "Completed";
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

const mockHospitals = [
  {
    id: 1,
    name: "Maharjan Pulmonary Clinic",
    address: "123 Lung Health Way, Pulchowk, Lalitpur",
    phone: "+977-1-5543210",
    distance: "1.2 km",
    status: "Open Now",
    open: true,
    specialty: "Respiratory Specialists & Asthma Center",
  },
  {
    id: 2,
    name: "Patna Respiratory Care Center",
    address: "456 Pulmonary Avenue, Lalitpur",
    phone: "+977-1-5521045",
    distance: "2.5 km",
    status: "Open Now",
    open: true,
    specialty: "Pneumonia Treatment & Pulmonary Rehab",
  },
  {
    id: 3,
    name: "Norvic International Hospital",
    address: "Thapathali, Kathmandu",
    phone: "+977-1-4258554",
    distance: "4.1 km",
    status: "Closed",
    open: false,
    specialty: "Comprehensive Pulmonary & Critical Care",
  },
  {
    id: 4,
    name: "Bir Hospital Pulmonology Dept",
    address: "Kanti Path, Kathmandu",
    phone: "+977-1-4221119",
    distance: "5.0 km",
    status: "Open 24/7",
    open: true,
    specialty: "Pneumonia Checkup & Inpatient Respiratory Care",
  },
];

export default function PatientDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Profile Edit State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    age: "",
    gender: "",
    contact_number: "",
    address: "",
    blood_group: "",
  });

  // Data States
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [history, setHistory] = useState<MedicalHistoryRecord[]>([]);

  // Search State for Clinical Centers
  const [searchQuery, setSearchQuery] = useState("");

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
      fetchDashboardData(storedToken);
    }
  }, [router]);

  const fetchDashboardData = async (authToken: string) => {
    setLoading(true);
    const headers = { Authorization: `Token ${authToken}` };
    try {
      // 1. Fetch Profile
      const profileRes = await axios.get("http://localhost:8000/api/user/", {
        headers,
      });
      setProfile(profileRes.data);
      setEditForm({
        first_name: profileRes.data.first_name || "",
        last_name: profileRes.data.last_name || "",
        age: profileRes.data.age?.toString() || "",
        gender: profileRes.data.gender || "",
        contact_number: profileRes.data.contact_number || "",
        address: profileRes.data.address || "",
        blood_group: profileRes.data.blood_group || "",
      });

      // 2. Fetch Scans
      const scansRes = await axios.get("http://localhost:8000/api/scans/", {
        headers,
      });
      setScans(scansRes.data);

      // 3. Fetch Appointments
      const appRes = await axios.get(
        "http://localhost:8000/api/appointments/",
        { headers },
      );
      setAppointments(appRes.data);

      // 4. Fetch Prescriptions
      const presRes = await axios.get(
        "http://localhost:8000/api/prescriptions/",
        { headers },
      );
      setPrescriptions(presRes.data);

      // 5. Fetch Medical History
      const histRes = await axios.get(
        "http://localhost:8000/api/medical-histories/",
        { headers },
      );
      setHistory(histRes.data);
    } catch (err: any) {
      console.error("Error fetching dashboard data", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const headers = { Authorization: `Token ${token}` };
      const response = await axios.patch(
        "http://localhost:8000/api/user/",
        {
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          age: editForm.age === "" ? "" : parseInt(editForm.age),
          gender: editForm.gender,
          contact_number: editForm.contact_number,
          address: editForm.address,
          blood_group: editForm.blood_group,
        },
        { headers },
      );
      setProfile((prev: any) => ({ ...prev, ...response.data }));
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile. Please try again.");
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
          <div className="w-10 h-10 border-4 border-brand-surface border-t-brand-indigo rounded-full animate-spin" />
          <p className="text-brand-muted font-medium text-sm">
            Securing clinical workspace...
          </p>
        </div>
      </div>
    );
  }

  // Filter Clinical Centers
  const filteredHospitals = mockHospitals.filter(
    (hospital) =>
      hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.specialty.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Status Badge Mapper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Accepted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Completed":
        return "bg-brand-indigo/5 text-brand-indigo border-brand-indigo/10";
      default:
        return "bg-brand-surface text-brand-muted border-brand-border";
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "Pending":
        return "Your appointment request is awaiting review.";
      case "Accepted":
        return "Your appointment has been approved.";
      case "Rejected":
        return "Your appointment request was declined.";
      case "Completed":
        return "Appointment completed.";
      default:
        return "";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-brand-surface font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col pl-64 h-screen overflow-hidden">
        <Topbar username={username} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight">
                My Patient Dashboard
              </h1>
              <p className="text-brand-muted font-medium mt-1">
                Access your personal medical files, clinical updates, and
                schedule appointments.
              </p>
            </div>
            <div>
              <button
                onClick={() => router.push("/patient-dashboard/appointments")}
                className="bg-brand-indigo hover:bg-[#2a2853] text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-md active:scale-95 transition-all flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-8 h-8 border-4 border-brand-surface border-t-brand-indigo rounded-full animate-spin" />
                <p className="text-brand-muted font-semibold text-sm">
                  Retrieving your profile files...
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Personal Profile, Prescriptions, History */}
              <div className="lg:col-span-1 space-y-8">
                {/* Profile Card */}
                <div className="bg-brand-white rounded-2xl border border-brand-border shadow-soft overflow-hidden p-6 relative">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-brand-navy flex items-center space-x-2">
                      <User className="w-5 h-5 text-brand-indigo" />
                      <span>Personal Profile</span>
                    </h3>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-brand-indigo hover:text-brand-lavender text-sm font-semibold flex items-center space-x-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-brand-muted mb-1 uppercase tracking-wider">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={editForm.first_name}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                first_name: e.target.value,
                              })
                            }
                            className="w-full bg-brand-surface border border-transparent rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-brand-muted mb-1 uppercase tracking-wider">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={editForm.last_name}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                last_name: e.target.value,
                              })
                            }
                            className="w-full bg-brand-surface border border-transparent rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-brand-muted mb-1 uppercase tracking-wider">
                            Age
                          </label>
                          <input
                            type="number"
                            value={editForm.age}
                            onChange={(e) =>
                              setEditForm({ ...editForm, age: e.target.value })
                            }
                            className="w-full bg-brand-surface border border-transparent rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-brand-muted mb-1 uppercase tracking-wider">
                            Gender
                          </label>
                          <select
                            value={editForm.gender}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                gender: e.target.value,
                              })
                            }
                            className="w-full bg-brand-surface border border-transparent rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-brand-muted mb-1 uppercase tracking-wider">
                            Blood Group
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. A+"
                            value={editForm.blood_group}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                blood_group: e.target.value,
                              })
                            }
                            className="w-full bg-brand-surface border border-transparent rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-brand-muted mb-1 uppercase tracking-wider">
                            Contact
                          </label>
                          <input
                            type="text"
                            value={editForm.contact_number}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                contact_number: e.target.value,
                              })
                            }
                            className="w-full bg-brand-surface border border-transparent rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-brand-muted mb-1 uppercase tracking-wider">
                          Address
                        </label>
                        <textarea
                          rows={2}
                          value={editForm.address}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              address: e.target.value,
                            })
                          }
                          className="w-full bg-brand-surface border border-transparent rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo resize-none"
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="bg-brand-surface border border-brand-border text-brand-navy font-semibold px-4 py-2 rounded-lg text-xs hover:bg-brand-border"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-brand-indigo hover:bg-[#2a2853] text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-brand-indigo/10 flex items-center justify-center border border-brand-indigo/20">
                          <span className="font-bold text-brand-indigo text-lg">
                            {profile?.first_name
                              ? profile.first_name[0].toUpperCase()
                              : profile?.email
                                ? profile.email[0].toUpperCase()
                                : "P"}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-brand-navy text-base">
                            {profile?.first_name || profile?.last_name
                              ? `${profile.first_name} ${profile.last_name}`.trim()
                              : "No Name Registered"}
                          </h4>
                          <p className="text-xs text-brand-muted font-medium">
                            {profile?.email}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-brand-border/60 pt-4 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                        <div>
                          <span className="block text-xs font-semibold text-brand-muted uppercase tracking-wider">
                            Age
                          </span>
                          <span className="font-semibold text-brand-navy">
                            {profile?.age !== null
                              ? `${profile?.age} Years`
                              : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-brand-muted uppercase tracking-wider">
                            Gender
                          </span>
                          <span className="font-semibold text-brand-navy capitalize">
                            {profile?.gender || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-brand-muted uppercase tracking-wider">
                            Blood Group
                          </span>
                          <span className="font-semibold text-brand-navy">
                            {profile?.blood_group || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-brand-muted uppercase tracking-wider">
                            Contact
                          </span>
                          <span className="font-semibold text-brand-navy">
                            {profile?.contact_number || "—"}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="block text-xs font-semibold text-brand-muted uppercase tracking-wider">
                            Address
                          </span>
                          <span className="font-semibold text-brand-navy break-words">
                            {profile?.address || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* My Prescriptions Summary */}
                <div className="bg-brand-white rounded-2xl border border-brand-border shadow-soft p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-brand-navy flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-brand-teal" />
                      <span>My Prescriptions</span>
                    </h3>
                    <button
                      onClick={() =>
                        router.push("/patient-dashboard/prescriptions")
                      }
                      className="text-brand-indigo hover:text-brand-lavender text-xs font-bold"
                    >
                      View All
                    </button>
                  </div>

                  {prescriptions.length === 0 ? (
                    <div className="text-center py-6 bg-brand-surface/30 rounded-xl border border-dashed border-brand-border">
                      <p className="text-brand-muted text-sm font-medium">
                        No prescriptions found.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {prescriptions.slice(0, 2).map((pres) => (
                        <div
                          key={pres.id}
                          className="p-4 bg-brand-surface/40 border border-brand-border rounded-xl"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-brand-navy text-sm">
                              {pres.medication}
                            </h4>
                            <span className="text-[10px] text-brand-muted font-bold">
                              {new Date(pres.date_issued).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-brand-muted font-semibold mt-1">
                            Dosage: {pres.dosage}
                          </p>
                          <p className="text-xs text-brand-navy mt-2 italic">
                            "{pres.instructions}"
                          </p>
                          {pres.doctor_notes && (
                            <div className="mt-2 pt-2 border-t border-brand-border/40 text-[11px] text-brand-muted">
                              <span className="font-bold text-brand-navy">
                                Doctor Notes:
                              </span>{" "}
                              {pres.doctor_notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Medical History Overview */}
                <div className="bg-brand-white rounded-2xl border border-brand-border shadow-soft p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-brand-navy flex items-center space-x-2">
                      <Heart className="w-5 h-5 text-rose-500" />
                      <span>Medical History</span>
                    </h3>
                  </div>

                  {history.length === 0 ? (
                    <div className="text-center py-6 bg-brand-surface/30 rounded-xl border border-dashed border-brand-border">
                      <p className="text-brand-muted text-sm font-medium">
                        No medical records uploaded.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.slice(0, 3).map((hist) => (
                        <div key={hist.id} className="flex space-x-3 text-sm">
                          <div className="mt-1 flex flex-col items-center">
                            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                            <div className="w-px h-full bg-brand-border mt-1" />
                          </div>
                          <div className="flex-1 pb-3">
                            <span className="text-[10px] font-bold text-brand-muted block uppercase">
                              {new Date(
                                hist.diagnosis_date,
                              ).toLocaleDateString()}
                            </span>
                            <span className="font-bold text-brand-navy block mt-0.5">
                              {hist.condition}
                            </span>
                            {hist.treatment && (
                              <span className="text-xs text-brand-muted block font-medium">
                                Treatment: {hist.treatment}
                              </span>
                            )}
                            {hist.notes && (
                              <p className="text-xs text-brand-navy bg-brand-surface/40 rounded px-2.5 py-1 mt-1 text-[11px]">
                                {hist.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Middle and Right Column: Scan History & Hospital Recommendations */}
              <div className="lg:col-span-2 space-y-8">
                {/* My Scan Results */}
                <div className="bg-brand-white rounded-2xl border border-brand-border shadow-soft p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-brand-navy flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-brand-indigo" />
                      <span>My Scan Results</span>
                    </h3>
                    <button
                      onClick={() => router.push("/patient-dashboard/scans")}
                      className="text-brand-indigo hover:text-brand-lavender text-xs font-bold"
                    >
                      View All Scans
                    </button>
                  </div>

                  {scans.length === 0 ? (
                    <div className="text-center py-12 bg-brand-surface/20 rounded-xl border-2 border-dashed border-brand-border flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 bg-brand-indigo/10 rounded-full">
                        <Activity className="w-6 h-6 text-brand-indigo" />
                      </div>
                      <p className="text-brand-navy font-semibold text-sm">
                        No chest X-ray scans recorded
                      </p>
                      <p className="text-brand-muted text-xs max-w-sm">
                        Only scans conducted by your clinic doctor and analyzed
                        by the Pneumonix AI model will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {scans.slice(0, 2).map((scan) => (
                        <div
                          key={scan.id}
                          className="border border-brand-border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-brand-white flex flex-col"
                        >
                          <div className="h-44 bg-slate-900 flex items-center justify-center overflow-hidden relative group">
                            {scan.image_url ? (
                              <img
                                src={scan.image_url}
                                alt="Chest Radiograph"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="text-brand-muted text-xs font-semibold">
                                Image file missing
                              </div>
                            )}
                            <div className="absolute top-3 right-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  scan.result === "Normal"
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    : "bg-red-500/10 text-red-500 border-red-500/20"
                                }`}
                              >
                                {scan.result}
                              </span>
                            </div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-brand-muted uppercase">
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
                                <span className="text-xs font-bold text-brand-navy">
                                  Confidence:{" "}
                                  {(scan.confidence * 100).toFixed(1)}%
                                </span>
                              </div>
                              <p className="text-xs text-brand-muted font-medium mt-3 border-t border-brand-border/40 pt-2 break-words">
                                <span className="font-bold text-brand-navy block mb-0.5">
                                  Doctor Remarks:
                                </span>
                                {scan.doctor_remarks
                                  ? `"${scan.doctor_remarks}"`
                                  : "Awaiting clinician clinical notes."}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upcoming Appointments Status & Notifications */}
                <div className="bg-brand-white rounded-2xl border border-brand-border shadow-soft p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-brand-navy flex items-center space-x-2">
                      <Clock3 className="w-5 h-5 text-brand-indigo" />
                      <span>My Appointments & Notifications</span>
                    </h3>
                    <button
                      onClick={() =>
                        router.push("/patient-dashboard/appointments")
                      }
                      className="text-brand-indigo hover:text-brand-lavender text-xs font-bold"
                    >
                      Manage Appointments
                    </button>
                  </div>

                  {appointments.length === 0 ? (
                    <div className="text-center py-6 bg-brand-surface/30 rounded-xl border border-dashed border-brand-border">
                      <p className="text-brand-muted text-sm font-medium">
                        No appointments booked yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointments.slice(0, 3).map((app) => (
                        <div
                          key={app.id}
                          className="p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-white hover:bg-brand-surface/20 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(app.status)}`}
                              >
                                {app.status}
                              </span>
                              <span className="text-xs text-brand-muted font-semibold">
                                Request Date: {app.requested_date} @{" "}
                                {app.requested_time}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-brand-navy mt-1">
                              Reason: {app.reason}
                            </p>
                            <p className="text-xs text-brand-muted">
                              Notification:{" "}
                              <span className="font-semibold text-brand-navy">
                                {getStatusMessage(app.status)}
                              </span>
                            </p>
                            {app.status === "Accepted" && (
                              <div className="bg-emerald-50 text-emerald-800 rounded-lg p-2.5 text-xs font-semibold mt-2 border border-emerald-100 flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                <span>
                                  Confirmed Schedule:{" "}
                                  <strong className="text-brand-navy">
                                    {app.appointment_date} at{" "}
                                    {app.appointment_time}
                                  </strong>
                                </span>
                              </div>
                            )}
                            {app.doctor_notes && (
                              <p className="text-[11px] text-brand-muted mt-1 bg-brand-surface/30 px-2 py-1 rounded">
                                <strong className="text-brand-navy font-bold">
                                  Doctor Notes:
                                </strong>{" "}
                                "{app.doctor_notes}"
                              </p>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-brand-muted uppercase block text-right">
                              Assigned Doctor
                            </span>
                            <span className="text-xs font-bold text-brand-navy block text-right">
                              Dr. Maharjan
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Nearby Pneumonia Checkup Centers */}
                <div className="bg-brand-white rounded-2xl border border-brand-border shadow-soft p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-3 md:space-y-0">
                    <div>
                      <h3 className="text-lg font-bold text-brand-navy flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-brand-teal" />
                        <span>Nearby Pneumonia Checkup Centers</span>
                      </h3>
                      <p className="text-xs text-brand-muted font-medium mt-0.5">
                        Clinical partners equipped with radiology scanning
                        units.
                      </p>
                    </div>
                    {/* Location-based search input */}
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 text-brand-muted absolute left-3" />
                      <input
                        type="text"
                        placeholder="Search clinic or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-brand-surface border border-transparent rounded-lg py-1.5 pl-9 pr-3 text-xs text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo transition-all placeholder:text-brand-muted w-52"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredHospitals.map((hospital) => (
                      <div
                        key={hospital.id}
                        className="bg-brand-white border border-brand-border rounded-xl p-4 hover:shadow-soft transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                                hospital.open
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {hospital.status}
                            </span>
                            <span className="text-xs font-bold text-brand-indigo">
                              {hospital.distance}
                            </span>
                          </div>
                          <h4 className="font-bold text-brand-navy text-sm mb-1">
                            {hospital.name}
                          </h4>
                          <p className="text-xs text-brand-muted font-medium flex items-start space-x-1.5 mb-2">
                            <MapPin className="w-3.5 h-3.5 text-brand-muted flex-shrink-0 mt-0.5" />
                            <span className="break-words">
                              {hospital.address}
                            </span>
                          </p>
                          <p className="text-[11px] text-brand-muted font-bold flex items-center space-x-1.5 mb-3">
                            <Phone className="w-3 h-3 text-brand-muted" />
                            <span>{hospital.phone}</span>
                          </p>
                          <p className="text-[11px] text-brand-indigo bg-brand-indigo/5 px-2.5 py-1 rounded font-bold mb-4">
                            {hospital.specialty}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            router.push(
                              `/patient-dashboard/appointments?ref=${encodeURIComponent(hospital.name)}`,
                            )
                          }
                          className="w-full bg-brand-indigo hover:bg-[#2a2853] text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center space-x-1 transition-colors mt-auto active:scale-95"
                        >
                          <span>Request Appointment</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {filteredHospitals.length === 0 && (
                      <div className="col-span-2 text-center py-6">
                        <p className="text-brand-muted text-xs font-semibold">
                          No clinics match your query.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Footer Banner */}
          <div className="bg-brand-white border border-brand-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/10 rounded-full">
                <ShieldCheck className="w-5 h-5 text-brand-teal" />
              </div>
              <div>
                <h4 className="font-bold text-brand-navy text-sm">
                  HIPAA Secure Portal
                </h4>
                <p className="text-xs text-brand-muted font-semibold">
                  All clinical scans and radiograph files are protected by
                  AES-256 state database encryption.
                </p>
              </div>
            </div>
            <div className="text-xs text-brand-muted font-semibold flex items-center space-x-1">
              <Stethoscope className="w-4 h-4 text-brand-indigo" />
              <span>
                Assigned Clinic Practitioner: <strong>Dr. Maharjan</strong>
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
