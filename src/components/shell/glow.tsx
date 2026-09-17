/**
 * Ambient glow — DESIGN.md §6. An absolutely positioned radial behind the
 * content, sized and placed differently per screen.
 *
 * The parent must be `position: relative; overflow: hidden`. Purely decorative,
 * so it never takes pointer events and is hidden from assistive tech.
 */

type GlowVariant = 'dash' | 'hub' | 'module';

export function Glow({ variant }: { variant: GlowVariant }) {
  if (variant === 'hub') {
    return (
      <>
        <span className="glow glow--hub-1" aria-hidden="true" />
        <span className="glow glow--hub-2" aria-hidden="true" />
      </>
    );
  }
  return <span className={`glow glow--${variant}`} aria-hidden="true" />;
}
