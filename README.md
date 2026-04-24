# Orrico Retail Intelligence

Orrico Retail Intelligence is a retail analytics web application designed for shop owners and growing businesses that want a simpler way to understand sales, customers, inventory, and store performance.

The application combines a React-based frontend with a lightweight Express backend to provide authentication, chat-based business queries, and database connection workflows in a single product experience.

## Product Overview

Orrico is built around a straightforward idea: retail teams should be able to ask business questions in natural language and get clear, decision-ready answers without navigating complex reporting tools.

The current application includes:

- Retail-focused landing and onboarding flows
- Email/password authentication
- Google sign-in support using Google Identity Services
- Demo account access for product walkthroughs
- Chat-based business assistant experience
- Dashboard views for sales, customer, order, and inventory data
- Database connection setup for MySQL, PostgreSQL, Oracle, and SQLite
- Lightweight backend APIs for auth, chat, sessions, and saved database configuration

## Technology Stack

- Frontend: React 18, Parcel, Tailwind CSS, Radix UI, Recharts
- Backend: Node.js, Express
- State and persistence: browser local storage plus file-backed backend storage
- Authentication: email/password flow and Google Identity Services
- Deployment: suitable for Vercel frontend hosting with a separate backend runtime

## Repository Structure

```text
.
|-- server/              # Express API, chat engine, file-backed storage
|-- src/                 # React application source
|   |-- components/      # UI screens and shared components
|   |-- data/            # Local intent and demo data
|   `-- lib/             # Frontend API client
|-- index.html           # Parcel entry point
|-- package.json
`-- README.md
```

## Local Development

### Prerequisites

- Node.js 18 or newer
- npm

### Installation

```bash
npm install
```

### Run the application

```bash
npm run dev
```

This starts:

- Frontend at `http://localhost:3000`
- Backend API at `http://localhost:4000`

### Production build

```bash
npm run build
```

### Start the backend only

```bash
npm start
```

## Environment Variables

Create a local `.env` file when needed.

```env
GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
API_BASE_URL=http://localhost:4000/api
```

### Google sign-in setup

Create a Google OAuth Web Client ID and add the following authorized JavaScript origins:

- `http://localhost:3000`
- your production frontend URL

Only the client ID is required in this project. Do not expose a Google client secret in the frontend.

## Available Scripts

- `npm run dev` - starts frontend and backend together
- `npm run dev:client` - starts the Parcel frontend
- `npm run dev:server` - starts the Express API
- `npm run build` - creates the frontend production build
- `npm start` - starts the backend server

## Demo Access

For presentations, reviews, or quick product walkthroughs, the app includes a demo account:

- Email: `demo@orrico.com`
- Password: `demo123`

## API Summary

The backend currently exposes the following routes:

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `GET /api/database/current`
- `POST /api/database/connect`
- `POST /api/chat/message`

## Current Implementation Notes

This repository is structured as a working full-stack product foundation. It is well suited for demos, internal reviews, UI validation, and incremental product development.

At the moment:

- the backend uses file-backed storage rather than a production database
- passwords are not yet hardened with production-grade hashing
- chat responses are application-driven rather than connected to a live analytics engine
- database connection flows are product-facing and persistent, but not yet a full secure connector layer

These are deliberate next-step areas for future hardening rather than blockers for product presentation or feature iteration.

## Recommended Next Steps

- Move backend persistence to PostgreSQL with an ORM such as Prisma
- Add password hashing and stronger session security
- Complete server-side Google authentication hardening
- Connect the chat workflow to a real analytics or reporting engine
- Add automated testing and CI checks for frontend and backend flows

## License

This project is currently maintained as a private product codebase.
