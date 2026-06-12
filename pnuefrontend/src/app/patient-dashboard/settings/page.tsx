"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import {
  Settings,
  User,
  Shield,
  Loader2,
  Check,
  AlertCircle,
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

export default function PatientSettingsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    age: "",
    gender: "",
    contact_number: "",
    address: "",
    blood_group: "",
  });

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
      fetchProfile(storedToken);
    }
  }, [router]);

  const fetchProfile = async (authToken: string) => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8000/api/user/", {
        headers: { Authorization: `Token ${authToken}` },
      });
      const data = response.data;
      setForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        age: data.age?.toString() || "",
        gender: data.gender || "",
        contact_number: data.contact_number || "",
        address: data.address || "",
        blood_group: data.blood_group || "",
      });
    } catch (err) {
      console.error("Failed to fetch profile settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitLoading(true);
    setSuccess(false);
    try {
      await axios.patch(
        "http://localhost:8000/api/user/",
        {
          first_name: form.first_name,
          last_name: form.last_name,
          age: form.age === "" ? "" : parseInt(form.age),
          gender: form.gender,
          contact_number: form.contact_number,
          address: form.address,
          blood_group: form.blood_group,
        },
        { headers: { Authorization: `Token ${token}` } },
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile settings", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSubmitLoading(false);
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
              Account & Profile Settings
            </h1>
            <p className="text-brand-muted font-medium">
              Update your personal credentials and health profile details.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-brand-indigo animate-spin" />
            </div>
          ) : (
            <div className="max-w-3xl bg-brand-white rounded-2xl border border-brand-border shadow-soft overflow-hidden">
              <div className="p-6 border-b border-brand-border flex items-center space-x-2">
                <Settings className="w-5 h-5 text-brand-indigo" />
                <h3 className="font-bold text-brand-navy text-base">
                  Health Card Configuration
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {success && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600 text-xs font-semibold flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Your profile was updated successfully.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={form.first_name}
                      onChange={(e) =>
                        setForm({ ...form, first_name: e.target.value })
                      }
                      className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={form.last_name}
                      onChange={(e) =>
                        setForm({ ...form, last_name: e.target.value })
                      }
                      className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      value={form.age}
                      onChange={(e) =>
                        setForm({ ...form, age: e.target.value })
                      }
                      className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">
                      Gender
                    </label>
                    <select
                      value={form.gender}
                      onChange={(e) =>
                        setForm({ ...form, gender: e.target.value })
                      }
                      className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">
                      Blood Group
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. O+"
                      value={form.blood_group}
                      onChange={(e) =>
                        setForm({ ...form, blood_group: e.target.value })
                      }
                      className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      value={form.contact_number}
                      onChange={(e) =>
                        setForm({ ...form, contact_number: e.target.value })
                      }
                      className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">
                      Address
                    </label>
                    <textarea
                      rows={3}
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      className="w-full bg-brand-surface border border-transparent rounded-lg px-3.5 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-indigo resize-none"
                    />
                  </div>
                </div>

                <div className="border-t border-brand-border/60 pt-6 flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-xs text-brand-muted">
                    <Shield className="w-4 h-4 text-brand-teal" />
                    <span>Your clinical data remains secure.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="bg-brand-indigo hover:bg-[#2a2853] text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors flex items-center space-x-1.5 shadow-md active:scale-98"
                  >
                    {submitLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
