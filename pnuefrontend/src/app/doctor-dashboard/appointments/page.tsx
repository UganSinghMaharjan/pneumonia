"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import {
  Calendar,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Activity,
  Bookmark,
  FileText,
  Clock3,
} from "lucide-react";

interface AppointmentRecord {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_email: string;
  doctor_id: number;
  doctor_email: string;
  requested_date: string;
  requested_time: string;
  appointment_date: string | null;
  appointment_time: string | null;
  reason: string;
  notes: string;
  doctor_notes: string;
  status: "Pending" | "Accepted" | "Rejected" | "Completed";
}

export default function DoctorAppointmentsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<
    "Pending" | "Accepted" | "Completed" | "Rejected"
  >("Pending");

  // Approval/Rejection Modal State
  const [selectedApp, setSelectedApp] = useState<AppointmentRecord | null>(
    null,
  );
  const [modalAction, setModalAction] = useState<"accept" | "reject" | null>(
    null,
  );
  const [modalDate, setModalDate] = useState("");
  const [modalTime, setModalTime] = useState("");
  const [modalNotes, setModalNotes] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

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
      fetchAppointments(storedToken);
    }
  }, [router]);

  const fetchAppointments = async (authToken: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:8000/api/appointments/",
        {
          headers: { Authorization: `Token ${authToken}` },
        },
      );
      setAppointments(response.data);
    } catch (err) {
      console.error("Failed to load appointments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedApp || !modalAction) return;

    setModalLoading(true);
    try {
      const payload: any = {
        action: modalAction,
        doctor_notes: modalNotes,
      };

      if (modalAction === "accept") {
        payload.appointment_date = modalDate;
        payload.appointment_time = modalTime;
      }

      await axios.patch(
        `http://localhost:8000/api/appointments/${selectedApp.id}/`,
        payload,
        { headers: { Authorization: `Token ${token}` } },
      );

      // Close modal and reset fields
      setSelectedApp(null);
      setModalAction(null);
      setModalDate("");
      setModalTime("");
      setModalNotes("");

      // Refresh list
      fetchAppointments(token);
    } catch (err) {
      console.error("Failed to update appointment status", err);
      alert("Failed to update appointment. Please try again.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleMarkComplete = async (appId: number) => {
    if (!token || !confirm("Mark this appointment as Completed?")) return;

    try {
      await axios.patch(
        `http://localhost:8000/api/appointments/${appId}/`,
        {
          action: "complete",
          doctor_notes: "Appointment successfully conducted.",
        },
        { headers: { Authorization: `Token ${token}` } },
      );
      fetchAppointments(token);
    } catch (err) {
      console.error("Failed to complete appointment", err);
      alert("Failed to update status. Please try again.");
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

  // Filter appointments by active status tab
  const filteredApps = appointments.filter((app) => app.status === activeTab);

  // Counters
  const countPending = appointments.filter(
    (app) => app.status === "Pending",
  ).length;
  const countAccepted = appointments.filter(
    (app) => app.status === "Accepted",
  ).length;
  const countCompleted = appointments.filter(
    (app) => app.status === "Completed",
  ).length;
  const countRejected = appointments.filter(
    (app) => app.status === "Rejected",
  ).length;

  return (
    <div className="flex h-screen overflow-hidden bg-brand-surface font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col pl-64 h-screen overflow-hidden">
        <Topbar username={username} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-navy mb-1">
              Clinic Appointments Dashboard
            </h1>
            <p className="text-brand-muted font-medium">
              Review patient clinical checkup requests and schedule slots.
            </p>
          </div>

          {/* Status Tabs */}
          <div className="flex space-x-2 border-b border-brand-border pb-px">
            {[
              { id: "Pending", label: "Pending Requests", count: countPending },
              {
                id: "Accepted",
                label: "Scheduled & Accepted",
                count: countAccepted,
              },
              {
                id: "Completed",
                label: "Completed Checkups",
                count: countCompleted,
              },
              {
                id: "Rejected",
                label: "Rejected Requests",
                count: countRejected,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 font-semibold text-xs uppercase tracking-wider rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-brand-indigo text-brand-indigo bg-brand-white"
                    : "border-transparent text-brand-muted hover:text-brand-navy hover:bg-brand-white/40"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === tab.id
                      ? "bg-brand-indigo/15 text-brand-indigo"
                      : "bg-brand-surface text-brand-muted"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-brand-indigo animate-spin" />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="bg-brand-white border border-brand-border rounded-2xl p-12 text-center max-w-xl mx-auto flex flex-col items-center">
              <Clock className="w-8 h-8 text-brand-muted mb-3" />
              <h4 className="font-bold text-brand-navy text-sm">
                No appointment requests in this tab
              </h4>
              <p className="text-xs text-brand-muted mt-1">
                Patients can schedule pulmonary checkup slots via their personal
                patient clinical dashboards.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="bg-brand-white border border-brand-border rounded-2xl p-5 shadow-soft hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-brand-indigo/10 rounded-xl">
                          <User className="w-4 h-4 text-brand-indigo" />
                        </div>
                        <div>
                          <h4 className="font-bold text-brand-navy text-sm leading-tight">
                            {app.patient_name || app.patient_email}
                          </h4>
                          <span className="text-[10px] text-brand-muted font-bold block">
                            {app.patient_email}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                          app.status === "Pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : app.status === "Accepted"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : app.status === "Rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-brand-surface text-brand-muted"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <div className="bg-brand-surface/40 p-4 rounded-xl border border-brand-border/40 text-xs font-semibold text-brand-navy space-y-2">
                      <p>
                        <span className="text-brand-muted uppercase text-[9px] block">
                          Requested Slots:
                        </span>{" "}
                        {app.requested_date} @ {app.requested_time}
                      </p>
                      <p>
                        <span className="text-brand-muted uppercase text-[9px] block font-bold">
                          Reason for checkup:
                        </span>{" "}
                        {app.reason}
                      </p>
                      {app.notes && (
                        <p className="italic font-medium text-brand-muted">
                          Patient notes: "{app.notes}"
                        </p>
                      )}
                    </div>

                    {app.status === "Accepted" && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs font-bold text-emerald-800 space-y-1">
                        <p className="flex items-center space-x-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Confirmed Booking Schedule</span>
                        </p>
                        <p className="text-brand-navy font-black pl-5">
                          Date: {app.appointment_date} at {app.appointment_time}
                        </p>
                      </div>
                    )}

                    {app.doctor_notes && (
                      <div className="p-3 bg-brand-indigo/5 border border-brand-indigo/10 rounded-lg text-xs">
                        <strong className="text-brand-navy uppercase text-[9px] block mb-0.5">
                          attending clinician notes:
                        </strong>
                        <p className="italic text-brand-navy">
                          "{app.doctor_notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-brand-border/40 flex justify-end space-x-2">
                    {app.status === "Pending" && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setModalAction("reject");
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-4 py-2.5 rounded-lg text-xs transition-colors flex items-center space-x-1 border border-rose-200"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setModalAction("accept");
                            setModalDate(app.requested_date);
                            setModalTime(app.requested_time);
                          }}
                          className="bg-brand-indigo hover:bg-[#2a2853] text-white font-bold px-4 py-2.5 rounded-lg text-xs shadow-md transition-colors flex items-center space-x-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Accept & Confirm</span>
                        </button>
                      </>
                    )}

                    {app.status === "Accepted" && (
                      <button
                        onClick={() => handleMarkComplete(app.id)}
                        className="w-full bg-brand-teal hover:bg-[#008f97] text-white font-bold py-2.5 rounded-lg text-xs shadow-md transition-colors flex items-center justify-center space-x-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark Checkup Completed</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions Modal (Accept / Reject) */}
          {selectedApp && modalAction && (
            <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-brand-white rounded-2xl max-w-md w-full border border-brand-border shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-white">
                  <h3 className="text-lg font-bold text-brand-navy flex items-center space-x-2">
                    {modalAction === "accept" ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span>Select Appointment Date and Time</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-500" />
                        <span>Decline Checkup Request</span>
                      </>
                    )}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedApp(null);
                      setModalAction(null);
                    }}
                    className="text-brand-muted hover:text-brand-navy"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAction} className="p-6 space-y-4">
                  <div className="bg-brand-surface/40 p-4 rounded-xl border border-brand-border/40 text-xs font-semibold text-brand-navy space-y-1">
                    <p>
                      <span className="text-brand-muted uppercase text-[9px] block">
                        Patient Profile
                      </span>{" "}
                      {selectedApp.patient_name || selectedApp.patient_email} (
                      {selectedApp.patient_email})
                    </p>
                    <p>
                      <span className="text-brand-muted uppercase text-[9px] block">
                        Requested Time
                      </span>{" "}
                      {selectedApp.requested_date} at{" "}
                      {selectedApp.requested_time}
                    </p>
                    <p className="italic text-brand-muted font-medium mt-1">
                      Reason: "{selectedApp.reason}"
                    </p>
                  </div>

                  {modalAction === "accept" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                          Confirmed Date
                        </label>
                        <input
                          type="date"
                          required
                          value={modalDate}
                          onChange={(e) => setModalDate(e.target.value)}
                          className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-xs text-brand-navy font-semibold focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                          Confirmed Time
                        </label>
                        <input
                          type="time"
                          required
                          value={modalTime}
                          onChange={(e) => setModalTime(e.target.value)}
                          className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-xs text-brand-navy font-semibold focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                      {modalAction === "accept"
                        ? "Attending Clinician Guidelines"
                        : "Optional Rejection Reason"}
                    </label>
                    <textarea
                      rows={3}
                      required={modalAction === "reject"}
                      placeholder={
                        modalAction === "accept"
                          ? "e.g. Please bring past medical scan copies."
                          : "State the reason for declining checkup schedule..."
                      }
                      value={modalNotes}
                      onChange={(e) => setModalNotes(e.target.value)}
                      className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-xs text-brand-navy placeholder:text-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-indigo resize-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t border-brand-border/40 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedApp(null);
                        setModalAction(null);
                      }}
                      className="bg-brand-surface border border-brand-border text-brand-navy px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-brand-border transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className={`px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-md active:scale-98 transition-colors flex items-center space-x-1.5 ${
                        modalAction === "accept"
                          ? "bg-brand-indigo hover:bg-[#2a2853]"
                          : "bg-rose-600 hover:bg-rose-700"
                      }`}
                    >
                      {modalLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : modalAction === "accept" ? (
                        "Confirm Booking"
                      ) : (
                        "Decline Booking"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
