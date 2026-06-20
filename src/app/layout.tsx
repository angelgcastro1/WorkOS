import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";
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
  title: "WorkCham — Personal Command Center",
  description: "Your projects, tasks, notes, and metrics in one place.",
  applicationName: "WorkCham",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "WorkCham", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

// Static, no-user-input script that applies the saved theme before first paint to avoid a flash.
const noFlashTheme = `(function(){try{var t=localStorage.getItem('workos-theme');document.documentElement.classList.toggle('dark', t? t==='dark':true);}catch(e){}})();`;

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
        <meta name="theme-color" content="#0b1f4d" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full">
        <AppShell profile={profile}>{children}</AppShell>
        <PwaRegister />
      </body>
    </html>
  );
}
