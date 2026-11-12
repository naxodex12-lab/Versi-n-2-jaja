/**
 * Utilidades de retroalimentación háptica (vibración) para confirmación táctil accesible.
 * Diseñado especialmente para adultos mayores con el fin de proporcionar confirmación física
 * inmediata en pantallas táctiles sin sobrecargar el dispositivo.
 */

export const triggerHaptic = (pattern: number | number[] = 25) => {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silenciosamente ignorado si el navegador o dispositivo no lo soporta o está deshabilitado
    }
  }
};

/**
 * Toque táctil estándar (25ms) para botones normales, botón flotante (FAB)
 * y elementos principales de la interfaz.
 */
export const hapticTap = () => {
  triggerHaptic(25);
};

/**
 * Micro-vibración ultracorta (15ms) para el ingreso en teclado numérico (BE Pass).
 * Simula la respuesta de una tecla física para prevenir dobles pulsaciones involuntarias.
 */
export const hapticKeypadPress = () => {
  triggerHaptic(15);
};

/**
 * Toque de selección ligera (15ms) para filtros, chips de respuesta rápida y tarjetas.
 */
export const hapticSelection = () => {
  triggerHaptic(15);
};

/**
 * Confirmación afirmativa intermedia ([30ms, 30ms, 35ms])
 * Usada al verificar destinatario o validar datos antes de autorizar.
 */
export const hapticConfirm = () => {
  triggerHaptic([30, 30, 35]);
};

/**
 * Confirmación de transacción exitosa: doble pulso suave y sostenido ([80ms, 50ms, 160ms]).
 * Brinda una sensación placentera, prolongada y clara de culminación y seguridad.
 */
export const hapticSuccess = () => {
  triggerHaptic([80, 50, 160]);
};

/**
 * Aviso o advertencia táctil: doble pulso de alerta suave ([40ms, 40ms, 40ms]).
 * Usado ante cancelaciones, detención de operaciones o errores.
 */
export const hapticWarning = () => {
  triggerHaptic([40, 40, 40]);
};
