import { toast } from "sonner";

/**
 * Abre una URL externa en pestaña nueva. Si el navegador bloquea la
 * ventana emergente, muestra un toast con el enlace directo como fallback
 * para que la acción nunca quede "muerta" silenciosamente.
 */
export function openExternal(url, fallbackLabel = "Abrir enlace") {
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    toast("Tu navegador bloqueó la ventana emergente", {
      description: "Toca abrir para continuar",
      action: {
        label: fallbackLabel,
        onClick: () => { window.location.href = url; },
      },
    });
  }
}
