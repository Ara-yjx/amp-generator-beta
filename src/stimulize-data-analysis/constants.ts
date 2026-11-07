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

/** Qualtrics New Survey Taking Experience prefixes JS embedded data in the survey flow and CSV export. */
const QUALTRICS_JS_ED_PREFIX = '__js_';

const JS_PREFIX_ALIASES = new Set<string>([
  ...REQUIRED_CSV_VARS,
  'stimuliItems',
  'timeline',
  'primes',
  'totalRounds',
  'acceptedKeys',
  'darkMode',
  'primeResultJson',
  'sptResponsesArray',
  'sptResponseDurationsArray',
]);

/**
 * Map a Qualtrics export header onto the column name the analysis already uses.
 * `__js_sptResponses` and `sptResponses` become `sptResponses`.
 * Other columns, including ones that merely start with `js_`, are left unchanged.
 */
export function canonicalCsvColumn(column: string): string {
  if (column.startsWith(QUALTRICS_JS_ED_PREFIX)) {
    const rest = column.slice(QUALTRICS_JS_ED_PREFIX.length);
    return rest || column;
  }
  if (column.startsWith('js_')) {
    const rest = column.slice('js_'.length);
    if (JS_PREFIX_ALIASES.has(rest) || rest.startsWith('shuffled_') || rest.startsWith('prime_')) {
      return rest;
    }
  }
  return column;
}

export function getMissingRequiredVars(columnNames: string[]): RequiredCsvVar[] {
  const available = new Set(columnNames.map(canonicalCsvColumn));
  return REQUIRED_CSV_VARS.filter((name) => !available.has(name));
}
