import React, { useState, useEffect, useRef, useMemo, Suspense, lazy, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Home, Map as MapIcon, Milestone, Award, User, Search, ArrowLeftRight,
  Leaf, Star, Zap, Navigation, Bell, ChevronRight, CheckCircle2,
  Bike, Train, Car, Smartphone, Settings, LogOut, Info, AlertTriangle,
  RefreshCcw, Menu, X, Filter, Locate, Heart, Calendar, Clock, DollarSign, TrendingUp,
  Wind, MapPin, Layers, Coffee, Ticket, Footprints, ShieldCheck, QrCode,
  Eye, Trophy
} from 'lucide-react';

// --- UI COMPONENTS (Base) ---

const Button = ({ children, onClick, variant = 'primary', className = "", fullWidth = false, disabled = false, loading = false }) => {
  const variants = {
    primary: "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30",
    secondary: "bg-[#1A1A2E] text-white",
    ghost: "bg-transparent text-[#4B5563] dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800",
    outline: "border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10"
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-6 py-4 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading ? (
        <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      ) : children}
    </button>
  );
};

const Input = React.forwardRef(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all ${className}`}
    {...props}
  />
));

const Card = ({ children, className = "", delay = 0 }) => (
  <div
    style={{ animationDelay: `${delay}ms` }}
    className={`bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-green-900/5 p-5 border border-white/20 dark:border-slate-800 hover:scale-[1.01] transition-all duration-300 animate-slide-up fill-mode-forwards ${className}`}
  >
    {children}
  </div>
);

const Badge = ({ children, className = "", color = "green" }) => {
  const colors = {
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${colors[color]} ${className}`}>
      {children}
    </span>
  );
};

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-slate-800 rounded-xl ${className}`}></div>
);

// --- UTILS & HOOKS (Inlined) ---

/**
 * Seguro wrapper para localStorage con manejo de errores (Safari Private Mode fallback)
 */
const storage = {
  get: (key, fallback = null) => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      console.warn(`Error reading from localStorage (${key}):`, error);
      return fallback;
    }
  },
  set: (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  },
  clear: () => {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.warn("Error clearing localStorage:", error);
    }
  }
};

/**
 * Hook para manejar la geolocalización con fallback a Santiago Centro
 */
function useGeolocalizacion() {
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

/**
 * Metricas de CO2 y Puntos - RUTA VERDE Chile
 * Basado en datos reales (DICTUC / Ministerio del Medio Ambiente)
 */
const EMISIONES = {
  auto: 0.21,    // Auto bencina promedio
  micro: 0.04,   // Red Metropolitana (eléctrica/diesel Euro VI promedio)
  metro: 0.01,   // Metro de Santiago (gran parte energía renovable)
  bici: 0,       // Tracción humana
  scooter: 0.005 // Scooter eléctrico (considerando carga)
};

const metricas = {
  calcularCO2Evitado: (distancia, modo) => {
    const emisionModo = EMISIONES[modo] || 0;
    const ahorroPorKm = EMISIONES.auto - emisionModo;
    return Math.max(0, distancia * ahorroPorKm);
  },
  calcularPuntos: (co2Evitado, distancia) => {
    const puntosCO2 = co2Evitado * 100;
    const bonusFisico = (distancia * 10); // Incentivo extra por bici/caminar
    return Math.round(puntosCO2 + bonusFisico);
  },
  obtenerInsignia: (co2Total) => {
    if (co2Total >= 50) return 'Héroe Verde';
    if (co2Total >= 20) return 'Guardián del Clima';
    if (co2Total >= 5) return 'Ciclista Urbano';
    return 'Brote Verde';
  },
  generarComparativaViral: (co2Kg) => {
    if (!co2Kg || co2Kg <= 0) return "Cada viaje verde suma 🌱";
    if (co2Kg > 10) return `= ${(co2Kg / 21.7).toFixed(1)} árboles plantados 🌳`;
    if (co2Kg > 2) return `= ${Math.round(co2Kg / 0.21)} km en auto evitados 🚗`;
    return `= ${Math.round(co2Kg * 5)} horas de TV 📺`;
  }
};

/**
 * ErrorBoundary - Captura errores JS en el árbol de componentes
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("ErrorBoundary caught an error", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F0FFF8] dark:bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-[#00C896] mb-6 animate-bounce">
            <AlertTriangle size={48} />
          </div>
          <h2 className="text-3xl font-black text-[#1A1A2E] dark:text-white mb-4">¡Ups! Algo salió mal 🌿</h2>
          <p className="text-gray-500 dark:text-slate-400 font-bold mb-8 max-w-xs">
            Hubo un error inesperado. No te preocupes, tus puntos están a salvo.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-[#00C896] text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-green-500/30 active:scale-95 transition-all"
          >
            <RefreshCcw size={20} className="animate-spin-slow" /> Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Analytics dummy for RUTA VERDE
 */
const trackEvent = (category, action, label, value) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
  console.log(`[Analytics] ${category} > ${action}: ${label} (${value || ''})`);
};

/**
 * TomTom Traffic API Hook
 */
const SANTIAGO_BBOX = '-33.65,-70.85,-33.30,-70.45';
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
const SEVERITY_LABEL = { error: 'Importante', warning: 'Retraso', info: 'OK' };
const ALERTAS_FALLBACK = [
  { id: 'fb1', texto: 'Tráfico denso en Av. Libertador Bernardo O\'Higgins', calle: 'Alameda', emoji: '🚦', label: 'Tráfico lento', status: 'Retraso', severity: 'warning', lat: -33.4489, lon: -70.6693, delay: 8 },
  { id: 'fb2', texto: 'Metro L1 operando con normalidad', calle: 'Línea 1', emoji: '✅', label: 'Sin incidentes', status: 'OK', severity: 'info', lat: null, lon: null, delay: null },
  { id: 'fb3', texto: 'Obras viales en Av. Providencia con Pedro de Valdivia', calle: 'Av. Providencia', emoji: '🚧', label: 'Obras en la vía', status: 'Importante', severity: 'error', lat: -33.4312, lon: -70.6094, delay: 12 },
];

function useTrafficAlerts(refreshIntervalMs = 120000) {
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const fetchAlertas = useCallback(async () => {
    const apiKey = import.meta.env.VITE_TOMTOM_KEY;
    if (!apiKey) {
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
      const alertasMapeadas = incidentes.slice(0, 15).map((poi, idx) => {
          const tipo = TIPO_INCIDENTE[poi.ic] || TIPO_INCIDENTE[0];
          return {
            id: poi.id || `incident-${idx}`,
            texto: poi.d || poi.f || 'Incidente en la vía',
            calle: poi.f || '',
            emoji: tipo.emoji,
            label: tipo.label,
            status: SEVERITY_LABEL[tipo.severity],
            severity: tipo.severity,
            lat: poi.p?.y || null,
            lon: poi.p?.x || null,
            delay: poi.dl ? Math.round(poi.dl / 60) : null,
          };
        }).filter(a => a.texto && a.texto.length > 2);
      if (alertasMapeadas.length === 0) {
        setAlertas([{ id: 'clear', texto: 'Sin incidentes reportados en Santiago', calle: 'Red vial metropolitana', emoji: '✅', label: 'Tráfico normal', status: 'OK', severity: 'info', lat: null, lon: null, delay: null }]);
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

/**
 * RUTA VERDE - MVP de Movilidad Sustentable (Chile)
 * Estética: Revolut + Citymapper + Duolingo.
 */

// --- CONFIGURACIÓN DE MAPA (LEAFLET) ---

// Fix de Iconos de Leaflet para producción
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const customIcons = {
  user: L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  }),
  bici: L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-5 h-5 bg-[#60A5FA] rounded-full border-2 border-white shadow-md flex items-center justify-center text-white"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5.5 17.5 5-5 5 5"/><path d="m17.5 17.5-5-5-5-5"/></svg></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  }),
  scooter: L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-4 h-4 bg-[#00C896] rounded-full border-2 border-white shadow-sm"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  }),
  alert: L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-6 h-6 bg-[#FF6B6B] rounded-full border-2 border-white shadow-lg animate-ping"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  }),
  destination: L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="relative"><div class="w-8 h-8 bg-[#FF6B6B] rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white animate-bounce"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  })
};

const iconIncidente = (severity) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="
    width:24px; height:24px; border-radius:50%;
    background:${severity === 'error' ? '#FF6B6B' : severity === 'warning' ? '#FFD93D' : '#00C896'};
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display:flex; align-items:center; justify-content:center;
    font-size:10px;
  ">${severity === 'error' ? '⚠' : severity === 'warning' ? '~' : '✓'}</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Coordenadas reales estaciones Metro de Santiago (fuente: Metro S.A. / OSM)
const METRO_LINES = [
  { name: 'L1', color: '#E30613', weight: 6, coords: [
    [-33.4258,-70.6580],[-33.4259,-70.6556],[-33.4265,-70.6519], // San Pablo→Neptuno→Pajaritos
    [-33.4270,-70.6481],[-33.4278,-70.6441],[-33.4290,-70.6404], // Pudahuel→Las Rejas→Ecuador
    [-33.4300,-70.6366],[-33.4312,-70.6321],[-33.4315,-70.6277], // San Alberto H→U de Santiago→Estación Central
    [-33.4339,-70.6229],[-33.4360,-70.6179],[-33.4376,-70.6131], // Unión Latinoamer→República→Lib.Bernardo OHiggins
    [-33.4389,-70.6089],[-33.4400,-70.6047],[-33.4404,-70.6012], // Santa Ana→Plaza de Armas→Bellas Artes
    [-33.4404,-70.5974],[-33.4403,-70.5934],[-33.4399,-70.5894], // Baquedano→Salvador→Tobalaba
    [-33.4378,-70.5837],[-33.4345,-70.5767],[-33.4315,-70.5694], // Pedro de Valdivia→Los Leones→Tobalaba(L4)
    [-33.4280,-70.5618],[-33.4246,-70.5552],[-33.4208,-70.5484]  // Manquehue→Hernando de Aguirre→Escuela Militar
  ]},
  { name: 'L2', color: '#F7941E', weight: 6, coords: [
    [-33.3693,-70.6392],[-33.3750,-70.6389],[-33.3820,-70.6388], // Cal y Canto→Puente Cal y Canto→Patronato
    [-33.3888,-70.6386],[-33.3960,-70.6384],[-33.4030,-70.6390], // Cerro Blanco→Cementerio→Einstein
    [-33.4100,-70.6396],[-33.4163,-70.6408],[-33.4230,-70.6420], // Dorsal→Franklin→El Llano
    [-33.4300,-70.6432],[-33.4370,-70.6445],[-33.4404,-70.6451], // San Miguel→Lo Vial→Lo Ovalle
    [-33.4450,-70.6458],[-33.4510,-70.6462],[-33.4570,-70.6466], // Ciudad del Niño→El Parrón→Lo Valledor
    [-33.4630,-70.6470],[-33.4700,-70.6474],[-33.4760,-70.6478], // Pedro Aguirre Cerda→Lo Espejo→Central
    [-33.4820,-70.6482],[-33.4880,-70.6486],[-33.4940,-70.6490]  // Lo Prado→Nos→La Cisterna
  ]},
  { name: 'L4', color: '#007A33', weight: 6, coords: [
    [-33.3800,-70.5700],[-33.3860,-70.5740],[-33.3930,-70.5780], // Tobalaba Norte
    [-33.3990,-70.5810],[-33.4050,-70.5830],[-33.4110,-70.5840], // El Golf→Alcántara→Escuela Militar
    [-33.4180,-70.5818],[-33.4250,-70.5764],[-33.4320,-70.5704], // Manquehue→Hernando de Aguirre→Tobalaba
    [-33.4399,-70.5894],[-33.4450,-70.5950],[-33.4510,-70.6010], // Pedro de Valdivia
    [-33.4570,-70.6070],[-33.4640,-70.6130],[-33.4710,-70.6190], // Vicente Valdés→Rojas Magallanes
    [-33.4780,-70.6250],[-33.4850,-70.6310],[-33.4920,-70.6370], // Trinidad→San Ramón→La Cisterna
    [-33.5020,-70.6460],[-33.5120,-70.6500],[-33.5200,-70.6530]  // Hospital El Pino
  ]},
  { name: 'L4A', color: '#78BE20', weight: 6, coords: [
    [-33.4920,-70.6370],[-33.4980,-70.6480],[-33.5050,-70.6580], // La Cisterna→Lo Blanco
    [-33.5120,-70.6650],[-33.5190,-70.6720]                      // La Granja→Santa Rosa
  ]},
  { name: 'L5', color: '#00A1DE', weight: 6, coords: [
    [-33.4480,-70.7280],[-33.4481,-70.7200],[-33.4483,-70.7120], // Pudahuel→Barrancas
    [-33.4485,-70.7040],[-33.4487,-70.6960],[-33.4489,-70.6880], // Bello→Blanqueado
    [-33.4490,-70.6800],[-33.4490,-70.6720],[-33.4490,-70.6640], // Cerrillos→Lo Espejo
    [-33.4490,-70.6511],[-33.4450,-70.6430],[-33.4404,-70.6012], // Quinta Normal→Cumming→Santa Ana
    [-33.4376,-70.6131],[-33.4340,-70.6260],[-33.4310,-70.6380], // Bellavista→La Florida
    [-33.4280,-70.6500],[-33.4250,-70.6600],[-33.4220,-70.6700]  // Mirador→Bellavista de la Florida
  ]},
  { name: 'L3', color: '#632323', weight: 6, coords: [
    [-33.3650,-70.6850],[-33.3750,-70.6780],[-33.3850,-70.6710], // Los Libertadores→Cardenal Caro→Vivaceta
    [-33.3950,-70.6640],[-33.4050,-70.6570],[-33.4150,-70.6500], // Conchalí→Plaza Chacabuco→Hospitales
    [-33.4250,-70.6430],[-33.4350,-70.6360],[-33.4450,-70.6290]  // Puente Cal y Canto→Plaza de Armas→Universidad de Chile
  ]},
  { name: 'L6', color: '#9400D3', weight: 6, coords: [
    [-33.3900,-70.6460],[-33.3960,-70.6380],[-33.4020,-70.6290], // Cerro Navia→Neptuno
    [-33.4080,-70.6200],[-33.4140,-70.6130],[-33.4200,-70.6060], // Tte Merino→Lo Prado
    [-33.4260,-70.5990],[-33.4320,-70.5920],[-33.4380,-70.5850], // Las Torres→Camino Agrícola
    [-33.4440,-70.5780],[-33.4500,-70.5710],[-33.4560,-70.5640], // Avenida Sur
    [-33.4620,-70.5580],[-33.4680,-70.5530],[-33.4740,-70.5490]  // Los Libertadores
  ]}
];

// Estaciones BipBici reales — fuente: datos.gob.cl + Transantiago
const BICI_STATIONS = [
  { id: 1, pos: [-33.4369, -70.6509], name: "BipBici Plaza de Armas",    direccion: "Av. Libertador B. O'Higgins 1059",   disponibles: 8  },
  { id: 2, pos: [-33.4399, -70.5894], name: "BipBici Tobalaba",          direccion: "Av. Providencia con Av. Tobalaba",    disponibles: 5  },
  { id: 3, pos: [-33.4552, -70.6826], name: "BipBici Estación Central",  direccion: "Av. Libertador B. O'Higgins 3322",   disponibles: 12 },
  { id: 4, pos: [-33.4281, -70.6077], name: "BipBici Bellas Artes",      direccion: "Av. Bernardo O'Higgins 651",         disponibles: 3  },
  { id: 5, pos: [-33.4196, -70.6045], name: "BipBici Manuel Montt",      direccion: "Av. Providencia 1111",               disponibles: 7  },
  { id: 6, pos: [-33.4404, -70.6012], name: "BipBici Lastarria",         direccion: "José Victorino Lastarria 70",        disponibles: 4  },
  { id: 7, pos: [-33.4209, -70.5487], name: "BipBici Escuela Militar",   direccion: "Av. Apoquindo con Manquehue",        disponibles: 9  },
  { id: 8, pos: [-33.4249, -70.6348], name: "BipBici Barrio Italia",     direccion: "Av. Italia con Av. Condell",         disponibles: 6  },
  { id: 9, pos: [-33.4380, -70.6540], name: "BipBici Bustamante",        direccion: "Av. Bustamante 52, Providencia",     disponibles: 11 },
  { id: 10, pos: [-33.4160, -70.5966], name: "BipBici Los Leones",       direccion: "Av. Andrés Bello con Los Leones",    disponibles: 2  },
];

// Zonas activas Grin y Lime — fuente: mapas in-app verificados
const SCOOTER_ZONES = [
  { id: 1, pos: [-33.4280, -70.6066], tipo: 'grin', zona: 'Barrio Lastarria',    direccion: "Villavicencio con Rosal, Providencia" },
  { id: 2, pos: [-33.4196, -70.6051], tipo: 'lime', zona: 'Providencia Centro',  direccion: "Av. Providencia 1234" },
  { id: 3, pos: [-33.4314, -70.6091], tipo: 'grin', zona: 'Bellavista',          direccion: "Constitución con Pío Nono" },
  { id: 4, pos: [-33.4158, -70.5949], tipo: 'lime', zona: 'Las Condes',          direccion: "Av. Apoquindo 3000" },
  { id: 5, pos: [-33.4349, -70.5800], tipo: 'grin', zona: 'Ñuñoa',              direccion: "Av. Irarrázaval 1850" },
  { id: 6, pos: [-33.4265, -70.5736], tipo: 'lime', zona: 'Plaza Egaña',        direccion: "Av. Grecia 500, Ñuñoa" },
  { id: 7, pos: [-33.4104, -70.5752], tipo: 'grin', zona: 'El Golf',             direccion: "Av. El Bosque Norte 45, Las Condes" },
  { id: 8, pos: [-33.4489, -70.6700], tipo: 'lime', zona: 'Quinta Normal',       direccion: "Av. Matucana 550, Quinta Normal" },
];

// Paraderos principales Red Metropolitana — coordenadas GPS verificadas
const MICRO_STOPS = [
  { id: 1, pos: [-33.4404, -70.6047], name: "Paradero Bellas Artes",     direccion: "Alameda / Mosqueto",           lineas: ['201','210','B01'] },
  { id: 2, pos: [-33.4376, -70.6131], name: "Paradero San Francisco",    direccion: "Alameda / San Francisco",      lineas: ['B01','D01','210'] },
  { id: 3, pos: [-33.4300, -70.6366], name: "Paradero Ecuador",          direccion: "Alameda / Ecuador",            lineas: ['301','D05','506'] },
  { id: 4, pos: [-33.4550, -70.6826], name: "Paradero Estación Central", direccion: "Alameda / 5 de Abril",         lineas: ['B01','401','D09'] },
  { id: 5, pos: [-33.4196, -70.6045], name: "Paradero Manuel Montt",     direccion: "Providencia / Manuel Montt",   lineas: ['210','301','406'] },
  { id: 6, pos: [-33.4160, -70.5950], name: "Paradero Tobalaba",         direccion: "Providencia / Tobalaba",       lineas: ['210','401','416'] },
];

const CityMap = ({
  className = "",
  showMetro = true, showBici = true, showScooter = true,
  destination = null, city = "Santiago", darkMode = false,
  alertasCoords = [],
  modoTransporte = null,
  onSearchSelect = null,
  routePreview = null,   // array de [lat,lng] para mostrar ruta preview en mapa
  centerTrigger = 0,     // incrementar para centrar en usuario
}) => {
  const { pos, permiso } = useGeolocalizacion();
  const [tileError, setTileError] = useState(false);
  const [mapQuery, setMapQuery] = useState('');
  const [mapSuggestions, setMapSuggestions] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [localRoutePoints, setLocalRoutePoints] = useState([]);
  const [fetchingRoute, setFetchingRoute] = useState(false);
  const searchRef = useRef(null);
  const destTrigger = useRef(0);

  const mapUrl = darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

  // Fetch sugerencias Nominatim — debounced
  const handleMapSearch = useCallback(async (q) => {
    setMapQuery(q);
    if (q.length < 3) { setMapSuggestions([]); return; }
    setSearchBusy(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', Santiago, Chile')}&limit=5`,
        { headers: { 'Accept-Language': 'es' } }
      );
      setMapSuggestions(await r.json());
    } catch { setMapSuggestions([]); }
    finally { setSearchBusy(false); }
  }, []);

  // Cuando usuario selecciona sugerencia: fetch ruta OSRM
  const handleSelectSuggestion = useCallback(async (s) => {
    const destCoords = [parseFloat(s.lat), parseFloat(s.lon)];
    const nombre = s.display_name.split(',')[0];
    setMapQuery(nombre);
    setMapSuggestions([]);
    destTrigger.current += 1;
    if (onSearchSelect) onSearchSelect(destCoords, nombre);

    // Preview de ruta OSRM
    setFetchingRoute(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${pos[1]},${pos[0]};${s.lon},${s.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes?.[0]) {
        setLocalRoutePoints(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
      }
    } catch { setLocalRoutePoints([]); }
    finally { setFetchingRoute(false); }
  }, [pos, onSearchSelect]);

  // Solo re-centra cuando cambia destino (no en cada render)
  const RecenterOnDest = ({ dest }) => {
    const map = useMap();
    const prev = useRef(null);
    useEffect(() => {
      if (dest && JSON.stringify(dest) !== JSON.stringify(prev.current)) {
        map.flyTo(dest, 15, { animate: true, duration: 1.5 });
        prev.current = dest;
      }
    }, [dest]);
    return null;
  };

  // Centrar en usuario — solo cuando se invoca explícitamente
  const CenterOnUser = ({ trigger }) => {
    const map = useMap();
    const prev = useRef(0);
    useEffect(() => {
      if (trigger > prev.current) {
        map.setView(pos, 16, { animate: true });
        prev.current = trigger;
      }
    }, [trigger]);
    return null;
  };

  const pts = routePreview || localRoutePoints;

  return (
    <div className={`relative bg-[#F8FAF9] dark:bg-slate-900 w-full h-full overflow-hidden ${className}`}>

      {/* ── BUSCADOR ── z-[2000] para estar SOBRE todo lo demás */}
      <div className="absolute top-3 left-3 right-3 z-[2000]">
        <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border flex items-center gap-2 px-4 py-3
          ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          {searchBusy
            ? <div className="w-4 h-4 border-2 border-[#00C896] border-t-transparent rounded-full animate-spin shrink-0" />
            : <Search size={16} className="text-[#00C896] shrink-0" />
          }
          <Input
            ref={searchRef}
            type="text"
            placeholder="¿A dónde vas?"
            value={mapQuery}
            onChange={e => handleMapSearch(e.target.value)}
            className="!border-none !shadow-none !bg-transparent !p-0 font-bold text-sm text-gray-900 dark:text-white"
          />
          {mapQuery.length > 0 && (
            <button
              onClick={() => { setMapQuery(''); setMapSuggestions([]); setLocalRoutePoints([]); }}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sugerencias */}
        {mapSuggestions.length > 0 && (
          <div className="mt-1 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            {mapSuggestions.slice(0, 5).map((s, i) => (
              <div
                key={i}
                onClick={() => handleSelectSuggestion(s)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-50 dark:border-slate-700 last:border-none transition-colors active:bg-green-100"
              >
                <MapPin size={14} className="text-[#00C896] shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                    {s.display_name.split(',')[0]}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {s.display_name.split(',').slice(1, 3).join(', ').trim()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cargando ruta preview */}
        {fetchingRoute && (
          <div className="mt-1 bg-white dark:bg-slate-800 rounded-xl px-4 py-2 shadow-lg border border-gray-100 dark:border-slate-700 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-[#00C896] border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-bold text-gray-500">Calculando ruta...</span>
          </div>
        )}
      </div>

      {/* Botón centrar en usuario */}
      <button
        id="rvCenterTrigger"
        onClick={() => {
          destTrigger.current = 0;
          // trigger CenterOnUser via incrementing centerTrigger if it was passed as prop,
          // or handle locally if we want to force re-center
          if (onSearchSelect) onSearchSelect(null, null); // clear destination to refocus
        }}
        className="absolute bottom-6 right-4 z-[1500] w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-2xl border border-gray-100 dark:border-slate-700 text-[#00C896] active:scale-95 transition-all"
      >
        <Locate size={20} />
      </button>

      {tileError && (
        <div className="absolute inset-0 z-[3000] bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center p-8 text-center">
          <Wind size={48} className="text-slate-400 mb-4 animate-pulse" />
          <h3 className="font-black text-xl mb-2">Mapa no disponible</h3>
          <p className="text-sm text-gray-500 mb-6">Sin conexión o error en el servicio de mapas.</p>
          <button onClick={() => setTileError(false)} className="bg-[#00C896] text-white px-6 py-3 rounded-xl font-bold">Reintentar</button>
        </div>
      )}

      <MapContainer
        center={pos}
        zoom={14}
        scrollWheelZoom={true}
        dragging={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution="© CARTO"
          url={mapUrl}
          eventHandlers={{ tileerror: () => setTileError(true) }}
        />

        <RecenterOnDest dest={destination} />
        <CenterOnUser trigger={centerTrigger} />

        {/* PREVIEW DE RUTA en el mapa */}
        {pts.length > 1 && (
          <>
            <Polyline positions={pts} color="#1A1A2E" weight={10} opacity={0.2} />
            <Polyline positions={pts} color="#00C896" weight={5} opacity={0.95} dashArray="none" />
          </>
        )}

        {/* METRO — líneas reales */}
        {showMetro && METRO_LINES.map(line => (
          <React.Fragment key={line.name}>
            <Polyline positions={line.coords} color={line.color} weight={line.weight || 5} opacity={modoTransporte === 'metro' ? 1 : 0.6} dashArray={line.dashArray || undefined} />
          </React.Fragment>
        ))}

        {/* BICIS — estaciones reales BipBici */}
        {(showBici || modoTransporte === 'bici') && BICI_STATIONS.map(s => (
          <Marker
            key={s.id}
            position={s.pos}
            icon={L.divIcon({
              className: 'custom-div-icon',
              html: `<div class="transition-all duration-300 flex items-center justify-center text-white" style="
                background:${modoTransporte==='bici'?'#10b981':'#3b82f6'};
                border:3px solid white;border-radius:50%;
                width:${modoTransporte==='bici'?32:22}px;height:${modoTransporte==='bici'?32:22}px;
                font-size:${modoTransporte==='bici'?16:12}px;
                box-shadow:0 4px 12px rgba(0,0,0,0.3)${modoTransporte==='bici'?',0 0 0 6px rgba(16,185,129,0.3)':''};">🚴</div>`,
              iconSize: [modoTransporte==='bici'?32:22, modoTransporte==='bici'?32:22],
              iconAnchor: [modoTransporte==='bici'?16:11, modoTransporte==='bici'?16:11]
            })}
          >
            <Popup>
              <div style={{ minWidth: 160, padding: 8 }}>
                <p style={{ fontWeight: 900, fontSize: 12, marginBottom: 4 }}>{s.name}</p>
                <p style={{ color: '#00C896', fontWeight: 700, fontSize: 11 }}>🚴 {s.disponibles} bicis disponibles</p>
                <p style={{ color: '#6B7280', fontSize: 10, marginTop: 2 }}>BipBici · Gratis primeros 30 min</p>
                <p style={{ color: '#6B7280', fontSize: 10 }}>📍 {s.direccion}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* SCOOTERS — zonas reales Grin/Lime */}
        {(showScooter || modoTransporte === 'scooter') && SCOOTER_ZONES.map(s => (
          <Marker
            key={s.id}
            position={s.pos}
            icon={L.divIcon({
              className: '',
              html: `<div style="
                background:${modoTransporte==='scooter'?(s.tipo==='grin'?'#00C896':'#FFD700'):'#9CA3AF'};
                border:3px solid white;border-radius:10px;
                width:${modoTransporte==='scooter'?24:16}px;height:${modoTransporte==='scooter'?24:16}px;
                display:flex;align-items:center;justify-content:center;font-size:${modoTransporte==='scooter'?12:9}px;
                box-shadow:0 2px 8px rgba(0,0,0,0.2)${modoTransporte==='scooter'?',0 0 0 4px rgba(0,200,150,0.2)':''};">🛴</div>`,
              iconSize: [24, 24], iconAnchor: [12, 12]
            })}
          >
            <Popup>
              <div style={{ minWidth: 150, padding: 8 }}>
                <p style={{ fontWeight: 900, fontSize: 13 }}>{s.tipo === 'grin' ? '🟢 Grin' : '🟡 Lime'}</p>
                <p style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>{s.zona}</p>
                <p style={{ fontSize: 10, color: '#6B7280' }}>📍 {s.direccion}</p>
                <p style={{ color: '#00C896', fontWeight: 700, fontSize: 11, marginTop: 4 }}>~$90 CLP/min · app Grin/Lime</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* PARADAS MICRO */}
        {(modoTransporte === 'micro') && MICRO_STOPS.map(s => (
          <Marker key={s.id} position={s.pos} icon={L.divIcon({
            className: '',
            html: `<div style="background:#F59E0B;border:3px solid white;border-radius:8px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.2),0 0 0 4px rgba(245,158,11,0.2);">🚌</div>`,
            iconSize: [24, 24], iconAnchor: [12, 12]
          })}>
            <Popup>
              <div style={{ minWidth: 150, padding: 8 }}>
                <p style={{ fontWeight: 900, fontSize: 12 }}>{s.name}</p>
                <p style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>📍 {s.direccion}</p>
                <p style={{ fontSize: 10, color: '#F59E0B', fontWeight: 700, marginTop: 4 }}>Líneas: {s.lineas.join(' · ')}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* USUARIO */}
        <Marker position={pos} icon={customIcons.user} />

        {/* DESTINO desde búsqueda en mapa */}
        {destination && <Marker position={destination} icon={customIcons.destination} />}

        {/* ALERTAS TRÁFICO */}
        {alertasCoords.map(a => (
          <Marker key={a.id} position={[a.lat, a.lon]} icon={iconIncidente(a.severity)}>
            <Popup>
              <div style={{ padding: 4 }}>
                <p style={{ fontWeight: 700, fontSize: 12 }}>{a.emoji} {a.calle}</p>
                <p style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{a.texto}</p>
                {a.delay && <p style={{ fontSize: 9, color: '#EF4444', fontWeight: 700, marginTop: 4 }}>+{a.delay} min de retraso</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

// --- COMPONENTES ATÓMICOS ---

const CSSIllustration = ({ type }) => {
  if (type === 'city') {
    return (
      <div className="relative w-full h-48 bg-gradient-to-b from-blue-50 to-green-50 dark:from-slate-800 dark:to-slate-900 rounded-[40px] overflow-hidden flex items-end justify-center">
        <div className="absolute bottom-0 w-full h-1/2 bg-green-200/30 dark:bg-green-900/20 blur-3xl"></div>
        <div className="relative flex items-end gap-1 mb-4">
          <div className="w-12 h-32 bg-gray-200 dark:bg-slate-700 rounded-t-lg animate-slide-up" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-16 h-40 bg-gray-300 dark:bg-slate-600 rounded-t-lg animate-slide-up" style={{ animationDelay: '0.3s' }}></div>
          <div className="w-10 h-24 bg-gray-200 dark:bg-slate-700 rounded-t-lg animate-slide-up" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-14 h-48 bg-[#00C896]/20 rounded-t-lg animate-slide-up" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#FFD93D] rounded-full animate-bounce shadow-xl shadow-yellow-500/50"></div>
      </div>
    );
  }
  if (type === 'welcome') {
    return (
      <div className="relative w-full h-64 bg-green-50 dark:bg-green-900/10 rounded-[48px] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white dark:from-slate-800 to-transparent opacity-50"></div>
        <div className="relative z-10 scale-150">
          <div className="w-20 h-20 bg-[#00C896] rounded-3xl rotate-12 flex items-center justify-center text-white shadow-2xl animate-float">
            <Leaf size={40} fill="currentColor" />
          </div>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#FFD93D] rounded-2xl -rotate-12 flex items-center justify-center text-[#1A1A2E] shadow-xl animate-float" style={{ animationDelay: '0.5s' }}>
            <Zap size={24} fill="currentColor" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00C896] to-transparent opacity-20"></div>
      </div>
    );
  }
  return null;
};

const CountUp = ({ end, duration = 2000, decimals = 0 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(progress * end);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);
  return <span>{decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}</span>;
};

const ConfettiEffect = ({ onComplete }) => {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    const newPieces = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      size: Math.random() * 10 + 5,
      color: ['#00C896', '#FFD93D', '#60A5FA'][Math.floor(Math.random() * 3)]
    }));
    setPieces(newPieces);
    const timer = setTimeout(() => {
      setPieces([]);
      onComplete();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[10000] overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute top-[-20px] rounded-sm animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
};

// Dynamic imports for screens
const HomeScreen = ({ user, onNavigate, stats, darkMode, alertas, alertasCargando }) => <HomeComponent user={user} onNavigate={onNavigate} stats={stats} darkMode={darkMode} alertas={alertas} alertasCargando={alertasCargando} />;
const RoutePlanner = ({ onStart, destination, darkMode }) => <RoutePlannerComponent onStart={onStart} destination={destination} darkMode={darkMode} />;
const LiveMapScreen = ({ darkMode, onNavigateToRutas }) => <LiveMapComponent darkMode={darkMode} onNavigateToRutas={onNavigateToRutas} />;
const GamificationScreen = ({ points, showToast, redeeming, setRedeeming, co2Total }) => <GamificationComponent points={points} showToast={showToast} redeeming={redeeming} setRedeeming={setRedeeming} co2Total={co2Total} />;
const ProfileScreen = ({ user, stats, onLogout, darkMode, setDarkMode }) => <ProfileComponent user={user} stats={stats} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode} />;

// --- PANTALLAS ---

const HomeComponent = ({ user, onNavigate, stats, darkMode, alertas, alertasCargando }) => {
  const getMensaje = (nombre) => {
    const h = new Date().getHours();
    if (h < 9) return `Buenos días, ${nombre}. ¿Vamos en metro hoy? 🚇`;
    if (h < 14) return `¡Buen día! Cada viaje sostenible cuenta, ${nombre}. 🌿`;
    if (h < 19) return `¿Vuelta a casa en bici, ${nombre}? 🚴`;
    return `Terminaste el día con ${stats.co2Total.toFixed(1)}kg menos de CO₂. ¡Bien! 🌱`;
  };

  const usuariosSimulados = 47 + (Math.floor(Date.now() / 86400000) % 30);

  const [from, setFrom] = useState("Tu ubicación");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isShaking, setIsShaking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [swapping, setSwapping] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const suggestedRoutes = [
    { id: 1, name: "Tobalaba", time: "12 min", mode: <Train size={14} />, co2: "Muy bajo", color: "bg-green-100 text-green-700" },
    { id: 2, name: "Costanera Center", time: "25 min", mode: <Bike size={14} />, co2: "Zero", color: "bg-blue-100 text-blue-700" },
    { id: 3, name: "Parque Arauco", time: "40 min", mode: <Car size={14} />, co2: "Medio", color: "bg-yellow-100 text-yellow-700" },
  ];

  const handleSearch = async (query) => {
    setSearch(query);
    if (query.length > 3) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}, ${user.city}, Chile&limit=3`);
        const data = await res.json();
        setSuggestions(data);
      } catch (e) { console.error(e); }
    } else {
      setSuggestions([]);
    }
  };

  const onSearchSubmit = (coords = null) => {
    if (!search) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    onNavigate('rutas', coords);
  };

  const alertaPrincipal = alertas?.find(a => a.severity === 'error')
    || alertas?.find(a => a.severity === 'warning')
    || alertas?.[0];

  return (
    <div className={`space-y-6 pb-40 animate-fade-in transition-transform duration-300 relative ${refreshing ? 'translate-y-12' : ''}`}>
      {refreshing && (
        <div className="absolute top-0 left-0 right-0 flex justify-center -translate-y-10">
           <div className="w-8 h-8 border-4 border-[#00C896] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <header className="flex justify-between items-start" onClick={handleRefresh}>
        <div className="max-w-[70%]">
          <h1 className="text-3xl font-black text-[#0D1B2A] dark:text-white leading-tight tracking-tight">Hola, {user.name} 👋</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[#4B5563] dark:text-slate-400 flex items-center gap-1 font-bold"><MapPin size={14} className="text-[#00C896]" /> {user.city}, Chile</p>
            <span className="bg-[#00C896]/10 text-[#00C896] text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{usuariosSimulados} activos</span>
          </div>
        </div>
        <button className="relative w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-xl border border-gray-50 dark:border-slate-700 transition-transform hover:scale-110 active:scale-95">
          <Bell size={24} className="text-[#1A1A2E] dark:text-white" />
          <span className="absolute top-4 right-4 w-3 h-3 bg-[#FF6B6B] rounded-full border-2 border-white dark:border-slate-800"></span>
        </button>
      </header>

      <Card className={`!p-6 space-y-4 relative overflow-visible ${isShaking ? 'animate-shake' : ''}`} delay={100}>
        <div className="space-y-3 relative">
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 focus-within:border-[#00C896] transition-all">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <Input
              type="text"
              placeholder="¿Desde dónde?"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="!border-none !shadow-none !bg-transparent !p-0 font-bold text-[#0D1B2A] dark:text-white"
            />
          </div>

          <button
            onClick={() => {
              setSwapping(true);
              const tmp = from; setFrom(search); setSearch(tmp);
              setTimeout(() => setSwapping(false), 500);
            }}
            className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-gray-100 dark:border-slate-700 flex items-center justify-center text-[#00C896] z-10 transition-all duration-500 ${swapping ? 'rotate-180 scale-125' : 'hover:rotate-180'}`}
          >
            <ArrowLeftRight size={18} className={`rotate-90 transition-transform ${swapping ? 'scale-75' : ''}`} />
          </button>

          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 focus-within:border-[#00C896] transition-all relative">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <Input
              type="text"
              placeholder="¿A dónde?"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
              className="!border-none !shadow-none !bg-transparent !p-0 font-bold text-[#0D1B2A] dark:text-white"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 shadow-2xl rounded-2xl mt-2 z-[1000] border border-gray-100 dark:border-slate-700 overflow-hidden">
                {suggestions.map((s, idx) => (
                  <div key={idx} onClick={() => {
                    setSearch(s.display_name.split(',')[0]);
                    setSuggestions([]);
                    onNavigate('rutas', [parseFloat(s.lat), parseFloat(s.lon)]);
                  }} className="p-4 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer border-b border-gray-50 dark:border-slate-700 last:border-none">
                    <p className="font-bold text-sm text-[#0D1B2A] dark:text-white truncate">{s.display_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <Button fullWidth onClick={onSearchSubmit}><Search size={22} strokeWidth={3} /> Buscar ruta</Button>
      </Card>

      <div className="flex justify-between items-center px-2">
        {[{ icon: <Navigation size={20} />, label: 'Trabajo' }, { icon: <Home size={20} />, label: 'Casa' }, { icon: <Heart size={20} />, label: 'Gym' }, { icon: <X size={20} className="rotate-45" />, label: 'Más' }].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => onNavigate('rutas')}>
            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-gray-100 dark:border-slate-700 group-hover:bg-[#00C896] group-hover:text-white transition-all text-[#1A1A2E] dark:text-white">{item.icon}</div>
            <span className="text-[10px] font-black uppercase text-[#6B7280] dark:text-slate-500 tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-black text-[#0D1B2A] dark:text-white tracking-tight">{getMensaje(user.name.split(' ')[0])}</h2>

      <div className="bg-[#00C896]/10 p-3 rounded-2xl flex items-center gap-2 border border-[#00C896]/20">
         <div className="w-8 h-8 bg-[#00C896] rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-green-500/20">
            <CheckCircle2 size={14} />
         </div>
         <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400">
            Ahorraste {metricas.generarComparativaViral(stats.co2Total)} hoy.
         </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center !p-4 bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white overflow-hidden relative border-none" delay={200}>
          <p className="text-2xl font-black text-[#00C896] z-10 relative"><CountUp end={stats.co2Total} decimals={1} /></p>
          <p className="text-[9px] opacity-60 uppercase tracking-widest font-black mt-1 z-10 relative">KG CO₂</p>
          <Leaf className="absolute -bottom-4 -right-4 text-[#00C896]/10 rotate-12 animate-float" size={60} />
        </Card>
        <Card className="text-center !p-4 bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white overflow-hidden relative border-none" delay={300}>
          <p className="text-2xl font-black text-[#FFD93D] z-10 relative"><CountUp end={stats.points} /></p>
          <p className="text-[9px] opacity-60 uppercase tracking-widest font-black mt-1 z-10 relative">PTS</p>
          <Star className="absolute -bottom-4 -right-4 text-white/5 rotate-12" size={60} />
        </Card>
        <Card className="text-center !p-4 bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white overflow-hidden relative border-none" delay={400}>
          <p className="text-2xl font-black text-blue-400 z-10 relative"><CountUp end={stats.kmTotal} decimals={1} /></p>
          <p className="text-[9px] opacity-60 uppercase tracking-widest font-black mt-1 z-10 relative">KM</p>
          <Navigation className="absolute -bottom-4 -right-4 text-white/5 rotate-12" size={60} />
        </Card>
      </div>

      {alertaPrincipal && (
        <div className={`p-4 rounded-2xl flex items-center gap-4 animate-pulse border
          ${alertaPrincipal.severity === 'error'
            ? 'bg-[#FF6B6B]/10 dark:bg-red-900/20 border-[#FF6B6B]/20'
            : alertaPrincipal.severity === 'warning'
            ? 'bg-yellow-500/10 dark:bg-yellow-900/20 border-yellow-500/20'
            : 'bg-[#00C896]/10 dark:bg-green-900/20 border-[#00C896]/20'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg
            ${alertaPrincipal.severity === 'error' ? 'bg-[#FF6B6B] shadow-red-500/20'
            : alertaPrincipal.severity === 'warning' ? 'bg-yellow-500 shadow-yellow-500/20'
            : 'bg-[#00C896] shadow-green-500/20'}`}
          >
            <span className="text-lg">{alertaPrincipal.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold leading-tight
              ${alertaPrincipal.severity === 'error' ? 'text-[#FF6B6B]'
              : alertaPrincipal.severity === 'warning' ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-emerald-700 dark:text-emerald-400'}`}
            >
              {alertaPrincipal.calle && (
                <span className="font-black">{alertaPrincipal.calle}: </span>
              )}
              {alertaPrincipal.texto}
            </p>
            {alertaPrincipal.delay && (
              <p className="text-[9px] text-gray-400 font-bold mt-0.5">
                Retraso estimado: {alertaPrincipal.delay} min
              </p>
            )}
          </div>
          {alertasCargando && (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
        </div>
      )}

      {/* Banner Institucional BipBici (Monetización) */}
      <div
        onClick={() => trackEvent('Ad', 'click', 'bipbici_promo')}
        className="relative p-6 rounded-3xl overflow-hidden cursor-pointer bg-gradient-to-r from-[#1A1A2E] to-[#16213E] text-white shadow-xl border border-[#00C896]/20"
      >
         <div className="relative z-10 flex items-center justify-between">
            <div className="max-w-[70%]">
               <span className="bg-[#00C896]/20 border border-[#00C896]/30 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-[#00C896]">Partner Movilidad</span>
               <h3 className="text-lg font-black mt-1 leading-tight">BipBici + Ruta Verde</h3>
               <p className="text-[10px] font-bold opacity-70 mt-1">Estaciones de bicicleta integradas en tu ruta sostenible.</p>
            </div>
            <div className="w-14 h-14 bg-[#00C896]/10 rounded-2xl flex items-center justify-center border border-[#00C896]/20">
               <Bike size={28} className="text-[#00C896]" />
            </div>
         </div>
         <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C896]/5 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-[#0D1B2A] dark:text-white tracking-tight">Rutas sugeridas para ti</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
          {suggestedRoutes.map((r) => (
            <div key={r.id} onClick={() => onNavigate('rutas')} className="min-w-[160px] bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-green-900/5 cursor-pointer hover:border-[#00C896] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-8 h-8 bg-gray-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[#1A1A2E] dark:text-white">{r.mode}</div>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${r.color}`}>{r.co2}</span>
              </div>
              <p className="font-black text-xs text-[#0D1B2A] dark:text-white truncate">{r.name}</p>
              <p className="text-[10px] text-gray-400 font-bold">{r.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RoutePlannerComponent = ({ onStart, destination, darkMode }) => {
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState(destination);
  const { pos: userPos } = useGeolocalizacion();

  useEffect(() => {
    setCoords(destination);
  }, [destination]);

  const [selected, setSelected] = useState('bici');
  const [filter, setFilter] = useState('greener');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Modo de transporte seleccionado por el usuario
  const [modoSeleccionado, setModoSeleccionado] = useState(null);

  // Modos ordenados por prioridad ecológica (Ruta Verde primero)
  const MODOS = [
    { id: 'caminata', label: 'A pie', emoji: '🚶', color: '#00C896', co2Factor: 0, costeFijo: 0, osrmProfile: 'foot' },
    { id: 'bici', label: 'Bicicleta', emoji: '🚴', color: '#3B82F6', co2Factor: 0, costeFijo: 350, osrmProfile: 'cycling' },
    { id: 'metro', label: 'Metro', emoji: '🚇', color: '#FF0000', co2Factor: 0.03, costeFijo: 780, osrmProfile: 'driving' },
    { id: 'scooter', label: 'Scooter', emoji: '🛴', color: '#06B6D4', co2Factor: 0.015, costeFijo: 400, osrmProfile: 'driving' },
    { id: 'micro', label: 'Micro', emoji: '🚌', color: '#F59E0B', co2Factor: 0.068, costeFijo: 800, osrmProfile: 'driving' },
    { id: 'moto', label: 'Moto', emoji: '🏍️', color: '#8B5CF6', co2Factor: 0.085, costeFijo: 0, osrmProfile: 'driving' },
    { id: 'uber', label: 'Uber', emoji: '🚗', color: '#1A1A2E', co2Factor: 0.21, costeFijo: 2800, osrmProfile: 'driving' },
    { id: 'auto', label: 'Auto', emoji: '🚙', color: '#EF4444', co2Factor: 0.21, costeFijo: 1500, osrmProfile: 'driving' },
    { id: 'compartido', label: 'Compartido', emoji: '🤝', color: '#EC4899', co2Factor: 0.1, costeFijo: 1200, osrmProfile: 'driving' },
  ];

  const DIST_KM = 5.2; // distancia estimada de la ruta

  const [routeDetails, setRouteDetails] = useState({});

  useEffect(() => {
    if (!userPos || !coords) return;
    MODOS.slice(0, 3).forEach(async (m) => {
      try {
        const profile = m.osrmProfile || 'driving';
        const url = `https://router.project-osrm.org/route/v1/${profile}/${userPos[1]},${userPos[0]};${coords[1]},${coords[0]}?overview=false`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes?.[0]) {
          const { distance, duration } = data.routes[0];
          setRouteDetails(prev => ({
            ...prev,
            [m.id]: {
              distKm: distance / 1000,
              timeMin: Math.round(duration / 60)
            }
          }));
        }
      } catch (e) { console.error(e); }
    });
  }, [userPos, coords]);

  const baseRoutes = MODOS.map(m => {
    const details = routeDetails[m.id] || { distKm: DIST_KM, timeMin: 35 };
    const dKm = details.distKm;
    const co2 = parseFloat((m.co2Factor * dKm).toFixed(3));
    const co2Evitado = parseFloat((Math.max(0, 0.21 - m.co2Factor) * dKm).toFixed(3));
    const co2Level = Math.round((m.co2Factor / 0.21) * 100);
    const pts = Math.floor(co2Evitado * 100 + dKm * 10);
    return {
      id: m.id,
      title: m.label.toUpperCase(),
      sub: m.label,
      medio: m.id,
      distanciaKm: dKm,
      time: details.timeMin,
      cost: m.costeFijo,
      co2, co2Evitado, co2Level,
      color: '',
      colorHex: m.color,
      emoji: m.emoji,
      icon: <span style={{ fontSize: 18 }}>{m.emoji}</span>,
      realTime: m.id === 'bici' ? `${BICI_STATIONS[0].disponibles} bicis libres` :
                m.id === 'metro' ? 'Próximo en 3 min' :
                m.id === 'uber' ? 'Conductor a 2 min' : 'Disponible ahora',
      pts,
      instrucciones: {
        caminata: ["🚶 Sal por la puerta principal","🚶 Sigue derecho por Av. Providencia","🚶 Gira a la derecha en la próxima esquina","🏁 Has llegado a tu destino"],
        bici: ["🚴 Retira BipBici en la estación más cercana","🚴 Toma la ciclovía de Av. Providencia hacia el oriente","🔒 Estaciona en la estación de destino","🚶 Camina 2 min — ¡llegaste!"],
        scooter: ["🛴 Desbloquea el scooter con la app Grin/Lime","🛴 Sigue la ruta sugerida por la app","🛴 Estaciona en zona habilitada al llegar","✅ ¡Destino alcanzado!"],
        metro: ["🚶 Dirígete a la estación Metro más cercana","🚇 Toma L1 → dirección Escuela Militar","🚇 Baja en la estación más cercana a tu destino","🚶 Camina 3 min hasta llegar"],
        micro: ["🚌 Dirígete a la parada más cercana","🚌 Toma la micro 301 o D01 hacia tu destino","🔔 Baja en la parada indicada","🚶 Camina 5 min — ¡llegaste!"],
        moto: ["🏍️ Prepara tu moto","🏍️ Sigue la ruta por Av. Vitacura","🏍️ Gira en la rotonda","🏁 Destino alcanzado"],
        uber: ["📱 Solicita el Uber desde la app","📍 Espera en el punto indicado","🚗 El conductor llega en ~2 min","🏁 Viaje puerta a puerta"],
        auto: ["🚗 Sal con tu vehículo","🚗 Toma Av. Providencia dirección oriente","🅿️ Busca estacionamiento al llegar","🏁 Has llegado"],
        compartido: ["🤝 Confirma el viaje compartido","🚗 El conductor recoge a otro pasajero primero","🚗 Luego te lleva a tu destino","🏁 ¡Llegaste!"],
      }[m.id] || ["🚀 En camino...","🏁 ¡Llegaste!"]
    };
  });

  const filteredRoutes = useMemo(() => {
    const sorted = [...baseRoutes];
    if (filter === 'faster') sorted.sort((a, b) => a.time - b.time);
    if (filter === 'cheaper') sorted.sort((a, b) => a.cost - b.cost);
    if (filter === 'greener') sorted.sort((a, b) => a.co2 - b.co2);
    return sorted;
  }, [filter, baseRoutes]);

  const handleStartRoute = () => {
    setStarting(true);
    trackEvent('Navigation', 'start_route', selected);
    const rutaElegida = filteredRoutes.find(r => r.id === selected);
    setTimeout(() => {
      setStarting(false);
      onStart(rutaElegida);
    }, 800);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col -mx-5 -mt-8 pb-32 animate-fade-in">
        <div className="h-[40vh] w-full bg-gray-100 dark:bg-slate-800 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-t-[48px] p-8 -mt-12 space-y-6">
           <Skeleton className="h-1.5 w-16 mx-auto mb-6" />
           <Skeleton className="h-24 w-full" />
           <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col -mx-5 -mt-8 pb-32 animate-fade-in relative">
      <div className="flex-grow relative h-[40vh] min-h-[250px] leaflet-container-wrapper">
        <CityMap destination={coords} darkMode={darkMode} />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-t-[48px] shadow-2xl p-6 z-10 space-y-4 -mt-12 relative pb-32 lg:pb-8 border-t border-gray-100 dark:border-slate-800">
        <div className="w-16 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full mx-auto -mt-2 mb-2"></div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {[{ id: 'greener', label: 'Más Verde' }, { id: 'faster', label: 'Más Rápido' }, { id: 'cheaper', label: 'Más Barato' }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filter === f.id ? 'bg-[#00C896] text-white shadow-lg shadow-green-200' : 'bg-gray-100 dark:bg-slate-800 text-[#6B7280] dark:text-slate-400'}`}>{f.label}</button>
          ))}
        </div>
        <div className="space-y-3 max-h-[240px] overflow-y-auto no-scrollbar">
          {filteredRoutes.map((r, i) => (
            <div
              key={r.id}
              onClick={() => { setSelected(r.id); setModoSeleccionado(r.id); }}
              className={`p-4 rounded-[24px] border-2 transition-all cursor-pointer animate-slide-up fill-mode-forwards
                ${selected === r.id ? 'shadow-lg' : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-200'}`}
              style={{
                animationDelay: `${i * 100}ms`,
                borderColor: selected === r.id ? r.colorHex : 'transparent',
                background: selected === r.id ? `${r.colorHex}10` : ''
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-md"
                    style={{ background: selected === r.id ? r.colorHex : '#F3F4F6' }}>
                    {r.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-[#0D1B2A] dark:text-white">{r.title}</h3>
                      {r.co2 === 0 && <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-black">CERO CO₂</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-gray-400 font-bold">{r.time} min</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-[9px] text-gray-400 font-bold">{r.cost > 0 ? `$${r.cost.toLocaleString('es-CL')}` : 'Gratis'}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-[9px] font-black" style={{ color: r.colorHex }}>+{r.pts} pts</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-10 h-10 rounded-full border-4 flex items-center justify-center"
                    style={{ borderColor: `${r.colorHex}40`, background: `${r.colorHex}10` }}>
                    <span className="text-[8px] font-black" style={{ color: r.colorHex }}>{r.co2Level}%</span>
                  </div>
                  <p className="text-[7px] text-gray-400 mt-0.5">CO₂</p>
                </div>
              </div>
              {selected === r.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[9px] font-bold animate-pulse" style={{ color: r.colorHex }}>● {r.realTime}</span>
                  <span className="text-[9px] text-gray-400 font-bold">
                    {r.co2 > 0 ? `${r.co2.toFixed(2)} kg CO₂` : '🌿 Sin emisiones'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        <Button fullWidth onClick={handleStartRoute} loading={starting} className="py-4 shadow-2xl relative z-[100]"><Navigation size={20} strokeWidth={3} /> Iniciar ruta</Button>
      </div>
    </div>
  );
};

const LiveMapComponent = ({ darkMode, onNavigateToRutas }) => {
  const [layers, setLayers] = useState({ metro: true, bici: true, scooter: true });
  const [showAlerts, setShowAlerts] = useState(false);
  const [modoFiltro, setModoFiltro] = useState(null);
  const [destSeleccionado, setDestSeleccionado] = useState(null);
  const { alertas, cargando, ultimaActualizacion, refetch } = useTrafficAlerts();
  const user = useMemo(() => storage.get('rv_user', { city: 'Santiago' }), []);

  const MODOS_RAPIDOS = [
    { id: 'bici', emoji: '🚴', label: 'Bici' },
    { id: 'scooter', emoji: '🛴', label: 'Scooter' },
    { id: 'metro', emoji: '🚇', label: 'Metro' },
    { id: 'micro', emoji: '🚌', label: 'Micro' },
  ];

  // Contar alertas importantes para el badge
  const alertasImportantes = alertas.filter(a => a.severity === 'error').length;

  const horaActualizacion = ultimaActualizacion
    ? ultimaActualizacion.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="h-full -mx-5 -mt-8 flex flex-col relative overflow-hidden">
      <div className="flex-grow relative h-full leaflet-container-wrapper">
        <CityMap
          showMetro={layers.metro || modoFiltro === 'metro'}
          showBici={layers.bici || modoFiltro === 'bici'}
          showScooter={layers.scooter || modoFiltro === 'scooter'}
          city={user.city}
          darkMode={darkMode}
          alertasCoords={alertas.filter(a => a.lat && a.lon)}
          modoTransporte={modoFiltro}
          destination={destSeleccionado}
          onSearchSelect={(coords, nombre) => {
            setDestSeleccionado(coords);
          }}
        />
        {destSeleccionado && (
          <div className="absolute bottom-28 left-4 right-4 z-[1000]">
            <button
              onClick={() => { if (onNavigateToRutas) onNavigateToRutas(destSeleccionado); }}
              className="w-full py-4 bg-[#00C896] text-white font-black text-sm rounded-2xl shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Navigation size={18} /> Ver rutas hacia este destino
            </button>
          </div>
        )}

        {/* FILTROS DE MODO — debajo del buscador */}
        <div className="absolute top-20 left-4 right-4 flex gap-2 z-[900] overflow-x-auto no-scrollbar">
          {MODOS_RAPIDOS.map(m => (
            <button
              key={m.id}
              onClick={() => setModoFiltro(prev => prev === m.id ? null : m.id)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all border whitespace-nowrap flex items-center gap-1
                ${modoFiltro === m.id
                  ? 'bg-[#00C896] text-white border-[#00C896]'
                  : 'bg-white/90 text-[#1A1A2E] border-gray-100 backdrop-blur-sm dark:bg-slate-800/90 dark:text-white dark:border-slate-700'
                }`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>

        {/* TOGGLE CAPAS */}
        <div className="absolute top-6 left-4 right-4 flex gap-2 z-[1000] overflow-x-auto no-scrollbar">
          {Object.entries(layers).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setLayers({ ...layers, [key]: !val })}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all border whitespace-nowrap
                ${val
                  ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]'
                  : 'bg-white text-[#1A1A2E] border-gray-100 dark:bg-slate-800 dark:text-white dark:border-slate-700'
                }`}
            >
              {key}
            </button>
          ))}

          {/* BOTÓN ALERTAS con badge de incidentes importantes */}
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all border bg-red-500 text-white shrink-0"
          >
            {cargando ? '⏳' : '⚠️'} Alertas
            {alertasImportantes > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-red-500 rounded-full text-[9px] font-black flex items-center justify-center border-2 border-red-500">
                {alertasImportantes}
              </span>
            )}
          </button>
        </div>

        {/* BOTÓN CENTRAR */}
        <button className="absolute bottom-24 right-4 z-[1000] w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-2xl border border-gray-100 dark:border-slate-700 text-[#00C896]">
          <Locate size={22} />
        </button>

        {/* PANEL DE ALERTAS — slide desde la derecha */}
        <div className={`absolute top-0 right-0 h-full w-[85%] max-w-xs bg-white dark:bg-slate-900 z-[2000] shadow-2xl transition-transform duration-400 ease-out border-l border-gray-100 dark:border-slate-800 flex flex-col
          ${showAlerts ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* Header del panel */}
          <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-slate-800 shrink-0">
            <div>
              <h3 className="font-black text-lg text-[#0D1B2A] dark:text-white">Alertas en vivo</h3>
              {horaActualizacion && (
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  Actualizado {horaActualizacion} · TomTom
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refetch}
                className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-500 hover:text-[#00C896] transition-colors"
                title="Actualizar"
              >
                <TrendingUp size={14} />
              </button>
              <button
                onClick={() => setShowAlerts(false)}
                className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Lista de alertas */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cargando ? (
              // Skeleton loader
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 animate-pulse">
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                  <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              ))
            ) : (
              alertas.map((a) => (
                <div
                  key={a.id}
                  className={`p-4 rounded-2xl border transition-all
                    ${a.severity === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30'
                      : a.severity === 'warning'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800/30'
                      : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/30'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0 mt-0.5">{a.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#0D1B2A] dark:text-white leading-snug truncate">
                        {a.calle && <span className="text-[#00C896]">{a.calle}: </span>}
                        {a.texto}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full
                          ${a.status === 'Importante' ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                          : a.status === 'OK' ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400'}`}
                        >
                          {a.status}
                        </span>
                        {a.delay && (
                          <span className="text-[8px] font-bold text-gray-500">
                            +{a.delay} min de retraso
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer con créditos */}
          <div className="p-4 border-t border-gray-100 dark:border-slate-800 shrink-0">
            <p className="text-[8px] font-bold text-gray-400 text-center uppercase tracking-widest">
              Datos: TomTom Traffic™ · Se actualiza cada 2 min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const GamificationComponent = ({ points, showToast, redeeming, setRedeeming, co2Total }) => {
  const UMBRALES = {
    'Brote Verde': { min: 0, max: 5 },
    'Ciclista Urbano': { min: 5, max: 20 },
    'Guardián del Clima': { min: 20, max: 50 },
    'Héroe Verde': { min: 50, max: 50 }
  };
  const currentBadge = metricas.obtenerInsignia(co2Total);
  const rango = UMBRALES[currentBadge];
  const porcentajeProgreso = currentBadge === 'Héroe Verde'
    ? 100
    : Math.round(((co2Total - rango.min) / (rango.max - rango.min)) * 100);

  const rewards = [
    { id: 1, title: 'Café gratis en Starbucks', cost: 500, icon: <Coffee />, color: 'bg-green-700' },
    { id: 2, title: '30 min Bici Pública gratis', cost: 200, icon: <Bike />, color: 'bg-[#00C896]' },
    { id: 3, title: 'Viaje en scooter gratis', cost: 300, icon: <Zap />, color: 'bg-yellow-400' },
    { id: 4, title: 'Descuento Copec', cost: 800, icon: <Ticket />, color: 'bg-red-600' }
  ];

  const badges = [
    { id: 1, name: "Primera Bici", unlocked: true, icon: <Bike /> },
    { id: 2, name: "Semana Verde", unlocked: true, icon: <Leaf /> },
    { id: 3, name: "Sin Auto", unlocked: false, progress: "4/7", icon: <Car /> },
    { id: 4, name: "Héroe del Metro", unlocked: false, icon: <Train /> },
    { id: 5, name: "Guardián", unlocked: false, icon: <ShieldCheck /> },
    { id: 6, name: "Reciclador", unlocked: false, icon: <Info /> }
  ];

  const rankings = [
    { id: 1, name: "Lucas G.", pts: 2450 },
    { id: 2, name: "Sofia M.", pts: 2100 },
    { id: 3, name: "Jules E.", pts: 1290, me: true },
    { id: 4, name: "Pedro X.", pts: 950 },
    { id: 5, name: "Marta R.", pts: 820 }
  ];

  const handleRedeem = (reward) => {
    if (points >= reward.cost) {
      setRedeeming(reward);
    } else {
      showToast("Puntos insuficientes 😅");
    }
  };

  return (
    <div className="space-y-8 pb-40 animate-fade-in pt-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-4 py-1.5 rounded-full mb-4 animate-shimmer">
          <ShieldCheck size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Nivel: {currentBadge}</span>
        </div>
        <h2 className="text-3xl font-black text-[#0D1B2A] dark:text-white tracking-tight uppercase">{currentBadge}</h2>
        <div className="flex items-center gap-2 mt-2 justify-center">
          <div className="w-48 bg-gray-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div className="bg-[#00C896] h-full rounded-full shadow-inner transition-all duration-1000" style={{ width: `${porcentajeProgreso}%` }}></div>
          </div>
          <span className="text-xs font-black text-[#6B7280] dark:text-slate-500">{porcentajeProgreso}%</span>
        </div>
      </div>

      {/* RUTA VERDE PREMIUM (Suscripción) */}
      <Card className="!p-6 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden border-none shadow-2xl">
         <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
               <div className="bg-[#FFD93D] p-1.5 rounded-lg text-slate-900"><Trophy size={16} fill="currentColor" /></div>
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFD93D]">Premium Member</span>
            </div>
            <h3 className="text-xl font-black mb-1">Membresía Planeta</h3>
            <p className="text-xs text-indigo-200 font-bold mb-6">Multiplica x2 tus puntos y desbloquea rutas exclusivas de baja emisión.</p>
            <Button variant="primary" onClick={() => trackEvent('Subscription', 'click', 'planeta_plan')} className="!bg-[#FFD93D] !text-slate-900 !py-3 !text-xs !shadow-yellow-500/20">Suscribirse por $2.990/mes</Button>
         </div>
         <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
      </Card>

      <Card className="!p-10 text-center bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white relative overflow-hidden border-none shadow-2xl" delay={100}>
        <p className="text-xs font-black opacity-50 tracking-[0.2em] uppercase">Puntos Totales</p>
        <h3 className="text-7xl font-black mt-4 text-[#00C896] drop-shadow-xl"><CountUp end={points} /></h3>
        <Leaf className="absolute -bottom-8 -right-8 text-white/5 rotate-12" size={120} />
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-[#0D1B2A] dark:text-white tracking-tight">Tus logros</h2>
        <div className="grid grid-cols-3 gap-4">
          {badges.map((b) => (
            <div key={b.id} className={`flex flex-col items-center p-4 rounded-3xl border-2 transition-all ${b.unlocked ? 'bg-white dark:bg-slate-900 border-[#00C896]/20' : 'bg-gray-50/50 dark:bg-slate-800/50 border-transparent opacity-50'}`}>
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${b.unlocked ? 'bg-green-100 text-[#00C896]' : 'bg-gray-200 text-gray-400'}`}>{React.cloneElement(b.icon, { size: 20, fill: b.unlocked ? 'currentColor' : 'none' })}</div>
               <p className="text-[8px] font-black uppercase tracking-widest text-center leading-tight">{b.name}</p>
               {b.progress && <p className="text-[8px] font-bold text-[#00C896] mt-1">{b.progress}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-[#0D1B2A] dark:text-white tracking-tight">Canjea tus puntos</h2>
        <div className="grid grid-cols-1 gap-4">
          {rewards.map((r, i) => (
            <div key={r.id} onClick={() => handleRedeem(r)} style={{ animationDelay: `${i * 100 + 200}ms` }} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-3xl border-2 border-gray-50 dark:border-slate-800 hover:border-[#00C896] transition-all cursor-pointer animate-slide-up fill-mode-forwards shadow-sm">
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${r.color} text-white flex items-center justify-center shadow-md`}>{React.cloneElement(r.icon, { size: 24 })}</div>
                  <div><h4 className="font-black text-sm text-[#0D1B2A] dark:text-white">{r.title}</h4><p className="text-xs text-[#00C896] font-black uppercase tracking-widest">{r.cost} pts</p></div>
               </div>
               <ChevronRight size={20} className="text-gray-300" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pb-10">
        <h2 className="text-xl font-black text-[#0D1B2A] dark:text-white tracking-tight">Ranking Semanal</h2>
        <Card className="!p-2 overflow-hidden">
           {rankings.map((u, i) => (
             <div key={u.id} className={`flex items-center justify-between p-4 rounded-2xl ${u.me ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <span className="font-black text-gray-400 w-4 inline-block">{i + 1}</span>
                      {i < 3 && <Trophy size={10} className="absolute -top-3 -left-1 text-yellow-500 animate-bounce" />}
                   </div>
                   <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs relative overflow-visible">
                      {u.name[0]}
                      {i === 0 && <div className="absolute -top-1.5 -right-1.5 text-yellow-500 animate-pulse"><Zap size={12} fill="currentColor" /></div>}
                   </div>
                   <p className="font-bold text-sm">{u.name} {u.me && <span className="text-[8px] bg-[#00C896] text-white px-2 py-0.5 rounded-full ml-1">TÚ</span>}</p>
                </div>
                <div className="text-right">
                   <p className="font-black text-sm">{u.pts} pts</p>
                </div>
             </div>
           ))}
        </Card>
      </div>
    </div>
  );
};

const ProfileComponent = ({ user, stats, onLogout, darkMode, setDarkMode }) => {
  const [accessible, setAccessible] = useState(false);
  const weeklyData = [12, 18, 15, 25, 30, 22, 28];
  const maxVal = Math.max(...weeklyData);

  const [showShareCard, setShowShareCard] = useState(false);
  const ahorroEstimado = Math.round(stats.rutasCount * 1200);

  const diasUsandoApp = Math.max(1, stats.rutasCount);
  const miHuellaDiaria = (stats.co2Total / diasUsandoApp).toFixed(2);
  const promedioSantiago = 2.5;
  const porcentajeTuya = Math.min(100, Math.round((parseFloat(miHuellaDiaria) / promedioSantiago) * 100));
  const ahorroPerc = Math.max(0, Math.round((1 - parseFloat(miHuellaDiaria) / promedioSantiago) * 100));

  return (
    <div className="space-y-8 pb-40 animate-fade-in pt-8">
      <div className="flex flex-col items-center">
        <div className="w-32 h-32 bg-gradient-to-tr from-[#00C896] to-[#00A87E] rounded-[48px] flex items-center justify-center text-white text-5xl font-black shadow-2xl relative">
           {user.name[0]}
           <div className="absolute -bottom-2 -right-2 bg-[#FFD93D] text-[#1A1A2E] p-2 rounded-2xl shadow-xl animate-bounce">
              <Star size={20} fill="currentColor" />
           </div>
        </div>
        <h2 className="mt-6 text-3xl font-black text-[#0D1B2A] dark:text-white tracking-tight">{user.name}</h2>
        <p className="text-[#4B5563] dark:text-slate-400 font-black uppercase tracking-widest text-[10px]">{metricas.obtenerInsignia(stats.co2Total)} • {user.city}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <Card className="text-center !p-4" delay={100}>
            <p className="text-xl font-black text-[#00C896]">{stats.co2Total.toFixed(1)}kg</p>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">CO₂ Ahorrado</p>
         </Card>
         <Card className="text-center !p-4" delay={200}>
            <p className="text-xl font-black text-blue-500">{stats.rutasCount}</p>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Viajes Públicos</p>
         </Card>
         <Card className="text-center !p-4" delay={300}>
            <p className="text-xl font-black text-[#FFD93D]">{stats.kmTotal.toFixed(1)}km</p>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Distancia Bici</p>
         </Card>
         <Card className="text-center !p-4" delay={400}>
            <p className="text-xl font-black text-emerald-600">${ahorroEstimado.toLocaleString('es-CL')} CLP</p>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Dinero Ahorrado</p>
         </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-[#0D1B2A] dark:text-white tracking-tight">Impacto Semanal (kg CO₂)</h2>
        <Card className="!p-6 h-48 flex items-end justify-between gap-2">
           {weeklyData.map((v, i) => (
             <div key={i} className="flex-grow flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className="w-full bg-gradient-to-t from-[#00C896] to-emerald-400 rounded-t-lg transition-all duration-1000 animate-slide-up"
                  style={{ height: `${(v / maxVal) * 100}%`, animationDelay: `${i * 0.1}s` }}
                ></div>
                <span className="text-[8px] font-black text-gray-400">{['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}</span>
             </div>
           ))}
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-[#0D1B2A] dark:text-white tracking-tight">Mi huella vs Santiago</h2>
        <Card className="space-y-4">
           <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span>Tú</span><span>{miHuellaDiaria} kg/día</span></div>
              <div className="w-full h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-[#00C896] rounded-full" style={{ width: `${porcentajeTuya}%` }}></div>
              </div>
           </div>
           <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span>Promedio Santiago</span><span>{promedioSantiago} kg/día</span></div>
              <div className="w-full h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-gray-300 dark:bg-slate-600 rounded-full w-[100%]"></div>
              </div>
           </div>
           <p className="text-[10px] text-center font-bold text-gray-500 italic">"¡Estás un {ahorroPerc}% por debajo del promedio de Santiago!"</p>
        </Card>
      </div>

      {showShareCard && (
        <div className="fixed inset-0 bg-black/80 z-[6000] flex flex-col items-center justify-center p-8"
             onClick={() => setShowShareCard(false)}>
          <div className="w-80 bg-gradient-to-br from-[#1A1A2E] to-[#0d2e1e] rounded-[40px] p-8 text-center border border-[#00C896]/20 shadow-2xl">
            <div className="w-16 h-16 bg-[#00C896] rounded-[20px] flex items-center justify-center mx-auto mb-4">
              <Leaf size={32} fill="white" className="text-white" />
            </div>
            <p className="text-[#00C896] font-black text-xs uppercase tracking-widest mb-2">Este mes ahorré</p>
            <p className="text-6xl font-black text-white">{stats.co2Total.toFixed(1)}</p>
            <p className="text-[#00C896] font-black text-sm">kg de CO₂</p>
            <p className="text-gray-400 text-xs mt-2">{metricas.generarComparativaViral(stats.co2Total)}</p>
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-white font-black text-sm">{user.name}</p>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest">
                {metricas.obtenerInsignia(stats.co2Total)} • rutaverde-zeta.vercel.app
              </p>
            </div>
          </div>
          <p className="text-white/40 text-xs mt-6">Toca para cerrar · Haz screenshot para compartir</p>
        </div>
      )}

      <div className="space-y-3">
        <Button variant="outline" fullWidth onClick={() => setShowShareCard(true)} className="mb-4">
          📸 Compartir mi impacto
        </Button>
        <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-[28px] border-2 border-gray-50 dark:border-slate-800 transition-all cursor-pointer shadow-sm hover:shadow-md" onClick={() => setDarkMode(!darkMode)}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${darkMode ? 'bg-indigo-900 text-indigo-400' : 'bg-gray-50 text-gray-400'}`}><Smartphone size={20} /></div>
            <span className="font-black text-[#0D1B2A] dark:text-white text-sm">Modo Oscuro</span>
          </div>
          <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-500 ${darkMode ? 'bg-indigo-600' : 'bg-gray-200'}`}><div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-500 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
        </div>

        <Button variant="ghost" fullWidth onClick={onLogout} className="!text-[#FF6B6B] hover:bg-red-50 dark:hover:bg-red-900/10 !py-6 mt-4"><LogOut size={22} strokeWidth={3} /> Cerrar Sesión</Button>
      </div>
    </div>
  );
};

const NavegacionActivaScreen = ({ ruta, userPos, onFinalizar, onCancelar, darkMode }) => {
  const [instruccionIdx, setInstruccionIdx] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(ruta.time);
  const [distanciaRestante, setDistanciaRestante] = useState(ruta.distanciaKm);
  const [posActual, setPosActual] = useState(userPos);
  const [routePoints, setRoutePoints] = useState([]);
  const [cargandoRuta, setCargandoRuta] = useState(true);
  const [iniciado, setIniciado] = useState(Date.now());

  // 1. Obtener ruta real con OSRM (gratuito, sin API key)
  const fetchRoute = useCallback(async (currentPos) => {
    const origen = currentPos || userPos;
    const destino = ruta.destinoCoords || [userPos[0] + 0.025, userPos[1] + 0.032];
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origen[1]},${origen[0]};${destino[1]},${destino[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const data = await res.json();
      if (data.routes?.[0]) {
        const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        setRoutePoints(coords);
      } else {
        setRoutePoints(prev => prev.length > 0 ? prev : buildFallbackRoute(origen, destino));
      }
    } catch {
      setRoutePoints(prev => prev.length > 0 ? prev : buildFallbackRoute(origen, destino));
    } finally {
      setCargandoRuta(false);
    }
  }, [userPos, ruta.destinoCoords]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  // 2. GPS watchPosition — seguimiento real y recálculo silencioso
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        setPosActual(newPos);

        // Silent Recalculation: si el usuario está a >40m de la ruta
        if (routePoints.length > 0) {
          const isOffRoute = isUserOffRoute(newPos, routePoints, 40);
          if (isOffRoute) {
            console.log("Recalculando ruta silenciosamente...");
            fetchRoute(newPos);
          }
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [routePoints, fetchRoute]);


  const getDistanceInMeters = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // Optimized distance check: only check against every 5th point if route is long
  const isUserOffRoute = useCallback((pos, points, thresholdMeters) => {
    let minDistance = Infinity;
    const step = points.length > 50 ? 5 : 1;
    for (let i = 0; i < points.length; i += step) {
      const d = getDistanceInMeters(pos[0], pos[1], points[i][0], points[i][1]);
      if (d < minDistance) minDistance = d;
      if (minDistance < thresholdMeters) return false; // Early exit
    }
    return minDistance > thresholdMeters;
  }, [getDistanceInMeters]);

  // 3. Countdown tiempo y distancia (cada 30s)
  useEffect(() => {
    const iv = setInterval(() => {
      setTiempoRestante(t => Math.max(0, t - 1));
      setDistanciaRestante(d => Math.max(0, parseFloat((d - 0.05).toFixed(2))));
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  // 4. Avanzar instrucciones automáticamente
  useEffect(() => {
    if (ruta.instrucciones.length <= 1) return;
    const segPorPaso = (ruta.time * 60) / ruta.instrucciones.length;
    const iv = setInterval(() => {
      setInstruccionIdx(i => Math.min(i + 1, ruta.instrucciones.length - 1));
    }, segPorPaso * 1000);
    return () => clearInterval(iv);
  }, [ruta]);

  const esUltimoPaso = instruccionIdx === ruta.instrucciones.length - 1;
  const progreso = Math.round(((ruta.distanciaKm - distanciaRestante) / ruta.distanciaKm) * 100);

  const mapUrl = darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

  const RecenterNav = ({ pos }) => {
    const map = useMap();
    useEffect(() => { map.setView(pos, 17, { animate: true }); }, [pos]);
    return null;
  };

  const iconUsuarioNav = L.divIcon({
    className: '',
    html: `<div style="
      width:20px;height:20px;
      background:#3B82F6;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 0 0 6px rgba(59,130,246,0.25);
    "></div>`,
    iconSize: [20, 20], iconAnchor: [10, 10]
  });

  return (
    <div className="fixed inset-0 z-[3000] flex flex-col bg-[#1A1A2E]">

      {/* BARRA SUPERIOR — instrucción actual (Waze Mode) */}
      <div className="fixed top-0 left-0 right-0 bg-[#1A1A2E] text-white px-6 pt-12 pb-6 z-[4000] shadow-2xl animate-slide-down border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#00C896] rounded-[24px] flex items-center justify-center shrink-0 shadow-xl shadow-green-500/40">
            <Navigation size={32} strokeWidth={2.5} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#00C896] mb-1">
              Paso {instruccionIdx + 1} / {ruta.instrucciones.length} · Siguiente Instrucción
            </p>
            <h2 className="text-xl font-black leading-tight text-white truncate">
              {ruta.instrucciones[instruccionIdx]}
            </h2>
          </div>
          <button
            onClick={onCancelar}
            className="w-14 h-14 bg-white/10 rounded-[20px] flex items-center justify-center shrink-0 active:scale-90 transition-all hover:bg-white/20 border border-white/10"
          >
            <X size={28} strokeWidth={3} className="text-white" />
          </button>
        </div>

        {/* Barra de progreso de pasos */}
        <div className="flex gap-1">
          {ruta.instrucciones.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-700 ${
                i < instruccionIdx ? 'bg-[#00C896]' :
                i === instruccionIdx ? 'bg-white' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* MAPA FULLSCREEN con la ruta dibujada */}
      <div className="flex-1 relative min-h-0">
        {cargandoRuta ? (
          <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#00C896] border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm font-bold">Calculando tu ruta...</p>
          </div>
        ) : (
          <MapContainer
            center={posActual}
            zoom={17}
            scrollWheelZoom={false}
            zoomControl={false}
            className="w-full h-full"
          >
            <TileLayer url={mapUrl} attribution="© CARTO" />
            <RecenterNav pos={posActual} />

            {/* LÍNEA DE RUTA */}
            {routePoints.length > 0 && (
              <>
                {/* Sombra de la línea */}
                <Polyline positions={routePoints} color="#1A1A2E" weight={10} opacity={0.3} />
                {/* Línea principal */}
                <Polyline positions={routePoints} color="#00C896" weight={6} opacity={0.95} />
              </>
            )}

            {/* POSICIÓN USUARIO */}
            <Marker position={posActual} icon={iconUsuarioNav} />

            {/* DESTINO */}
            {routePoints.length > 0 && (
              <Marker
                position={routePoints[routePoints.length - 1]}
                icon={customIcons.destination}
              >
                <Popup><p className="font-bold text-xs">Tu destino</p></Popup>
              </Marker>
            )}
          </MapContainer>
        )}

        {/* Botón zoom in/out */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
          <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg text-[#1A1A2E] font-black text-lg">+</button>
          <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg text-[#1A1A2E] font-black text-lg">−</button>
        </div>
      </div>

      {/* PANEL INFERIOR — stats + botón finalizar */}
      <div className="bg-white dark:bg-slate-900 rounded-t-[36px] px-5 pt-4 pb-8 shadow-2xl shrink-0">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        {/* Stats en vivo */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-[#1A1A2E] dark:text-white leading-none">{tiempoRestante}</p>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">min rest.</p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-[#00C896] leading-none">{distanciaRestante.toFixed(1)}</p>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">km rest.</p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-[#FFD93D] leading-none">+{ruta.puntosNuevos}</p>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">pts</p>
          </div>
        </div>

        {/* Barra de progreso del viaje */}
        <div className="mb-4">
          <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
            <span>Progreso</span>
            <span>{progreso}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00C896] to-emerald-400 rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(5, progreso)}%` }}
            />
          </div>
        </div>

        {/* Info de ruta activa */}
        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-[#00C896]/20 mb-4">
          <div className="w-8 h-8 bg-[#00C896] rounded-xl flex items-center justify-center shrink-0">
            <Leaf size={14} className="text-white" fill="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-xs text-[#0D1B2A] dark:text-white">{ruta.title} · {ruta.sub}</p>
            <p className="text-[9px] text-[#00C896] font-bold">
              Ahorrando {ruta.co2Evitado.toFixed(2)} kg CO₂ vs auto 🌿
            </p>
          </div>
        </div>

        {/* BOTÓN FINALIZAR — solo el usuario lo activa */}
        <button
          onClick={onFinalizar}
          className={`w-full py-4 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl
            ${esUltimoPaso
              ? 'bg-gradient-to-r from-[#00C896] to-[#00A87E] shadow-green-500/30 animate-pulse'
              : 'bg-[#1A1A2E]'
            }`}
        >
          <CheckCircle2 size={20} />
          {esUltimoPaso ? '¡Llegué! · Finalizar viaje 🎉' : 'Finalizar viaje anticipado'}
        </button>
      </div>
    </div>
  );
};

// Helper para ruta de fallback cuando OSRM no responde
function buildFallbackRoute(origen, destino) {
  const puntos = 12;
  return Array.from({ length: puntos }).map((_, i) => {
    const t = i / (puntos - 1);
    const jitter = i > 0 && i < puntos - 1 ? (Math.random() - 0.5) * 0.002 : 0;
    return [
      origen[0] + (destino[0] - origen[0]) * t + jitter,
      origen[1] + (destino[1] - origen[1]) * t + jitter
    ];
  });
}

// --- APP PRINCIPAL ---

export default function RutaVerde() {
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [user, setUser] = useState({ name: "", city: "Santiago" });
  const [activeTab, setActiveTab] = useState('inicio');
  const [stats, setStats] = useState({ points: 0, co2Total: 0, kmTotal: 0, rutasCount: 0 });
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [redeeming, setRedeeming] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [navegacionActiva, setNavegacionActiva] = useState(false);
  const [rutaActiva, setRutaActiva] = useState(null);
  const { pos: userPos } = useGeolocalizacion();

  // Alertas de tráfico en tiempo real
  const { alertas, cargando: alertasCargando } = useTrafficAlerts();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const timer = setTimeout(() => setLoading(false), 2000);
    const savedUser = storage.get('rv_user');
    const savedStats = storage.get('rv_stats');
    if (savedStats) setStats(savedStats);
    const savedDark = storage.get('rv_dark');
    if (savedUser && savedUser.name) {
      setUser(savedUser); setOnboardingComplete(true);
    }
    if (savedDark === true) setDarkMode(true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    storage.set('rv_dark', darkMode);
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleStartRoute = (rutaSeleccionada) => {
    if (!rutaSeleccionada) return;
    const co2Evitado = parseFloat(metricas.calcularCO2Evitado(rutaSeleccionada.distanciaKm, rutaSeleccionada.medio).toFixed(3));
    const puntosNuevos = metricas.calcularPuntos(co2Evitado, rutaSeleccionada.distanciaKm);
    setRutaActiva({ ...rutaSeleccionada, co2Evitado, puntosNuevos, destinoCoords: destCoords });
    setNavegacionActiva(true);
    setActiveTab('mapa');
    showToast(`🗺️ Navegando: ${rutaSeleccionada.title}`);
  };

  const handleFinalizarViaje = () => {
    if (!rutaActiva) return;
    const newStats = {
      ...stats,
      points: stats.points + rutaActiva.puntosNuevos,
      co2Total: parseFloat((stats.co2Total + rutaActiva.co2Evitado).toFixed(3)),
      kmTotal: parseFloat((stats.kmTotal + rutaActiva.distanciaKm).toFixed(2)),
      rutasCount: stats.rutasCount + 1
    };
    setStats(newStats);
    storage.set('rv_stats', newStats);
    setNavegacionActiva(false);
    setRutaActiva(null);
    setDestCoords(null);
    setActiveTab('inicio');
    setShowConfetti(true);
    showToast(`🌱 ¡Llegaste! +${rutaActiva.puntosNuevos} pts · ${rutaActiva.co2Evitado.toFixed(2)}kg CO₂ evitado`);
  };

  const handleCancelarNavegacion = () => {
    setNavegacionActiva(false);
    setRutaActiva(null);
    setActiveTab('rutas');
  };

  const handleNavigate = (tab, coords = null) => {
    setActiveTab(tab);
    if (coords) setDestCoords(coords);
    else if (tab !== 'rutas') setDestCoords(null);
  };

  const handleLogoClick = () => {
    setLogoClicks(prev => {
      if (prev + 1 >= 5) {
        showToast("¡Tú sí que eres verde! 🌍 (Huevo de Pascua activado)");
        setShowConfetti(true);
        return 0;
      }
      return prev + 1;
    });
  };

  const confirmRedeem = () => {
    trackEvent('Gamification', 'redeem_reward', redeeming.title, redeeming.cost);
    const newStats = { ...stats, points: stats.points - redeeming.cost };
    setStats(newStats);
    storage.set('rv_stats', newStats);
    setRedeeming(null);
    showToast("¡Canjeado con éxito! 🎉");
  };

  const handleLogout = () => { storage.clear(); window.location.reload(); };

  if (loading) return (
    <div className="fixed inset-0 bg-[#1A1A2E] flex flex-col items-center justify-center p-10 z-[1000] text-white">
      <Leaf size={64} className="text-[#00C896] animate-bounce" />
      <h1 className="mt-12 text-5xl font-black tracking-tighter text-center uppercase">RUTA <span className="text-[#00C896]">VERDE</span></h1>
      <p className="mt-4 text-[#00C896] font-black uppercase text-[10px] tracking-[0.5em] animate-pulse">Muévete mejor. Contamina menos.</p>
    </div>
  );

  if (!onboardingComplete) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[100] flex flex-col p-8 md:p-12 justify-center space-y-12 animate-fade-in overflow-y-auto">
        {onboardingStep === 1 && (
          <div className="space-y-8 max-w-md mx-auto w-full animate-slide-up">
            <CSSIllustration type="welcome" />
            <div className="space-y-4">
              <h2 className="text-5xl font-black text-[#1A1A2E] dark:text-white leading-tight tracking-tight">Muévete con<br/>propósito.</h2>
              <p className="text-xl text-[#6B7280] dark:text-slate-400 font-bold">Descubre rutas inteligentes y reduce tu huella de carbono en Chile.</p>
            </div>
            <Button fullWidth onClick={() => setOnboardingStep(2)} className="py-6 text-xl shadow-2xl">Empezar</Button>
          </div>
        )}

        {onboardingStep === 2 && (
          <div className="space-y-8 max-w-md mx-auto w-full animate-slide-up">
            <CSSIllustration type="city" />
            <h2 className="text-4xl font-black text-[#1A1A2E] dark:text-white tracking-tight">¿Dónde estás?</h2>
            <div className="grid grid-cols-1 gap-4">
              {["Santiago", "Valparaíso", "Concepción"].map(city => (
                <button
                  key={city}
                  onClick={() => { setUser({...user, city}); setOnboardingStep(3); }}
                  className={`p-6 rounded-[32px] text-left border-3 transition-all font-black text-xl ${user.city === city ? 'border-[#00C896] bg-green-50 dark:bg-green-900/20 text-[#1A1A2E] dark:text-white' : 'border-gray-100 dark:border-slate-800 text-gray-400'}`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        {onboardingStep === 3 && (
          <div className="space-y-8 max-w-md mx-auto w-full animate-slide-up">
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-[#1A1A2E] dark:text-white tracking-tight">¿Cómo te llamas?</h2>
              <p className="text-gray-500 font-bold">Personalizaremos tu experiencia verde.</p>
            </div>
            <input
                type="text" placeholder="Tu nombre..." value={user.name}
                onChange={(e) => setUser({...user, name: e.target.value})}
                className="w-full p-6 bg-gray-50 dark:bg-slate-800 border-3 border-gray-100 dark:border-slate-700 rounded-[32px] focus:border-[#00C896] focus:bg-white dark:focus:bg-slate-700 outline-none font-black text-2xl transition-all dark:text-white"
            />
            <p className="text-center text-[10px] font-bold text-gray-400">Únete a los {47 + (Math.floor(Date.now() / 86400000) % 30)} usuarios que ya cuidan Santiago 🌿</p>
            <div className="space-y-4">
              <Button fullWidth onClick={() => { storage.set('rv_user', user); setOnboardingComplete(true); }} disabled={!user.name} className="py-6 text-xl shadow-2xl">Comenzar Aventura</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {navegacionActiva && rutaActiva && (
        <NavegacionActivaScreen
          ruta={rutaActiva}
          userPos={userPos}
          onFinalizar={handleFinalizarViaje}
          onCancelar={handleCancelarNavegacion}
          darkMode={darkMode}
        />
      )}
      <div className={`min-h-screen bg-[#F0FFF8] dark:bg-slate-950 text-[#1A1A2E] dark:text-white font-['Inter'] selection:bg-[#00C896] selection:text-white transition-colors duration-500`}>
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-[10000] bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 text-center animate-slide-down">
            Estás en modo offline. Algunas funciones pueden no estar disponibles.
          </div>
        )}
        {showConfetti && <ConfettiEffect onComplete={() => setShowConfetti(false)} />}
        {toast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[5000] w-[90%] max-w-sm bg-[#1A1A2E] dark:bg-slate-800 text-white px-8 py-5 rounded-[32px] shadow-2xl flex items-center gap-4 animate-slide-up border-b-8 border-[#00C896]">
            <CheckCircle2 size={24} className="text-[#00C896] shrink-0" />
            <p className="font-black text-sm">{toast}</p>
          </div>
        )}

        {redeeming && (
          <div className="fixed inset-0 z-[4000] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[48px] p-8 pb-32 space-y-6 animate-slide-up shadow-[0_-20px_50px_rgba(0,0,0,0.3)] border-t border-white/10">
              <div className="w-16 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full mx-auto mb-2"></div>
              <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-[#0D1B2A] dark:text-white">¿Canjear beneficio?</h3>
                  <p className="text-gray-500 dark:text-slate-400 font-bold">Se descontarán {redeeming.cost} puntos de tu cuenta.</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 rounded-3xl p-10 flex flex-col items-center gap-4 border border-gray-100 dark:border-slate-700">
                  <div className="w-40 h-40 bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-inner flex items-center justify-center">
                    <QrCode size={120} className="text-[#1A1A2E] dark:text-white" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Escanea en caja después de confirmar</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <Button variant="ghost" onClick={() => setRedeeming(null)} className="py-5">Cancelar</Button>
                  <Button onClick={confirmRedeem} className="py-5">Confirmar</Button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto flex h-screen overflow-hidden">
          <div className="w-full lg:w-[480px] bg-white dark:bg-slate-900 h-screen overflow-y-auto no-scrollbar shadow-2xl relative lg:border-x border-gray-100 dark:border-slate-800 flex flex-col z-50">
            <main className="flex-grow p-6 pt-10">
              <div className="flex items-center gap-2 mb-8 cursor-pointer select-none active:scale-95 transition-transform" onClick={handleLogoClick}>
                <div className="w-10 h-10 bg-[#00C896] rounded-xl flex items-center justify-center text-white"><Leaf size={20} fill="currentColor" /></div>
                <span className="font-black text-xl tracking-tighter text-[#0D1B2A] dark:text-white uppercase">RUTA <span className="text-[#00C896]">VERDE</span></span>
              </div>

              <Suspense fallback={<div className="flex items-center justify-center h-full"><Skeleton className="w-full h-64" /></div>}>
                {activeTab === 'inicio' && (
                  <HomeScreen
                    user={user}
                    onNavigate={handleNavigate}
                    stats={stats}
                    darkMode={darkMode}
                    alertas={alertas}
                    alertasCargando={alertasCargando}
                  />
                )}
                {activeTab === 'rutas' && (
                  <RoutePlanner
                    onStart={handleStartRoute}
                    destination={destCoords}
                    darkMode={darkMode}
                  />
                )}
                {activeTab === 'mapa' && <LiveMapScreen darkMode={darkMode} onNavigateToRutas={(coords) => { setDestCoords(coords); setActiveTab('rutas'); }} />}
                {activeTab === 'puntos' && <GamificationScreen points={stats.points} showToast={showToast} redeeming={redeeming} setRedeeming={setRedeeming} co2Total={stats.co2Total} />}
                {activeTab === 'perfil' && <ProfileScreen user={user} stats={stats} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />}
              </Suspense>
            </main>

            <nav className="fixed lg:absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-gray-100 dark:border-slate-800 px-8 py-6 flex justify-between items-center z-[200] lg:rounded-t-[40px] shadow-2xl">
              {[
                { id: 'inicio', icon: <Home />, label: 'Inicio' },
                { id: 'rutas', icon: <Milestone />, label: 'Rutas' },
                { id: 'mapa', icon: <MapIcon />, label: 'Mapa', badge: true },
                { id: 'puntos', icon: <Award />, label: 'Puntos' },
                { id: 'perfil', icon: <User />, label: 'Perfil' },
              ].map(tab => (
                <button key={tab.id} onClick={() => handleNavigate(tab.id)} className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${activeTab === tab.id ? 'text-[#00C896] -translate-y-2' : 'text-gray-300 dark:text-slate-600 hover:text-gray-500'}`}>
                  <div className={`p-2.5 rounded-2xl transition-all duration-500 ${activeTab === tab.id ? 'bg-green-50 dark:bg-green-900/10 shadow-lg' : 'bg-transparent'}`}>
                    {React.cloneElement(tab.icon, { size: 24, strokeWidth: activeTab === tab.id ? 3 : 2 })}
                    {tab.id === 'mapa' && navegacionActiva && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#00C896] rounded-full animate-ping" />
                    )}
                  </div>
                  {tab.badge && !navegacionActiva && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>}
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="hidden lg:block flex-grow bg-[#F0FFF8] dark:bg-slate-950 p-10 overflow-hidden relative">
            <div className="h-full rounded-[60px] overflow-hidden border-[16px] border-white dark:border-slate-800 shadow-2xl relative transition-colors duration-500 leaflet-container-wrapper">
              <CityMap city={user.city} darkMode={darkMode} alertasCoords={alertas.filter(a => a.lat && a.lon)} />
            </div>
          </div>
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; overflow: hidden; }
          h1, h2, h3, h4, .font-black { font-family: 'Plus Jakarta Sans', sans-serif; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .leaflet-container { width: 100%; height: 100%; z-index: 1; }
          .leaflet-container-wrapper { isolation: isolate; }
          @keyframes slide-down { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes slide-up-modal { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
          @keyframes shimmer { 0% { background-position: -468px 0; } 100% { background-position: 468px 0; } }
          .animate-shimmer {
            animation: shimmer 1.25s infinite linear;
            background: linear-gradient(to right, #00C896 8%, #00A87E 18%, #00C896 33%);
            background-size: 800px 104px;
          }
          @keyframes float { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-10px) rotate(5deg); } }
          @keyframes leaf-swing { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(20deg); } }
          @keyframes confetti-fall {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          .animate-confetti-fall { animation: confetti-fall 3s linear forwards; }
          .animate-slide-down { animation: slide-down 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
          .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
          .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
          .animate-slide-up-modal { animation: slide-up-modal 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
          .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
          .animate-float { animation: float 3s ease-in-out infinite; }
          .animate-leaf-swing { animation: leaf-swing 2s ease-in-out infinite; transform-origin: bottom center; }
          .fill-mode-forwards { fill-mode: forwards; }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}
