import { Sora, Inter, JetBrains_Mono } from 'next/font/google';

/**
 * DESIGN.md §5. Three families, exposed as CSS variables so the type scale in
 * base.css can reference them. Body default is Inter; any figure a user would
 * scan or compare is JetBrains Mono.
 */

export const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
});

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const fontVariables = `${sora.variable} ${inter.variable} ${jetbrainsMono.variable}`;
