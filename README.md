# Karaoke Eternal — Kosher Fork

> Open karaoke party system with i18n support (English / Russian / Hebrew)

Host awesome karaoke parties where everyone can easily find and queue songs from their phone's browser. The player is fully browser-based with support for MP3+G, MP4 videos and WebGL visualizations. The server is self-hosted and runs on nearly everything.

This fork extends the original [Karaoke Eternal](https://www.karaoke-eternal.com) with a **modular internationalization (i18n) system** — all UI strings are translatable without touching any core karaoke logic.

[![Karaoke Eternal](/docs/assets/images/README.jpg?raw=true)](/docs/assets/images/README.jpg?raw=true)

<p align="center">
  <i>App in mobile browser (top) controlling player in desktop browser (bottom)</i>
</p>

---

## Features

- Plays:
  - MP3+G (MP3 with CDG lyrics; including zipped)
  - MP4 videos
  - Music-synced WebGL visualizations (with automatic lyrics background removal)
- Fast, modern mobile browser app designed for "karaoke conditions"
- Easy joining with QR codes and guest accounts
- Multiple simultaneous rooms/queues (optionally password-protected)
- Dynamic round-robin queues — keeps parties fair, fun, and no-fuss
- Fully self-hosted with no ads or telemetry
- **Multilingual UI** — English, Russian (Русский), Hebrew (עברית); easily add more

---

## Requirements

| Tool | Min Version |
|------|------------|
| Node.js | 24 |
| npm | 11 |

---

## Quick Start (Development)

```bash
git clone <this-repo>
cd KaraokeEternalKosher
npm install
npm run dev
# Open http://localhost:3000
```

On first launch you will be prompted to create an admin account.

## Build for Production

```bash
npm run build   # compiles client (Webpack) + server (TypeScript)
npm run serve   # starts the production server
```

## Deploy to Vercel

A `vercel.json` is included so that Vercel can build and serve the React frontend as a static site:

```bash
vercel deploy
```

> **Note:** Vercel serves only the static frontend (the React SPA). Features that require the Node.js backend — such as song library scanning, the SQLite database, and real-time Socket.IO sync — are not available in a Vercel-only deployment. For the full application, deploy to a self-hosted server or a platform that supports persistent Node.js processes (e.g. Railway, Render, Fly.io).

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build (client + server) |
| `npm run build:client` | Webpack client bundle only |
| `npm run build:server` | TypeScript server compilation only |
| `npm run serve` | Run the production server |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run test` | Unit tests (Vitest) |
| `npm run typecheck` | TypeScript type check |
| `npm run docs:serve` | Local Hugo docs server |

---

## Project Structure

```
KaraokeEternalKosher/
├── server/                    # Node.js / Koa backend
│   ├── Library/               # Song library management
│   ├── Player/                # Player state & control
│   ├── Queue/                 # Queue management
│   ├── Rooms/                 # Room management
│   ├── Scanner/               # Media file scanning worker
│   ├── User/                  # User authentication
│   └── main.ts                # Server entry point
│
├── src/                       # React frontend
│   ├── components/
│   │   └── LanguageSelector/  # Language switcher component (i18n)
│   ├── i18n/                  # Internationalization module
│   │   ├── index.ts           # Context, hooks, LANGUAGES registry
│   │   ├── I18nProvider.tsx   # React provider
│   │   └── locales/
│   │       ├── en.json        # English (default / fallback)
│   │       ├── ru.json        # Russian / Русский
│   │       └── he.json        # Hebrew / עברית (RTL)
│   ├── routes/
│   │   ├── Account/           # Auth, admin, user settings
│   │   ├── Library/           # Song library browser
│   │   ├── Player/            # Karaoke player (core — untouched)
│   │   └── Queue/             # Song queue
│   └── main.tsx               # React entry point
│
├── shared/                    # Types shared between client and server
├── config/                    # Webpack, TypeScript, Babel configs
└── docs/                      # Hugo documentation site
```

---

## Internationalization (i18n)

### Design Principles

- **Zero external dependencies** — uses React Context and plain JSON
- **Non-invasive** — core karaoke playback logic is completely untouched
- **Fallback chain** — missing keys fall back to English, then show `[section.key]`
- **RTL ready** — Hebrew sets `<html dir="rtl">` automatically
- **Persistent** — selected language is saved to `localStorage` (`ke_language`)

### How It Works

The `I18nProvider` wraps the entire application in `src/components/App/App.tsx`. All child components call the `useT()` hook to obtain a translator function:

```tsx
import { useT } from 'i18n'

const MyComponent = () => {
  const t = useT()
  return <button>{t('account', 'signOut')}</button>
}
```

The `t(section, key)` call looks up `locales/<lang>.json → section → key`.

For full language/setter access use `useI18n()`:

```tsx
import { useI18n } from 'i18n'

const { language, setLanguage } = useI18n()
```

### Language Selector

`LanguageSelector` is a `<select>` component rendered in the app header when the user is on `/account`. It lets any user switch the UI language at any time.

### Translation Files

Each locale file is a flat two-level JSON object — top-level keys are _sections_, and nested keys are _string identifiers_:

```json
{
  "account": {
    "title": "My Account",
    "signOut": "Sign Out"
  },
  "queue": {
    "empty": "Queue Empty"
  }
}
```

### Adding a New Language

1. Copy `src/i18n/locales/en.json` to `src/i18n/locales/<code>.json` and translate all values.
2. Open `src/i18n/index.ts` and add two lines:

```ts
import fr from './locales/fr.json'            // 1. import

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', label: 'English',  dir: 'ltr' },
  { code: 'ru', label: 'Русский',  dir: 'ltr' },
  { code: 'he', label: 'עברית',    dir: 'rtl' },
  { code: 'fr', label: 'Français', dir: 'ltr' }, // 2. register
]

const catalogue = { en, ru, he, fr }              // 3. add to catalogue
```

No other files need to change. The new language will automatically appear in the `LanguageSelector` dropdown.

---

## Supported Media Formats

| Format | Notes |
|--------|-------|
| **MP3+G** | MP3 audio + CDG graphics (most common karaoke format); `.zip` supported |
| **MP4** | Video files with embedded or alpha-channel lyrics |
| **WebGL** | Butterchurn music visualizer for audio-only tracks |

---

## Technology Stack

**Backend**

| Technology | Role |
|-----------|------|
| Node.js + TypeScript | Runtime & language |
| Koa | HTTP server framework |
| Socket.IO | Real-time sync (player ↔ app) |
| SQLite (`sqlate`) | Local database |

**Frontend**

| Technology | Role |
|-----------|------|
| React 18 + TypeScript | UI framework |
| Redux Toolkit + redux-persist | State management |
| React Router 7 | Client-side routing |
| Webpack 5 / Babel | Bundling & transpiling |
| CSS Modules | Scoped component styles |

**i18n (this fork)**

| Technology | Role |
|-----------|------|
| React Context | Global language state |
| JSON files | Translation storage |
| localStorage | Language preference persistence |
| `<html dir>` | RTL layout support |

---

## Contributing & Development

Contributions are welcome! Please join the `#dev` channel of the [Discord Server](https://discord.gg/PgqVtFq) before embarking on major features.

For i18n contributions (new languages or improved translations), simply follow the [Adding a New Language](#adding-a-new-language) guide above and open a pull request.

---

## License

ISC — see [LICENSE](LICENSE) for details.
Original project by [RadRoot LLC](https://www.radroot.com) — <https://www.karaoke-eternal.com>
