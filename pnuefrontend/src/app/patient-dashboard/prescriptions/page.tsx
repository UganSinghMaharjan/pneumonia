"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import {
  FileText,
  Calendar,
  Loader2,
  Bookmark,
  Activity,
  Heart,
} from "lucide-react";

interface PrescriptionRecord {
  id: number;
  medication: string;
  dosage: string;
  instructions: string;
  doctor_notes: string;
  date_issued: string;
}

export default function PatientPrescriptionsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);

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
      fetchPrescriptions(storedToken);
    }
  }, [router]);

  const fetchPrescriptions = async (authToken: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:8000/api/prescriptions/",
        {
          headers: { Authorization: `Token ${authToken}` },
        },
      );
      setPrescriptions(response.data);
    } catch (err) {
      console.error("Failed to fetch prescriptions", err);
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
              My Medical Prescriptions
            </h1>
            <p className="text-brand-muted font-medium">
              View pharmaceutical orders and clinician guidelines issued for
              your recovery.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-brand-indigo animate-spin" />
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="bg-brand-white border border-brand-border rounded-xl p-12 text-center max-w-2xl mx-auto flex flex-col items-center">
              <div className="p-4 bg-brand-indigo/10 rounded-full mb-4">
                <FileText className="w-8 h-8 text-brand-indigo" />
              </div>
              <h3 className="text-lg font-bold text-brand-navy mb-2">
                No prescriptions issued yet
              </h3>
              <p className="text-sm text-brand-muted mb-4 max-w-md">
                All clinical prescriptions issued by your attending physician
                will appear in this log.
              </p>
            </div>
          ) : (
            <div className="max-w-4xl space-y-4">
              {prescriptions.map((pres) => (
                <div
                  key={pres.id}
                  className="bg-brand-white border border-brand-border rounded-2xl p-6 shadow-soft hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 justify-between"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-brand-indigo/10 rounded-xl">
                        <Activity className="w-5 h-5 text-brand-indigo" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-brand-navy text-base leading-tight">
                          {pres.medication}
                        </h3>
                        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block mt-0.5">
                          Dosage Regimen: {pres.dosage}
                        </span>
                      </div>
                    </div>

                    <div className="bg-brand-surface/40 p-4 rounded-xl border border-brand-border/40 text-sm">
                      <span className="block text-xs font-bold text-brand-navy mb-1 flex items-center space-x-1">
                        <Bookmark className="w-4 h-4 text-brand-indigo" />
                        <span>Attending Guidelines</span>
                      </span>
                      <p className="text-brand-navy italic">
                        "{pres.instructions}"
                      </p>
                    </div>

                    {pres.doctor_notes && (
                      <div className="text-xs text-brand-muted bg-brand-indigo/5 p-3 rounded-lg border border-brand-indigo/10">
                        <span className="font-bold text-brand-navy block mb-0.5">
                          Doctor Notes:
                        </span>
                        <span>{pres.doctor_notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-left md:text-right flex flex-col justify-between items-start md:items-end border-t md:border-t-0 border-brand-border/40 pt-4 md:pt-0">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-brand-muted uppercase block">
                        Attending Practitioner
                      </span>
                      <span className="text-xs font-bold text-brand-navy block">
                        Dr. Maharjan
                      </span>
                    </div>

                    <div className="text-xs text-brand-muted font-semibold flex items-center space-x-1 mt-4 md:mt-0">
                      <Calendar className="w-4 h-4 text-brand-muted" />
                      <span>
                        Issued:{" "}
                        {new Date(pres.date_issued).toLocaleDateString()}
                      </span>
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
