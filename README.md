# Second Brain

A personal knowledge management web app inspired by Obsidian. Built to capture notes, tasks, journal entries, and calendar events in one unified, beautifully minimal interface.

---

## The Goal

The basic idea: one place for everything: notes, tasks, journal, calendar. Wired together so your thinking actually connects. Eliminates the need to switch between five apps. Real, usable and most importantly, *yours*.

---

## Features

- **Notes** — Create and edit markdown notes with a live-preview editor (CodeMirror 6). Organize notes into folders with drag-and-drop support.
- **Knowledge Graph** — Visualize connections between notes as an interactive force-directed graph. Click any node to navigate directly to that note.
- **Tasks** — Manage tasks with priorities, due dates, subtasks, and completion states. Includes confetti on task completion :)
- **Calendar** — Schedule and view events on a monthly calendar with a clean agenda sidebar.
- **Journal** — Write daily journal entries with a minimal, distraction-free interface. 
- **Full-Text Search** — Search across all notes and content instantly with partial string matching.
- **Dark / Light Mode** — Theme toggle.
- **Authentication** — JWT-based auth with bcrypt password hashing and protected routes. 

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| React Router v7 | Client-side routing |
| TanStack Query v5 | Server state & caching |
| CodeMirror 6 | Live markdown editor |
| Framer Motion | Page transitions & animations |
| react-force-graph-2d | Knowledge graph visualization |
| Lucide React | Icon library |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| TypeScript | Type safety |
| PostgreSQL | Relational database |
| Supabase | Hosted Postgres (recommended) |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |

---

## Architecture

Standard client-server setup. The frontend handles all UI and interaction, talking to a REST API backend that manages business logic and data. PostgreSQL stores all the notes, tasks, events, journal entries with a dedicated `note_links` table tracking connections between notes for the graph view.

Authentication runs through JWT tokens. The graph view queries note relationships from the database and renders them as an interactive force directed graph on the frontend. The whole thing actually talks to itself like it's supposed to.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A PostgreSQL database (local or [Supabase](https://supabase.com) — Supabase is beginner-friendlier and honestly just easier)

### 1. Clone the repository

```bash
git clone https://github.com/SidTheSloth12/second-brain.git
cd second-brain
```

### 2. Set up the server

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your_32_char_secret_here
FRONTEND_ORIGINS=http://localhost:5173
PORT=5000
```

Initialize the database (run these in order — order matters):

```bash
psql $DATABASE_URL -f sql/init.sql
psql $DATABASE_URL -f sql/folders.sql
psql $DATABASE_URL -f sql/notes.sql
psql $DATABASE_URL -f sql/tasks.sql
psql $DATABASE_URL -f sql/events.sql
psql $DATABASE_URL -f sql/journal_and_search.sql
```

Start the server:

```bash
npm run dev
```

### 3. Set up the client

```bash
cd ../client
npm install
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start the client:

```bash
npm run dev
```

App is live at **http://localhost:5173**. 

---

## Project Structure

```
second-brain/
├── client/                  # React frontend
│   └── src/
│       ├── components/      # Reusable UI components
│       │   ├── notes/       # Note editor, graph, sidebar
│       │   ├── journal/     # Journal components
│       │   └── calendar/    # Calendar components
│       ├── pages/           # Route-level page components
│       │   ├── notes/       # Notes layout, edit, graph views
│       │   ├── TasksPage    # Task manager
│       │   ├── JournalPage  # Daily journal
│       │   ├── CalendarPage # Calendar & events
│       │   └── SearchPage   # Full-text search
│       ├── hooks/           # Custom React hooks
│       ├── context/         # Auth context
│       └── types/           # Shared TypeScript types
│
└── server/                  # Express backend
    ├── src/
    │   ├── routes/          # API route handlers
    │   │   ├── notes.ts
    │   │   ├── tasks.ts
    │   │   ├── folders.ts
    │   │   ├── journal.ts
    │   │   ├── calendar.ts
    │   │   ├── events.ts
    │   │   ├── search.ts
    │   │   └── auth.ts
    │   ├── middleware/      # Auth middleware
    │   ├── domain/          # Business logic
    │   └── db.ts            # Database connection
    └── sql/                 # Schema migration files
```

---

## API Overview

All routes are prefixed with `/api` and require a `Bearer` JWT token — except `/api/auth`, which is how you get the token in the first place.

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Login and receive a JWT |
| `GET/POST` | `/api/notes` | List / create notes |
| `GET/PUT/DELETE` | `/api/notes/:id` | Get / update / delete a note |
| `GET/POST` | `/api/folders` | List / create folders |
| `GET/POST` | `/api/tasks` | List / create tasks |
| `GET/POST` | `/api/journal` | List / create journal entries |
| `GET/POST` | `/api/events` | List / create calendar events |
| `GET` | `/api/search?q=` | Full-text search across notes |

---

## Why Did I Build A "Second Brain"?
> *My first brain already has enough going on.*

I miss things if I don't write them down, and I got tired of my notes living in one app, my tasks in another, and my calendar somewhere else entirely. Yes, Google has done the integration thing already, and done it well. What I've built is essentially a budget version of that, except with linked notes and a graph view, which Google doesn't have.
The Obsidian-style notes, folder structure, and graph view are how I (try to) organize my thoughts and ideas. I think about a lot of things. They need a map. The calendar and tasks just keep my life running smoothly enough that I have time to do that.

Regarding the "Lines" section, it was made out of pure boredom. Lines I've come across from TV shows, books, movies, or the Internet. There's some real poetic beauty in there :)

---

*I might add a habit tracker feature in the near future*.
