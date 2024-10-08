import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Head from "next/head";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Casino Sim",
  description: "Play some fake games of chance!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <title>Casino Sim</title>
        <meta name="description" content="Play some fake games of chance!" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          defer
          src="https://umami-qs0c004ww04o0c0o8woocwws.noah.dev/script.js"
          data-website-id="7f7430b7-17c0-4c28-be0c-af0a6fac4fd3"
        ></script>
      </Head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
