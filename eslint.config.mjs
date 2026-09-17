import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const config = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // The guide is explicit: no `any` types.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
    },
  },
];

export default config;
