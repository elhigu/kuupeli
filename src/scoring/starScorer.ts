export function scoreStars(successAttempt: number): 1 | 2 | 3 {
  if (successAttempt <= 1) {
    return 3
  }

  if (successAttempt === 2) {
    return 2
  }

  return 1
}
