import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChatWidget } from "@/components/chat-widget";
import { TenantProvider } from "@/lib/TenantProvider";
import { TenantAnalytics } from "@/lib/TenantAnalytics";
import { FeatureProvider } from "@/contexts/FeatureContext";
import { FeatureAwareChatWidget } from "@/components/FeatureAwareChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Generic metadata - will be updated client-side by TenantProvider
export const metadata: Metadata = {
  title: "Smartphone Service",
  description: "Premium refurbished smartphones and professional repair services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TenantProvider>
          <FeatureProvider>
            {/* Dynamic analytics based on tenant config */}
            <TenantAnalytics />
            {children}
            {/* Chat widget only shown if tickets feature is enabled */}
            <FeatureAwareChatWidget />
          </FeatureProvider>
        </TenantProvider>
      </body>
    </html>
  );
}


