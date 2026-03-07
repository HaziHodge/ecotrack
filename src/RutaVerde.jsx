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

/**
 * RUTA VERDE - Chilean Sustainable Mobility SPA
 * Version: Professional Waze-Style Navigation
 * Provider: Leaflet + OSRM + Nominatim
 */

// --- UI COMPONENTS (Surgical definition to avoid ReferenceErrors) ---

const Button = ({ children, onClick, variant = 'primary', className = "", fullWidth = false, loading = false, disabled = false, ...props }) => {
  const variants = {
    primary: "bg-gradient-to-r from-[#00C896] to-[#00A87E] text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50",
    secondary: "bg-slate-900 text-white hover:bg-slate-800",
    ghost: "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
    outline: "border-2 border-[#00C896] text-[#00A87E] hover:bg-green-50 dark:hover:bg-green-900/10"
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-6 py-4 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {loading ? <RefreshCcw className="animate-spin" size={20} /> : children}
    </button>
  );
};

const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold focus:border-[#00C896] transition-all dark:text-white placeholder:text-slate-400 ${className}`}
    {...props}
  />
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-5 border border-slate-100 dark:border-slate-800 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, className = "" }) => (
  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${className}`}>
    {children}
  </span>
);

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl ${className}`} />
);

// --- UTILS & HOOKS ---

const storage = {
  get: (key, fallback = null) => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch { return fallback; }
  },
  set: (key, value) => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  },
  clear: () => window.localStorage.clear()
};

function useGeolocalizacion() {
  const [estado, setEstado] = useState({ pos: [-33.4489, -70.6693], permiso: 'sin-solicitar' });
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setEstado({ pos: [p.coords.latitude, p.coords.longitude], permiso: 'ok' }),
      () => setEstado(prev => ({ ...prev, permiso: 'denegado' })),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  return estado;
}

const metricas = {
  calcularCO2Evitado: (km, modo) => {
    // Logic: 0.12kg saved per km compared to average car
    if (['caminata', 'bici', 'scooter', 'metro', 'micro'].includes(modo)) {
       return km * 0.12;
    }
    return 0;
  },
  calcularPuntos: (co2, km) => Math.round(co2 * 100 + km * 10)
};

// --- CONFIGURACIÓN DE MAPA ---

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customIcons = {
  user: L.divIcon({
    className: '',
    html: `<div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
    iconSize: [24, 24], iconAnchor: [12, 12]
  }),
  destination: L.divIcon({
    className: '',
    html: `<div class="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white animate-bounce text-xs font-bold">📍</div>`,
    iconSize: [32, 32], iconAnchor: [16, 32]
  })
};

const METRO_LINES = [
  { name: 'L1', color: '#FF0000', coords: [[-33.4258,-70.6580],[-33.4268,-70.6510],[-33.4278,-70.6440],[-33.4290,-70.6380],[-33.4310,-70.6315],[-33.4315,-70.6275],[-33.4339,-70.6228],[-33.4360,-70.6178],[-33.4376,-70.6130],[-33.4389,-70.6088],[-33.4400,-70.6046],[-33.4404,-70.6011]] },
  { name: 'L2', color: '#FFD700', coords: [[-33.3693,-70.6392],[-33.3820,-70.6388],[-33.3960,-70.6384],[-33.4100,-70.6396],[-33.4230,-70.6420],[-33.4370,-70.6445],[-33.4450,-70.6458]] },
  { name: 'L3', color: '#8B4513', coords: [[-33.3600,-70.6800],[-33.3800,-70.6700],[-33.4000,-70.6600],[-33.4200,-70.6500]] },
  { name: 'L4', color: '#0055A4', coords: [[-33.3800,-70.5700],[-33.3990,-70.5810],[-33.4110,-70.5840],[-33.4180,-70.5818]] },
  { name: 'L5', color: '#008000', coords: [[-33.4490,-70.7200],[-33.4490,-70.7040],[-33.4490,-70.6880],[-33.4490,-70.6720]] },
  { name: 'L6', color: '#9400D3', coords: [[-33.4020,-70.6290],[-33.4140,-70.6130],[-33.4260,-70.5990],[-33.4380,-70.5850]] }
];

const BICI_STATIONS = [
  { id:1, pos:[-33.4369,-70.6509], name:"BipBici Plaza de Armas", disp:8 },
  { id:2, pos:[-33.4399,-70.5894], name:"BipBici Tobalaba", disp:5 },
  { id:3, pos:[-33.4552,-70.6826], name:"BipBici Estación Central", disp:12 }
];

// --- MAP COMPONENT ---

const CityMap = ({
  className = "", showMetro = true, destination = null, darkMode = false,
  modoTransporte = 'driving', onSearchSelect = null, centerTrigger = 0,
  routePreviewPoints = [],
}) => {
  const { pos } = useGeolocalizacion();
  const [zoomLevel, setZoomLevel] = useState(14);
  const [mapQuery, setMapQuery] = useState('');
  const [mapSuggestions, setMapSuggestions] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [localRoute, setLocalRoute] = useState([]);

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
    try {
      const profile = modoTransporte === 'caminata' ? 'foot' : modoTransporte === 'bici' ? 'cycling' : 'driving';
      const url = `https://router.project-osrm.org/route/v1/${profile}/${pos[1]},${pos[0]};${s.lon},${s.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes?.[0]) setLocalRoute(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
    } catch { setLocalRoute([]); }
  }, [pos, onSearchSelect, modoTransporte]);

  const MapLogic = ({ dest, trigger }) => {
    const map = useMap();
    const prevTrigger = useRef(0);
    useEffect(() => { if (dest) map.flyTo(dest, 16, { animate: true }); }, [dest, map]);
    useEffect(() => { if (trigger > prevTrigger.current) { map.flyTo(pos, 16, { animate: true }); prevTrigger.current = trigger; } }, [trigger, map, pos]);
    return null;
  };

  const pts = routePreviewPoints.length > 0 ? routePreviewPoints : localRoute;

  return (
    <div className={`relative bg-slate-100 dark:bg-slate-900 w-full h-full overflow-hidden ${className}`}>
      <div className="absolute top-3 left-3 right-3 z-[2000]">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 px-4 py-3">
          {searchBusy ? <RefreshCcw size={16} className="animate-spin text-[#00C896]" /> : <Search size={16} className="text-[#00C896]" />}
          <input
            type="text" placeholder="¿A dónde vas?" value={mapQuery}
            onChange={e => handleMapSearch(e.target.value)}
            className="bg-transparent flex-1 text-sm font-bold outline-none dark:text-white"
          />
          {mapQuery && <X size={14} className="text-slate-400 cursor-pointer" onClick={() => { setMapQuery(''); setMapSuggestions([]); setLocalRoute([]); }} />}
        </div>
        {mapSuggestions.length > 0 && (
          <div className="mt-1 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            {mapSuggestions.map((s,i) => (
              <div key={i} onMouseDown={() => handleSelectSuggestion(s)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-50 dark:border-slate-700 last:border-none">
                <MapPin size={13} className="text-[#00C896]" />
                <div className="min-w-0">
                  <p className="font-bold text-xs truncate dark:text-white">{s.display_name.split(',')[0]}</p>
                  <p className="text-[10px] text-slate-400 truncate">{s.display_name.split(',').slice(1,3).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MapContainer center={pos} zoom={14} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer attribution="&copy; CARTO" url={mapUrl} />
        <MapLogic dest={destination} trigger={centerTrigger} />
        <ZoomTracker />

        {pts.length > 1 && <>
          <Polyline positions={pts} color="#00C896" weight={7} opacity={1} />
          <Polyline positions={pts} color="#1A1A2E" weight={10} opacity={0.1} />
        </>}

        {showMetro && zoomLevel > 13 && METRO_LINES.map(l => (
          <Polyline key={l.name} positions={l.coords} color={l.color} weight={5} opacity={0.65} />
        ))}

        {zoomLevel > 14 && BICI_STATIONS.map(s => (
          <Marker key={s.id} position={s.pos} icon={L.divIcon({ html: '🚴', className: 'text-lg shadow-lg' })}>
            <Popup><p className="font-bold text-xs">{s.name}<br/><span className="text-[#00C896]">{s.disp} bicis</span></p></Popup>
          </Marker>
        ))}

        <Marker position={pos} icon={customIcons.user} />
        {destination && <Marker position={destination} icon={customIcons.destination} />}
      </MapContainer>
    </div>
  );
};

// --- NAVIGATION SCREEN ---

function getDistance(p1, p2) {
  const R = 6371e3;
  const phi1 = p1[0] * Math.PI/180;
  const phi2 = p2[0] * Math.PI/180;
  const dPhi = (p2[0]-p1[0]) * Math.PI/180;
  const dLam = (p2[1]-p1[1]) * Math.PI/180;
  const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLam/2) * Math.sin(dLam/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const NavegacionActivaScreen = ({ ruta, userPos, onFinalizar, onCancelar, darkMode }) => {
  const [routePts, setRoutePts] = useState([]);
  const [posActual, setPosActual] = useState(userPos);

  const fetchNavRoute = useCallback(async (origin) => {
    const profile = ruta.medio === 'caminata' ? 'foot' : ruta.medio === 'bici' ? 'cycling' : 'driving';
    try {
      const url = `https://router.project-osrm.org/route/v1/${profile}/${origin[1]},${origin[0]};${ruta.destinoCoords[1]},${ruta.destinoCoords[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes?.[0]) setRoutePts(data.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]));
    } catch { setRoutePts([]); }
  }, [ruta]);

  useEffect(() => { fetchNavRoute(posActual); }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(p => {
      const newPos = [p.coords.latitude, p.coords.longitude];
      setPosActual(newPos);
      if (routePts.length > 0) {
        const dist = Math.min(...routePts.map(pt => getDistance(newPos, pt)));
        if (dist > 40) fetchNavRoute(newPos);
      }
    }, null, { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(id);
  }, [routePts, fetchNavRoute]);

  const FollowUser = () => {
    const map = useMap();
    useEffect(() => { map.flyTo(posActual, 17, { animate: true }); }, [posActual, map]);
    return null;
  };

  return (
    <div className="fixed inset-0 z-[3000] flex flex-col bg-slate-900">
      {/* Banner de Navegación Profesional */}
      <div className="bg-slate-900 text-white px-5 pt-12 pb-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#00C896] rounded-2xl flex items-center justify-center text-3xl shadow-lg">{ruta.emoji}</div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00C896] mb-1">Próxima Maniobra</p>
            <p className="font-black text-lg leading-tight">En 200m dobla a la derecha</p>
          </div>
        </div>
        <button onClick={onCancelar} className="w-14 h-14 bg-slate-800 hover:bg-slate-700 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-xl">
          <X size={28} strokeWidth={3} />
        </button>
      </div>

      <div className="flex-1 relative">
        <MapContainer center={posActual} zoom={17} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url={darkMode ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'} />
          {routePts.length > 1 && <Polyline positions={routePts} color="#00C896" weight={8} />}
          <Marker position={posActual} icon={customIcons.user} />
          <FollowUser />
        </MapContainer>
      </div>

      {/* Panel Inferior Navegación */}
      <div className="bg-white dark:bg-slate-900 p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] rounded-t-[40px] space-y-6">
        <div className="flex justify-around items-center">
          <div className="text-center">
            <p className="text-2xl font-black dark:text-white">{ruta.time} min</p>
            <p className="text-[10px] font-black text-slate-400 uppercase">Tiempo</p>
          </div>
          <div className="w-px h-10 bg-slate-100 dark:bg-slate-800" />
          <div className="text-center">
            <p className="text-2xl font-black text-[#00C896]">{ruta.distanciaKm} km</p>
            <p className="text-[10px] font-black text-slate-400 uppercase">Distancia</p>
          </div>
          <div className="w-px h-10 bg-slate-100 dark:bg-slate-800" />
          <div className="text-center">
            <p className="text-2xl font-black text-[#FFD93D]">{ruta.co2.toFixed(1)}kg</p>
            <p className="text-[10px] font-black text-slate-400 uppercase">Ahorro CO₂</p>
          </div>
        </div>
        <Button fullWidth onClick={onFinalizar} className="py-5 shadow-xl">¡He llegado! Finalizar viaje 🎉</Button>
      </div>
    </div>
  );
};

// --- SCREENS ---

const HomeComponent = ({ user, onNavigate, stats }) => (
  <div className="space-y-6 pb-40">
    <header className="flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-black dark:text-white tracking-tight">Hola, {user.name} 👋</h1>
        <p className="text-slate-500 font-bold text-sm mt-1">{user.city}, Chile</p>
      </div>
      <button className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-xl border border-slate-100 dark:border-slate-700">
        <Bell size={24} className="dark:text-white" />
      </button>
    </header>
    <Card className="!p-6 space-y-4 border-none shadow-2xl">
      <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
        <Search size={20} className="text-slate-400" />
        <input type="text" placeholder="¿A dónde vas?" className="bg-transparent w-full outline-none font-bold dark:text-white" onFocus={() => onNavigate('mapa')} />
      </div>
      <Button fullWidth onClick={() => onNavigate('mapa')}><Search size={20} strokeWidth={3} /> Buscar destino</Button>
    </Card>
    <div className="grid grid-cols-3 gap-4">
      {[{ label: 'CO₂', val: stats.co2Total.toFixed(1), c: 'text-[#00C896]' }, { label: 'PTS', val: stats.points, c: 'text-[#FFD93D]' }, { label: 'KM', val: stats.kmTotal.toFixed(1), c: 'text-blue-400' }].map(s => (
        <Card key={s.label} className="text-center !p-4 border-none shadow-lg">
          <p className={`text-2xl font-black ${s.c}`}>{s.val}</p>
          <p className="text-[8px] font-black uppercase text-slate-400 mt-1">{s.label}</p>
        </Card>
      ))}
    </div>
  </div>
);

const RoutePlannerScreen = ({ onStart, destination, darkMode }) => {
  const [selected, setSelected] = useState('bici');
  const [starting, setStarting] = useState(false);
  const baseRoutes = [
    { id:'caminata', label:'A pie', emoji:'🚶', hex:'#00C896', co2f:0, cost:0, t:65 },
    { id:'bici', label:'Bicicleta', emoji:'🚴', hex:'#3B82F6', co2f:0, cost:350, t:22 },
    { id:'metro', label:'Metro', emoji:'🚇', hex:'#FF0000', co2f:0.03, cost:780, t:40 }
  ].map(m => ({ ...m, co2: 5.2 * 0.12, distanciaKm: 5.2, medio: m.id, destinoCoords: destination }));

  return (
    <div className="space-y-4 pb-32">
      <div className="h-64 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner">
        <CityMap destination={destination} darkMode={darkMode} modoTransporte={selected} />
      </div>
      <h2 className="text-xl font-black dark:text-white">Rutas sostenibles</h2>
      <div className="space-y-3">
        {baseRoutes.map(r => (
          <div key={r.id} onClick={() => setSelected(r.id)} className={`p-4 rounded-3xl border-2 transition-all cursor-pointer ${selected===r.id?'border-[#00C896] bg-green-50 dark:bg-green-900/10':'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{r.emoji}</span>
                <div>
                  <h3 className="font-black text-sm dark:text-white">{r.label}</h3>
                  <p className="text-[10px] font-bold text-slate-400">{r.t} min · ${r.cost}</p>
                </div>
              </div>
              <p className="text-[10px] font-black text-[#00C896]">{r.co2.toFixed(2)}kg ahorrados</p>
            </div>
          </div>
        ))}
      </div>
      <Button fullWidth onClick={() => { setStarting(true); setTimeout(() => { setStarting(false); onStart(baseRoutes.find(x=>x.id===selected)); }, 800); }} loading={starting}><Navigation size={20} strokeWidth={3} /> Iniciar viaje</Button>
    </div>
  );
};

// --- APP ROOT ---

export default function RutaVerde() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [onboardingComplete, setOnboardingComplete] = useState(storage.get('rv_onboarding', false));
  const [user, setUser] = useState(storage.get('rv_user', { name: '', city: 'Santiago' }));
  const [stats, setStats] = useState(storage.get('rv_stats', { points: 150, co2Total: 12.5, kmTotal: 45, rutasCount: 8 }));
  const [navegacionActiva, setNavegacionActiva] = useState(false);
  const [rutaActiva, setRutaActiva] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const { pos: userPos } = useGeolocalizacion();

  const handleStartRoute = (r) => { if (destCoords) { setRutaActiva(r); setNavegacionActiva(true); } else { setActiveTab('mapa'); } };
  const handleFinalizar = () => {
    if (!rutaActiva) return;
    const co2 = metricas.calcularCO2Evitado(rutaActiva.distanciaKm, rutaActiva.medio);
    const newStats = {
      ...stats,
      points: stats.points + metricas.calcularPuntos(co2, rutaActiva.distanciaKm),
      co2Total: stats.co2Total + co2,
      kmTotal: stats.kmTotal + rutaActiva.distanciaKm,
      rutasCount: stats.rutasCount + 1
    };
    setStats(newStats); storage.set('rv_stats', newStats);
    setNavegacionActiva(false); setActiveTab('inicio');
  };

  if (!onboardingComplete) return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-8 space-y-8">
      <Leaf size={64} className="text-[#00C896] animate-bounce" />
      <h1 className="text-4xl font-black text-center dark:text-white uppercase tracking-tighter">RUTA <span className="text-[#00C896]">VERDE</span></h1>
      <Input placeholder="¿Cómo te llamas?" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
      <Button fullWidth onClick={() => { storage.set('rv_onboarding', true); storage.set('rv_user', user); setOnboardingComplete(true); }}>Empezar aventura</Button>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F0FFF8] dark:bg-slate-950 font-['Inter'] transition-colors duration-500">
        {navegacionActiva && rutaActiva && (
          <NavegacionActivaScreen ruta={rutaActiva} userPos={userPos} onFinalizar={handleFinalizar} onCancelar={() => setNavegacionActiva(false)} darkMode={false} />
        )}
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 min-h-screen shadow-2xl flex flex-col relative overflow-hidden lg:border-x border-slate-100 dark:border-slate-800">
          <main className="flex-1 p-6 overflow-y-auto no-scrollbar">
            <div className="flex items-center gap-2 mb-8 select-none" onClick={() => setActiveTab('inicio')}>
              <Leaf className="text-[#00C896]" size={24} />
              <span className="font-black text-xl tracking-tighter uppercase dark:text-white">RUTA <span className="text-[#00C896]">VERDE</span></span>
            </div>
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
              {activeTab === 'inicio' && <HomeComponent user={user} onNavigate={setActiveTab} stats={stats} />}
              {activeTab === 'rutas' && <RoutePlannerScreen onStart={handleStartRoute} destination={destCoords} darkMode={false} />}
              {activeTab === 'mapa' && <div className="h-[75vh] -mx-6 -mt-10 relative"><CityMap darkMode={false} onSearchSelect={(c) => { setDestCoords(c); setActiveTab('rutas'); }} /></div>}
              {activeTab === 'puntos' && <div className="p-8 text-center animate-fade-in"><Award size={64} className="mx-auto text-[#FFD93D] mb-4" /><h2 className="text-2xl font-black dark:text-white">Mis Puntos</h2><p className="text-5xl font-black text-[#00C896] mt-4">{stats.points}</p></div>}
              {activeTab === 'perfil' && <div className="p-8 space-y-4 animate-fade-in"><h2 className="text-2xl font-black dark:text-white">Mi Perfil</h2><Card><p className="font-bold text-lg dark:text-white">{user.name}</p><p className="text-slate-400">{user.city}</p></Card><Button fullWidth onClick={() => { storage.clear(); window.location.reload(); }} variant="secondary">Cerrar sesión</Button></div>}
            </Suspense>
          </main>
          <nav className="h-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 flex items-center justify-around px-4 z-50">
            {[{id:'inicio', i:<Home/>, l:'Inicio'}, {id:'rutas', i:<Milestone/>, l:'Rutas'}, {id:'mapa', i:<MapIcon/>, l:'Mapa'}, {id:'puntos', i:<Award/>, l:'Puntos'}, {id:'perfil', i:<User/>, l:'Perfil'}].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-[#00C896] -translate-y-1' : 'text-slate-300 dark:text-slate-600'}`}>
                {React.cloneElement(tab.i, { size: 24, strokeWidth: activeTab === tab.id ? 3 : 2 })}
                <span className="text-[8px] font-black uppercase tracking-widest">{tab.l}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .leaflet-container { width: 100%; height: 100%; z-index: 1; }`}</style>
    </ErrorBoundary>
  );
}
