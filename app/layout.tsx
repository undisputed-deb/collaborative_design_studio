import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CosmicAnalyticsProvider } from "cosmic-analytics";
import { AuthProvider } from "cosmic-authentication";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

const primaryFont = Inter({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
});

// Change the title and description to your own.
export const metadata: Metadata = {
  title: "sketchFlow",
  description: "Creative whiteboard for brilliant minds - Draw, ideate, and collaborate in real-time",
};

export default function RootLayout({
  children,
  
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={primaryFont.className}>
      <body
        className="antialiased text-white"
      >
        <CosmicAnalyticsProvider>
          <AuthProvider>
            <Navbar />
            <main className="min-h-screen pt-[84px]">
              {children}
            </main>
          </AuthProvider>
        </CosmicAnalyticsProvider>
        <Footer />
      </body>
    </html>
  );
}