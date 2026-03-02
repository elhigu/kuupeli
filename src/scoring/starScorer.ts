import { logEvent } from '../observability/devLogger'

export function scoreStars(successAttempt: number): 1 | 2 | 3 {
  if (successAttempt <= 1) {
    logEvent('scoring', 'star_score_computed', { successAttempt, stars: 3 })
    return 3
  }

  if (successAttempt === 2) {
    logEvent('scoring', 'star_score_computed', { successAttempt, stars: 2 })
    return 2
  }

  logEvent('scoring', 'star_score_computed', { successAttempt, stars: 1 })
  return 1
}
