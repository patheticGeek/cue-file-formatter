import type { Metadata } from "next";
import Link from "next/link";
import FaqSection from "@/components/faq-section";

export const metadata: Metadata = {
  title: "About | Cue File Formatter",
  description:
    "Learn what Cue File Formatter does: convert rekordbox .cue files into clean tracklists with configurable formats and time offsets.",
  openGraph: {
    title: "About Cue File Formatter",
    description:
      "Cue File Formatter helps DJs turn rekordbox cue sheets into readable, export-ready tracklists.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About Cue File Formatter",
    description:
      "Convert rekordbox .cue files into clean tracklists with configurable export templates.",
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="space-y-6 rounded-xl border border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h1 className="text-3xl font-semibold tracking-tight">About Cue File Formatter</h1>
        <p className="text-zinc-700 dark:text-zinc-300">
          Cue File Formatter is a web tool for DJs and set curators who work with rekordbox
          exports. It parses `.cue` files and generates clean tracklist output you can reuse in
          posts, playlists, and set descriptions.
        </p>
        <p className="text-zinc-700 dark:text-zinc-300">
          You can paste or drop a cue file, shift timestamps with positive or negative offsets, and
          export the result using selectable output templates.
        </p>
        <div className="text-sm">
          <Link href="/" className="text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100">
            Back to formatter
          </Link>
        </div>
      </div>
      <div className="mt-6">
        <FaqSection variant="card" />
      </div>
    </main>
  );
}
