import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/react";

const title = "Daisy.work: describe a job, get it posted";
const description =
  "Describe the job you need done in plain words. Daisy writes the posting, you publish it, and people apply.";
const url = "https://daisy-work.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: {
    default: title,
    template: "%s · Daisy.work",
  },
  description,
  openGraph: {
    type: "website",
    siteName: "Daisy.work",
    title,
    description,
    url,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>
          {children}
          <Toaster />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
