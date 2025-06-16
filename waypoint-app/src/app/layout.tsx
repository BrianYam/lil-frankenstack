import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ApiProvider } from "@/providers/api-provider";
import { UserProvider } from "@/contexts/user-context";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Waypoint - Plan Your Adventure",
  description: "Discover new destinations and create personalized travel itineraries",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ApiProvider>
          <UserProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <div className="pt-16">
                {children}
              </div>
            </div>
          </UserProvider>
        </ApiProvider>
      </body>
    </html>
  );
}
