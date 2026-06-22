import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DemoProvider } from "../context/DemoContext";
import AppWrapper from "../components/AppWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NorthStarAI - AI-Powered Deadline Guardian",
  description: "An AI-powered productivity companion that prevents missed deadlines by proactively planning, prioritizing, and scheduling work with Google Gemini 2.5 Pro.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-[#060913] text-slate-100 flex flex-row">
        <DemoProvider>
          <AppWrapper>{children}</AppWrapper>
        </DemoProvider>
      </body>
    </html>
  );
}
