import exampleSettings from './Xi_JESP_2021.example.json';
import type { AmpParams } from './ampTypes';
import { transformOldValues } from './backwardCompatibility';

/** Xi et al. (JESP 2021) example — loaded from saved settings export. */
export function getExampleAmpParams(): AmpParams {
  const values = JSON.parse(JSON.stringify(exampleSettings.values)) as AmpParams;
  transformOldValues(values);
  return values;
}
