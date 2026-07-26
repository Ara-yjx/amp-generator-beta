/** Qualtrics export columns required before data conversion. */
export const REQUIRED_CSV_VARS = [
  'ID',
  'Progress',
  'Duration..in.seconds.',
  'sptResponses',
  'shuffleResult',
  'sptResponseDurations',
  'primeResult',
] as const;

export type RequiredCsvVar = (typeof REQUIRED_CSV_VARS)[number];

export function getMissingRequiredVars(columnNames: string[]): RequiredCsvVar[] {
  const available = new Set(columnNames);
  return REQUIRED_CSV_VARS.filter((name) => !available.has(name));
}
