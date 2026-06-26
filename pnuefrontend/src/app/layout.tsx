import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AxiosInterceptor from "@/components/AxiosInterceptor";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pneumonix AI Dashboard",
  description: "Modern SaaS dashboard for Pneumonia Detection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AxiosInterceptor />
        {children}
      </body>
    </html>
  );
}
