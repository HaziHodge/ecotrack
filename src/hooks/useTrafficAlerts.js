import { useState, useEffect, useCallback } from 'react';

// Bounding box de Santiago Gran Área Metropolitana
// minLat, minLon, maxLat, maxLon
const SANTIAGO_BBOX = '-33.65,-70.85,-33.30,-70.45';

// Tipos de incidente TomTom → emoji + texto legible en español
const TIPO_INCIDENTE = {
  0: { emoji: '🚗', label: 'Incidente desconocido', severity: 'info' },
  1: { emoji: '🚗', label: 'Accidente', severity: 'error' },
  2: { emoji: '🌦️', label: 'Condición climática', severity: 'warning' },
  3: { emoji: '🚧', label: 'Peligro en la vía', severity: 'warning' },
  4: { emoji: '🚦', label: 'Tráfico detenido', severity: 'error' },
  5: { emoji: '🚦', label: 'Tráfico lento', severity: 'warning' },
  6: { emoji: '🚧', label: 'Obras en la vía', severity: 'warning' },
  7: { emoji: '🚗', label: 'Carretera cerrada', severity: 'error' },
  8: { emoji: 'ℹ️', label: 'Aviso de ruta', severity: 'info' },
  9: { emoji: '🌊', label: 'Cierre por lluvia/inundación', severity: 'error' },
  14: { emoji: '🚧', label: 'Carril cerrado', severity: 'warning' },
};

const SEVERITY_LABEL = {
  error: 'Importante',
  warning: 'Retraso',
  info: 'OK'
};

// Fallback realista para cuando no hay API key o hay error de red
const ALERTAS_FALLBACK = [
  {
    id: 'fb1',
    texto: 'Tráfico denso en Av. Libertador Bernardo O\'Higgins',
    calle: 'Alameda',
    emoji: '🚦',
    label: 'Tráfico lento',
    status: 'Retraso',
    severity: 'warning',
    lat: -33.4489,
    lon: -70.6693,
    delay: 8
  },
  {
    id: 'fb2',
    texto: 'Metro L1 operando con normalidad',
    calle: 'Línea 1',
    emoji: '✅',
    label: 'Sin incidentes',
    status: 'OK',
    severity: 'info',
    lat: null,
    lon: null,
    delay: null
  },
  {
    id: 'fb3',
    texto: 'Obras viales en Av. Providencia con Pedro de Valdivia',
    calle: 'Av. Providencia',
    emoji: '🚧',
    label: 'Obras en la vía',
    status: 'Importante',
    severity: 'error',
    lat: -33.4312,
    lon: -70.6094,
    delay: 12
  },
];

export function useTrafficAlerts(refreshIntervalMs = 120000) { // refresca cada 2 min
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const fetchAlertas = useCallback(async () => {
    const apiKey = import.meta.env.VITE_TOMTOM_KEY;
    if (!apiKey) {
      // Sin API key: usar alertas de fallback realistas
      setAlertas(ALERTAS_FALLBACK);
      setCargando(false);
      setUltimaActualizacion(new Date());
      return;
    }

    try {
      const url = `https://api.tomtom.com/traffic/services/4/incidentDetails/s3/${SANTIAGO_BBOX}/12/-1/json?projection=EPSG4326&key=${apiKey}&language=es-419`;
      const res = await fetch(url);

      if (!res.ok) throw new Error(`TomTom API error: ${res.status}`);

      const data = await res.json();
      const incidentes = data?.tm?.poi || [];

      const alertasMapeadas = incidentes
        .slice(0, 15) // máximo 15 alertas
        .map((poi, idx) => {
          const tipo = TIPO_INCIDENTE[poi.ic] || TIPO_INCIDENTE[0];
          return {
            id: poi.id || `incident-${idx}`,
            texto: poi.d || poi.f || 'Incidente en la vía',
            calle: poi.f || '',
            emoji: tipo.emoji,
            label: tipo.label,
            status: SEVERITY_LABEL[tipo.severity],
            severity: tipo.severity,
            // Coordenadas para mostrar en el mapa
            lat: poi.p?.y || null,
            lon: poi.p?.x || null,
            // Delay en minutos si existe
            delay: poi.dl ? Math.round(poi.dl / 60) : null,
          };
        })
        .filter(a => a.texto && a.texto.length > 2);

      // Si no hay incidentes reales, mostrar estado positivo
      if (alertasMapeadas.length === 0) {
        setAlertas([{
          id: 'clear',
          texto: 'Sin incidentes reportados en Santiago',
          calle: 'Red vial metropolitana',
          emoji: '✅',
          label: 'Tráfico normal',
          status: 'OK',
          severity: 'info',
          lat: null,
          lon: null,
          delay: null,
        }]);
      } else {
        setAlertas(alertasMapeadas);
      }

      setUltimaActualizacion(new Date());
      setError(null);
    } catch (err) {
      console.warn('Traffic API error, usando fallback:', err);
      setError(err.message);
      setAlertas(ALERTAS_FALLBACK);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    fetchAlertas();
    const interval = setInterval(fetchAlertas, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [fetchAlertas, refreshIntervalMs]);

  return { alertas, cargando, error, ultimaActualizacion, refetch: fetchAlertas };
}
