import { useState, useEffect } from 'react';

/**
 * Hook para manejar la geolocalización con fallback a Santiago Centro
 */
export function useGeolocalizacion() {
  const [estado, setEstado] = useState({
    pos: [-33.4489, -70.6693], // Fallback: Santiago Centro
    permiso: 'sin-solicitar',  // 'ok' | 'denegado' | 'sin-solicitar'
    error: null
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setEstado(prev => ({ ...prev, permiso: 'denegado', error: 'No soportado' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setEstado({
          pos: [position.coords.latitude, position.coords.longitude],
          permiso: 'ok',
          error: null
        });
      },
      (error) => {
        setEstado(prev => ({
          ...prev,
          permiso: 'denegado',
          error: error.message
        }));
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, []);

  return estado;
}
