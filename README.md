# Cue File Formatter

Format rekordbox `.cue` files into clean, reusable tracklists.

You can paste cue content or drop a `.cue` file, apply a global time offset, choose an export template, and copy the output in one click.

## Features

- Parse rekordbox-style `TRACK` blocks (`TITLE`, `PERFORMER`, `INDEX 01`)
- Drag-and-drop or paste `.cue` content directly
- Global offset support (`+5`, `-2`, `+00:30`, `-00:01:10`)
- Export format selector with built-in templates
- Custom export format input with token support
- Debounced custom-format input for smoother typing
- About page + FAQ content for SEO
- Responsive layout with mobile-friendly section flow

## Supported Tokens

Use these tokens in templates (including Custom):

- `{start}` - Start time (`HH:MM:SS`)
- `{start_seconds}` - Start time as total seconds
- `{title}` - Track title
- `{artist}` - Track performer (track-level only)
- `{track_no}` - Track number (`1`, `2`, `3`, ...)
- `{track_no_padded}` - Padded track number (`01`, `02`, `03`, ...)

Backward-compatible aliases are also supported:

- `{start_at}`
- `{track_title}`
- `{performer}`

## Getting Started

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - run production build
- `npm run lint` - run ESLint

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Vercel Analytics
- Cursor Agent
