"use client";

import { ChangeEvent, DragEvent, useMemo, useState } from "react";

type ParsedTrack = {
  title: string;
  performer: string;
  startAt: string;
};

const TRACK_HEADER = /^\s*TRACK\s+\d+\s+AUDIO\s*$/i;
const TITLE_LINE = /^\s*TITLE\s+"(.+)"\s*$/i;
const PERFORMER_LINE = /^\s*PERFORMER\s+"(.+)"\s*$/i;
const INDEX_LINE = /^\s*INDEX\s+01\s+(\d{2}:\d{2}:\d{2})\s*$/i;

function parseCue(cueText: string): ParsedTrack[] {
  const tracks: ParsedTrack[] = [];
  const lines = cueText.replace(/\r\n/g, "\n").split("\n");

  let currentTrack: Partial<ParsedTrack> | null = null;
  let defaultPerformer = "";

  const pushCurrentTrack = () => {
    if (!currentTrack?.title || !currentTrack.startAt) {
      return;
    }

    tracks.push({
      title: currentTrack.title,
      startAt: currentTrack.startAt,
      performer: currentTrack.performer || defaultPerformer || "Unknown Artist",
    });
  };

  for (const line of lines) {
    if (TRACK_HEADER.test(line)) {
      pushCurrentTrack();
      currentTrack = {};
      continue;
    }

    const performerMatch = line.match(PERFORMER_LINE);

    if (!currentTrack) {
      if (performerMatch) {
        defaultPerformer = performerMatch[1];
      }
      continue;
    }

    const titleMatch = line.match(TITLE_LINE);
    if (titleMatch) {
      currentTrack.title = titleMatch[1];
      continue;
    }

    if (performerMatch) {
      currentTrack.performer = performerMatch[1];
      continue;
    }

    const indexMatch = line.match(INDEX_LINE);
    if (indexMatch) {
      currentTrack.startAt = indexMatch[1];
      continue;
    }
  }

  pushCurrentTrack();

  return tracks;
}

export default function Home() {
  const [cueText, setCueText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const parsedTracks = useMemo(() => parseCue(cueText), [cueText]);

  const formattedOutput = useMemo(
    () =>
      parsedTracks
        .map((track) => `${track.startAt} ${track.title} ${track.performer}`)
        .join("\n"),
    [parsedTracks],
  );

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setCueText(event.target.value);
    setErrorMessage("");
  };

  const loadCueFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".cue")) {
      setErrorMessage("Please use a .cue file.");
      return;
    }

    const text = await file.text();
    setCueText(text);
    setErrorMessage("");
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }
    await loadCueFile(file);
  };

  const handleFileInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await loadCueFile(file);
    event.target.value = "";
  };

  const copyOutput = async () => {
    if (!formattedOutput) {
      return;
    }
    await navigator.clipboard.writeText(formattedOutput);
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Cue File Formatter</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Paste or drop a rekordbox .cue file to format each track as:
            <span className="ml-1 rounded bg-zinc-200 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">
              {"{start_at} {track_title} {performer}"}
            </span>
          </p>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed p-6 transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
              : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
          }`}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Drop .cue file here or paste below</p>
            <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
              Choose file
              <input type="file" accept=".cue" className="hidden" onChange={handleFileInput} />
            </label>
          </div>
          <textarea
            className="h-64 w-full rounded-md border border-zinc-300 bg-white p-3 font-mono text-sm outline-none ring-blue-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="Paste your .cue content here..."
            value={cueText}
            onChange={handleTextChange}
          />
          {errorMessage ? <p className="mt-2 text-sm text-red-600">{errorMessage}</p> : null}
        </div>

        <div className="rounded-xl border border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Formatted Output</h2>
            <button
              type="button"
              onClick={copyOutput}
              disabled={!formattedOutput}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Copy
            </button>
          </div>
          <pre className="min-h-28 whitespace-pre-wrap rounded-md bg-zinc-100 p-3 font-mono text-sm dark:bg-zinc-800">
            {formattedOutput || "No tracks parsed yet."}
          </pre>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Parsed tracks: {parsedTracks.length}
          </p>
        </div>
      </main>
    </div>
  );
}
