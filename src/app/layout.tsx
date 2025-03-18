import type { Metadata } from "next";
import RootLayout from "@/components/layout/RootLayout";
import "./globals.css";

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
      <body>
        <RootLayout>{children}</RootLayout>
      </body>
    </html>
  );
}
