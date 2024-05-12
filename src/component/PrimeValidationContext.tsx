/** @deprecated */

import { createContext } from 'react';
import { PrimeValidation, initialPrimeValidation } from '../data/primeValidation';

export const PrimeValidationContext = createContext<PrimeValidation | null>(null);
