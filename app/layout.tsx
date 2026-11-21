import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import TabBar from "@/components/TabBar";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kokoro | Stay in Japan's heritage homes",
  appleWebApp: { capable: true, title: "Kokoro", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
  description:
    "Book restored machiya, kominka and heritage estates across Japan, then manage your stay in one place.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${body.variable} ${cormorant.variable} antialiased`}
    >
      <body>
        <SiteNav />
        {children}
        <TabBar />
      </body>
    </html>
  );
}
