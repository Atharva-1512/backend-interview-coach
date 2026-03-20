# Backend Interview Coach (Offline)

A production-ready Next.js (App Router) web app that simulates backend interviews with:
- Predefined questions
- Local (offline) evaluation logic (keyword-based scoring)
- Structured feedback + improved answers
- Typing delay + phrasing variation to feel like an interview
- Progress indicator + score tracking
- Improve-my-answer + restart

No external AI APIs. No environment variables.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Build & start

```bash
npm run build
npm run start
```

## Deploy on Vercel

1. Push this project to a GitHub repo
2. Go to Vercel → New Project → Import the repo
3. Framework preset: Next.js (auto-detected)
4. Build command: `npm run build`
5. Output: default
6. Deploy