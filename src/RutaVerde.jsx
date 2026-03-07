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

// --- UTILS & HOOKS (Inlined) ---

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

function useGeolocalizacion() {
  const [estado, setEstado] = useState({
    pos: [-33.4489, -70.6693],
    permiso: 'sin-solicitar',
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

const EMISIONES = {
  auto: 0.21,
  micro: 0.068,
  metro: 0.03,
  bici: 0,
  scooter: 0.015,
  caminata: 0,
  moto: 0.085,
  uber: 0.21,
  compartido: 0.1
};

const metricas = {
  calcularCO2Evitado: (distancia, modo) => {
    const emisionModo = EMISIONES[modo] || 0;
    const ahorroPorKm = EMISIONES.auto - emisionModo;
    return Math.max(0, distancia * ahorroPorKm);
  },
  calcularPuntos: (co2Evitado, distancia) => {
    const puntosCO2 = co2Evitado * 100;
    const bonusFisico = (distancia * 10);
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
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-[#00C896] mb-6">
            <AlertTriangle size={48} />
          </div>
          <h2 className="text-3xl font-black text-[#1A1A2E] dark:text-white mb-4">¡Ups! Algo salió mal 🌿</h2>
          <button onClick={() => window.location.reload()} className="bg-[#00C896] text-white px-8 py-4 rounded-2xl font-black">Reintentar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const trackEvent = (category, action, label, value) => {
  console.log(`[Analytics] ${category} > ${action}: ${label} (${value || ''})`);
};

const SANTIAGO_BBOX = '-33.65,-70.85,-33.30,-70.45';
const TIPO_INCIDENTE = {
  0: { emoji: '🚗', label: 'Incidente desconocido', severity: 'info' },
  1: { emoji: '🚗', label: 'Accidente', severity: 'error' },
  2: { emoji: '🌦️', label: 'Condición climática', severity: 'warning' },
  3: { emoji: '🚧', label: 'Peligro en la vía', severity: 'warning' },
  4: { emoji: '🚦', label: 'Tráfico detenido', severity: 'error' },
  5: { emoji: '🚦', label: 'Tráfico lento', severity: 'warning' },
  6: { emoji: '🚧', label: 'Obras en la vía', severity: 'warning' },
  14: { emoji: '🚧', label: 'Carril cerrado', severity: 'warning' },
};
const SEVERITY_LABEL = { error: 'Importante', warning: 'Retraso', info: 'OK' };
const ALERTAS_FALLBACK = [
  { id: 'fb1', texto: 'Tráfico denso en Alameda', calle: 'Alameda', emoji: '🚦', label: 'Tráfico lento', status: 'Retraso', severity: 'warning', lat: -33.4489, lon: -70.6693, delay: 8 },
  { id: 'fb2', texto: 'Metro L1 operando con normalidad', calle: 'Línea 1', emoji: '✅', label: 'Sin incidentes', status: 'OK', severity: 'info', lat: null, lon: null, delay: null },
];

function useTrafficAlerts(refreshIntervalMs = 120000) {
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
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
      setAlertas(alertasMapeadas.length === 0 ? [ALERTAS_FALLBACK[1]] : alertasMapeadas);
      setUltimaActualizacion(new Date());
    } catch (err) {
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

  return { alertas, cargando, ultimaActualizacion, refetch: fetchAlertas };
}

// --- CONFIGURACIÓN DE MAPA (LEAFLET) ---

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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
    html: `<div class="w-5 h-5 bg-[#3B82F6] rounded-full border-2 border-white shadow-md flex items-center justify-center text-white">🚴</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  }),
  scooter: L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-4 h-4 bg-[#00C896] rounded-full border-2 border-white shadow-sm flex items-center justify-center">🛴</div>`,
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
    html: `<div class="w-8 h-8 bg-[#FF6B6B] rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white animate-bounce">📍</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  })
};

const iconIncidente = (severity) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="width:24px; height:24px; border-radius:50%; background:${severity === 'error' ? '#FF6B6B' : severity === 'warning' ? '#FFD93D' : '#00C896'}; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; font-size:10px;">${severity === 'error' ? '⚠' : severity === 'warning' ? '~' : '✓'}</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const METRO_LINES = [
  { name: 'L1', color: '#FF0000', weight: 6, coords: [
    [-33.4258,-70.6580],[-33.4268,-70.6510],[-33.4278,-70.6440],
    [-33.4290,-70.6380],[-33.4310,-70.6315],[-33.4315,-70.6275],
    [-33.4339,-70.6228],[-33.4360,-70.6178],[-33.4376,-70.6130],
    [-33.4389,-70.6088],[-33.4400,-70.6046],[-33.4404,-70.6011],
    [-33.4404,-70.5973],[-33.4403,-70.5933],[-33.4399,-70.5893],
    [-33.4378,-70.5836],[-33.4345,-70.5766],[-33.4315,-70.5693],
    [-33.4280,-70.5617],[-33.4246,-70.5551],[-33.4208,-70.5483]
  ]},
  { name: 'L2', color: '#FFD700', weight: 6, coords: [
    [-33.3693,-70.6392],[-33.3820,-70.6388],[-33.3960,-70.6384],
    [-33.4100,-70.6396],[-33.4230,-70.6420],[-33.4370,-70.6445],
    [-33.4450,-70.6458],[-33.4570,-70.6466],[-33.4700,-70.6474],
    [-33.4820,-70.6482],[-33.4940,-70.6490]
  ]},
  { name: 'L5', color: '#008000', weight: 6, coords: [
    [-33.4490,-70.7200],[-33.4490,-70.7040],[-33.4490,-70.6880],
    [-33.4490,-70.6720],[-33.4490,-70.6640],[-33.4490,-70.6511],
    [-33.4450,-70.6430],[-33.4404,-70.6011],[-33.4376,-70.6130],
    [-33.4340,-70.6260],[-33.4220,-70.6700]
  ]}
];

const BICI_STATIONS = [
  { id:1,  pos:[-33.4369,-70.6509], name:"BipBici Plaza de Armas",   direccion:"Av. B. O'Higgins 1059",        disponibles:8  },
  { id:2,  pos:[-33.4399,-70.5894], name:"BipBici Tobalaba",         direccion:"Av. Providencia / Tobalaba",   disponibles:5  },
  { id:3,  pos:[-33.4552,-70.6826], name:"BipBici Estación Central", direccion:"Av. B. O'Higgins 3322",        disponibles:12 },
  { id:4,  pos:[-33.4281,-70.6077], name:"BipBici Bellas Artes",     direccion:"Av. B. O'Higgins 651",         disponibles:3  },
  { id:5,  pos:[-33.4196,-70.6045], name:"BipBici Manuel Montt",     direccion:"Av. Providencia 1111",         disponibles:7  },
  { id:6,  pos:[-33.4404,-70.6012], name:"BipBici Lastarria",        direccion:"J.V. Lastarria 70",            disponibles:4  },
  { id:7,  pos:[-33.4209,-70.5487], name:"BipBici Escuela Militar",  direccion:"Av. Apoquindo / Manquehue",    disponibles:9  },
  { id:8,  pos:[-33.4249,-70.6348], name:"BipBici Barrio Italia",    direccion:"Av. Italia / Av. Condell",     disponibles:6  },
  { id:9,  pos:[-33.4380,-70.6540], name:"BipBici Bustamante",       direccion:"Av. Bustamante 52",            disponibles:11 },
  { id:10, pos:[-33.4160,-70.5966], name:"BipBici Los Leones",       direccion:"Av. Andrés Bello / Los Leones",disponibles:2  },
];

const SCOOTER_ZONES = [
  { id:1, pos:[-33.4280,-70.6066], tipo:'grin', zona:'Lastarria',       direccion:"Villavicencio / Rosal"          },
  { id:2, pos:[-33.4196,-70.6051], tipo:'lime', zona:'Providencia',     direccion:"Av. Providencia 1234"           },
  { id:3, pos:[-33.4314,-70.6091], tipo:'grin', zona:'Bellavista',      direccion:"Constitución / Pío Nono"        },
  { id:4, pos:[-33.4158,-70.5949], tipo:'lime', zona:'Las Condes',      direccion:"Av. Apoquindo 3000"             },
  { id:5, pos:[-33.4349,-70.5800], tipo:'grin', zona:'Ñuñoa',           direccion:"Av. Irarrázaval 1850"           },
  { id:6, pos:[-33.4265,-70.5736], tipo:'lime', zona:'Plaza Egaña',     direccion:"Av. Grecia 500"                 },
  { id:7, pos:[-33.4104,-70.5752], tipo:'grin', zona:'El Golf',         direccion:"Av. El Bosque Norte 45"         },
  { id:8, pos:[-33.4489,-70.6700], tipo:'lime', zona:'Quinta Normal',   direccion:"Av. Matucana 550"               },
];

const MICRO_STOPS = [
  { id:1, pos:[-33.4404,-70.6047], name:"Paradero Bellas Artes",     direccion:"Alameda / Mosqueto",       lineas:['201','210','B01'] },
  { id:2, pos:[-33.4376,-70.6131], name:"Paradero San Francisco",    direccion:"Alameda / San Francisco",  lineas:['B01','D01','210'] },
  { id:3, pos:[-33.4300,-70.6366], name:"Paradero Ecuador",          direccion:"Alameda / Ecuador",        lineas:['301','D05','506'] },
  { id:4, pos:[-33.4550,-70.6826], name:"Paradero Est. Central",     direccion:"Alameda / 5 de Abril",     lineas:['B01','401','D09'] },
  { id:5, pos:[-33.4196,-70.6045], name:"Paradero Manuel Montt",     direccion:"Providencia / Manuel Montt",lineas:['210','301','406'] },
  { id:6, pos:[-33.4160,-70.5950], name:"Paradero Tobalaba",         direccion:"Providencia / Tobalaba",   lineas:['210','401','416'] },
];

const CityMap = ({
  className = "", showMetro = true, showBici = true, showScooter = true,
  destination = null, city = "Santiago", darkMode = false, alertasCoords = [],
  modoTransporte = null, onSearchSelect = null, centerTrigger = 0,
  routePreviewPoints = [],
}) => {
  const { pos, permiso } = useGeolocalizacion();
  const [tileError, setTileError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(14);
  const [mapQuery, setMapQuery] = useState('');
  const [mapSuggestions, setMapSuggestions] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [localRoute, setLocalRoute] = useState([]);
  const [fetchingRoute, setFetchingRoute] = useState(false);

  const mapUrl = darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

  const ZoomTracker = () => {
    const map = useMap();
    useEffect(() => {
      const onZoom = () => setZoomLevel(map.getZoom());
      map.on('zoomend', onZoom);
      return () => map.off('zoomend', onZoom);
    }, [map]);
    return null;
  };

  const handleMapSearch = useCallback(async (q) => {
    setMapQuery(q);
    if (q.length < 3) { setMapSuggestions([]); return; }
    setSearchBusy(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', Santiago, Chile')}&limit=5`);
      const data = await r.json();
      setMapSuggestions(data);
    } catch { setMapSuggestions([]); }
    finally { setSearchBusy(false); }
  }, []);

  const handleSelectSuggestion = useCallback(async (s) => {
    const coords = [parseFloat(s.lat), parseFloat(s.lon)];
    setMapQuery(s.display_name.split(',')[0]);
    setMapSuggestions([]);
    if (onSearchSelect) onSearchSelect(coords, s.display_name.split(',')[0]);
    setFetchingRoute(true);
    try {
      const profile = modoTransporte === 'caminata' ? 'foot' : modoTransporte === 'bici' ? 'bike' : 'driving';
      const url = `https://router.project-osrm.org/route/v1/${profile}/${pos[1]},${pos[0]};${s.lon},${s.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes?.[0]) setLocalRoute(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
      else setLocalRoute([]);
    } catch { setLocalRoute([]); }
    finally { setFetchingRoute(false); }
  }, [pos, onSearchSelect, modoTransporte]);

  const RecenterOnDest = ({ dest }) => {
    const map = useMap();
    const prev = useRef(null);
    useEffect(() => {
      if (dest && JSON.stringify(dest) !== JSON.stringify(prev.current)) {
        map.flyTo(dest, 16, { animate: true });
        prev.current = dest;
      }
    }, [dest, map]);
    return null;
  };

  const CenterOnUser = ({ trigger }) => {
    const map = useMap();
    const prev = useRef(0);
    useEffect(() => {
      if (trigger > prev.current) { map.flyTo(pos, 16, { animate: true }); prev.current = trigger; }
    }, [trigger, map, pos]);
    return null;
  };

  const pts = routePreviewPoints.length > 0 ? routePreviewPoints : localRoute;

  return (
    <div className={`relative bg-[#F8FAF9] dark:bg-slate-900 w-full h-full overflow-hidden ${className}`}>
      <div className="absolute top-3 left-3 right-3 z-[2000]">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex items-center gap-2 px-4 py-3">
          {searchBusy ? <RefreshCcw size={16} className="animate-spin text-[#00C896]" /> : <Search size={16} className="text-[#00C896]" />}
          <input
            type="text" placeholder="¿A dónde vas?" value={mapQuery}
            onChange={e => handleMapSearch(e.target.value)}
            className="bg-transparent flex-1 text-sm font-bold outline-none dark:text-white"
          />
          {mapQuery && <X size={14} className="text-gray-400 cursor-pointer" onClick={() => { setMapQuery(''); setMapSuggestions([]); setLocalRoute([]); }} />}
        </div>
        {mapSuggestions.length > 0 && (
          <div className="mt-1 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            {mapSuggestions.map((s,i) => (
              <div key={i} onMouseDown={() => handleSelectSuggestion(s)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-50 dark:border-slate-700 last:border-none">
                <MapPin size={13} className="text-[#00C896]" />
                <div className="min-w-0">
                  <p className="font-bold text-xs truncate dark:text-white">{s.display_name.split(',')[0]}</p>
                  <p className="text-[10px] text-gray-400 truncate">{s.display_name.split(',').slice(1,3).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {permiso === 'denegado' && (
        <div className="absolute top-20 left-4 right-4 z-[1000] bg-yellow-50 border border-yellow-200 p-3 rounded-xl flex items-center gap-3 shadow-md">
           <Locate size={18} className="text-yellow-600" />
           <p className="text-[10px] font-bold text-yellow-800">📍 Activa la ubicación para ver tu posición real.</p>
        </div>
      )}

      <MapContainer
        center={pos}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer attribution="&copy; CARTO" url={mapUrl} eventHandlers={{ tileerror: () => setTileError(true) }} />
        <RecenterOnDest dest={destination} />
        <CenterOnUser trigger={centerTrigger} />
        <ZoomTracker />

        {pts.length > 1 && <>
          <Polyline positions={pts} color="#1A1A2E" weight={10} opacity={0.2} />
          <Polyline positions={pts} color="#00C896" weight={5} opacity={0.95} />
        </>}

        {showMetro && zoomLevel > 13 && METRO_LINES.map(l => (
          <Polyline key={l.name} positions={l.coords} color={l.color} weight={l.weight||5} opacity={0.65} />
        ))}

        {(showBici || modoTransporte==='bici') && zoomLevel > 14 && BICI_STATIONS.map(s => (
          <Marker key={s.id} position={s.pos} icon={customIcons.bici}>
            <Popup>
              <div className="p-1">
                <p className="font-black text-xs">{s.name}</p>
                <p className="text-[10px] text-[#00C896] font-bold">BipBici: {s.disponibles} disponibles</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {(showScooter || modoTransporte==='scooter') && zoomLevel > 14 && SCOOTER_ZONES.map(s => (
          <Marker key={s.id} position={s.pos} icon={customIcons.scooter} />
        ))}

        {modoTransporte === 'micro' && zoomLevel > 14 && MICRO_STOPS.map(s => (
          <Marker key={s.id} position={s.pos} icon={L.divIcon({ html: '🚌', className: 'text-lg' })}>
            <Popup>
              <div className="p-1">
                <p className="font-black text-xs">{s.name}</p>
                <p className="text-[10px] text-orange-500 font-bold">Frecuencia estimada: 8-12 min</p>
              </div>
            </Popup>
          </Marker>
        ))}

        <Marker position={pos} icon={customIcons.user} />
        {destination && <Marker position={destination} icon={customIcons.destination} />}
        {alertasCoords.map(a => (
          <Marker key={a.id} position={[a.lat,a.lon]} icon={iconIncidente(a.severity)}>
            <Popup><p className="font-bold text-xs">{a.texto}</p></Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

// --- PANTALLAS ---

const HomeComponent = ({ user, onNavigate, stats, alertas }) => {
  const [search, setSearch] = useState("");
  const alertaPrincipal = alertas?.[0];
  return (
    <div className="space-y-6 pb-40">
      <header className="flex justify-between items-start">
        <div className="max-w-[70%]">
          <h1 className="text-3xl font-black">Hola, {user.name} 👋</h1>
          <p className="text-gray-500 font-bold text-sm mt-1">{user.city}, Chile</p>
        </div>
        <button className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-xl border border-gray-100 dark:border-slate-700">
          <Bell size={24} />
        </button>
      </header>
      <Card className="!p-6 space-y-4">
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl">
          <Search size={20} className="text-gray-400" />
          <input type="text" placeholder="¿A dónde vas?" value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent w-full outline-none font-bold" />
        </div>
        <Button fullWidth onClick={() => onNavigate('rutas')}><Search size={20} /> Buscar ruta</Button>
      </Card>
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-xl font-black text-[#00C896]">{stats.co2Total.toFixed(1)}</p>
          <p className="text-[8px] font-black uppercase text-gray-400">KG CO₂</p>
        </Card>
        <Card className="text-center">
          <p className="text-xl font-black text-[#FFD93D]">{stats.points}</p>
          <p className="text-[8px] font-black uppercase text-gray-400">PTS</p>
        </Card>
        <Card className="text-center">
          <p className="text-xl font-black text-blue-400">{stats.kmTotal.toFixed(1)}</p>
          <p className="text-[8px] font-black uppercase text-gray-400">KM</p>
        </Card>
      </div>
      {alertaPrincipal && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
          <span className="text-xl">{alertaPrincipal.emoji}</span>
          <p className="text-xs font-bold text-red-700">{alertaPrincipal.texto}</p>
        </div>
      )}
    </div>
  );
};

const RoutePlannerComponent = ({ onStart, destination, darkMode }) => {
  const [selected, setSelected] = useState('bici');
  const [starting, setStarting] = useState(false);
  const DIST_KM = 5.2;
  const MODOS_DEF = [
    { id:'caminata', label:'A pie',      emoji:'🚶', hex:'#00C896', co2f:0,     coste:0,    t:65, inst: ["🚶 Sal por la puerta principal","🚶 Sigue recto por la vereda","🚶 Cruza con precaución","🏁 Llegaste!"] },
    { id:'bici',     label:'Bicicleta',  emoji:'🚴', hex:'#3B82F6', co2f:0,     coste:350,  t:22, inst: ["🚴 Retira tu BipBici","🚴 Sigue la ciclovía hacia el norte","🚴 Estaciona en destino","🏁 Viaje completado"] },
    { id:'scooter',  label:'Scooter',    emoji:'🛴', hex:'#06B6D4', co2f:0.015, coste:450,  t:18, inst: ["🛴 Desbloquea el scooter","🛴 Circula por la calzada","🛴 Estaciona en zona habilitada","🏁 Llegaste!"] },
    { id:'metro',    label:'Metro',      emoji:'🚇', hex:'#FF0000', co2f:0.03,  coste:780,  t:40, inst: ["🚶 Camina a la estación","🚇 Toma L1 dirección Escuela Militar","🚇 Baja en Tobalaba","🏁 Destino alcanzado"] },
    { id:'micro',    label:'Micro',      emoji:'🚌', hex:'#F59E0B', co2f:0.068, coste:800,  t:45, inst: ["🚌 Dirígete al paradero","🚌 Toma la micro 401","🔔 Baja en el paradero indicado","🏁 Llegaste!"] },
    { id:'moto',     label:'Moto',       emoji:'🏍️', hex:'#8B5CF6', co2f:0.085, coste:0,    t:20, inst: ["🏍️ Enciende el motor","🏍️ Toma Av. Kennedy","🏍️ Gira a la derecha","🏁 Llegaste!"] },
    { id:'uber',     label:'Uber',       emoji:'🚗', hex:'#1A1A2E', co2f:0.21,  coste:2800, t:25, inst: ["📱 Espera al conductor","🚗 Disfruta el viaje","🚗 Baja en el punto indicado","🏁 Destino"] },
    { id:'auto',     label:'Auto',       emoji:'🚙', hex:'#EF4444', co2f:0.21,  coste:1500, t:28, inst: ["🚗 Sal de tu cochera","🚗 Toma la autopista","🅿️ Busca estacionamiento","🏁 Llegaste!"] },
    { id:'compartido',label:'Compartido',emoji:'🤝', hex:'#EC4899', co2f:0.1,   coste:1200, t:30, inst: ["🤝 Encuentra a tu compañero","🚗 Viajen juntos","🚗 Compartan gastos","🏁 Llegamos!"] },
  ];
  const baseRoutes = MODOS_DEF.map(m => ({
    id: m.id, title: m.label.toUpperCase(), time: m.t, cost: m.coste, co2: m.co2f * DIST_KM, colorHex: m.hex, emoji: m.emoji, medio: m.id, distanciaKm: DIST_KM, instrucciones: m.inst
  }));

  const handleStartRoute = () => {
    const r = baseRoutes.find(x => x.id === selected);
    setStarting(true);
    setTimeout(() => { setStarting(false); onStart(r); }, 600);
  };

  return (
    <div className="space-y-4 pb-32">
      <div className="h-48 rounded-3xl overflow-hidden border border-gray-100 shadow-inner">
        <CityMap destination={destination} darkMode={darkMode} modoTransporte={selected} />
      </div>
      <h2 className="text-xl font-black">Rutas recomendadas</h2>
      <div className="space-y-3">
        {baseRoutes.map(r => (
          <div key={r.id} onClick={() => setSelected(r.id)} className={`p-4 rounded-3xl border-2 transition-all cursor-pointer ${selected===r.id?'border-[#00C896] bg-green-50':'border-gray-50 bg-white'}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{r.emoji}</span>
                <div>
                  <h3 className="font-black text-sm">{r.title}</h3>
                  <p className="text-[10px] font-bold text-gray-400">{r.time} min · ${r.cost}</p>
                </div>
              </div>
              <p className="text-[10px] font-black text-[#00C896]">{r.co2.toFixed(2)}kg CO₂</p>
            </div>
          </div>
        ))}
      </div>
      <Button fullWidth onClick={handleStartRoute} loading={starting}><Navigation size={20} /> Iniciar viaje</Button>
    </div>
  );
};

const LiveMapComponent = ({ darkMode, onNavigateToRutas }) => {
  const [modoFiltro, setModoFiltro] = useState(null);
  const [dest, setDest] = useState(null);
  const { alertas } = useTrafficAlerts();
  return (
    <div className="h-full relative overflow-hidden -mx-6 -mt-10">
      <CityMap
        darkMode={darkMode}
        destination={dest}
        onSearchSelect={setDest}
        modoTransporte={modoFiltro}
        alertasCoords={alertas}
      />
      <div className="absolute top-20 left-4 right-4 flex gap-2 z-[1500] overflow-x-auto no-scrollbar">
        {['bici', 'metro', 'scooter', 'micro'].map(m => (
          <button key={m} onClick={() => setModoFiltro(m)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg border backdrop-blur-md transition-all ${modoFiltro===m?'bg-[#00C896] text-white':'bg-white/90 text-gray-800'}`}>{m}</button>
        ))}
      </div>
      {dest && (
        <div className="absolute bottom-4 left-4 right-4 z-[1500]">
          <Button fullWidth onClick={() => onNavigateToRutas(dest)} className="shadow-2xl">Ver rutas hacia aquí →</Button>
        </div>
      )}
    </div>
  );
};

const LiveMapScreen = ({ darkMode, onNavigateToRutas }) => <LiveMapComponent darkMode={darkMode} onNavigateToRutas={onNavigateToRutas} />;
const GamificationScreen = ({ points }) => <div className="p-8 text-center"><h2 className="text-2xl font-black">Mis Puntos</h2><p className="text-4xl font-black text-[#00C896] mt-4">{points} pts</p></div>;
const ProfileScreen = ({ user, onLogout }) => <div className="p-8 space-y-4"><h2 className="text-2xl font-black">Mi Perfil</h2><Card><p className="font-bold text-lg">{user.name}</p><p className="text-gray-400">{user.city}</p></Card><Button fullWidth onClick={onLogout} variant="secondary">Cerrar sesión</Button></div>;

function buildFallbackRoute(o, d) {
  const n = 8;
  return Array.from({length:n}).map((_,i) => {
    const t = i/(n-1);
    return [o[0]+(d[0]-o[0])*t, o[1]+(d[1]-o[1])*t];
  });
}

function getDistance(p1, p2) {
  const R = 6371e3;
  const phi1 = p1[0] * Math.PI/180;
  const phi2 = p2[0] * Math.PI/180;
  const dPhi = (p2[0]-p1[0]) * Math.PI/180;
  const dLam = (p2[1]-p1[1]) * Math.PI/180;
  const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLam/2) * Math.sin(dLam/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function NavegacionActivaScreen({ ruta, userPos, onFinalizar, onCancelar, darkMode }) {
  const [instrIdx, setInstrIdx] = useState(0);
  const [routePts, setRoutePts] = useState([]);
  const [posActual, setPosActual] = useState(userPos||[-33.4489,-70.6693]);

  const FollowUser = () => {
    const map = useMap();
    useEffect(() => {
      map.flyTo(posActual, 17, { animate: true });
    }, [posActual, map]);
    return null;
  };

  const fetchRoute = useCallback(async (origin) => {
    const o = origin, d = ruta.destinoCoords||[-33.43, -70.62];
    const profile = ruta.medio === 'caminata' ? 'foot' : ruta.medio === 'bici' ? 'bike' : 'driving';
    try {
      const url = `https://router.project-osrm.org/route/v1/${profile}/${o[1]},${o[0]};${d[1]},${d[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes?.[0]) setRoutePts(data.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]));
      else setRoutePts(buildFallbackRoute(o,d));
    } catch { setRoutePts(buildFallbackRoute(o,d)); }
  }, [ruta.destinoCoords, ruta.medio]);

  useEffect(() => {
    fetchRoute(posActual);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(p => {
      const newPos = [p.coords.latitude, p.coords.longitude];
      setPosActual(newPos);
      if (routePts.length > 0) {
        const minDist = Math.min(...routePts.map(pt => getDistance(newPos, pt)));
        if (minDist > 50) {
          console.log("Recalculando ruta por desvío...");
          fetchRoute(newPos);
        }
      }
    }, null, { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(id);
  }, [routePts, fetchRoute]);

  const stepProgress = ((instrIdx + 1) / ruta.instrucciones.length) * 100;

  return (
    <div className="fixed inset-0 z-[3000] flex flex-col bg-slate-900">
      <div className="bg-slate-900 text-white px-5 pt-12 pb-6 flex flex-col gap-4 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#00C896] rounded-2xl flex items-center justify-center text-3xl shadow-lg">{ruta.emoji}</div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00C896] mb-1">Maniobra actual</p>
              <p className="font-black text-lg leading-tight truncate">{ruta.instrucciones[instrIdx]}</p>
            </div>
          </div>
          <button onClick={onCancelar} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors active:scale-90"><X size={28} strokeWidth={3} /></button>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative z-10">
          <div className="h-full bg-[#00C896] transition-all duration-700 ease-out" style={{ width: `${stepProgress}%` }} />
        </div>
      </div>

      <div className="flex-1 relative" style={{ minHeight: '300px' }}>
        <MapContainer
          center={posActual}
          zoom={17}
          scrollWheelZoom={true}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url={darkMode?'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png':'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'} />
          {routePts.length>1 && <Polyline positions={routePts} color="#00C896" weight={7} />}
          <Marker position={posActual} icon={customIcons.user} />
          <FollowUser />
        </MapContainer>
      </div>

      <div className="bg-white rounded-t-[40px] p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center px-2">
          <div><p className="text-2xl font-black">{ruta.time} min</p><p className="text-[10px] font-black text-gray-400 uppercase">Restante</p></div>
          <div className="text-right"><p className="text-2xl font-black text-[#00C896]">{ruta.distanciaKm} km</p><p className="text-[10px] font-black text-gray-400 uppercase">Distancia</p></div>
        </div>
        <div className="flex flex-col gap-3">
          <Button fullWidth onClick={onFinalizar} className="py-4 shadow-xl">¡He llegado! Finalizar viaje 🎉</Button>
          <button
            onClick={onCancelar}
            className="w-full py-3 rounded-xl bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
          >
            Finalizar viaje anticipado
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RutaVerde() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [onboardingComplete, setOnboardingComplete] = useState(storage.get('rv_onboarding', false));
  const [user, setUser] = useState(storage.get('rv_user', { name: '', city: 'Santiago' }));
  const [stats, setStats] = useState(storage.get('rv_stats', { points: 150, co2Total: 12.5, kmTotal: 45, rutasCount: 8 }));
  const [navegacionActiva, setNavegacionActiva] = useState(false);
  const [rutaActiva, setRutaActiva] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const { alertas } = useTrafficAlerts();
  const { pos: userPos } = useGeolocalizacion();

  const handleStartRoute = (r) => {
    setRutaActiva(r);
    setNavegacionActiva(true);
  };

  const handleFinalizarViaje = () => {
    if (!rutaActiva) return;
    const co2Evitado = metricas.calcularCO2Evitado(rutaActiva.distanciaKm, rutaActiva.medio);
    const puntosNuevos = metricas.calcularPuntos(co2Evitado, rutaActiva.distanciaKm);
    const newStats = { ...stats, points: stats.points + puntosNuevos, co2Total: stats.co2Total + co2Evitado, kmTotal: stats.kmTotal + rutaActiva.distanciaKm, rutasCount: stats.rutasCount + 1 };
    setStats(newStats);
    storage.set('rv_stats', newStats);
    setNavegacionActiva(false);
    setActiveTab('inicio');
  };

  if (!onboardingComplete) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 space-y-8">
        <Leaf size={64} className="text-[#00C896]" />
        <h1 className="text-4xl font-black text-center uppercase tracking-tighter">RUTA <span className="text-[#00C896]">VERDE</span></h1>
        <input type="text" placeholder="Tu nombre" value={user.name} onChange={e => setUser({...user, name: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl outline-none font-bold" />
        <Button fullWidth onClick={() => { storage.set('rv_onboarding', true); storage.set('rv_user', user); setOnboardingComplete(true); }}>Empezar</Button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F0FFF8] dark:bg-slate-950 font-['Inter']">
        {navegacionActiva && rutaActiva && (
          <NavegacionActivaScreen ruta={rutaActiva} userPos={userPos} onFinalizar={handleFinalizarViaje} onCancelar={() => setNavegacionActiva(false)} darkMode={false} />
        )}

        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 min-h-screen shadow-2xl flex flex-col relative overflow-hidden lg:border-x border-gray-100">
          <main className="flex-1 p-6 overflow-y-auto no-scrollbar">
            <div className="flex items-center gap-2 mb-8">
              <Leaf className="text-[#00C896]" size={24} />
              <span className="font-black text-xl tracking-tighter uppercase">RUTA <span className="text-[#00C896]">VERDE</span></span>
            </div>

            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              {activeTab === 'inicio' && <HomeComponent user={user} onNavigate={(t, c) => { setActiveTab(t); setDestCoords(c); }} stats={stats} alertas={alertas} />}
              {activeTab === 'rutas' && <RoutePlannerComponent onStart={handleStartRoute} destination={destCoords} darkMode={false} />}
              {activeTab === 'mapa' && <LiveMapScreen darkMode={false} onNavigateToRutas={(c) => { setDestCoords(c); setActiveTab('rutas'); }} />}
              {activeTab === 'puntos' && <GamificationScreen points={stats.points} />}
              {activeTab === 'perfil' && <ProfileScreen user={user} onLogout={() => { storage.clear(); window.location.reload(); }} />}
            </Suspense>
          </main>

          <nav className="h-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t flex items-center justify-around px-4 z-50">
            {[
              { id: 'inicio', icon: <Home />, label: 'Inicio' },
              { id: 'rutas', icon: <Milestone />, label: 'Rutas' },
              { id: 'mapa', icon: <MapIcon />, label: 'Mapa' },
              { id: 'puntos', icon: <Award />, label: 'Puntos' },
              { id: 'perfil', icon: <User />, label: 'Perfil' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-[#00C896] -translate-y-1' : 'text-gray-300'}`}>
                {React.cloneElement(tab.icon, { size: 24, strokeWidth: activeTab === tab.id ? 3 : 2 })}
                <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .leaflet-container { width: 100%; height: 100%; z-index: 1; }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}
