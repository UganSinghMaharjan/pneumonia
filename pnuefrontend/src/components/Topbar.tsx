"use client";

import { useState, useEffect } from "react";
import { Search, Bell, User, LogOut } from "lucide-react";

export function Topbar({ username, onLogout }: { username: string | null; onLogout: () => void }) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, []);
  return (
    <header className="h-16 bg-brand-white border-b border-brand-border flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex-1 max-w-xl relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-brand-muted absolute left-3" />
          <input
            type="text"
            placeholder="Search patient records, scans..."
            className="w-full bg-brand-surface border border-transparent rounded-lg py-2 pl-10 pr-4 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all placeholder:text-brand-muted"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6 ml-4">
        <button className="relative p-2 text-brand-muted hover:text-brand-indigo transition-colors rounded-full hover:bg-brand-surface">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-teal rounded-full border-2 border-brand-white"></span>
        </button>

        <div className="h-8 w-px bg-brand-border"></div>

        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-brand-navy leading-tight">
              {username || (role === "doctor" ? "Dr. Practitioner" : "Patient")}
            </span>
            <span className="text-xs text-brand-muted font-medium capitalize">{role || "User"}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-brand-indigo/10 flex items-center justify-center border border-brand-indigo/20">
            <User className="w-4 h-4 text-brand-indigo" />
          </div>
          
          <button
            onClick={onLogout}
            className="ml-2 p-2 text-brand-muted hover:text-brand-indigo transition-colors rounded-full hover:bg-brand-surface"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
