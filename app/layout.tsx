import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pobb URL Fetcher",
  description: "Next.js com frontend e API para consultar URLs pobb.in"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Script src="/status-indicator.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
