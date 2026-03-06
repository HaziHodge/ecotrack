/**
 * Metricas de CO2 y Puntos - RUTA VERDE Chile
 * Basado en datos reales (DICTUC / Ministerio del Medio Ambiente)
 */

// Factores de emisión en kg CO2 por km recorrido (estimados para Santiago)
export const EMISIONES = {
  auto: 0.21,    // Auto bencina promedio
  micro: 0.04,   // Red Metropolitana (eléctrica/diesel Euro VI promedio)
  metro: 0.01,   // Metro de Santiago (gran parte energía renovable)
  bici: 0,       // Tracción humana
  scooter: 0.005 // Scooter eléctrico (considerando carga)
};

/**
 * Calcula el CO2 evitado al no usar auto particular
 * @param {number} distancia - km recorridos
 * @param {string} modo - modo de transporte usado (micro, metro, bici, scooter)
 */
export function calcularCO2Evitado(distancia, modo) {
  const emisionModo = EMISIONES[modo] || 0;
  const ahorroPorKm = EMISIONES.auto - emisionModo;
  return Math.max(0, distancia * ahorroPorKm);
}

/**
 * Calcula puntos ganados según CO2 evitado y esfuerzo físico
 */
export function calcularPuntos(co2Evitado, distancia) {
  const puntosCO2 = co2Evitado * 100;
  const bonusFisico = (distancia * 10); // Incentivo extra por bici/caminar
  return Math.round(puntosCO2 + bonusFisico);
}

/**
 * Retorna el nombre de la insignia según CO2 total ahorrado (kg)
 */
export function obtenerInsignia(co2Total) {
  if (co2Total >= 50) return 'Héroe Verde';
  if (co2Total >= 20) return 'Guardián del Clima';
  if (co2Total >= 5) return 'Ciclista Urbano';
  return 'Brote Verde';
}

/**
 * Genera una comparativa divertida para redes sociales
 */
export function generarComparativaViral(co2Kg) {
  if (!co2Kg || co2Kg <= 0) return "Cada viaje verde suma 🌱";
  if (co2Kg > 10) return `= ${(co2Kg / 21.7).toFixed(1)} árboles plantados 🌳`;
  if (co2Kg > 2) return `= ${Math.round(co2Kg / 0.21)} km en auto evitados 🚗`;
  return `= ${Math.round(co2Kg * 5)} horas de TV 📺`;
}
