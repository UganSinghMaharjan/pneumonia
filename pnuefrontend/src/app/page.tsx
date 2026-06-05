"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      router.push("/login");
    } else if (role === "doctor") {
      router.push("/doctor-dashboard");
    } else {
      router.push("/patient-dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-surface">
      <Loader2 className="w-10 h-10 text-brand-indigo animate-spin" />
    </div>
  );
}
