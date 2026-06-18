import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { getProfile } from "@/lib/queries";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WorkCHAM — Personal Command Center",
  description: "Your projects, tasks, notes, and metrics in one place.",
};

// Static, no-user-input script that applies the saved theme before first paint to avoid a flash.
const noFlashTheme = `(function(){try{var t=localStorage.getItem('WorkCHAM-theme');document.documentElement.classList.toggle('dark', t? t==='dark':true);}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getProfile();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body className="min-h-full">
        <AppShell profile={profile}>{children}</AppShell>
      </body>
    </html>
  );
}
