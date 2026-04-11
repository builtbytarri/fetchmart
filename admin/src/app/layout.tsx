import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FetchMart - Fresh Groceries Delivered to Your Door",
    template: "%s | FetchMart",
  },
  description: "FetchMart is your trusted grocery delivery service. Shop fresh produce, groceries, and essentials from local markets with fast, reliable delivery right to your doorstep.",
  keywords: [
    "grocery delivery",
    "fresh groceries",
    "online grocery shopping",
    "food delivery",
    "fresh produce",
    "local market delivery",
    "FetchMart",
    "groceries online",
    "fast delivery",
    "doorstep delivery",
    "fresh vegetables",
    "fresh fruits",
    "household essentials",
    "Nigeria grocery delivery",
    "Abuja grocery delivery",
  ],
  authors: [{ name: "FetchMart" }],
  creator: "FetchMart",
  publisher: "FetchMart",
  metadataBase: new URL("https://fetchmart.com.ng"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/images/icon.png",
    shortcut: "/images/icon.png",
    apple: "/images/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://fetchmart.com.ng",
    siteName: "FetchMart",
    title: "FetchMart - Fresh Groceries Delivered to Your Door",
    description: "Shop fresh produce, groceries, and essentials from local markets with fast, reliable delivery right to your doorstep.",
    images: [
      {
        url: "/images/logo.png",
        width: 1200,
        height: 630,
        alt: "FetchMart - Fresh Groceries Delivered",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FetchMart - Fresh Groceries Delivered to Your Door",
    description: "Shop fresh produce, groceries, and essentials from local markets with fast, reliable delivery right to your doorstep.",
    images: ["/images/logo.png"],
    creator: "@FetchMart",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
