"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Activity,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    // If token exists, redirect to dashboard immediately
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token) {
      if (role === "doctor") {
        router.push("/doctor-dashboard");
      } else {
        router.push("/patient-dashboard");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isLogin
      ? "http://localhost:8000/api/login/"
      : "http://localhost:8000/api/register/";

    const payload = {
      email: email.trim().toLowerCase(),
      password,
    };

    try {
      const response = await axios.post(url, payload);

      if (!isLogin) {
        // Switch back to login view after successful registration
        setIsLogin(true);
        setPassword(""); // clear password for security
        alert(
          "Account created successfully! Please sign in with your new credentials.",
        );
        return;
      }

      const { token, username: returnedUsername, role } = response.data;

      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("username", returnedUsername);
      if (role) {
        localStorage.setItem("role", role);
      }

      // Smooth transition to corresponding dashboard
      if (role === "doctor") {
        router.push("/doctor-dashboard");
      } else {
        router.push("/patient-dashboard");
      }

      router.refresh();
    } catch (err: any) {
      // Removed console.error to prevent expected 401s from cluttering the dev console
      setError(
        err.response?.data?.error ||
          "Something went wrong. Please check your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-brand-surface">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-brand-indigo/10 rounded-2xl mb-4 border border-brand-indigo/20 shadow-sm animate-pulse">
            <Activity className="w-8 h-8 text-brand-indigo" />
          </div>
          <h1 className="text-3xl font-bold text-brand-navy tracking-tight">
            Pneumonix AI
          </h1>
          <p className="text-sm text-brand-muted mt-2 font-medium">
            Advanced X-Ray Diagnostic Intelligence Portal
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-brand-white rounded-2xl p-8 border border-brand-border shadow-soft">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-brand-navy">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-xs text-brand-muted mt-1 font-medium">
              {isLogin
                ? "Sign in to access advanced diagnostics"
                : "Register a clinical workspace account"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start space-x-2 animate-in fade-in duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="e.g. smith@clinic.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-brand-surface border border-brand-border rounded-lg text-brand-navy placeholder:text-brand-muted text-sm outline-none transition-all duration-200 focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-brand-surface border border-brand-border rounded-lg text-brand-navy placeholder:text-brand-muted text-sm outline-none transition-all duration-200 focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-brand-indigo hover:bg-[#2a2853] text-white rounded-lg py-3 font-semibold transition-all duration-200 shadow-md active:scale-[0.98] flex items-center justify-center space-x-2 disabled:bg-brand-surface disabled:text-brand-muted disabled:border disabled:border-brand-border disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? "Sign In" : "Get Started"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Form Type */}
          <div className="mt-6 text-center border-t border-brand-border pt-6">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setEmail("");
                setPassword("");
              }}
              className="text-sm font-semibold text-brand-indigo hover:text-brand-lavender transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already registered? Sign in"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-brand-muted mt-8 font-medium">
          Secure clinical interface. Authorized clinical personnel only.
        </p>
      </div>
    </div>
  );
}
