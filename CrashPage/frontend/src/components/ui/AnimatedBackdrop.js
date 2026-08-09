import { memo } from "react";

/**
 * Fondo animado mission-control: suelo de rejilla en perspectiva,
 * orbes de luz a la deriva y barrido de escaneo vertical.
 * Todo con CSS keyframes (transform/opacity) y desactivado bajo
 * prefers-reduced-motion. Colócalo como primera capa dentro de un
 * contenedor `relative` con la superficie ya pintada.
 */
function AnimatedBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden z-[var(--z-decor)] pointer-events-none">
      <div className="orb-drift orb-a" />
      <div className="orb-drift orb-b" />
      <div className="grid-floor" />
      <div className="scan-sweep" />
    </div>
  );
}

export default memo(AnimatedBackdrop);
