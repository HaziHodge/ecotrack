/**
 * Factores de emisión CO2 y lógica de gamificación (Datos reales Chile / DICTUC)
 */

export const FACTORES_CO2 = {
  auto: 0.21,          // kg/km
  metro: 0.03,         // kg/km
  bus: 0.068,          // kg/km (Red Metropolitana)
  bici: 0,             // Zero emissions
  scooter_electrico: 0.015,
  caminata: 0
};

export function calcularCO2Evitado(distanciaKm, medioUsado) {
  const emisionAuto = distanciaKm * FACTORES_CO2.auto;
  const emisionActual = distanciaKm * (FACTORES_CO2[medioUsado] || 0);
  return Math.max(0, emisionAuto - emisionActual);
}

export function calcularPuntos(co2Evitado, distanciaKm) {
  // 100 puntos por cada kg de CO2 evitado + 10 puntos por km
  return Math.floor((co2Evitado * 100) + (distanciaKm * 10));
}

export function obtenerInsignia(co2Total) {
  if (co2Total >= 50) return "Héroe Verde";
  if (co2Total >= 20) return "Guardián del Clima";
  if (co2Total >= 5) return "Ciclista Urbano";
  return "Brote Verde";
}

export function generarComparativaViral(co2Kg) {
  if (co2Kg > 10) return `= ${Math.round(co2Kg / 0.7)} árboles plantados 🌳`;
  if (co2Kg > 2) return `= evitar ${Math.round(co2Kg / 0.21)} km en auto 🚗`;
  return `= ${Math.round(co2Kg * 5)} horas de TV 📺`;
}
