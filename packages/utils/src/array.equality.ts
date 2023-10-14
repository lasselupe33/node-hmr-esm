/**
 * See https://stackoverflow.com/questions/6229197/how-to-know-if-two-arrays-have-the-same-values
 */
export function areArraysEqualSets<T>(a1: T[], a2: T[]): boolean {
  const superSet: Record<string, number> = {};

  for (const i of a1) {
    const e = i + typeof i;
    superSet[e] = 1;
  }

  for (const i of a2) {
    const e = i + typeof i;

    if (!superSet[e]) {
      return false;
    }

    superSet[e] = 2;
  }

  for (const e in superSet) {
    if (superSet[e] === 1) {
      return false;
    }
  }

  return true;
}
