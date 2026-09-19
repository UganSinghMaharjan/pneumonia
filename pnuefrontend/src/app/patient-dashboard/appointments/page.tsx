"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useToast } from "@/context/ToastContext";
import {
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock3,
  CalendarDays,
  Send,
  Loader2,
  Bookmark,
  ShieldCheck,
  Building2,
  Stethoscope,
  UserCheck,
} from "lucide-react";

interface DoctorInfo {
  id: number;
  name: string;
  email: string;
  contact_number?: string;
}

interface ClinicInfo {
  id: number;
  name: string;
  address: string;
  phone?: string;
  specialty?: string;
  doctors: DoctorInfo[];
  doctors_count: number;
}

interface AppointmentRecord {
  id: number;
  clinic_id?: number | null;
  clinic_name?: string | null;
  requested_date: string;
  requested_time: string;
  appointment_date: string | null;
  appointment_time: string | null;
  reason: string;
  notes: string;
  doctor_notes: string;
  doctor_id?: number | null;
  doctor_email?: string;
  doctor_name?: string;
  status: "Pending" | "Accepted" | "Rejected" | "Completed";
}

function AppointmentsContent() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [clinics, setClinics] = useState<ClinicInfo[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);

  // Minimum selectable date = tomorrow (today and past dates are not allowed)
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  // Booking Form State
  const [form, setForm] = useState({
    clinic_id: "",
    doctor_id: "",
    requested_date: "",
    requested_time: "",
    reason: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

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
      fetchAppointments(storedToken);
      fetchClinics();
    }
  }, [router]);

  const fetchClinics = async () => {
    setLoadingClinics(true);
    try {
      const response = await axios.get("/backend/clinics");
      setClinics(response.data);
      return response.data as ClinicInfo[];
    } catch (err) {
      console.error("Failed to load clinics", err);
      return [];
    } finally {
      setLoadingClinics(false);
    }
  };

  useEffect(() => {
    const refClinic = searchParams.get("ref");
    const clinicIdParam = searchParams.get("clinic_id");

    if (clinics.length > 0) {
      let matchedClinic: ClinicInfo | undefined;
      if (clinicIdParam) {
        matchedClinic = clinics.find((c) => String(c.id) === clinicIdParam);
      } else if (refClinic) {
        matchedClinic = clinics.find(
          (c) => c.name.toLowerCase() === refClinic.toLowerCase()
        );
      }

      if (matchedClinic) {
        const autoDocId =
          matchedClinic.doctors.length === 1
            ? String(matchedClinic.doctors[0].id)
            : "";
        setForm((prev) => ({
          ...prev,
          clinic_id: String(matchedClinic!.id),
          doctor_id: autoDocId,
          reason: prev.reason || `Pulmonary Consultation referral from ${matchedClinic!.name}`,
          notes: prev.notes || "Requested checkup scan and chest radiograph analysis.",
        }));
      }
    }
  }, [searchParams, clinics]);

  const fetchAppointments = async (authToken: string) => {
    setLoading(true);
    try {
      const response = await axios.get("/backend/appointments", {
        headers: { Authorization: `Token ${authToken}` },
      });
      setAppointments(response.data);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClinicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedClinic = clinics.find((c) => String(c.id) === selectedId);
    let autoDoctorId = "";

    if (selectedClinic && selectedClinic.doctors.length === 1) {
      autoDoctorId = String(selectedClinic.doctors[0].id);
    }

    setForm((prev) => ({
      ...prev,
      clinic_id: selectedId,
      doctor_id: autoDoctorId,
    }));
  };

  const selectedClinicObj = clinics.find(
    (c) => String(c.id) === String(form.clinic_id)
  );
  const availableDoctors = selectedClinicObj?.doctors || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!form.clinic_id) {
      const msg = "Please select a clinic for your appointment.";
      setError(msg);
      toast.warning(msg, "Clinic Required");
      return;
    }

    if (availableDoctors.length > 1 && !form.doctor_id) {
      const msg = "Please choose a doctor for this clinic.";
      setError(msg);
      toast.warning(msg, "Doctor Selection Required");
      return;
    }

    if (selectedClinicObj && availableDoctors.length === 0) {
      const msg = "Selected clinic has no available doctors. Please choose another clinic.";
      setError(msg);
      toast.error(msg, "No Doctors Available");
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitLoading(true);

    try {
      await axios.post(
        "/backend/appointments",
        {
          clinic_id: form.clinic_id ? parseInt(form.clinic_id) : undefined,
          doctor_id: form.doctor_id ? parseInt(form.doctor_id) : undefined,
          requested_date: form.requested_date,
          requested_time: form.requested_time,
          reason: form.reason,
          notes: form.notes,
        },
        { headers: { Authorization: `Token ${token}` } }
      );
      const msg = "Your appointment request was submitted successfully!";
      setSuccess(msg);
      toast.success(msg, "Appointment Requested");
      setForm({
        clinic_id: "",
        doctor_id: "",
        requested_date: "",
        requested_time: "",
        reason: "",
        notes: "",
      });
      fetchAppointments(token);
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error ||
        "Failed to submit request. Please try again.";
      setError(errMsg);
      toast.error(errMsg, "Request Failed");
    } finally {
      setSubmitLoading(false);
    }
  };

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
        return "Your appointment request is awaiting review by the attending physician.";
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

  const handleLogout = () => {
    toast.info("Logged out successfully.", "Signed Out");
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
            Loading clinic portal...
          </p>
        </div>
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
              Clinic Appointment Manager
            </h1>
            <p className="text-brand-muted font-medium">
              Select a clinic, choose your attending physician, and schedule pulmonary checkups.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle: Booking Form Card */}
            <div className="lg:col-span-1">
              <div className="bg-brand-white rounded-2xl border border-brand-border shadow-soft p-6 sticky top-8">
                <h3 className="text-lg font-bold text-brand-navy mb-2 flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5 text-brand-indigo" />
                  <span>Book Appointment</span>
                </h3>
                <p className="text-xs text-brand-muted mb-6">
                  Select your preferred clinic, attending doctor, and date. Bookings are routed directly to the chosen doctor.
                </p>

                {error && (
                  <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-semibold flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600 text-xs font-semibold flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Clinic Selection */}
                  <div>
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-brand-indigo" />
                      <span>Select Clinic</span>
                    </label>
                    <select
                      required
                      value={form.clinic_id}
                      onChange={handleClinicChange}
                      className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-sm text-brand-navy font-semibold focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                    >
                      <option value="">-- Choose Clinic / Medical Center --</option>
                      {clinics.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.specialty ? `• ${c.specialty}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Doctor Selection (Dynamic based on selected clinic) */}
                  {selectedClinicObj && (
                    <div>
                      <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-brand-indigo" />
                        <span>Attending Doctor</span>
                      </label>

                      {availableDoctors.length === 0 ? (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                          <span>No doctors assigned to this clinic yet. Please choose another center.</span>
                        </div>
                      ) : availableDoctors.length === 1 ? (
                        <div className="p-3 bg-brand-indigo/5 border border-brand-indigo/20 rounded-lg text-xs font-semibold text-brand-navy flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <UserCheck className="w-4 h-4 text-brand-indigo flex-shrink-0" />
                            <div>
                              <p className="font-bold text-brand-navy">
                                {availableDoctors[0].name}
                              </p>
                              <p className="text-[11px] text-brand-muted">
                                {availableDoctors[0].email}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-brand-indigo text-white px-2 py-0.5 rounded-full font-bold">
                            Assigned
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <select
                            required
                            value={form.doctor_id}
                            onChange={(e) =>
                              setForm({ ...form, doctor_id: e.target.value })
                            }
                            className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-sm text-brand-navy font-semibold focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                          >
                            <option value="">
                              -- Choose from {availableDoctors.length} Available Doctors --
                            </option>
                            {availableDoctors.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                {doc.name} ({doc.email})
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-brand-muted">
                            Multiple doctors available at this clinic. Choose your preferred physician.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preferred Date */}
                  <div>
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      required
                      min={tomorrow}
                      value={form.requested_date}
                      onChange={(e) =>
                        setForm({ ...form, requested_date: e.target.value })
                      }
                      className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                    />
                  </div>

                  {/* Preferred Time */}
                  <div>
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                      Preferred Time
                    </label>
                    <input
                      type="time"
                      required
                      value={form.requested_time}
                      onChange={(e) =>
                        setForm({ ...form, requested_time: e.target.value })
                      }
                      className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                    />
                  </div>

                  {/* Reason for Visit */}
                  <div>
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                      Reason for Visit
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chest discomfort, annual X-ray"
                      value={form.reason}
                      onChange={(e) =>
                        setForm({ ...form, reason: e.target.value })
                      }
                      className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-sm text-brand-navy placeholder:text-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                    />
                  </div>

                  {/* Optional Notes */}
                  <div>
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                      Optional Notes (Symptoms / Details)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="List details about current symptoms..."
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-sm text-brand-navy placeholder:text-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-indigo resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitLoading || (selectedClinicObj && availableDoctors.length === 0)}
                    className="w-full bg-brand-indigo hover:bg-[#2a2853] disabled:bg-brand-surface text-white py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:text-brand-muted disabled:border disabled:border-brand-border disabled:shadow-none shadow-md mt-6"
                  >
                    {submitLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Book Appointment</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Appointments List Logs */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-brand-white rounded-2xl border border-brand-border shadow-soft p-6">
                <h3 className="text-lg font-bold text-brand-navy mb-6 flex items-center space-x-2">
                  <Bookmark className="w-5 h-5 text-brand-indigo" />
                  <span>My Appointment History</span>
                </h3>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 text-brand-indigo animate-spin" />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-12 bg-brand-surface/30 rounded-xl border border-dashed border-brand-border">
                    <p className="text-brand-muted text-sm font-semibold">
                      No appointment requests found.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((app) => (
                      <div
                        key={app.id}
                        className="p-5 rounded-xl border bg-brand-white hover:bg-brand-surface/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(app.status)}`}
                            >
                              {app.status}
                            </span>
                            <span className="text-xs text-brand-muted font-bold flex items-center space-x-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                Requested for: {app.requested_date} @{" "}
                                {app.requested_time}
                              </span>
                            </span>
                          </div>

                          <h4 className="font-bold text-brand-navy text-sm pt-1">
                            Reason: {app.reason}
                          </h4>
                          {app.notes && (
                            <p className="text-xs text-brand-muted">
                              My Notes: "{app.notes}"
                            </p>
                          )}

                          {/* Approval Status Message Banner */}
                          <div className="bg-brand-surface/40 p-3 rounded-lg text-xs font-semibold mt-3 text-brand-navy flex items-center space-x-2 border border-brand-border/40">
                            {app.status === "Pending" && (
                              <Clock className="w-4 h-4 text-amber-500" />
                            )}
                            {app.status === "Accepted" && (
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            )}
                            {app.status === "Rejected" && (
                              <AlertCircle className="w-4 h-4 text-rose-500" />
                            )}
                            {app.status === "Completed" && (
                              <CheckCircle className="w-4 h-4 text-brand-teal" />
                            )}
                            <span>{getStatusMessage(app.status)}</span>
                          </div>

                          {/* If accepted, display the official schedule details */}
                          {app.status === "Accepted" && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-bold mt-2 flex items-center space-x-2 shadow-sm">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              <span>
                                Confirmed checkup slot:{" "}
                                <strong className="text-brand-navy">
                                  {app.appointment_date} at{" "}
                                  {app.appointment_time}
                                </strong>
                              </span>
                            </div>
                          )}

                          {app.doctor_notes && (
                            <div className="p-3 bg-brand-indigo/5 rounded-lg border border-brand-indigo/10 text-xs mt-2">
                              <strong className="text-brand-navy font-bold">
                                Doctor Notes:
                              </strong>{" "}
                              "{app.doctor_notes}"
                            </div>
                          )}
                        </div>

                        {/* Clinic & Doctor Details Box */}
                        <div className="text-left md:text-right border-t md:border-t-0 border-brand-border/40 pt-4 md:pt-0 min-w-[180px]">
                          <span className="text-[10px] font-bold text-brand-indigo uppercase tracking-wider block">
                            {app.clinic_name || "Pulmonary Clinic"}
                          </span>
                          <span className="text-xs font-bold text-brand-navy block mt-0.5">
                            {app.doctor_name || "Attending Physician"}
                          </span>
                          <span className="text-[10px] text-brand-muted block mt-0.5">
                            {app.doctor_email || "Clinical Staff"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-brand-surface">
          <Loader2 className="w-8 h-8 text-brand-indigo animate-spin" />
        </div>
      }
    >
      <AppointmentsContent />
    </Suspense>
  );
}
