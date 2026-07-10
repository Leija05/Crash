import { useEffect, useRef } from "react";

/**
 * Hace que el botón "atrás" del navegador cierre un modal en vez de navegar
 * fuera de la página. Al abrir el modal se agrega una entrada al historial;
 * al pulsar atrás, el evento popstate cierra el modal y la URL vuelve a la
 * ruta subyacente sin cambiar de página.
 *
 * Para cerrar el modal de forma programática (X, backdrop, Escape) usa
 * `closeModalViaHistory(onClose)`, que consume la entrada agregada.
 */
export function useCloseOnBrowserBack(open, onClose) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onPop = () => {
      if (onCloseRef.current) onCloseRef.current();
      else window.history.pushState({ crashModal: true }, ""); // bloquear si no se puede cerrar
    };
    window.addEventListener("popstate", onPop);
    const state = window.history.state;
    if (!(state && state.crashModal)) {
      window.history.pushState({ crashModal: true }, "");
    }
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);
}

export function closeModalViaHistory(onClose) {
  if (onClose) window.history.back();
}
