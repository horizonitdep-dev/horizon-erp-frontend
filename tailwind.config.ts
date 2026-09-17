import type { Config } from 'tailwindcss';

/**
 * Layout utilities only — grid, flex, spacing, sizing.
 * Colour, type and component geometry live in src/styles/*.css as tokens.
 * Deliberately no theme.extend colours: a Tailwind colour class in a component
 * would be a raw value escaping the token system (DESIGN.md §1).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  corePlugins: { preflight: false },
  plugins: [],
};

export default config;
