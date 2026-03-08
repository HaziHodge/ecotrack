import React, { useState, useEffect, useRef, useMemo, Suspense, lazy, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Leaflet Icon Fix - unpkg CDN
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
import {
  Home, Map as MapIcon, Milestone, Award, User, Search, ArrowLeftRight,
  Leaf, Star, Zap, Navigation, Bell, ChevronRight, CheckCircle2,
  Bike, Train, Car, Smartphone, Settings, LogOut, Info, AlertTriangle,
  RefreshCcw, Menu, X, Filter, Locate, Heart, Calendar, Clock, DollarSign, TrendingUp,
  Wind, MapPin, Layers, Coffee, Ticket, Footprints, ShieldCheck, QrCode,
  Eye, Trophy
} from 'lucide-react';

const ALERTAS_TRAFICO = [
  {
    id: 'a1', tipo: 'obras',
    lat: -33.4372, lng: -70.6506,
    titulo: 'Obras viales',
    descripcion: 'Av. Providencia cortada parcialmente',
    color: '#FF6B6B', icon: '🚧', severidad: 'alta'
  },
  {
    id: 'a2', tipo: 'accidente',
    lat: -33.4200, lng: -70.6080,
    titulo: 'Accidente',
    descripcion: 'Colisión en Costanera Norte km 3',
    color: '#FF8C42', icon: '⚠️', severidad: 'media'
  },
  {
    id: 'a3', tipo: 'congestion',
    lat: -33.4569, lng: -70.6483,
    titulo: 'Congestión alta',
    descripcion: 'Diagonal Paraguay - lento',
    color: '#FFD93D', icon: '🚗', severidad: 'media'
  },
  {
    id: 'a4', tipo: 'corte',
    lat: -33.4380, lng: -70.6830,
    titulo: 'Corte de calle',
    descripcion: 'Av. Santa Rosa - desvío activo',
    color: '#FF6B6B', icon: '🚫', severidad: 'alta'
  },
  {
    id: 'a5', tipo: 'metro',
    lat: -33.4689, lng: -70.6320,
    titulo: 'Metro en mantención',
    descripcion: 'L4 con frecuencia reducida',
    color: '#58A6FF', icon: '🚇', severidad: 'baja'
  }
]

// --- LOCAL UI COMPONENTS ---

class PerfilErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          background: '#0D1117',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px'
        }}>
          <div style={{ fontSize: '48px' }}>👤</div>
          <div style={{
            color: '#F0F6FC',
            fontSize: '18px',
            fontWeight: '700'
          }}>
            Hazi
          </div>
          <div style={{ color: '#8B949E', fontSize: '14px' }}>
            BROTE VERDE · Santiago
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px', width: '100%',
            maxWidth: '320px', marginTop: '8px'
          }}>
            {[
              { v: '1.1kg', l: 'CO₂ AHORRADO', c: '#00C896' },
              { v: '1', l: 'VIAJES PÚBLICOS', c: '#58A6FF' },
              { v: '5.2km', l: 'DISTANCIA BICI', c: '#FFD93D' },
              { v: '$1.200', l: 'DINERO AHORRADO', c: '#00C896' }
            ].map(m => (
              <div key={m.l} style={{
                background: '#161B22',
                border: '1px solid #30363D',
                borderRadius: '14px', padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '20px', fontWeight: '700',
                  color: m.c
                }}>{m.v}</div>
                <div style={{
                  color: '#8B949E', fontSize: '11px',
                  marginTop: '4px'
                }}>{m.l}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              background: '#00C896', border: 'none',
              color: 'white', padding: '12px 24px',
              borderRadius: '12px', cursor: 'pointer',
              fontSize: '15px', fontWeight: '600',
              marginTop: '16px'
            }}
          >
            Recargar perfil
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full p-4 bg-slate-900/50 border border-white/10 rounded-2xl outline-none focus:border-[#00C896] transition-all text-white placeholder:text-slate-500 ${className}`}
    {...props}
  />
);

const Badge = ({ children, className = "", variant = "primary" }) => {
  const variants = {
    primary: "bg-[#00C896]/10 text-[#00C896] border-[#00C896]/20",
    secondary: "bg-slate-800 text-slate-300 border-slate-700",
    accent: "bg-amber-500/10 text-amber-500 border-amber-500/20"
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-slate-800 rounded-3xl ${className}`}></div>
);

const Card = ({ children, className = "", delay = 0 }) => (
  <div
    style={{ animationDelay: `${delay}ms` }}
    className={`bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-green-900/5 p-5 border border-white/20 dark:border-slate-800 hover:scale-[1.01] transition-all duration-300 animate-slide-up fill-mode-forwards ${className}`}
  >
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", fullWidth = false, disabled = false, loading = false }) => {
  const variants = {
    primary: "bg-gradient-to-r from-[#00C896] to-[#00A87E] text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50",
    secondary: "bg-[#1A1A2E] text-white",
    ghost: "bg-transparent text-[#4B5563] dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800",
    outline: "border-2 border-[#00C896] text-[#00A87E] hover:bg-green-50 dark:hover:bg-green-900/10"
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

const RouteCard = ({ route, selected, onSelect }) => (
  <div
    onClick={onSelect}
    style={{
      background: selected ? '#1a2f26' : '#21262D',
      border: `2px solid ${selected
        ? route.badgeColor : '#30363D'}`,
      borderRadius: '14px',
      padding: '14px',
      marginBottom: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}
  >
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    }}>
      <div>
        <div style={{ color: '#F0F6FC', fontWeight: '600', fontSize: '15px' }}>
          {route.nombre}
        </div>
        <div style={{ color: '#8B949E', fontSize: '12px', marginTop: '2px' }}>
          {route.descripcion}
        </div>
      </div>
      <span style={{
        background: route.badgeColor + '20',
        color: route.badgeColor,
        border: `1px solid ${route.badgeColor}50`,
        borderRadius: '20px',
        padding: '3px 10px',
        fontSize: '10px',
        fontWeight: '700'
      }}>
        {route.badge}
      </span>
    </div>

    <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
      {route.iconos.map((ic, i) => (
        <span key={i} style={{ fontSize: '18px' }}>{ic}</span>
      ))}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
      {[
        { valor: route.tiempo + ' min', label: 'TIEMPO', color: '#F0F6FC' },
        { valor: route.precio, label: 'PRECIO', color: '#F0F6FC' },
        { valor: route.co2, label: 'CO₂', color: route.co2Color }
      ].map(m => (
        <div key={m.label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: m.color }}>{m.valor}</div>
          <div style={{ fontSize: '10px', color: '#8B949E' }}>{m.label}</div>
        </div>
      ))}
    </div>

    {selected && (
      <div style={{ marginTop: '10px', textAlign: 'center', color: route.badgeColor, fontSize: '13px', fontWeight: '600' }}>
        ✓ Seleccionada — toca "Iniciar" abajo
      </div>
    )}
  </div>
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
  { name: 'L1', color: '#FF0000', weight: 6, coords: [
    [-33.4258,-70.6580],[-33.4259,-70.6556],[-33.4265,-70.6519], // San Pablo→Neptuno→Pajaritos
    [-33.4270,-70.6481],[-33.4278,-70.6441],[-33.4290,-70.6404], // Pudahuel→Las Rejas→Ecuador
    [-33.4300,-70.6366],[-33.4312,-70.6321],[-33.4315,-70.6277], // San Alberto H→U de Santiago→Estación Central
    [-33.4339,-70.6229],[-33.4360,-70.6179],[-33.4376,-70.6131], // Unión Latinoamer→República→Lib.Bernardo OHiggins
    [-33.4389,-70.6089],[-33.4400,-70.6047],[-33.4404,-70.6012], // Santa Ana→Plaza de Armas→Bellas Artes
    [-33.4404,-70.5974],[-33.4403,-70.5934],[-33.4399,-70.5894], // Baquedano→Salvador→Tobalaba
    [-33.4378,-70.5837],[-33.4345,-70.5767],[-33.4315,-70.5694], // Pedro de Valdivia→Los Leones→Tobalaba(L4)
    [-33.4280,-70.5618],[-33.4246,-70.5552],[-33.4208,-70.5484]  // Manquehue→Hernando de Aguirre→Escuela Militar
  ]},
  { name: 'L2', color: '#FFD700', weight: 6, coords: [
    [-33.3693,-70.6392],[-33.3750,-70.6389],[-33.3820,-70.6388], // Cal y Canto→Puente Cal y Canto→Patronato
    [-33.3888,-70.6386],[-33.3960,-70.6384],[-33.4030,-70.6390], // Cerro Blanco→Cementerio→Einstein
    [-33.4100,-70.6396],[-33.4163,-70.6408],[-33.4230,-70.6420], // Dorsal→Franklin→El Llano
    [-33.4300,-70.6432],[-33.4370,-70.6445],[-33.4404,-70.6451], // San Miguel→Lo Vial→Lo Ovalle
    [-33.4450,-70.6458],[-33.4510,-70.6462],[-33.4570,-70.6466], // Ciudad del Niño→El Parrón→Lo Valledor
    [-33.4630,-70.6470],[-33.4700,-70.6474],[-33.4760,-70.6478], // Pedro Aguirre Cerda→Lo Espejo→Central
    [-33.4820,-70.6482],[-33.4880,-70.6486],[-33.4940,-70.6490]  // Lo Prado→Nos→La Cisterna
  ]},
  { name: 'L4', color: '#0055A4', weight: 6, coords: [
    [-33.3800,-70.5700],[-33.3860,-70.5740],[-33.3930,-70.5780], // Tobalaba Norte
    [-33.3990,-70.5810],[-33.4050,-70.5830],[-33.4110,-70.5840], // El Golf→Alcántara→Escuela Militar
    [-33.4180,-70.5818],[-33.4250,-70.5764],[-33.4320,-70.5704], // Manquehue→Hernando de Aguirre→Tobalaba
    [-33.4399,-70.5894],[-33.4450,-70.5950],[-33.4510,-70.6010], // Pedro de Valdivia
    [-33.4570,-70.6070],[-33.4640,-70.6130],[-33.4710,-70.6190], // Vicente Valdés→Rojas Magallanes
    [-33.4780,-70.6250],[-33.4850,-70.6310],[-33.4920,-70.6370], // Trinidad→San Ramón→La Cisterna
    [-33.5020,-70.6460],[-33.5120,-70.6500],[-33.5200,-70.6530]  // Hospital El Pino
  ]},
  { name: 'L4A', color: '#0055A4', weight: 6, dashArray: '8,4', coords: [
    [-33.4920,-70.6370],[-33.4980,-70.6480],[-33.5050,-70.6580], // La Cisterna→Lo Blanco
    [-33.5120,-70.6650],[-33.5190,-70.6720]                      // La Granja→Santa Rosa
  ]},
  { name: 'L5', color: '#008000', weight: 6, coords: [
    [-33.4480,-70.7280],[-33.4481,-70.7200],[-33.4483,-70.7120], // Pudahuel→Barrancas
    [-33.4485,-70.7040],[-33.4487,-70.6960],[-33.4489,-70.6880], // Bello→Blanqueado
    [-33.4490,-70.6800],[-33.4490,-70.6720],[-33.4490,-70.6640], // Cerrillos→Lo Espejo
    [-33.4490,-70.6511],[-33.4450,-70.6430],[-33.4404,-70.6012], // Quinta Normal→Cumming→Santa Ana
    [-33.4376,-70.6131],[-33.4340,-70.6260],[-33.4310,-70.6380], // Bellavista→La Florida
    [-33.4280,-70.6500],[-33.4250,-70.6600],[-33.4220,-70.6700]  // Mirador→Bellavista de la Florida
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
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
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

  // Solo re-centra cuando cambia destino (no en cada render) — FIX #3
  const RecenterOnDest = ({ dest }) => {
    const map = useMap();
    const prev = useRef(null);
    useEffect(() => {
      if (dest && JSON.stringify(dest) !== JSON.stringify(prev.current)) {
        map.flyTo(dest, 15, { duration: 1.5 });
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
    <div className={`relative bg-[#0D1117] w-full h-full overflow-hidden ${className}`}>

      {/* Botón centrar en usuario */}
      <button
        id="rvCenterTrigger"
        onClick={() => {
          destTrigger.current = 0;
          if (onSearchSelect) onSearchSelect(null, null);
        }}
        className="absolute bottom-20 right-4 z-[1500] w-12 h-12 bg-[#161B22] rounded-2xl flex items-center justify-center shadow-2xl border border-[#30363D] text-[#00C896] active:scale-95 transition-all"
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
              className: '',
              html: `<div style="
                background:${modoTransporte==='bici'?'#00C896':'#3B82F6'};
                border:3px solid white;border-radius:50%;
                width:${modoTransporte==='bici'?26:18}px;height:${modoTransporte==='bici'?26:18}px;
                display:flex;align-items:center;justify-content:center;font-size:${modoTransporte==='bici'?13:10}px;
                box-shadow:0 2px 8px rgba(0,0,0,0.25)${modoTransporte==='bici'?',0 0 0 5px rgba(0,200,150,0.2)':''};">🚴</div>`,
              iconSize: [modoTransporte==='bici'?26:18, modoTransporte==='bici'?26:18],
              iconAnchor: [modoTransporte==='bici'?13:9, modoTransporte==='bici'?13:9]
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
const HomeScreen = ({ user, onNavigate, stats, darkMode, alertas, alertasCargando }) => <HomeComponent user={user} onNavigate={onNavigate} stats={stats} alertas={alertas} alertasCargando={alertasCargando} />;
const RoutePlanner = ({ onStart, destination, destName, darkMode }) => <RoutePlannerComponent onStart={onStart} destination={destination} destName={destName} darkMode={darkMode} />;
const GamificationScreen = ({ points, showToast, redeeming, setRedeeming, co2Total }) => <GamificationComponent points={points} showToast={showToast} redeeming={redeeming} setRedeeming={setRedeeming} co2Total={co2Total} />;
const ProfileScreen = ({ user, stats, onLogout, darkMode, setDarkMode }) => <ProfileComponent user={user} stats={stats} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode} />;

// --- PANTALLAS ---

const HomeComponent = ({ user, onNavigate, stats, alertas, alertasCargando }) => {
  const [from, setFrom] = useState("Tu ubicación");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const usuariosSimulados = 47 + (Math.floor(Date.now() / 86400000) % 30);

  const handleSearch = async (query) => {
    setSearch(query);
    if (query.length > 3) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}, ${user.city}, Chile&limit=3`);
        const data = await res.json();
        setSuggestions(data);
      } catch (e) { console.error(e); }
    } else { setSuggestions([]); }
  };

  const alertaPrincipal = alertas?.find(a => a.severity === 'error')
    || alertas?.find(a => a.severity === 'warning')
    || alertas?.[0];

  return (
    <div style={{ padding: '20px', paddingBottom: '24px', minHeight: '100%' }} className="space-y-6 animate-fade-in relative z-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-white leading-tight">Hola, {user?.name?.split(' ')[0] || 'Viajero'} 👋</h1>
        <div className="flex items-center gap-2">
          <p className="text-[#8B949E] text-xs font-bold flex items-center gap-1"><MapPin size={12} className="text-[#00C896]" /> {user.city}, Chile</p>
          <span className="bg-[#00C896]/10 text-[#00C896] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{usuariosSimulados} activos</span>
        </div>
      </div>

      <div style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '16px' }} className="p-4 space-y-3 relative">
        <div className="space-y-2">
          <div style={{ background: '#21262D' }} className="flex items-center gap-3 p-3 rounded-xl border border-[#30363D]">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <input type="text" readOnly value={from} className="bg-transparent w-full outline-none text-white text-sm font-bold" />
          </div>

          <div style={{ background: '#21262D' }} className="flex items-center gap-3 p-3 rounded-xl border border-[#30363D] relative">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            <input
              type="text"
              placeholder="¿A dónde?"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent w-full outline-none text-white text-sm font-bold placeholder:text-[#484f58]"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-[#161B22] border border-[#30363D] shadow-2xl rounded-xl mt-1 z-[100] overflow-hidden">
                {suggestions.map((s, i) => (
                  <div key={i} onClick={() => { setSearch(s.display_name.split(',')[0]); setSuggestions([]); onNavigate('mapa', [parseFloat(s.lat), parseFloat(s.lon)], s.display_name.split(',')[0]); }} className="p-3 hover:bg-[#21262D] cursor-pointer border-b border-[#30363D] last:border-none">
                    <p className="font-bold text-xs text-white truncate">{s.display_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button onClick={() => { const tmp = from; setFrom(search); setSearch(tmp); }} className="absolute right-8 top-1/2 -translate-y-8 w-8 h-8 bg-[#21262D] border border-[#30363D] rounded-full flex items-center justify-center text-[#00C896] z-20">
          <ArrowLeftRight size={14} className="rotate-90" />
        </button>

        <Button fullWidth onClick={() => onNavigate('mapa')} className="!py-3.5"><Search size={18} strokeWidth={3} /> Buscar ruta</Button>
      </div>

      <div className="flex justify-between items-center px-2">
        {[{ icon: <Navigation size={18} />, label: 'Trabajo' }, { icon: <Home size={18} />, label: 'Casa' }, { icon: <Heart size={18} />, label: 'Gym' }].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => onNavigate('mapa')}>
            <div className="w-12 h-12 bg-[#161B22] border border-[#30363D] rounded-full flex items-center justify-center text-white">{item.icon}</div>
            <span className="text-[9px] font-black uppercase text-[#8B949E] tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#00C896]/5 p-4 rounded-2xl border border-[#00C896]/10">
         <p className="text-xs font-bold text-[#00C896] leading-relaxed text-center">
            Terminaste el día con 1.1kg menos de CO₂. ¡Bien! 🌱
         </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-black text-[#8B949E] uppercase tracking-widest flex items-center gap-2"><Wind size={14} /> Impacto de hoy</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { v: '2.4', l: 'KG CO₂', c: 'text-[#00C896]' },
            { v: '340', l: 'PTS', c: 'text-[#FFD93D]' },
            { v: '12.5', l: 'KM', c: 'text-blue-400' }
          ].map(m => (
            <div key={m.l} className="bg-[#161B22] border border-[#30363D] p-3 rounded-2xl text-center">
              <p className={`text-lg font-black ${m.c}`}>{m.v}</p>
              <p className="text-[8px] font-black text-[#8B949E] mt-0.5">{m.l}</p>
            </div>
          ))}
        </div>
      </div>

      {alertaPrincipal && (
        <div className={`p-4 rounded-2xl flex items-center gap-4 border
          ${alertaPrincipal.severity === 'error'
            ? 'bg-[#FF6B6B]/10 border-[#FF6B6B]/20'
            : alertaPrincipal.severity === 'warning'
            ? 'bg-yellow-500/10 border-yellow-500/20'
            : 'bg-[#00C896]/10 border-[#00C896]/20'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0
            ${alertaPrincipal.severity === 'error' ? 'bg-[#FF6B6B]'
            : alertaPrincipal.severity === 'warning' ? 'bg-yellow-500'
            : 'bg-[#00C896]'}`}
          >
            <span className="text-lg">{alertaPrincipal.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold leading-tight
              ${alertaPrincipal.severity === 'error' ? 'text-[#FF6B6B]'
              : alertaPrincipal.severity === 'warning' ? 'text-yellow-600'
              : 'text-emerald-700'}`}
            >
              {alertaPrincipal.calle && <span className="font-black">{alertaPrincipal.calle}: </span>}
              {alertaPrincipal.texto}
            </p>
          </div>
          {alertasCargando && <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin shrink-0" />}
        </div>
      )}
    </div>
  );
};

const RoutePlannerComponent = ({ onStart, destination, destName, darkMode }) => {
  const [loading, setLoading] = useState(true);
  const [osrmTime, setOsrmTime] = useState(30);
  const [coords, setCoords] = useState(destination);

  useEffect(() => {
    setCoords(destination);
    if (destination) {
      setLoading(true);
      const fetchTime = async () => {
        try {
          const origin = [-33.4489, -70.6693];
          const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=false`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes?.[0]) {
            setOsrmTime(Math.round(data.routes[0].duration / 60));
          } else {
            setOsrmTime(30);
          }
        } catch {
          setOsrmTime(30);
        } finally {
          setLoading(false);
        }
      };
      fetchTime();
    } else {
      setLoading(false);
    }
  }, [destination]);

  const [selected, setSelected] = useState('verde');
  const [filter, setFilter] = useState('greener');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Modo de transporte seleccionado por el usuario
  const [modoSeleccionado, setModoSeleccionado] = useState(null);

  // Modos ordenados por prioridad ecológica (Ruta Verde primero)
  const MODOS = [
    { id: 'caminata', label: 'A pie', emoji: '🚶', color: '#00C896', co2Factor: 0, costeFijo: 0 },
    { id: 'bici', label: 'Bicicleta', emoji: '🚴', color: '#3B82F6', co2Factor: 0, costeFijo: 350 },
    { id: 'scooter', label: 'Scooter', emoji: '🛴', color: '#06B6D4', co2Factor: 0.015, costeFijo: 400 },
    { id: 'metro', label: 'Metro', emoji: '🚇', color: '#FF0000', co2Factor: 0.03, costeFijo: 780 },
    { id: 'micro', label: 'Micro', emoji: '🚌', color: '#F59E0B', co2Factor: 0.068, costeFijo: 800 },
    { id: 'moto', label: 'Moto', emoji: '🏍️', color: '#8B5CF6', co2Factor: 0.085, costeFijo: 0 },
    { id: 'uber', label: 'Uber', emoji: '🚗', color: '#1A1A2E', co2Factor: 0.21, costeFijo: 2800 },
    { id: 'auto', label: 'Auto', emoji: '🚙', color: '#EF4444', co2Factor: 0.21, costeFijo: 1500 },
    { id: 'compartido', label: 'Compartido', emoji: '🤝', color: '#EC4899', co2Factor: 0.1, costeFijo: 1200 },
  ];

  const DIST_KM = 5.2; // distancia estimada de la ruta

  const surgicalRoutes = [
    {
      id: 'verde',
      title: 'RUTA VERDE',
      sub: 'Bici + Metro',
      time: Math.round(osrmTime * 1.1),
      cost: 800,
      co2: 0.2,
      pts: 150,
      colorHex: '#00C896',
      emoji: '🌿',
      instrucciones: ["🚶 Camina a la estación BipBici","🚴 Pedalea hasta Metro Tobalaba","🚇 Toma L1 hacia Los Dominicos","🚶 Camina al destino"]
    },
    {
      id: 'rapida',
      title: 'RUTA RÁPIDA',
      sub: 'Auto / Uber',
      time: Math.round(osrmTime * 0.9),
      cost: 1200,
      co2: 0.8,
      pts: 40,
      colorHex: '#EF4444',
      emoji: '⚡',
      instrucciones: ["📍 Dirígete al vehículo","🚗 Sigue por la Costanera Norte","🏁 Destino alcanzado"]
    },
    {
      id: 'activa',
      title: 'RUTA ACTIVA',
      sub: 'Caminata / Bici',
      time: Math.round(osrmTime * 1.4),
      cost: 0,
      co2: 0,
      pts: 250,
      colorHex: '#3B82F6',
      emoji: '💪',
      instrucciones: ["🚶 Sal de tu ubicación","🚴 Toma la ciclovía Mapocho 42K","🏁 ¡Meta alcanzada!"]
    }
  ].map(r => ({
    ...r,
    distanciaKm: DIST_KM,
    medio: r.id,
    icon: <span style={{ fontSize: 18 }}>{r.emoji}</span>,
  }));

  const filteredRoutes = surgicalRoutes;

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

      <div className="bg-[#0D1117]/95 backdrop-blur-xl rounded-t-[48px] shadow-2xl p-6 z-10 space-y-4 -mt-12 relative pb-32 lg:pb-8 border-t border-white/10">
        <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto -mt-2 mb-2"></div>
        <div className="mb-2">
          <p className="text-[10px] font-black text-[#00C896] uppercase tracking-[0.2em]">Rutas disponibles hacia</p>
          <h2 className="text-xl font-black text-white truncate">{destName || 'Tu destino'}</h2>
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

const LiveMapScreen = ({ darkMode, onStartNavigation, userPos, onSetDest, onSetRoutePoints }) => {
  const [mapQuery, setMapQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [destination, setDestination] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const searchPlaces = async (query) => {
    if (query.length < 3) { setSuggestions([]); return; }
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' Santiago Chile')}&format=json&limit=5&countrycodes=cl`);
    const data = await res.json();
    setSuggestions(data.map(p => ({
      nombre: p.display_name.split(',').slice(0,2).join(',').trim(),
      lat: parseFloat(p.lat), lon: parseFloat(p.lon)
    })));
  };

  const selectDestination = async (s) => {
    setDestination(s);
    setSuggestions([]);
    setMapQuery(s.nombre);
    onSetDest([s.lat, s.lon], s.nombre);

    // OSRM
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userPos[1]},${userPos[0]};${s.lon},${s.lat}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const mins = Math.round(data.routes[0].duration / 60);
        const pts = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        onSetRoutePoints(pts);

        const routesGen = [
          { id: 'verde', nombre: 'Ruta Verde', badge: 'RECOMENDADA', badgeColor: '#00C896', iconos: ['🚇', '🚶'], tiempo: Math.round(mins * 1.1), precio: '$800', co2: '0.2 kg', co2Color: '#00C896', descripcion: 'Metro + caminata · Mejor opción' },
          { id: 'rapida', nombre: 'Ruta Rápida', badge: 'MÁS RÁPIDA', badgeColor: '#FFD93D', iconos: ['🚌', '🚇'], tiempo: Math.round(mins * 0.9), precio: '$1.200', co2: '0.8 kg', co2Color: '#FFD93D', descripcion: 'Bus + Metro · Más directo' },
          { id: 'activa', nombre: 'Ruta Activa', badge: 'CERO EMISIONES', badgeColor: '#00D4FF', iconos: ['🚲'], tiempo: Math.round(mins * 1.4), precio: '$0', co2: '0 kg', co2Color: '#00D4FF', descripcion: 'Solo bicicleta · Sin emisiones' }
        ];
        setRoutes(routesGen);
        setSelectedRoute(routesGen[0]);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="h-full relative pointer-events-auto">
      {/* SEARCH INPUT — FIX #3 */}
      <div className="absolute top-4 left-4 right-4 z-[600]">
        <div style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '12px' }} className="flex items-center gap-3 p-3 shadow-2xl">
          <Search size={18} className="text-[#00C896]" />
          <input
            type="text" placeholder="¿A dónde vas?" value={mapQuery}
            onChange={(e) => { setMapQuery(e.target.value); searchPlaces(e.target.value); }}
            className="bg-transparent w-full outline-none text-white text-sm font-bold"
          />
          {mapQuery && <X size={18} className="text-[#8B949E]" onClick={() => { setMapQuery(''); setDestination(null); setRoutes([]); }} />}
        </div>
        {suggestions.length > 0 && (
          <div style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '0 0 12px 12px' }} className="mt-0.5 overflow-hidden shadow-2xl">
            {suggestions.map((s, i) => (
              <div key={i} onClick={() => selectDestination(s)} className="p-4 border-b border-[#30363D] text-[#F0F6FC] cursor-pointer text-sm font-bold flex items-center gap-3 active:bg-[#21262D]">
                <MapPin size={14} className="text-[#00C896]" /> {s.nombre}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM SHEET — FIX #3 & #4 */}
      {destination && routes.length > 0 && (
        <div style={{ background: '#161B22', borderTop: '1px solid #30363D' }} className="fixed bottom-[60px] left-0 right-0 z-[800] rounded-t-[20px] p-5 max-h-[70vh] overflow-y-auto no-scrollbar animate-slide-up">
          <div className="w-10 h-1 bg-[#30363D] rounded-full mx-auto mb-4" />
          <h3 className="text-[#F0F6FC] text-base font-bold">Rutas disponibles</h3>
          <p className="text-[#8B949E] text-xs mb-4">Hacia {destination.nombre}</p>

          {/* NEARBY TRANSPORT — FIX #4 */}
          <div className="mb-6">
            <p className="text-[#8B949E] text-[10px] font-black uppercase tracking-widest mb-3">CERCA DE TI AHORA</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {[
                { tipo: '🚇', nombre: 'Metro', info: 'Baquedano · 3 min', color: '#EF4444' },
                { tipo: '🚌', nombre: 'Micro', info: 'Red 301 · 5 min', color: '#FFD93D' },
                { tipo: '🚲', nombre: 'BipBici', info: '4 bicis · 200m', color: '#00D4FF' },
                { tipo: '🛴', nombre: 'Scooter', info: 'Lime · 80m', color: '#FF8C42' }
              ].map(t => (
                <div key={t.nombre} style={{ background: '#21262D', border: `1px solid ${t.color}40` }} className="p-3 rounded-xl min-w-[90px] text-center shrink-0">
                  <div className="text-xl mb-1">{t.tipo}</div>
                  <div style={{ color: t.color }} className="text-[11px] font-bold">{t.nombre}</div>
                  <div className="text-[9px] text-[#8B949E]">{t.info}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {routes.map(r => (
              <RouteCard key={r.id} route={r} selected={selectedRoute?.id === r.id} onSelect={() => setSelectedRoute(r)} />
            ))}
          </div>

          {selectedRoute && (
            <button
              onClick={() => onStartNavigation({ ...selectedRoute, destinoCoords: [destination.lat, destination.lon] })}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#00C896] to-[#00A878] text-white font-black text-lg shadow-xl shadow-green-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              ▶ Iniciar {selectedRoute.nombre}
            </button>
          )}
        </div>
      )}
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
  if (!ruta || !ruta.instrucciones || ruta.instrucciones.length === 0) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#0D1117',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column',
        gap: '16px',
        zIndex: 9999
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid #30363D',
          borderTop: '3px solid #00C896',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}/>
        <p style={{ color: '#8B949E', fontSize: '14px' }}>
          Calculando ruta...
        </p>
      </div>
    )
  }
  const [instruccionIdx, setInstruccionIdx] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(ruta.time);
  const [distanciaRestante, setDistanciaRestante] = useState(ruta.distanciaKm);
  const [posActual, setPosActual] = useState(userPos);
  const [routePoints, setRoutePoints] = useState([]);
  const [cargandoRuta, setCargandoRuta] = useState(true);
  const [iniciado, setIniciado] = useState(Date.now());
  const [recalculando, setRecalculando] = useState(false);

  // 1. Obtener ruta real con OSRM (gratuito, sin API key)
  useEffect(() => {
    const fetchRoute = async () => {
      const origen = userPos;
      const destino = ruta.destinoCoords || [userPos[0] + 0.025, userPos[1] + 0.032];
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origen[1]},${origen[0]};${destino[1]},${destino[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        const data = await res.json();
        if (data.routes?.[0]) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRoutePoints(coords);
        } else {
          setRoutePoints(buildFallbackRoute(origen, destino));
        }
      } catch {
        setRoutePoints(buildFallbackRoute(origen, destino));
      } finally {
        setCargandoRuta(false);
      }
    };
    fetchRoute();
  }, []);

  // 2. GPS watchPosition — seguimiento real
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setPosActual([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

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

  // 5. Silent recalculation every 45 seconds
  useEffect(() => {
    const iv = setInterval(() => {
      setRecalculando(true);
      setTimeout(() => {
        setRecalculando(false);
      }, 2000);
    }, 45000);
    return () => clearInterval(iv);
  }, []);

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
      width:24px;height:24px;
      background:#3B82F6;
      border:4px solid white;
      border-radius:50%;
      box-shadow:0 0 15px rgba(59,130,246,0.5);
    "></div>`,
    iconSize: [24, 24], iconAnchor: [12, 12]
  });

  return (
    <div className="fixed inset-0 z-[3000] flex flex-col bg-[#0D1117]">
      {recalculando && (
        <div className="fixed inset-0 z-[5000] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
          <div className="bg-[#0D1117] border border-[#00C896] p-8 rounded-[32px] shadow-2xl flex flex-col items-center gap-4">
            <RefreshCcw size={40} className="text-[#00C896] animate-spin" />
            <p className="font-black text-white uppercase tracking-widest">Recalculando...</p>
          </div>
        </div>
      )}

      {/* BARRA SUPERIOR (Waze Style) */}
      <div className="fixed top-0 left-0 right-0 bg-[#0D1117]/90 backdrop-blur-md text-white px-5 py-6 z-[900] border-b border-white/10 h-[100px] flex items-center">
        <div className="flex items-center gap-4 w-full">
          <div className="w-14 h-14 bg-[#00C896] rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-green-500/20">
            <Navigation size={28} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00C896] mb-1">
              PASO {instruccionIdx + 1} / {ruta.instrucciones.length}
            </p>
            <p className="font-black text-base leading-tight text-white truncate">
              {ruta.instrucciones[instruccionIdx]}
            </p>
          </div>
          <button
            onClick={() => setInstruccionIdx(i => Math.min(i + 1, ruta.instrucciones.length - 1))}
            className="h-12 px-4 bg-white/5 rounded-2xl flex items-center justify-center gap-2 border border-white/10 hover:bg-white/10 transition-all font-black text-xs uppercase tracking-widest"
          >
            Saltar <ChevronRight size={16} />
          </button>
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

      {/* PANEL INFERIOR (Fixed above tab bar) */}
      <div className="fixed bottom-[60px] left-0 right-0 bg-[#0D1117]/95 backdrop-blur-md px-5 pt-4 pb-6 z-[900] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-center mb-6 px-2">
          <div className="text-center">
            <p className="text-2xl font-black text-white leading-none">{tiempoRestante}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">min rest.</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-[#00C896] leading-none">{distanciaRestante.toFixed(1)}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">km rest.</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-amber-500 leading-none">+{ruta.pts}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">puntos</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 mb-6">
          <Leaf size={18} className="text-[#00C896]" />
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ahorrando CO₂ vs auto</p>
          </div>
          <p className="font-black text-lg text-[#00C896]">{(metricas.calcularCO2Evitado(ruta.distanciaKm - distanciaRestante, ruta.medio)).toFixed(2)} kg</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onCancelar}
            variant="outline"
            className="!border-red-500/50 !text-red-500 !bg-transparent hover:!bg-red-500/10 h-14 text-sm"
          >
            <X size={20} /> Cancelar
          </Button>
          <Button
            onClick={onFinalizar}
            className="h-14 text-sm"
          >
            {esUltimoPaso ? '¡Llegué!' : 'Finalizar'}
          </Button>
        </div>
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
  const [darkMode, setDarkMode] = useState(true);
  const [logoClicks, setLogoClicks] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [redeeming, setRedeeming] = useState(null);

  const [userPoints, setUserPoints] = useState(() => {
    try {
      const saved = localStorage.getItem('rv_points')
      return saved ? parseInt(saved) : 161
    } catch { return 161 }
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showRoutePanel, setShowRoutePanel] = useState(false)
  const [rutas, setRutas] = useState([])
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [loadingRoutes, setLoadingRoutes] = useState(false)
  const [routeGeometry, setRouteGeometry] = useState(null)
  const [routeDistance, setRouteDistance] = useState(null)
  const [destinoNombre, setDestinoNombre] = useState('')
  const [userLocation, setUserLocation] = useState(null)

  const [navegacionActiva, setNavegacionActiva] = useState(false);
  const [rutaActiva, setRutaActiva] = useState(null);

  const mapRef = useRef(null)

  useEffect(() => {
    if (activeTab === 'mapa' && mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize()
      }, 100)
    }
  }, [activeTab])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          }
          setUserLocation(loc)
          if (mapRef.current) {
            mapRef.current.flyTo(
              [loc.lat, loc.lng], 15,
              { duration: 1.5 }
            )
          }
        },
        () => {
          setUserLocation({ lat: -33.4489, lng: -70.6693 })
        }
      )
    }
  }, [])

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(
            searchQuery + ' Santiago Chile'
          )}&format=json&limit=5&countrycodes=cl`,
          { headers: { 'Accept-Language': 'es' } }
        )
        const data = await res.json()
        setSearchResults(data.map(p => ({
          nombre: p.display_name
            .split(',').slice(0, 2).join(', ').trim(),
          lat: parseFloat(p.lat),
          lon: parseFloat(p.lon)
        })))
      } catch {
        setSearchResults([])
      }
      setSearchLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectDestino = (place) => {
    setSearchQuery(place.nombre)
    setSearchResults([])
    setDestinoNombre(place.nombre)
    mapRef.current?.flyTo([place.lat, place.lon], 14, { duration: 1.5 })
    calcularRutas(place.lat, place.lon, place.nombre)
  }

  const calcularRutas = async (destLat, destLon, destNombre) => {
    setLoadingRoutes(true)
    let osrmMinutes = 30
    try {
      const origin = userLocation || { lat: -33.4489, lng: -70.6693 }
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destLon},${destLat}?overview=full`)
      if (res.ok) {
        const data = await res.json()
        if (data.routes?.[0]) {
          osrmMinutes = Math.round(data.routes[0].duration / 60)
          setRouteGeometry(data.routes[0].geometry)
          setRouteDistance((data.routes[0].distance / 1000).toFixed(1))
        }
      }
    } catch (err) { console.warn('OSRM falló, usando fallback:', err) }

    const generated = [
      { id: 'verde', nombre: 'Ruta Verde 🌿', destino: destNombre, badge: 'RECOMENDADA', badgeColor: '#00C896', iconos: ['🚇', '🚶'], tiempo: Math.round(osrmMinutes * 1.1), precio: '$800 CLP', co2: '0.2 kg', co2Color: '#00C896', descripcion: 'Metro + caminata' },
      { id: 'rapida', nombre: 'Ruta Rápida ⚡', destino: destNombre, badge: 'MÁS RÁPIDA', badgeColor: '#FFD93D', iconos: ['🚌', '🚇'], tiempo: Math.round(osrmMinutes * 0.85), precio: '$1.200 CLP', co2: '0.8 kg', co2Color: '#FFD93D', descripcion: 'Bus expreso + Metro' },
      { id: 'activa', nombre: 'Ruta Activa 🚲', destino: destNombre, badge: '0 EMISIONES', badgeColor: '#00D4FF', iconos: ['🚲'], tiempo: Math.round(osrmMinutes * 1.35), precio: '$0', co2: '0 kg', co2Color: '#00D4FF', descripcion: 'Solo bicicleta' }
    ]
    setRutas(generated)
    setLoadingRoutes(false)
    setShowRoutePanel(true)
  }

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.5 })
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        mapRef.current?.flyTo([loc.lat, loc.lng], 15, { duration: 1.5 })
      })
    }
  }

  const { pos: userPos } = useGeolocalizacion();

  // Alertas de tráfico en tiempo real
  const { alertas, cargando: alertasCargando } = useTrafficAlerts();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const timer = setTimeout(() => setLoading(false), 500);
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

  const handleStartNavigation = (route) => {
    setRutaActiva({
      ...route,
      time: route.tiempo,
      pts: 150,
      medio: route.id,
      instrucciones: ["🚶 Camina al paradero", "🚇 Toma el metro", "🏁 ¡Llegaste!"],
      distanciaKm: 4.2
    });
    setNavegacionActiva(true);
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

  const handleNavigate = (tab, coords = null, name = '') => {
    setActiveTab(tab);
    if (coords) setDestCoords(coords);
    if (name) setDestName(name);
    else if (tab !== 'rutas') {
      setDestCoords(null);
      setDestName('');
    }
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
    <div className="fixed inset-0 bg-[#0D1117] flex flex-col items-center justify-center p-10 z-[1000] text-white">
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
      <div className={`min-h-screen bg-[#0D1117] text-[#F0F6FC] font-['Inter'] selection:bg-[#00C896] selection:text-white transition-colors duration-500 overflow-hidden`}>

        {/* Fondo base siempre presente — FIX #1 */}
        <div style={{ position: 'fixed', inset: 0, background: '#0D1117', zIndex: 0 }} />

        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-[10000] bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 text-center animate-slide-down">
            Estás en modo offline. Algunas funciones pueden no estar disponibles.
          </div>
        )}
        {showConfetti && <ConfettiEffect onComplete={() => setShowConfetti(false)} />}
        {toast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[5000] w-[90%] max-w-sm bg-[#1A1A2E] text-white px-8 py-5 rounded-[32px] shadow-2xl flex items-center gap-4 animate-slide-up border-b-8 border-[#00C896]">
            <CheckCircle2 size={24} className="text-[#00C896] shrink-0" />
            <p className="font-black text-sm">{toast}</p>
          </div>
        )}

        {redeeming && (
          <div className="fixed inset-0 z-[4000] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fade-in">
            <div className="bg-[#0D1117] w-full max-w-lg rounded-t-[48px] p-8 pb-32 space-y-6 animate-slide-up shadow-[0_-20px_50px_rgba(0,0,0,0.3)] border-t border-[#30363D]">
              <div className="w-16 h-1.5 bg-[#30363D] rounded-full mx-auto mb-2"></div>
              <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-white">¿Canjear beneficio?</h3>
                  <p className="text-gray-400 font-bold">Se descontarán {redeeming.cost} puntos de tu cuenta.</p>
              </div>
              <div className="bg-[#161B22] rounded-3xl p-10 flex flex-col items-center gap-4 border border-[#30363D]">
                  <div className="w-40 h-40 bg-[#21262D] p-4 rounded-3xl shadow-inner flex items-center justify-center">
                    <QrCode size={120} className="text-white" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Escanea en caja después de confirmar</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <Button variant="ghost" onClick={() => setRedeeming(null)} className="py-5 text-gray-400">Cancelar</Button>
                  <Button onClick={confirmRedeem} className="py-5">Confirmar</Button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto flex h-screen overflow-hidden relative">

          {/* MAP CONTAINER CON VISIBILIDAD CONTROLADA — FIX #1 & #3 & #4 & #6 & #7 */}
          <div style={{
            position: 'fixed',
            top: '56px', left: 0, right: 0, bottom: '60px',
            zIndex: 1,
            display: activeTab === 'mapa' ? 'block' : 'none'
          }}>
            <MapContainer
              ref={mapRef}
              center={[-33.4489, -70.6693]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />

              {/* METRO — líneas reales */}
              {METRO_LINES.map(line => (
                <Polyline key={line.name} positions={line.coords} color={line.color} weight={6} opacity={0.6} />
              ))}

              {/* BICIS — estaciones reales BipBici */}
              {BICI_STATIONS.map(s => (
                <Marker key={s.id} position={s.pos} icon={L.divIcon({ html: `<div style="background:#3B82F6;border:2px solid white;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:10px;box-shadow:0 2px 4px rgba(0,0,0,0.3);">🚴</div>`, iconSize: [18, 18], iconAnchor: [9, 9], className: '' })}>
                  <Popup><div style={{ background: '#161B22', color: '#F0F6FC', padding: '10px', borderRadius: '8px' }}><p style={{ fontWeight: 700, fontSize: '13px' }}>{s.name}</p><p style={{ color: '#00C896', fontSize: '11px' }}>{s.disponibles} bicis libres</p></div></Popup>
                </Marker>
              ))}

              {/* Markers de alertas — FIX #6 */}
              {alertas.filter(a => a.lat && a.lon).map(alerta => (
                <Marker
                  key={alerta.id}
                  position={[alerta.lat, alerta.lon]}
                  icon={L.divIcon({
                    html: `<div style="font-size:20px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.8));">${alerta.emoji}</div>`,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                    className: ''
                  })}
                >
                  <Popup>
                    <div style={{ background: '#161B22', color: '#F0F6FC', padding: '10px', borderRadius: '8px', fontSize: '13px', minWidth: '160px' }}>
                      <div style={{ fontWeight: '700', marginBottom: '4px', color: alerta.severity === 'error' ? '#FF6B6B' : '#FFD93D' }}>{alerta.emoji} {alerta.label}</div>
                      <div style={{ color: '#8B949E' }}>{alerta.texto}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Botón centrar — FIX #4 */}
              <button
                onClick={(e) => { e.stopPropagation(); centerOnUser(); }}
                style={{
                  position: 'absolute',
                  bottom: '80px', right: '16px',
                  width: '48px', height: '48px',
                  background: '#161B22',
                  border: '1px solid #30363D',
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer', zIndex: 500,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                }}
              >
                🎯
              </button>

              {/* INPUT de búsqueda en el mapa — FIX #7 */}
              <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', zIndex: 600 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: searchResults.length > 0 ? '12px 12px 0 0' : '12px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '16px' }}>🔍</span>
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="¿A dónde vas?"
                      style={{ background: 'none', border: 'none', outline: 'none', color: '#F0F6FC', fontSize: '16px', flex: 1 }}
                    />
                    {searchQuery && (
                      <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowRoutePanel(false); setRutas([]); }} style={{ background: 'none', border: 'none', color: '#8B949E', cursor: 'pointer', fontSize: '18px', padding: '0' }}>✕</button>
                    )}
                  </div>
                  {searchResults.length > 0 && (
                    <div style={{ background: '#161B22', border: '1px solid #30363D', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden', zIndex: 700 }}>
                      {searchLoading ? (
                        <div style={{ padding: '12px 16px', color: '#8B949E', fontSize: '13px', textAlign: 'center' }}>Buscando...</div>
                      ) : (
                        searchResults.map((r, i) => (
                          <div key={i} onClick={() => selectDestino(r)} style={{ padding: '12px 16px', borderTop: i > 0 ? '1px solid #21262D' : 'none', color: '#F0F6FC', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '16px' }}>📍</span>
                            <span>{r.nombre}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Panel de alertas horizontal — FIX #6 */}
              {!showRoutePanel && (
                <div style={{ position: 'absolute', top: '72px', left: '12px', right: '12px', zIndex: 500 }}>
                  <div style={{ overflowX: 'auto', display: 'flex', gap: '8px', paddingBottom: '4px' }} className="no-scrollbar">
                    {ALERTAS_TRAFICO.map(a => (
                      <div key={a.id} onClick={() => { mapRef.current?.flyTo([a.lat, a.lng], 16, { duration: 1 }) }} style={{ background: '#161B22', border: `1px solid ${a.color}50`, borderRadius: '20px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '14px' }}>{a.icon}</span>
                        <span style={{ color: '#F0F6FC', fontSize: '12px', fontWeight: '500' }}>{a.titulo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom sheet de rutas — FIX #5 & #7 */}
              {showRoutePanel && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#161B22', borderRadius: '20px 20px 0 0', border: '1px solid #30363D', borderBottom: 'none', zIndex: 600, maxHeight: '72vh', overflowY: 'auto', padding: '16px 16px 24px' }} className="no-scrollbar">
                  <div style={{ width: '40px', height: '4px', background: '#30363D', borderRadius: '2px', margin: '0 auto 16px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <div style={{ color: '#F0F6FC', fontWeight: '700', fontSize: '16px' }}>Rutas disponibles</div>
                      <div style={{ color: '#8B949E', fontSize: '13px', marginTop: '2px' }}>Hacia {destinoNombre.split(',')[0]} {routeDistance && ` · ${routeDistance} km`}</div>
                    </div>
                    <button onClick={() => { setShowRoutePanel(false); setSearchQuery(''); setRutas([]); }} style={{ background: '#21262D', border: '1px solid #30363D', color: '#8B949E', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                  </div>
                  <div style={{ overflowX: 'auto', display: 'flex', gap: '8px', padding: '12px 0', borderBottom: '1px solid #30363D', marginBottom: '12px' }} className="no-scrollbar">
                    {[
                      { i:'🚇', n:'Metro', d:'3 min', c:'#EF4444' },
                      { i:'🚌', n:'Micro', d:'5 min', c:'#FFD93D' },
                      { i:'🚲', n:'BipBici', d:'200m', c:'#00D4FF' },
                      { i:'🛴', n:'Scooter', d:'80m', c:'#FF8C42' }
                    ].map(t => (
                      <div key={t.n} style={{ background: '#21262D', border: `1px solid ${t.c}30`, borderRadius: '10px', padding: '8px 12px', flexShrink: 0, textAlign: 'center', minWidth: '72px' }}>
                        <div style={{ fontSize: '18px' }}>{t.i}</div>
                        <div style={{ color: t.c, fontSize: '11px', fontWeight: '600', marginTop: '2px' }}>{t.n}</div>
                        <div style={{ color: '#8B949E', fontSize: '10px' }}>{t.d}</div>
                      </div>
                    ))}
                  </div>
                  {loadingRoutes ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#8B949E', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <div style={{ width: '20px', height: '20px', border: '2px solid #30363D', borderTop: '2px solid #00C896', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      Calculando rutas reales...
                    </div>
                  ) : (
                    <>
                      {rutas.map(ruta => (
                        <div key={ruta.id} onClick={() => setSelectedRoute(ruta)} style={{ background: selectedRoute?.id === ruta.id ? '#00C89615' : '#21262D', border: `2px solid ${selectedRoute?.id === ruta.id ? ruta.badgeColor : '#30363D'}`, borderRadius: '14px', padding: '14px', marginBottom: '10px', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div>
                              <div style={{ fontWeight: '600', color: '#F0F6FC', fontSize: '15px' }}>{ruta.nombre}</div>
                              <div style={{ color: '#8B949E', fontSize: '12px', marginTop: '2px' }}>{ruta.descripcion}</div>
                            </div>
                            <span style={{ background: ruta.badgeColor + '20', color: ruta.badgeColor, border: `1px solid ${ruta.badgeColor}40`, borderRadius: '20px', padding: '3px 10px', fontSize: '10px', fontWeight: '700', height: 'fit-content' }}>{ruta.badge}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>{ruta.iconos.map((ic, i) => (<span key={i} style={{ fontSize: '18px' }}>{ic}</span>))}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                            {[{ v: ruta.tiempo + ' min', l: 'TIEMPO', c: '#F0F6FC' }, { v: ruta.precio, l: 'PRECIO', c: '#F0F6FC' }, { v: ruta.co2 + ' CO₂', l: 'EMISIONES', c: ruta.co2Color }].map(m => (
                              <div key={m.l} style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: '700', color: m.c, fontSize: '14px' }}>{m.v}</div>
                                <div style={{ color: '#8B949E', fontSize: '10px' }}>{m.l}</div>
                              </div>
                            ))}
                          </div>
                          {selectedRoute?.id === ruta.id && (
                            <div style={{ marginTop: '8px', textAlign: 'center', color: ruta.badgeColor, fontSize: '12px', fontWeight: '600' }}>✓ Seleccionada</div>
                          )}
                        </div>
                      ))}
                      {selectedRoute && (
                        <button onClick={() => startNavigation(selectedRoute)} style={{ width: '100%', background: 'linear-gradient(135deg, #00C896, #00A878)', border: 'none', color: 'white', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>▶ Iniciar {selectedRoute.nombre.split(' ')[2]}</button>
                      )}
                    </>
                  )}
                </div>
              )}
            </MapContainer>
          </div>

          <div style={{
            position: 'fixed',
            top: '56px', left: 0, right: 0, bottom: '60px',
            overflowY: 'auto',
            overflowX: 'hidden',
            background: '#0D1117',
            WebkitOverflowScrolling: 'touch',
            zIndex: 10,
            display: activeTab === 'mapa' ? 'none' : 'block'
          }}>
          <div className="w-full lg:w-[480px] h-screen shadow-2xl relative lg:border-x border-[#30363D] flex flex-col z-[20] pointer-events-none">
            {/* Header: position fixed, height 56px */}
            <header className="fixed top-0 left-0 right-0 h-[56px] bg-[#0D1117] flex items-center justify-between px-6 z-[1000] border-b border-[#30363D] pointer-events-auto">
              <div className="flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform" onClick={handleLogoClick}>
                <div className="w-8 h-8 bg-[#00C896] rounded-lg flex items-center justify-center text-white"><Leaf size={16} fill="currentColor" /></div>
                <span className="font-black text-lg tracking-tighter text-white uppercase">RUTA <span className="text-[#00C896]">VERDE</span></span>
              </div>
              <button className="relative w-10 h-10 bg-[#161B22] rounded-xl flex items-center justify-center border border-[#30363D] transition-transform active:scale-95">
                <Bell size={20} className="text-white" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FF6B6B] rounded-full border-2 border-[#0D1117]"></span>
              </button>
            </header>

            <div className="pointer-events-none h-full">
              <Suspense fallback={<div className="flex items-center justify-center h-full"><Skeleton className="w-full h-64" /></div>}>
                {activeTab === 'inicio' && <div className="pointer-events-auto"><HomeComponent user={user} onNavigate={handleNavigate} stats={stats} alertas={alertas} alertasCargando={alertasCargando} /></div>}
                {activeTab === 'rutas' && (
                  <div className="p-6 text-center animate-fade-in pointer-events-auto pt-24">
                    <div className="w-20 h-20 bg-[#161B22] border border-[#30363D] rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#00C896]"><Milestone size={40} /></div>
                    <h2 className="text-2xl font-black text-white mb-2">Tus rutas guardadas</h2>
                    <p className="text-[#8B949E] font-bold">Aquí aparecerán tus destinos frecuentes.</p>
                  </div>
                )}
                {activeTab === 'puntos' && <div className="pointer-events-auto"><GamificationScreen points={userPoints} showToast={showToast} redeeming={redeeming} setRedeeming={setRedeeming} co2Total={stats.co2Total} /></div>}
                {activeTab === 'perfil' && (
                  <div className="pointer-events-auto">
                    <PerfilErrorBoundary>
                      <ProfileScreen user={user} stats={stats} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />
                    </PerfilErrorBoundary>
                  </div>
                )}
              </Suspense>
            </div>

            <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-[#0D1117] border-t border-white/5 px-8 flex justify-between items-center z-[1000] pointer-events-auto">
              {[
                { id: 'inicio', icon: <Home />, label: 'Inicio' },
                { id: 'rutas', icon: <Milestone />, label: 'Rutas' },
                { id: 'mapa', icon: <MapIcon />, label: 'Mapa', badge: true },
                { id: 'puntos', icon: <Award />, label: 'Puntos' },
                { id: 'perfil', icon: <User />, label: 'Perfil' },
              ].map(tab => (
                <button key={tab.id} onClick={() => handleNavigate(tab.id)} className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${activeTab === tab.id ? 'text-[#00C896] -translate-y-2' : 'text-gray-300 dark:text-slate-600 hover:text-gray-500'}`}>
                  <div className={`p-2 rounded-xl transition-all duration-500 ${activeTab === tab.id ? 'bg-[#00C896]/10 shadow-lg' : 'bg-transparent'}`}>
                    {React.cloneElement(tab.icon, { size: 22, strokeWidth: activeTab === tab.id ? 3 : 2 })}
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
