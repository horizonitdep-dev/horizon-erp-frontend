import type { Metadata, Viewport } from 'next';
import { fontVariables } from '@/lib/fonts';
import { themeScript } from '@/lib/theme';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'HIRS',
    template: '%s · HIRS',
  },
  description: 'Horizon International Recruitment Services — internal ERP.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script below sets data-theme before
    // React hydrates, so the server's markup deliberately differs here.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking, so the correct theme is applied before first paint and
            there is no flash of the wrong palette (DESIGN.md §3). */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={fontVariables}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
