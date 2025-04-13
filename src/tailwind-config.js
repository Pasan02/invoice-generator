// This file ensures all Tailwind utility classes are available
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../tailwind.config.js';

export const fullConfig = resolveConfig(tailwindConfig);