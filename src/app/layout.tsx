import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF Tools",
  description: "Free online PDF and image tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
