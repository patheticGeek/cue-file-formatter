"use client";

import FaqSection from "@/components/faq-section";
import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";

type ParsedTrack = {
  title: string;
  performer?: string;
  startAt: string;
};

type FormatOption = {
  id: string;
  label: string;
  template: string;
};

type TokenOption = {
  token: string;
  description: string;
};

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: "start-title-performer",
    label: "Start + Title + Performer",
    template: "{start} {title} by {artist}",
  },
  {
    id: "start-performer-title",
    label: "Start + Performer + Title",
    template: "{start} {artist} - {title}",
  },
  {
    id: "title-performer-start",
    label: "Title + Performer + Start",
    template: "{title} - {artist} ({start})",
  },
  {
    id: "csv",
    label: "CSV",
    template: "{track_no},{start},{title},{artist}",
  },
  {
    id: "custom",
    label: "Custom",
    template: "{start} {title}",
  },
];

const TOKEN_OPTIONS: TokenOption[] = [
  { token: "{start}", description: "Track start time (HH:MM:SS)" },
  {
    token: "{start_seconds}",
    description: "Track start time as total seconds",
  },
  { token: "{title}", description: "Track title" },
  {
    token: "{artist}",
    description: "Track performer/artist (track-level only)",
  },
  { token: "{track_no}", description: "Track number (1, 2, 3...)" },
  {
    token: "{track_no_padded}",
    description: "Track number padded (01, 02, 03...)",
  },
];

const TRACK_HEADER = /^\s*TRACK\s+\d+\s+AUDIO\s*$/i;
const TITLE_LINE = /^\s*TITLE\s+"(.+)"\s*$/i;
const PERFORMER_LINE = /^\s*PERFORMER\s+"(.+)"\s*$/i;
const INDEX_LINE = /^\s*INDEX\s+01\s+(\d{2}:\d{2}:\d{2})\s*$/i;

function parseCue(cueText: string): ParsedTrack[] {
  const tracks: ParsedTrack[] = [];
  const lines = cueText.replace(/\r\n/g, "\n").split("\n");

  let currentTrack: Partial<ParsedTrack> | null = null;

  const pushCurrentTrack = () => {
    if (!currentTrack?.title || !currentTrack.startAt) {
      return;
    }

    tracks.push({
      title: currentTrack.title,
      startAt: currentTrack.startAt,
      performer: currentTrack.performer || "",
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
    }
  }

  pushCurrentTrack();
  return tracks;
}

function parseTimeToSeconds(timecode: string): number | null {
  const parts = timecode.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  return null;
}

function formatSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function parseOffsetToSeconds(offset: string): number | null {
  const trimmed = offset.trim();
  if (!trimmed) {
    return 0;
  }

  if (/^[+-]?\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const sign = trimmed.startsWith("-") ? -1 : 1;
  const unsignedOffset = trimmed.replace(/^[+-]/, "");
  const parsedTime = parseTimeToSeconds(unsignedOffset);
  if (parsedTime === null) {
    return null;
  }

  return sign * parsedTime;
}

function renderTemplate(
  track: ParsedTrack,
  template: string,
  trackIndex: number,
): string {
  const startSeconds = parseTimeToSeconds(track.startAt);
  const replacements: Record<string, string> = {
    // Preferred tokens
    start: track.startAt,
    start_seconds: startSeconds === null ? "" : String(startSeconds),
    title: track.title,
    artist: track.performer ?? "",
    track_no: String(trackIndex + 1),
    track_no_padded: String(trackIndex + 1).padStart(2, "0"),
    // Backward-compatible aliases
    start_at: track.startAt,
    track_title: track.title,
    performer: track.performer ?? "",
  };

  const rendered = template.replace(
    /\{([a-z_]+)\}/g,
    (match, token: string) => {
      return Object.hasOwn(replacements, token) ? replacements[token] : match;
    },
  );

  if (template.includes(",")) {
    return rendered.trim();
  }

  return rendered
    .replace(/\s{2,}/g, " ")
    .replace(/\s+-\s*$/g, "")
    .replace(/\(\s*\)/g, "")
    .trim();
}

export default function Home() {
  const [cueText, setCueText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [offsetInput, setOffsetInput] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("start-title-performer");
  const [customFormat, setCustomFormat] = useState("{start} {title}");
  const [debouncedCustomFormat, setDebouncedCustomFormat] =
    useState(customFormat);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedCustomFormat(customFormat);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [customFormat]);

  const parsedTracks = useMemo(() => parseCue(cueText), [cueText]);
  const offsetSeconds = useMemo(
    () => parseOffsetToSeconds(offsetInput),
    [offsetInput],
  );

  const adjustedTracks = useMemo(() => {
    if (offsetSeconds === null) {
      return [];
    }

    return parsedTracks.map((track) => {
      const originalSeconds = parseTimeToSeconds(track.startAt);
      return {
        ...track,
        startAt:
          originalSeconds === null
            ? track.startAt
            : formatSeconds(originalSeconds + offsetSeconds),
      };
    });
  }, [parsedTracks, offsetSeconds]);

  const formattedByFormat = useMemo(() => {
    return FORMAT_OPTIONS.filter((option) => option.id === selectedFormat).map(
      (option) => ({
        ...option,
        template:
          option.id === "custom" ? debouncedCustomFormat : option.template,
        output: adjustedTracks
          .map((track, index) =>
            renderTemplate(
              track,
              option.id === "custom" ? debouncedCustomFormat : option.template,
              index,
            ),
          )
          .join("\n"),
      }),
    );
  }, [adjustedTracks, debouncedCustomFormat, selectedFormat]);

  const selectedFormatOutputText = useMemo(
    () => formattedByFormat[0]?.output ?? "",
    [formattedByFormat],
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

  const handleCopyClick = async () => {
    if (!selectedFormatOutputText) {
      return;
    }
    await navigator.clipboard.writeText(selectedFormatOutputText);
    window.alert("Copied!");
  };

  const selectFormat = (formatId: string) => {
    setSelectedFormat(formatId);
  };

  const renderExportFormatsPanel = (panelId: string, className: string) => (
    <aside className={className}>
      <h2 className="text-lg font-semibold">Export Formats</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Select one output format.
      </p>
      <div className="mt-4 space-y-3">
        {FORMAT_OPTIONS.map((option) => (
          <label
            key={`${panelId}-${option.id}`}
            className="flex cursor-pointer items-start gap-2 rounded-md border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
          >
            <input
              type="radio"
              name={`export-format-${panelId}`}
              checked={selectedFormat === option.id}
              onChange={() => selectFormat(option.id)}
              className="mt-0.5 h-4 w-4"
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium">{option.label}</span>
              <code className="block text-xs text-zinc-500 dark:text-zinc-400">
                {option.template}
              </code>
            </span>
          </label>
        ))}
      </div>

      {selectedFormat === "custom" ? (
        <div className="mt-4 space-y-2">
          <label htmlFor={`${panelId}-custom-format`} className="text-sm font-medium">
            Custom format
          </label>
          <input
            id={`${panelId}-custom-format`}
            type="text"
            value={customFormat}
            onChange={(event) => setCustomFormat(event.target.value)}
            placeholder="{start} {title}"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none ring-blue-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
      ) : null}

      <div className="mt-5">
        <h3 className="text-sm font-medium">Available tokens</h3>
        <ul className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
          {TOKEN_OPTIONS.map((token) => (
            <li key={`${panelId}-${token.token}`}>
              <code className="mr-1 text-zinc-700 dark:text-zinc-300">{token.token}</code>
              {token.description}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        One format stays selected.
      </p>
    </aside>
  );

  return (
    <div className="min-h-screen bg-zinc-50 px-3 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-4 sm:py-10">
      <main className="mx-auto grid w-full max-w-7xl gap-4 md:grid-cols-[7fr_3fr] md:gap-6">
        <section className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Cue File Formatter
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Paste or drop a rekordbox .cue file, then export selected formats.
            </p>
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-4 transition-colors sm:p-6 ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
            }`}
          >
            <div className="mb-3 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm font-medium">
                Drop .cue file here or paste below
              </p>
              <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-center text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 sm:text-left">
                Choose file
                <input
                  type="file"
                  accept=".cue"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </label>
            </div>
            <textarea
              className="h-64 w-full rounded-md border border-zinc-300 bg-white p-3 font-mono text-sm outline-none ring-blue-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Paste your .cue content here..."
              value={cueText}
              onChange={handleTextChange}
            />
            {errorMessage ? (
              <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
            ) : null}
          </div>
          {renderExportFormatsPanel(
            "mobile",
            "h-fit rounded-xl border border-zinc-300 bg-white p-4 md:hidden dark:border-zinc-700 dark:bg-zinc-900 sm:p-6",
          )}

          <div className="rounded-xl border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Formatted Output</h2>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                <div className="group relative">
                  <label
                    htmlFor="offset-input"
                    className="inline-flex cursor-help items-center gap-1 text-sm text-zinc-600 dark:text-zinc-300"
                  >
                    Offset
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
                      aria-hidden="true"
                    >
                      ?
                    </span>
                  </label>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute left-0 top-full z-10 mt-2 w-72 rounded-md bg-zinc-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    Shift all parsed start times by this amount. Use seconds
                    (+5, -2) or time (+00:30, -00:01:10).
                  </span>
                </div>
                <input
                  id="offset-input"
                  type="text"
                  value={offsetInput}
                  onChange={(event) => setOffsetInput(event.target.value)}
                  placeholder="+5, -3, +00:30"
                  className="min-w-[9rem] flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none ring-blue-500 focus:ring-2 sm:w-36 sm:flex-none dark:border-zinc-700 dark:bg-zinc-950"
                />
                <button
                  type="button"
                  onClick={handleCopyClick}
                  disabled={!selectedFormatOutputText}
                  className="w-full rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Copy
                </button>
              </div>
            </div>

            {offsetSeconds === null ? (
              <pre className="min-h-28 whitespace-pre-wrap rounded-md bg-zinc-100 p-3 font-mono text-sm dark:bg-zinc-800">
                Invalid offset. Use seconds (e.g. +5, -2) or time (e.g. +00:30,
                -00:01:10).
              </pre>
            ) : (
              <div className="space-y-4">
                {formattedByFormat.map((section) => (
                  <div key={section.id} className="space-y-2">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                      {section.label}
                    </p>
                    <pre className="min-h-20 overflow-x-auto whitespace-pre-wrap rounded-md bg-zinc-100 p-3 font-mono text-sm dark:bg-zinc-800">
                      {section.output || "No tracks parsed yet."}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              Parsed tracks: {parsedTracks.length}
            </p>
          </div>
        </section>
        {renderExportFormatsPanel(
          "desktop",
          "hidden h-fit rounded-xl border border-zinc-300 bg-white p-4 md:sticky md:top-4 md:mt-20 md:block dark:border-zinc-700 dark:bg-zinc-900 sm:p-6",
        )}
      </main>
      <div className="mx-auto mt-6 w-full max-w-7xl p-4 sm:p-6">
        <FaqSection variant="plain" />
      </div>
    </div>
  );
}
