import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cue File Formatter | .cue to Tracklist",
  description:
    "Format rekordbox .cue files into clean tracklists. Paste or drop a cue file, apply time offsets, and export in multiple output formats.",
  keywords: [
    "cue file formatter",
    "rekordbox",
    "dj tracklist",
    "cue parser",
    "tracklist generator",
  ],
  applicationName: "Cue File Formatter",
  openGraph: {
    title: "Cue File Formatter",
    description:
      "Convert rekordbox .cue files into clean tracklists with configurable output formats and time offsets.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Cue File Formatter",
    description:
      "Convert rekordbox .cue files into clean tracklists with configurable output formats and time offsets.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <footer className="mx-auto mt-4 flex w-full max-w-7xl items-center justify-center gap-4 px-4 pb-6 text-sm text-zinc-600 dark:text-zinc-400">
            <Link href="/about" className="underline-offset-2 hover:underline">
              About
            </Link>
            <span aria-hidden="true">•</span>
            <div>
              <span>Made by </span>
              <a
                href="https://x.com/pathetic_geek"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-2 hover:underline"
              >
                @pathetic_geek
              </a>
            </div>
            <span aria-hidden="true">•</span>
            <a
              href="https://github.com/patheticGeek/cue-file-formatter"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:underline"
            >
              GitHub
            </a>
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
