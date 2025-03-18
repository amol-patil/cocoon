import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DatabaseProvider } from "@/components/providers/DatabaseProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cocoon - Document Insights",
  description: "Transform your documents into smart, accessible insights",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DatabaseProvider>{children}</DatabaseProvider>
      </body>
    </html>
  );
}
