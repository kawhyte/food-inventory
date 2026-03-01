import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, Patrick_Hand } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const patrickHand = Patrick_Hand({
  variable: "--font-patrick-hand",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Pantry Pal",
  description: "Your hand-drawn kitchen companion",
  applicationName: "Pantry Pal",
  appleWebApp: {
    capable: true,
    title: "Pantry Pal",
    statusBarStyle: "default",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} ${geistMono.variable} ${patrickHand.variable} antialiased`}
      >
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
