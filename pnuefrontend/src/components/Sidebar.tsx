"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  LayoutDashboard,
  Users,
  Settings,
  ShieldCheck,
  FileText,
  Clock
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("role") || "patient");
  }, []);

  const doctorItems = [
    { name: "Dashboard", href: "/doctor-dashboard", icon: LayoutDashboard },
    { name: "Appointments", href: "/doctor-dashboard/appointments", icon: Clock },
    { name: "Scans", href: "/doctor-dashboard/scans", icon: Activity },
    { name: "Patients", href: "/doctor-dashboard/patients", icon: Users },
    { name: "Settings", href: "/doctor-dashboard/settings", icon: Settings },
  ];

  const patientItems = [
    { name: "Dashboard", href: "/patient-dashboard", icon: LayoutDashboard },
    { name: "Appointments", href: "/patient-dashboard/appointments", icon: Clock },
    { name: "My Scans", href: "/patient-dashboard/scans", icon: Activity },
    { name: "My Prescriptions", href: "/patient-dashboard/prescriptions", icon: FileText },
    { name: "Settings", href: "/patient-dashboard/settings", icon: Settings },
  ];

  const navItems = role === "doctor" ? doctorItems : patientItems;

  return (
    <aside className="w-64 bg-brand-white border-r border-brand-border h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center space-x-3 border-b border-brand-border">
        <div className="p-2 bg-brand-indigo/10 rounded-xl">
          <Activity className="w-6 h-6 text-brand-indigo" />
        </div>
        <span className="font-bold text-brand-navy tracking-tight text-xl">
          Pneumonix
        </span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-4 px-3">
          Main Menu
        </p>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                  isActive
                    ? "bg-brand-indigo text-brand-white shadow-soft"
                    : "text-brand-navy hover:bg-brand-surface hover:text-brand-indigo"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-brand-white" : "text-brand-muted"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-brand-border">
        <div className="bg-brand-surface rounded-xl p-4 flex flex-col items-center text-center">
          <ShieldCheck className="w-8 h-8 text-brand-teal mb-2" />
          <h4 className="text-sm font-semibold text-brand-navy mb-1">HIPAA Compliant</h4>
          <p className="text-xs text-brand-muted">Secure diagnostic storage</p>
        </div>
      </div>
    </aside>
  );
}
