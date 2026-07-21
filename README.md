# Paddock Predictor 🏁

A friendly F1 2026 prediction league for a group of friends: pick the top 3 finishers
for each Grand Prix, track who's most accurate over the season, and see the standings
as an actual podium ceremony.

- **Frontend:** React + Vite, Tailwind CSS
- **Backend:** Firebase (Firestore + Anonymous Auth), no custom server
- **Realtime:** Firestore `onSnapshot` — the scoreboard, podium, and "who's submitted"
  status update live for everyone without a refresh

## Quick start

```bash
npm install
cp .env.example .env      # then fill in your Firebase project keys, see below
npm run seed               # loads the 2026 calendar + driver grid into Firestore
npm run dev                 # http://localhost:5173
```

Until `.env` is filled in, the app still loads (you'll see a banner at the top
explaining what's missing) — it just can't read or write any data.

## Firebase project setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Build > Firestore Database** → create a database (any region, start in
   production mode — the rules in `firestore.rules` handle access control).
3. **Build > Authentication > Sign-in method** → enable **Anonymous**. This just
   gives each browser a stable ID so Firestore rules can tell "my prediction"
   apart from everyone else's before a race locks — nobody sees a login screen.
4. **Project settings > General > Your apps** → add a Web app, copy the config
   values into `.env` (`VITE_FIREBASE_*`).
5. **Project settings > Service accounts** → "Generate new private key", save
   the JSON as `serviceAccountKey.json` in the project root (gitignored). This
   is only used by the one-time seed script, never by the browser app.
6. Deploy the security rules so predictions are actually protected:
   ```bash
   npx firebase-tools login
   npx firebase-tools use --add        # pick your project, alias it "default"
   npx firebase-tools deploy --only firestore:rules
   ```
7. `npm run seed` to load the calendar and grid.

## Local emulator (optional, for testing without touching real data)

The Firestore + Auth emulators need a **Java runtime** on your machine
(`brew install openjdk`, then follow the symlink instructions it prints).

```bash
npm run emulators          # starts Firestore/Auth/Hosting emulators + a UI at :4000
```

In another terminal:

```bash
npm run seed:emulator      # seeds the emulator instead of your live project
```

Then set `VITE_USE_FIREBASE_EMULATOR=true` in `.env` and run `npm run dev` as usual.
Emulator data resets every time you restart it — handy for testing scoring logic
without risking the real season's data.

## How it works

### Data model (Firestore)

- `races/{raceId}` — the 22-round calendar: name, circuit, dates, sprint flag,
  `lockAt` (predictions close here), `results` (null until entered)
  - `races/{raceId}/submissions/{playerId}` — a content-free "finished their
    pick" flag, kept separate from the prediction itself so the calendar can
    show who's submitted without leaking anyone's actual guess before lock
- `drivers/{driverId}` — the grid: name, team, team color
- `players/{playerId}` — name, avatar color/emoji (no passwords)
- `predictions/{raceId}_{playerId}` — one doc per player per race: P1/P2/P3,
  optional pole/fastest-lap bonus picks, and (once scored) points + breakdown
- `settings/scoring` — the configurable points rules

### Predictions stay private until lock

Firestore security rules (`firestore.rules`) only let a player read their own
prediction doc until a race's `lockAt` has passed — reading anyone else's pick
early is rejected outright, not just hidden in the UI. Once locked, everyone's
predictions become readable so the app can show the side-by-side comparison
and per-race breakdown.

### Scoring

Defaults (editable in **Admin → Scoring rules**):

| | Points |
|---|---|
| Exact position match | 10 |
| Correct podium, wrong slot | 5 |
| Race winner bonus (on top of the above) | 3 |
| Pole position bonus (optional) | 2 |
| Fastest lap bonus (optional) | 2 |

Entering results in **Admin → Race results** scores every submitted prediction
for that race in one batch (`src/firebase/api.js`, `submitRaceResults`) using
the pure function in `src/lib/scoring.js`.

## Project structure

```
src/
  firebase/       Firebase init + all Firestore reads/writes (config.js, api.js)
  hooks/          onSnapshot-backed hooks (races, drivers, players, predictions…)
  context/        PlayerContext — the "who am I" selection, persisted locally
  lib/            Pure logic: scoring engine, race lock/status helpers
  data/seedData.js  The 2026 calendar + grid (source of truth for npm run seed)
  components/     UI, grouped by feature (players, race, scoreboard, admin)
  pages/          Race Hub, Race detail, Scoreboard, Admin
seed/seed.js      One-time Admin SDK seed script (npm run seed)
firestore.rules   Security rules
```

## What's not built (stretch goals from the brief)

- Live results pulled from a public F1 API (results are entered manually in Admin)
- Per-player prediction streaks
- A shareable read-only standings link for non-players

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run seed` | Seed your **live** Firebase project (needs `serviceAccountKey.json`) |
| `npm run seed:emulator` | Seed the local emulator instead |
| `npm run emulators` | Start the Firebase Local Emulator Suite |
| `npm run lint` | Lint with oxlint |
