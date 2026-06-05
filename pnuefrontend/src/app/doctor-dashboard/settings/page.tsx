"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Settings, User, ShieldAlert, ShieldCheck } from "lucide-react";

export default function DoctorSettingsPage() {
  const [username, setUsername] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
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
      setUsername(storedUsername);
      setAuthorized(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    router.push("/login");
  };

  if (!authorized) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-surface font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col pl-64 h-screen overflow-hidden">
        <Topbar username={username} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-navy mb-1">Clinic Credentials & Settings</h1>
            <p className="text-brand-muted font-medium">Manage clinical access keys and attending physician credentials.</p>
          </div>

          <div className="max-w-xl bg-brand-white rounded-2xl border border-brand-border shadow-soft overflow-hidden">
            <div className="p-6 border-b border-brand-border flex items-center space-x-2 bg-brand-white">
              <Settings className="w-5 h-5 text-brand-indigo" />
              <h3 className="font-bold text-brand-navy text-sm">Practitioner Profile File</h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-brand-indigo/10 rounded-full flex items-center justify-center border border-brand-indigo/20">
                  <User className="w-6 h-6 text-brand-indigo" />
                </div>
                <div>
                  <h4 className="font-bold text-brand-navy text-sm">Dr. Ugan Singh Maharjan</h4>
                  <p className="text-xs text-brand-muted font-semibold">Chief Pulmonary Clinician</p>
                </div>
              </div>

              <div className="border-t border-brand-border/60 pt-4 space-y-3 text-xs font-semibold text-brand-navy">
                <div>
                  <span className="text-brand-muted uppercase text-[9px] block">Attending Clinic Email</span>
                  <span>dr_maharjans@gmail.com</span>
                </div>
                <div>
                  <span className="text-brand-muted uppercase text-[9px] block">Security Roles</span>
                  <span>Primary Doctor (Clinical Director)</span>
                </div>
                <div>
                  <span className="text-brand-muted uppercase text-[9px] block">System Privileges</span>
                  <span className="text-brand-teal font-extrabold flex items-center space-x-1 mt-1">
                    <ShieldCheck className="w-4 h-4 text-brand-teal mr-1" />
                    <span>Full administrative access to scans and medical prescriptions</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
