# Second Brain

A comprehensive personal knowledge management and productivity application built with a modern web stack. Second Brain helps you organize your notes, track habits, manage tasks, and keep a daily journal—all in one place.

## Architecture Overview

The application follows a standard client-server architecture with a RESTful API backend communicating with a relational database.

### System Diagram

```mermaid
graph TD
    Client[Client (React SPA)] -->|REST API over HTTP| API[Server (Express API)]
    API -->|Prisma ORM| DB[(Supabase PostgreSQL)]
```

- **Client:** A Single Page Application (SPA) built with React, Vite, and Tailwind CSS. It uses React Query for efficient data fetching, caching, and state synchronization. It communicates with the backend exclusively via RESTful endpoints.
- **Server:** A Node.js backend using Express.js. It handles authentication, data validation (via Zod), and domain logic (such as syncing wiki-style note links). 
- **Database:** A PostgreSQL database hosted on Supabase. It uses raw SQL `to_tsvector` GIN indexes for performant full-text searches across notes and journals. 

## Folder Structure

The repository is organized into a monorepo containing two main packages: `client` and `server`.

```text
second-brain/
├── client/                     # Frontend React application
│   ├── public/                 # Static public assets
│   └── src/
│       ├── assets/             # Images and design assets
│       ├── auth/               # Authentication contexts and hooks
│       ├── components/         # Reusable UI components
│       ├── context/            # React context providers
│       ├── data/               # Static data files (e.g., quotes)
│       ├── hooks/              # Custom React hooks (e.g., useLocalStorage)
│       ├── lib/                # API clients and utility functions
│       ├── pages/              # Application views/routes
│       └── types/              # TypeScript type definitions
├── server/                     # Backend Express API
│   ├── prisma/                 # Prisma schema and migrations
│   ├── src/
│   │   ├── __tests__/          # Vitest unit and integration tests
│   │   ├── domain/             # Core business logic (NoteService, TaskService)
│   │   ├── lib/                # Backend utilities (slugification, wiki link parsing)
│   │   ├── middleware/         # Express middlewares (auth, error handling)
│   │   ├── routes/             # Express API route controllers
│   │   ├── utils/              # Helper functions (async wrappers)
│   │   └── index.ts            # Application entry point
│   └── Dockerfile              # Docker configuration for production builds
└── docker-compose.yml          # Local development orchestration
```

## Features

- **Notes & Knowledge Graph:** Create interconnected notes using wiki-style links and visualize them through an interactive knowledge graph. Features full-text search optimized with PostgreSQL GIN indexing.
- **Task Management:** Manage your to-do lists, prioritize tasks, and track completions.
- **Habit Tracker:** Log daily habits, track streaks, and visualize your progress over time.
- **Journal:** Write daily journal entries to capture your thoughts and reflections.
- **Calendar:** Keep track of upcoming events and deadlines.
- **Dashboard:** A unified view of your most important information, including priority tasks, recent notes, and upcoming calendar events.

## Tech Stack

### Client (Frontend)
- **Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Framer Motion (for animations)
- **Data Fetching:** React Query (@tanstack/react-query)
- **Routing:** React Router

### Server (Backend)
- **Framework:** Express
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Database Engine:** PostgreSQL (hosted on Supabase)
- **Validation:** Zod

## Deployment & Hosting

- **Database:** Hosted in the cloud on **Supabase** (PostgreSQL). Supabase manages the connection pooling and provides a direct connection for migrations.
- **Application Deployment:** The application is deployed seamlessly using **Vercel**, providing edge-network performance, CI/CD integration, and easy environment variable management.

## Getting Started

### Prerequisites
- Node.js (v18 or newer recommended)
- A Supabase project (for PostgreSQL)
- A Vercel account (if you intend to deploy your own instance)

### Environment Variables

1. Copy `.env.example` to `.env` in the `server` directory.
2. Update the `DATABASE_URL` and `DIRECT_URL` with your Supabase credentials. Ensure your pooler URL uses port `6543`.
3. In the `client` directory, create a `.env` file and set `VITE_API_URL` to point to your backend. (When deploying to Vercel, you will set this in the Vercel dashboard).

### Installation

1. Install dependencies for the server:
   ```bash
   cd server
   npm install
   ```
2. Generate Prisma client and apply migrations to your Supabase database:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```
3. Install dependencies for the client:
   ```bash
   cd ../client
   npm install
   ```

### Running Locally

To run the application locally, you will need to start both the server and the client.

**Start the Server:**
```bash
cd server
npm run dev
```

**Start the Client:**
```bash
cd client
npm run dev
```

Your application should now be accessible at `http://localhost:5173`.
