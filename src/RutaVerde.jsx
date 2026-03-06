import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Home, Map as MapIcon, Milestone, Award, User, Search, ArrowLeftRight,
  Leaf, Star, Zap, Navigation, Bell, ChevronRight, CheckCircle2,
  Bike, Train, Car, Smartphone, Settings, LogOut, Info, AlertTriangle,
  Menu, X, Filter, Locate, Heart, Calendar, Clock, DollarSign, TrendingUp,
  Wind, MapPin, Layers, Coffee, Ticket, Footprints, ShieldCheck, QrCode,
  Eye, Trophy
} from 'lucide-react';

// Utils & Hooks
import storage from './utils/storage';
import { useGeolocalizacion } from './hooks/useGeolocalizacion';
import * as metricas from './utils/metricas';
import ErrorBoundary from './components/ErrorBoundary';
import { trackEvent } from './utils/vitals';

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

const METRO_LINES = [
  { name: 'L1', color: '#f44336', coords: [[-33.4447, -70.6874], [-33.4442, -70.6511], [-33.4312, -70.6094], [-33.4144, -70.5815]] },
  { name: 'L2', color: '#ffeb3b', coords: [[-33.4012, -70.6434], [-33.4489, -70.6511], [-33.5012, -70.6588]] },
  { name: 'L5', color: '#4caf50', coords: [[-33.4612, -70.7434], [-33.4442, -70.6511], [-33.4812, -70.5934]] }
];

const BICI_STATIONS = [
  { id: 1, pos: [-33.4372, -70.6506], name: "Plaza de Armas" },
  { id: 2, pos: [-33.4312, -70.6094], name: "Tobalaba" },
  { id: 3, pos: [-33.4447, -70.6874], name: "Estación Central" }
];

const CityMap = ({ className = "", showMetro = true, showBici = true, showScooter = true, destination = null, city = "Santiago", darkMode = false }) => {
  const { pos, permiso } = useGeolocalizacion();
  const [tileError, setTileError] = useState(false);

  const mapUrl = darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const scooterPositions = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    pos: [
      pos[0] + (Math.random() - 0.5) * 0.04,
      pos[1] + (Math.random() - 0.5) * 0.04
    ]
  })), [pos]);

  const RecenterMap = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
      if (coords) map.setView(coords, 15, { animate: true });
    }, [coords, map]);
    return null;
  };

  return (
    <div className={`relative bg-[#F8FAF9] dark:bg-slate-900 w-full h-full overflow-hidden ${className}`}>
      {permiso === 'denegado' && (
        <div className="absolute top-16 left-4 right-4 z-[1000] bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 p-3 rounded-xl flex items-center gap-3 animate-slide-down">
           <Locate size={18} className="text-yellow-600" />
           <p className="text-[10px] font-bold text-yellow-800 dark:text-yellow-200">📍 Activa la ubicación en tu navegador para ver tu posición real.</p>
        </div>
      )}

      {tileError && (
        <div className="absolute inset-0 z-[2000] bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center p-8 text-center">
           <Wind size={48} className="text-slate-400 mb-4 animate-pulse" />
           <h3 className="font-black text-xl mb-2">Mapa no disponible</h3>
           <p className="text-sm text-gray-500 mb-6">Parece que no tienes conexión o los servicios de mapas están caídos.</p>
           <button onClick={() => setTileError(false)} className="bg-[#00C896] text-white px-6 py-3 rounded-xl font-bold">Reintentar</button>
        </div>
      )}

      <div className="absolute top-4 left-4 z-[1000] bg-white/80 dark:bg-slate-800/80 backdrop-blur px-3 py-1 rounded-full border border-gray-100 dark:border-slate-700 shadow-md">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#00C896] flex items-center gap-1">
          <MapPin size={10} /> {city} • Mapa en vivo
        </p>
      </div>

      <MapContainer center={pos} zoom={13} scrollWheelZoom={false} className="w-full h-full" zoomControl={false}>
        <TileLayer
          attribution='&copy; CARTO'
          url={mapUrl}
          eventHandlers={{ tileerror: () => setTileError(true) }}
        />

        {showMetro && METRO_LINES.map(line => (
          <Polyline key={line.name} positions={line.coords} color={line.color} weight={5} opacity={0.7} />
        ))}

        {showBici && BICI_STATIONS.map(s => (
          <Marker key={s.id} position={s.pos} icon={customIcons.bici}>
            <Popup><p className="font-bold text-xs">{s.name}</p></Popup>
          </Marker>
        ))}

        {showScooter && scooterPositions.map(s => (
          <Marker key={s.id} position={s.pos} icon={customIcons.scooter} />
        ))}

        <Marker position={pos} icon={customIcons.user} />

        {destination && (
          <>
            <Marker position={destination} icon={customIcons.destination} />
            <RecenterMap coords={destination} />
          </>
        )}

        <Marker position={[-33.4442, -70.6511]} icon={customIcons.alert} />
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

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-slate-800 rounded-3xl ${className}`}></div>
);

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

const Card = ({ children, className = "", delay = 0 }) => (
  <div
    style={{ animationDelay: `${delay}ms` }}
    className={`bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-green-900/5 p-5 border border-white/20 dark:border-slate-800 hover:scale-[1.01] transition-all duration-300 animate-slide-up fill-mode-forwards ${className}`}
  >
    {children}
  </div>
);

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

// Dynamic imports for screens
const HomeScreen = ({ user, onNavigate, stats, darkMode }) => <HomeComponent user={user} onNavigate={onNavigate} stats={stats} darkMode={darkMode} />;
const RoutePlanner = ({ onStart, destination, darkMode }) => <RoutePlannerComponent onStart={onStart} destination={destination} darkMode={darkMode} />;
const LiveMapScreen = ({ darkMode }) => <LiveMapComponent darkMode={darkMode} />;
const GamificationScreen = ({ points, showToast, redeeming, setRedeeming, co2Total }) => <GamificationComponent points={points} showToast={showToast} redeeming={redeeming} setRedeeming={setRedeeming} co2Total={co2Total} />;
const ProfileScreen = ({ user, stats, onLogout, darkMode, setDarkMode }) => <ProfileComponent user={user} stats={stats} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode} />;

// --- PANTALLAS ---

const HomeComponent = ({ user, onNavigate, stats, darkMode }) => {
  const ALERTAS_DEMO = [
    "🚧 Obras en Av. Providencia entre Bustamante y Pedro de Valdivia",
    "🚇 Metro L1: operación normal esta mañana",
    "🚌 Micro 301 con 5 min de retraso dirección Las Condes",
    "✅ Corredor Alameda sin incidentes reportados",
    "🌧️ Lluvia ligera prevista. Recuerda llevar impermeable 🧥"
  ];
  const alertaHoy = useMemo(() =>
    ALERTAS_DEMO[new Date().getDay() % ALERTAS_DEMO.length], []);

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
            <input
              type="text"
              placeholder="¿Desde dónde?"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-transparent w-full focus:outline-none text-[#0D1B2A] dark:text-white font-bold placeholder:text-gray-400 dark:placeholder:text-slate-600"
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
            <input
              type="text"
              placeholder="¿A dónde?"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
              className="bg-transparent w-full focus:outline-none text-[#0D1B2A] dark:text-white font-bold placeholder:text-gray-400 dark:placeholder:text-slate-600"
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

      <div className="bg-[#FF6B6B]/10 dark:bg-red-900/20 border border-[#FF6B6B]/20 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
        <div className="w-10 h-10 bg-[#FF6B6B] rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-500/20"><AlertTriangle size={20} /></div>
        <p className="text-xs font-bold text-[#FF6B6B] leading-tight">{alertaHoy}</p>
      </div>

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

  useEffect(() => {
    setCoords(destination);
  }, [destination]);

  const [selected, setSelected] = useState('verde');
  const [filter, setFilter] = useState('greener');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const baseRoutes = [
    { id: 'verde', title: 'RUTA VERDE', sub: 'Micro + Metro', time: 45, cost: 800, co2: 0.2, co2Level: 15, color: 'bg-[#00C896]', icon: <Leaf size={20} />, realTime: "Micro 301 en 4 min" },
    { id: 'rapida', title: 'RUTA RÁPIDA', sub: 'Auto compartido', time: 28, cost: 2500, co2: 1.8, co2Level: 75, color: 'bg-[#FFD93D]', icon: <Zap size={20} />, realTime: "Auto a 2 km" },
    { id: 'activa', title: 'RUTA ACTIVA', sub: 'Bici + Metro', time: 52, cost: 350, co2: 0, co2Level: 5, color: 'bg-blue-400', icon: <Bike size={20} />, realTime: "12 bicis libres" },
  ];

  const filteredRoutes = useMemo(() => {
    const sorted = [...baseRoutes];
    if (filter === 'faster') sorted.sort((a, b) => a.time - b.time);
    if (filter === 'cheaper') sorted.sort((a, b) => a.cost - b.cost);
    if (filter === 'greener') sorted.sort((a, b) => a.co2 - b.co2);
    return sorted;
  }, [filter]);

  const handleStartRoute = () => {
    setStarting(true);
    trackEvent('Navigation', 'start_route', selected);
    setTimeout(() => {
      setStarting(false);
      onStart();
    }, 1500);
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
            <div key={r.id} onClick={() => setSelected(r.id)} style={{ animationDelay: `${i * 100}ms` }} className={`p-4 rounded-[28px] border-2 transition-all cursor-pointer animate-slide-up fill-mode-forwards ${selected === r.id ? 'border-[#00C896] bg-green-50 dark:bg-green-900/10 shadow-lg' : 'border-gray-50 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md ${r.color}`}>{React.cloneElement(r.icon, { size: 18 })}</div>
                  <div><h3 className="font-black text-sm text-[#0D1B2A] dark:text-white">{r.title}</h3><p className="text-[10px] text-[#6B7280] dark:text-slate-500 font-bold">{r.sub}</p></div>
                </div>
                <div className="text-right">
                   <p className="font-black text-lg text-[#0D1B2A] dark:text-white leading-none">{r.time} min</p>
                   <p className="text-[10px] text-[#6B7280] dark:text-slate-500 font-bold mt-0.5 uppercase tracking-widest">${r.cost}</p>
                </div>
              </div>
              <div className="flex justify-between items-center mb-2">
                 <div className="w-[70%] h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${selected === r.id ? 'bg-[#00C896]' : 'bg-gray-200 dark:bg-slate-700'}`} style={{ width: `${r.co2Level}%` }}></div>
                 </div>
                 <span className="text-[8px] font-black text-[#00C896] animate-pulse">{r.realTime}</span>
              </div>
            </div>
          ))}
        </div>
        <Button fullWidth onClick={handleStartRoute} loading={starting} className="py-4 shadow-2xl relative z-[100]"><Navigation size={20} strokeWidth={3} /> Iniciar ruta</Button>
      </div>
    </div>
  );
};

const LiveMapComponent = ({ darkMode }) => {
  const [layers, setLayers] = useState({ metro: true, bici: true, scooter: true });
  const [showAlerts, setShowAlerts] = useState(false);

  const alerts = [
    { id: 1, text: "🚧 Corte Av. Libertador Bernardo O'Higgins", status: "Importante" },
    { id: 2, text: "🚌 Demora en corredor Alameda", status: "Retraso" },
    { id: 3, text: "✅ Metro L1 funcionando normal", status: "OK" }
  ];

  const user = useMemo(() => storage.get('rv_user', { city: 'Santiago' }), []);

  return (
    <div className="h-full -mx-5 -mt-8 flex flex-col relative overflow-hidden">
      <div className="flex-grow relative h-full leaflet-container-wrapper">
        <CityMap showMetro={layers.metro} showBici={layers.bici} showScooter={layers.scooter} city={user.city} darkMode={darkMode} />

        <div className="absolute top-6 left-6 right-6 flex gap-2 z-[1000] overflow-x-auto no-scrollbar">
          {Object.entries(layers).map(([key, val]) => (
            <button key={key} onClick={() => setLayers({...layers, [key]: !val})} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all border ${val ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]' : 'bg-white text-[#1A1A2E] border-gray-100 dark:bg-slate-800 dark:text-white dark:border-slate-700'}`}>
              {key}
            </button>
          ))}
          <button onClick={() => setShowAlerts(!showAlerts)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all border bg-red-500 text-white shrink-0`}>
             {showAlerts ? 'Cerrar Alertas' : 'Alertas'}
          </button>
        </div>

        <button className="absolute bottom-24 right-6 z-[1000] w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-2xl border border-gray-100 dark:border-slate-700 text-[#00C896] hover:scale-110 active:scale-90 transition-all">
           <Locate size={24} />
        </button>

        <div className={`absolute top-0 right-0 h-full w-72 bg-white dark:bg-slate-900 z-[2000] shadow-2xl transition-transform duration-500 border-l border-gray-100 dark:border-slate-800 p-6 space-y-6 ${showAlerts ? 'translate-x-0' : 'translate-x-full'}`}>
           <div className="flex justify-between items-center">
              <h3 className="font-black text-xl">Alertas en vivo</h3>
              <button onClick={() => setShowAlerts(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all"><X size={20} /></button>
           </div>
           <div className="space-y-4">
              {alerts.map(a => (
                <div key={a.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
                   <p className="text-xs font-bold mb-1">{a.text}</p>
                   <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${a.status === 'Importante' ? 'bg-red-100 text-red-600' : a.status === 'OK' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{a.status}</span>
                </div>
              ))}
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
    if (savedStats) setStats(savedStats);
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

  const handleStartRoute = () => {
    showToast("¡Ruta iniciada! Sumarás puntos al llegar. 🚲");
    setActiveTab('mapa');

    // Simulate completion after 4s
    setTimeout(() => {
      const co2Evitado = metricas.calcularCO2Evitado(5, 'metro');
      const puntosNuevos = metricas.calcularPuntos(co2Evitado, 5);

      const newStats = {
        ...stats,
        points: stats.points + puntosNuevos,
        co2Total: stats.co2Total + co2Evitado,
        kmTotal: stats.kmTotal + 5,
        rutasCount: stats.rutasCount + 1
      };

      setStats(newStats);
      storage.set('rv_stats', newStats);
      showToast(`¡Viaje completado! +${puntosNuevos} puntos 🌱`);
    }, 4000);
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
        {activeTab === 'inicio' && <HomeScreen user={user} onNavigate={handleNavigate} stats={stats} darkMode={darkMode} />}
        {activeTab === 'rutas' && <RoutePlanner onStart={handleStartRoute} destination={destCoords} darkMode={darkMode} />}
        {activeTab === 'mapa' && <LiveMapScreen darkMode={darkMode} />}
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
                  </div>
                  {tab.badge && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>}
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="hidden lg:block flex-grow bg-[#F0FFF8] dark:bg-slate-950 p-10 overflow-hidden relative">
            <div className="h-full rounded-[60px] overflow-hidden border-[16px] border-white dark:border-slate-800 shadow-2xl relative transition-colors duration-500 leaflet-container-wrapper">
              <CityMap city={user.city} darkMode={darkMode} />
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
