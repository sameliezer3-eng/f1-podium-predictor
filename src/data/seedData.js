// 2026 F1 season calendar and grid. Shared by the seed script (Admin SDK,
// run once via `npm run seed`) and the admin panel's "reset to defaults"
// helper. This is the source of truth for what ships in the repo — once
// seeded, the live/edited Firestore data takes over and this file is no
// longer read by the running app.

export const TEAMS = [
  { name: 'McLaren', color: '#FF8000' },
  { name: 'Ferrari', color: '#E8002D' },
  { name: 'Red Bull Racing', color: '#3671C6' },
  { name: 'Mercedes', color: '#00D7B6' },
  { name: 'Williams', color: '#00A0E1' },
  { name: 'Audi', color: '#BB0A30' },
  { name: 'Aston Martin', color: '#229971' },
  { name: 'Alpine', color: '#FF87BC' },
  { name: 'Haas', color: '#B6BABD' },
  { name: 'Racing Bulls', color: '#6C98FF' },
  { name: 'Cadillac', color: '#8A1538' },
]

const teamColor = (name) => TEAMS.find((t) => t.name === name).color

export const DRIVERS = [
  { name: 'Lando Norris', team: 'McLaren' },
  { name: 'Oscar Piastri', team: 'McLaren' },
  { name: 'Lewis Hamilton', team: 'Ferrari' },
  { name: 'Charles Leclerc', team: 'Ferrari' },
  { name: 'Max Verstappen', team: 'Red Bull Racing' },
  { name: 'Isack Hadjar', team: 'Red Bull Racing' },
  { name: 'George Russell', team: 'Mercedes' },
  { name: 'Kimi Antonelli', team: 'Mercedes' },
  { name: 'Alex Albon', team: 'Williams' },
  { name: 'Carlos Sainz', team: 'Williams' },
  { name: 'Nico Hülkenberg', team: 'Audi' },
  { name: 'Gabriel Bortoleto', team: 'Audi' },
  { name: 'Fernando Alonso', team: 'Aston Martin' },
  { name: 'Lance Stroll', team: 'Aston Martin' },
  { name: 'Pierre Gasly', team: 'Alpine' },
  { name: 'Franco Colapinto', team: 'Alpine' },
  { name: 'Esteban Ocon', team: 'Haas' },
  { name: 'Oliver Bearman', team: 'Haas' },
  { name: 'Liam Lawson', team: 'Racing Bulls' },
  { name: 'Arvid Lindblad', team: 'Racing Bulls' },
  { name: 'Sergio Pérez', team: 'Cadillac' },
  { name: 'Valtteri Bottas', team: 'Cadillac' },
].map((d) => ({ ...d, teamColor: teamColor(d.team), active: true }))

// dateStart/dateEnd are ISO date strings (UTC midnight). lockAt is derived
// from dateStart at seed time — predictions close when the race weekend
// (practice) begins.
export const RACES = [
  { order: 1, name: 'Australian Grand Prix', circuit: 'Albert Park, Melbourne', dateStart: '2026-03-06', dateEnd: '2026-03-08', sprint: false },
  { order: 2, name: 'Chinese Grand Prix', circuit: 'Shanghai International Circuit', dateStart: '2026-03-13', dateEnd: '2026-03-15', sprint: true },
  { order: 3, name: 'Japanese Grand Prix', circuit: 'Suzuka Circuit', dateStart: '2026-03-27', dateEnd: '2026-03-29', sprint: false },
  { order: 4, name: 'Miami Grand Prix', circuit: 'Miami International Autodrome, Miami Gardens', dateStart: '2026-05-01', dateEnd: '2026-05-03', sprint: true },
  { order: 5, name: 'Canadian Grand Prix', circuit: 'Circuit Gilles Villeneuve, Montreal', dateStart: '2026-05-22', dateEnd: '2026-05-24', sprint: true },
  { order: 6, name: 'Monaco Grand Prix', circuit: 'Circuit de Monaco, Monte Carlo', dateStart: '2026-06-05', dateEnd: '2026-06-07', sprint: false },
  { order: 7, name: 'Spanish Grand Prix', circuit: 'Circuit de Barcelona-Catalunya', dateStart: '2026-06-12', dateEnd: '2026-06-14', sprint: false },
  { order: 8, name: 'Austrian Grand Prix', circuit: 'Red Bull Ring, Spielberg', dateStart: '2026-06-26', dateEnd: '2026-06-28', sprint: false },
  { order: 9, name: 'British Grand Prix', circuit: 'Silverstone Circuit', dateStart: '2026-07-03', dateEnd: '2026-07-05', sprint: true },
  { order: 10, name: 'Belgian Grand Prix', circuit: 'Circuit de Spa-Francorchamps', dateStart: '2026-07-17', dateEnd: '2026-07-19', sprint: false },
  { order: 11, name: 'Hungarian Grand Prix', circuit: 'Hungaroring, Budapest', dateStart: '2026-07-24', dateEnd: '2026-07-26', sprint: false },
  { order: 12, name: 'Dutch Grand Prix', circuit: 'Circuit Zandvoort', dateStart: '2026-08-21', dateEnd: '2026-08-23', sprint: true },
  { order: 13, name: 'Italian Grand Prix', circuit: 'Autodromo Nazionale Monza', dateStart: '2026-09-04', dateEnd: '2026-09-06', sprint: false },
  { order: 14, name: 'Madrid Grand Prix', circuit: 'Madring, Madrid', dateStart: '2026-09-11', dateEnd: '2026-09-13', sprint: false },
  { order: 15, name: 'Azerbaijan Grand Prix', circuit: 'Baku City Circuit', dateStart: '2026-09-25', dateEnd: '2026-09-27', sprint: false },
  { order: 16, name: 'Singapore Grand Prix', circuit: 'Marina Bay Street Circuit', dateStart: '2026-10-09', dateEnd: '2026-10-11', sprint: true },
  { order: 17, name: 'United States Grand Prix', circuit: 'Circuit of the Americas, Austin', dateStart: '2026-10-23', dateEnd: '2026-10-25', sprint: false },
  { order: 18, name: 'Mexico City Grand Prix', circuit: 'Autódromo Hermanos Rodríguez', dateStart: '2026-10-30', dateEnd: '2026-11-01', sprint: false },
  { order: 19, name: 'Brazilian Grand Prix', circuit: 'Interlagos, São Paulo', dateStart: '2026-11-06', dateEnd: '2026-11-08', sprint: false },
  { order: 20, name: 'Las Vegas Grand Prix', circuit: 'Las Vegas Strip Circuit', dateStart: '2026-11-19', dateEnd: '2026-11-21', sprint: false },
  { order: 21, name: 'Qatar Grand Prix', circuit: 'Lusail International Circuit', dateStart: '2026-11-27', dateEnd: '2026-11-29', sprint: false },
  { order: 22, name: 'Abu Dhabi Grand Prix', circuit: 'Yas Marina Circuit', dateStart: '2026-12-04', dateEnd: '2026-12-06', sprint: false },
]

export const DEFAULT_SCORING = {
  exactPosition: 10,
  correctPodiumWrongSlot: 5,
  winnerBonus: 3,
  bonusPicksEnabled: true,
  poleBonus: 2,
  fastestLapBonus: 2,
  // Sprint predictions are scored with the exact same rules above (exact
  // position, correct-podium-wrong-slot, winner bonus), then the whole
  // result is scaled by this — matching how real F1 weights a sprint result
  // below the Grand Prix itself.
  sprintPointsMultiplier: 0.5,
}
