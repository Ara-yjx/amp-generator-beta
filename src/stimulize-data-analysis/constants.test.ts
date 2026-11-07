import { canonicalCsvColumn, getMissingRequiredVars } from './constants';

describe('qualtrics embedded data column names', () => {
  const required = [
    'ID',
    'Progress',
    'Duration..in.seconds.',
    'sptResponses',
    'shuffleResult',
    'sptResponseDurations',
    'primeResult',
  ];

  test('keeps an unprefixed export unchanged', () => {
    expect(required.map(canonicalCsvColumn)).toEqual(required);
    expect(getMissingRequiredVars(required)).toEqual([]);
    expect(canonicalCsvColumn('js_customNote')).toBe('js_customNote');
  });

  test('accepts the __js_ prefix and a js_ prefix on known fields', () => {
    const prefixed = required.map((name) => (name.startsWith('spt') || name === 'shuffleResult' || name === 'primeResult' ? `__js_${name}` : name));
    expect(getMissingRequiredVars(prefixed)).toEqual([]);
    expect(canonicalCsvColumn('js_sptResponses')).toBe('sptResponses');
    expect(canonicalCsvColumn('__js_shuffled_1_1_1_content')).toBe('shuffled_1_1_1_content');
  });
});
