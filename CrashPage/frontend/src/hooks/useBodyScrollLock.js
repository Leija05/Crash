import { useEffect } from "react";

let activeLocks = 0;

/**
 * Bloquea el scroll del body mientras al menos un modal esté abierto.
 * Usa un contador global para que varios modales apilados no compitan
 * y para que el scroll SIEMPRE se restaure, incluso si el modal crashea.
 */
export function useBodyScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;
    activeLocks += 1;
    document.body.style.overflow = "hidden";
    return () => {
      activeLocks = Math.max(0, activeLocks - 1);
      if (activeLocks === 0) {
        document.body.style.overflow = "";
      }
    };
  }, [active]);
}
