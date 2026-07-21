# Claude Code Prompt: "Paddock Predictor" — F1 2026 Prediction League

Copy everything below into Claude Code as your build brief.

---

## What to build

A friendly, visually fun web app where a group of friends predicts the top 3 finishers for each 2026 F1 Grand Prix, tracks who's most accurate over the season, and shows the standings as an actual F1 podium graphic. Local/self-hosted app for a friend group — no need for public auth, just simple named player profiles.

## Tech stack

- **Frontend:** React + Vite, Tailwind CSS for styling
- **Database:** Firebase — use **Firestore** for all app data (players, predictions, results, scores). No custom backend server needed: the React app talks to Firestore directly via the Firebase JS SDK, secured with Firestore security rules (open for read/write within the friend group is fine — no need for a lockdown auth model).
- **Auth:** Skip real authentication — this is a trust-based friend-group app. Optionally use Firebase Anonymous Auth under the hood just so each browser session has a stable UID, but the visible "who am I" selection stays the simple name/avatar picker from the Players feature below.
- **Real-time:** Take advantage of Firestore's `onSnapshot` listeners so the predictions status ("who's submitted"), scoreboard, and podium update live for everyone without a manual refresh — this is a natural fit for race day when everyone's watching together.
- **State/data fetching:** React Query (or simple hooks wrapping `onSnapshot`) is fine.
- **Hosting/deploy:** Firebase Hosting, so the whole thing (frontend + DB) lives in one Firebase project. Keep Firebase config in environment variables (`.env`, gitignored) rather than hardcoded.
- Runs locally with `npm install && npm run dev` against the live Firestore project (or the Firebase Local Emulator Suite for offline dev — set this up if straightforward, it's nice for testing scoring logic without touching real data).

## Seed data — 2026 F1 season (use this, don't invent it)

**Calendar — 22 confirmed rounds** (Bahrain and Saudi Arabia were cancelled this year due to the Middle East conflict, so the season runs 22 rather than the originally planned 24 races). Sprint weekends are flagged.

| # | Race | Circuit | Dates | Sprint? |
|---|------|---------|-------|---------|
| 1 | Australian GP | Melbourne | Mar 6–8 | |
| 2 | Chinese GP | Shanghai | Mar 13–15 | ✅ |
| 3 | Japanese GP | Suzuka | Mar 27–29 | |
| 4 | Miami GP | Miami Gardens | May 1–3 | ✅ |
| 5 | Canadian GP | Montreal | May 22–24 | ✅ |
| 6 | Monaco GP | Monte Carlo | Jun 5–7 | |
| 7 | Spanish GP | Barcelona | Jun 12–14 | |
| 8 | Austrian GP | Spielberg | Jun 26–28 | |
| 9 | British GP | Silverstone | Jul 3–5 | ✅ |
| 10 | Belgian GP | Spa-Francorchamps | Jul 17–19 | |
| 11 | Hungarian GP | Budapest | Jul 24–26 | |
| 12 | Dutch GP | Zandvoort | Aug 21–23 | ✅ |
| 13 | Italian GP | Monza | Sep 4–6 | |
| 14 | Madrid GP *(new)* | Madrid | Sep 11–13 | |
| 15 | Azerbaijan GP | Baku | Sep 25–27 | |
| 16 | Singapore GP | Marina Bay | Oct 9–11 | ✅ |
| 17 | United States GP | Austin | Oct 23–25 | |
| 18 | Mexico City GP | Mexico City | Oct 30–Nov 1 | |
| 19 | Brazilian GP | São Paulo | Nov 6–8 | |
| 20 | Las Vegas GP | Las Vegas | Nov 19–21 | |
| 21 | Qatar GP | Lusail | Nov 27–29 | |
| 22 | Abu Dhabi GP | Yas Marina | Dec 4–6 | |

**Grid — 11 teams, 22 drivers** (biggest regulation reset in a decade; Sauber has been rebranded as Audi; Cadillac is a brand-new 11th team):

| Team | Drivers |
|---|---|
| McLaren | Lando Norris, Oscar Piastri |
| Ferrari | Lewis Hamilton, Charles Leclerc |
| Red Bull Racing | Max Verstappen, Isack Hadjar |
| Mercedes | George Russell, Kimi Antonelli |
| Williams | Alex Albon, Carlos Sainz |
| Audi | Nico Hülkenberg, Gabriel Bortoleto |
| Aston Martin | Fernando Alonso, Lance Stroll |
| Alpine | Pierre Gasly, Franco Colapinto |
| Haas | Esteban Ocon, Oliver Bearman |
| Racing Bulls | Liam Lawson, Arvid Lindblad |
| Cadillac | Sergio Pérez, Valtteri Bottas |

Seed the database with this calendar and grid. Give each team a `color` field (use each team's real livery color) since it'll drive a lot of the visual styling. Make both editable from an admin/settings screen, since lineups occasionally change mid-season (reserve drivers stepping in, etc.) and I don't want to touch code to fix that.

## Core features

### 1. Players
- Simple "who's playing" setup: add a player with a name, pick an avatar color or emoji (no passwords/auth needed — this is a friend-group app, trust-based).
- A player switcher so whoever's device/browser it is can pick their name before entering predictions.

### 2. Making predictions
- For each upcoming race, every player predicts **P1, P2, P3** (top three finishers) by picking drivers from the current grid.
- Predictions lock automatically once the race weekend starts (use the date in the calendar) — no editing after lockout.
- Show a clear "predictions submitted / still open" status per player per race so it's obvious who still needs to pick.
- Nice touch: let players optionally predict pole position or fastest lap too, as a small bonus-point extra — but keep the top-3 podium prediction as the main event.

### 3. Entering actual results
- An admin/results screen where actual P1/P2/P3 (and pole/fastest lap if used) get entered once the real race finishes.
- Entering results should trigger automatic scoring for every player's prediction for that race.

### 4. Scoring
Use a simple, transparent points system (make it configurable in settings, but default to):
- **Exact position match:** 10 pts (predicted driver in the exact predicted slot)
- **Correct podium, wrong slot:** 5 pts (predicted driver finished top 3, just not where you guessed)
- **Bonus:** +3 pts for correctly predicting the race winner specifically
- Optional pole/fastest-lap bonus: +2 pts each if enabled

Track both **total season points** and an **accuracy percentage** (e.g., "correctly predicted podium finishers 62% of the time") so casual players can compare on points while stat-nerds can compare on accuracy.

### 5. Scoreboard — the centerpiece
This is the feature I care most about, so spend real effort here:

- **Podium visualization:** Build an actual 3-step F1 podium graphic (like a real podium ceremony) showing the top 3 players in the standings — 1st place on the tallest center block, 2nd on a slightly lower block to the left, 3rd on the lowest block to the right. Show each player's avatar/name and their score on their podium step. Add a little life to it: a subtle rise/entrance animation when the page loads, maybe confetti or a checkered-flag motif behind it.
- Below the podium, show the full ranked standings table for everyone else (4th place down).
- Add a per-race breakdown view: pick any race from the calendar and see a mini podium of who predicted it best that week, plus each player's guess vs. the actual result.
- A trend chart (simple line chart is fine) showing each player's cumulative points across the season, so people can see momentum.

### 6. Race hub
- A calendar view of all 22 rounds, showing which are done (with actual results), which are locked/awaiting results, and which are still open for predictions.
- Clicking a race shows all players' predictions side by side once it's locked (before lock, keep predictions private between players so nobody copies).

## Design direction
- Fun and energetic, not corporate: motorsport aesthetic — checkered-flag accents, team-color chips next to driver names, bold numerals for standings.
- Use each team's real color as an accent when displaying that team's drivers, so the grid feels authentic at a glance.
- Fully responsive — this will mostly get used on phones between friends on race weekend.
- Keep empty/loading states friendly (e.g., "No predictions yet — be the first on the grid!" rather than a bare blank screen).

## Data notes
- Structure Firestore as a handful of top-level collections, roughly:
  - `races` — the 22-race calendar (name, circuit, dates, sprint flag, lock timestamp, actual results once entered)
  - `drivers` — the current grid (name, team, team color)
  - `players` — name, avatar/color
  - `predictions` — one doc per player per race (playerId, raceId, predicted P1/P2/P3, optional pole/fastest-lap pick, locked boolean, points once scored)
  - `settings` — the configurable scoring rules
- Write a one-time seed script (a small Node script using the Firebase Admin SDK, run manually with `npm run seed`) that loads the calendar + grid above into Firestore on first setup.
- Build a small admin/settings panel in the app to: edit scoring rules, edit the driver grid (for mid-season swaps), and manually enter/correct race results — all just Firestore writes.
- Use Firestore security rules to prevent a player from reading other players' predictions for a race until that race is locked, so nobody can peek before submitting.

## Stretch goals (only if time allows)
- Pull live results automatically from a public F1 results API instead of manual entry.
- Per-player prediction "streaks" (e.g., correctly picked the winner 3 races running).
- Shareable read-only link to the podium/standings page for non-players to see bragging rights.

---

Build this as a working local app I can run with `npm install && npm run dev`. Prioritize getting the prediction flow, scoring, and the podium scoreboard visual working end-to-end before polishing extras.
