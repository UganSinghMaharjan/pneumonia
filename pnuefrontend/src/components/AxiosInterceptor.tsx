"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";

export default function AxiosInterceptor() {
  const router = useRouter();
  const pathname = usePathname();

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
            router.push("/login");
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [router, pathname]);

  return null;
}
