"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Activity, Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    // If token exists, redirect to dashboard immediately
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isLogin 
      ? "http://localhost:8000/api/login/" 
      : "http://localhost:8000/api/register/";

    const payload = isLogin 
      ? { username, password } 
      : { username, email, password };

    try {
      const response = await axios.post(url, payload);
      const { token, username: returnedUsername } = response.data;

      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("username", returnedUsername);

      // Smooth transition to homepage
      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || 
        "Something went wrong. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-4 border border-indigo-100 shadow-sm animate-pulse">
            <Activity className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Pneumonix AI
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-light">
            Advanced X-Ray Diagnostic Intelligence Portal
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/60 shadow-xl shadow-slate-100/50">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-slate-800">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isLogin 
                ? "Sign in to access advanced diagnostics" 
                : "Register a clinical workspace account"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50/50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-start space-x-2 animate-in fade-in duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. dr_smith"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-sm outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            {/* Email Input (Sign Up only) */}
            {!isLogin && (
              <div className="animate-in fade-in duration-300">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="e.g. smith@clinic.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-sm outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>
            )}

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-sm outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-3.5 font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-slate-900/10 active:scale-[0.98] flex items-center justify-center space-x-2 disabled:bg-slate-300 disabled:shadow-none"
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
          <div className="mt-6 text-center border-t border-slate-100 pt-6">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setUsername("");
                setEmail("");
                setPassword("");
              }}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already registered? Sign in"}
            </button>
          </div>
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-8 font-light">
          Secure clinical interface. Authorized clinical personnel only.
        </p>
      </div>
    </div>
  );
}
