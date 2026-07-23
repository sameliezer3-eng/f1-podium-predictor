const SLOTS = ['p1', 'p2', 'p3']

/**
 * Scores one player's prediction against a race's actual results.
 * Pure function — same shape is used client-side for a live "what would I
 * score" preview and by the admin results screen when results are entered.
 */
export function scorePrediction(prediction, results, settings) {
  if (!prediction || !results) return { points: 0, breakdown: [], correctPodiumCount: 0 }

  const podiumDrivers = new Set(SLOTS.map((s) => results[s]).filter(Boolean))
  const breakdown = []
  let points = 0
  let correctPodiumCount = 0

  for (const slot of SLOTS) {
    const guess = prediction[slot]
    if (!guess) continue

    if (guess === results[slot]) {
      points += settings.exactPosition
      correctPodiumCount += 1
      breakdown.push({ slot, driver: guess, reason: 'exact', pts: settings.exactPosition })
    } else if (podiumDrivers.has(guess)) {
      points += settings.correctPodiumWrongSlot
      correctPodiumCount += 1
      breakdown.push({ slot, driver: guess, reason: 'podium', pts: settings.correctPodiumWrongSlot })
    }
  }

  if (prediction.p1 && prediction.p1 === results.p1) {
    points += settings.winnerBonus
    breakdown.push({ slot: 'winner-bonus', driver: prediction.p1, reason: 'winner', pts: settings.winnerBonus })
  }

  if (settings.bonusPicksEnabled) {
    if (prediction.pole && results.pole && prediction.pole === results.pole) {
      points += settings.poleBonus
      breakdown.push({ slot: 'pole', driver: prediction.pole, reason: 'pole', pts: settings.poleBonus })
    }
    if (prediction.fastestLap && results.fastestLap && prediction.fastestLap === results.fastestLap) {
      points += settings.fastestLapBonus
      breakdown.push({ slot: 'fastestLap', driver: prediction.fastestLap, reason: 'fastestLap', pts: settings.fastestLapBonus })
    }
  }

  const guessCount = SLOTS.filter((s) => prediction[s]).length
  return { points, breakdown, correctPodiumCount, guessCount }
}

/**
 * Aggregates a player's scored predictions into season totals: points and a
 * podium-accuracy percentage (how often a guessed driver actually landed on
 * the podium, out of every guess made across scored races). Expects each
 * prediction to already carry the `points`/`correctPodiumCount`/`guessCount`
 * fields written by scorePrediction at result-entry time.
 *
 * On sprint weekends a prediction doc also carries `sprintPoints` (already
 * multiplied by `sprintPointsMultiplier` at scoring time — see
 * submitRaceResults) plus its own `sprintCorrectPodiumCount`/
 * `sprintGuessCount`. Both halves fold into the same season totals and the
 * same accuracy figure here: a prediction only needs *either* half scored to
 * count toward `racesScored`, since sprint and main-race results can land on
 * different days and one is often entered before the other.
 */
export function aggregatePlayerStats(scoredPredictions) {
  let totalPoints = 0
  let guessesMade = 0
  let guessesOnPodium = 0
  let winnersCalled = 0
  let racesScored = 0

  for (const p of scoredPredictions) {
    const mainScored = typeof p.points === 'number'
    const sprintScored = typeof p.sprintPoints === 'number'
    if (!mainScored && !sprintScored) continue

    racesScored += 1
    totalPoints += (p.points || 0) + (p.sprintPoints || 0)
    guessesMade += (p.guessCount || 0) + (p.sprintGuessCount || 0)
    guessesOnPodium += (p.correctPodiumCount || 0) + (p.sprintCorrectPodiumCount || 0)
    if (p.breakdown?.some((b) => b.reason === 'winner')) winnersCalled += 1
    if (p.sprintBreakdown?.some((b) => b.reason === 'winner')) winnersCalled += 1
  }

  const accuracy = guessesMade > 0 ? Math.round((guessesOnPodium / guessesMade) * 100) : null

  return { totalPoints, racesScored, guessesMade, guessesOnPodium, winnersCalled, accuracy }
}
