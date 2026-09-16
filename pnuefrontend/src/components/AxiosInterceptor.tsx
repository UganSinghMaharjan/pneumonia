"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { useToast } from "@/context/ToastContext";

export default function AxiosInterceptor() {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // If not already on the login page, clear session and redirect
          if (pathname !== "/login") {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("username");
            toast.error("Session expired. Please sign in again.", "Session Expired");
            router.push("/login");
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [router, pathname, toast]);

  return null;
}
