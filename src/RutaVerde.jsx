import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, CircleMarker, Tooltip } from 'react-leaflet';
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

// --- LEAFLET ICONS FIX ---
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// --- CONSTANTS SANTIAGO INFRASTRUCTURE ---
const METRO_LINES = [
  { name: 'L1', color: '#E30613', weight: 6, coords: [
    [-33.4501,-70.7061],[-33.4500,-70.6924],[-33.4491,-70.6787], // San Pablo→Pudahuel→Bello
    [-33.4489,-70.6693],[-33.4480,-70.6599],[-33.4468,-70.6558], // La Moneda→Los Héroes→República
    [-33.4447,-70.6512],[-33.4411,-70.6402],[-33.4372,-70.6328], // Santa Lucía→U. Católica→Baquedano
    [-33.4312,-70.6189],[-33.4274,-70.6111],[-33.4231,-70.6062], // Salvador→M. Montt→P. de Valdivia
    [-33.4190,-70.5977],[-33.4144,-70.5837],[-33.4076,-70.5689]  // Los Leones→Tobalaba→Escuela Militar
  ]},
  { name: 'L2', color: '#F6AD00', weight: 6, coords: [
    [-33.4334,-70.6503],[-33.4365,-70.6489],[-33.4402,-70.6475], // Cal y Canto→Santa Ana→Los Héroes
    [-33.4534,-70.6323],[-33.4688,-70.6121],[-33.4801,-70.6056]  // Franklin→Lo Ovalle→La Cisterna
  ]},
  { name: 'L3', color: '#8E4D1E', weight: 6, coords: [
    [-33.4334,-70.6503],[-33.4401,-70.6456],[-33.4455,-70.6399], // Cal y Canto→Pza de Armas→U. de Chile
    [-33.4512,-70.6321],[-33.4601,-70.5989]                      // Parque Almagro→Matta
  ]},
  { name: 'L4', color: '#006FB9', weight: 6, coords: [
    [-33.4144,-70.5837],[-33.4281,-70.5736],[-33.4395,-70.5389], // Tobalaba→Cristóbal Colón→Fco. Bilbao
    [-33.4678,-70.5123],[-33.4891,-70.4822],[-33.5123,-70.4678]  // Pza. Egaña→Quilín→V. Mackenna
  ]},
  { name: 'L5', color: '#00A14E', weight: 6, coords: [
    [-33.4521,-70.5778],[-33.4490,-70.6012],[-33.4411,-70.6231], // Baquedano→Pque. Bustamante→Sta. Isabel
    [-33.4634,-70.6089],[-33.4822,-70.6543],[-33.5123,-70.7678]  // Irarrázaval→Ñuble→Pza. Maipú
  ]},
  { name: 'L6', color: '#A3238E', weight: 6, coords: [
    [-33.4172,-70.5985],[-33.4437,-70.6065],[-33.4534,-70.6212], // Los Leones→Inés de Suárez→Ñuñoa
    [-33.4611,-70.6432],[-33.4721,-70.6654],[-33.4889,-70.7012]  // Franklin→Bío Bío→Cerrillos
  ]}
];

const BICI_STATIONS = [
  { id: 1, pos: [-33.4369, -70.6509], name: "BipBici Plaza de Armas", info: "Estado: Operativo", disponibles: 8 },
  { id: 2, pos: [-33.4399, -70.5894], name: "BipBici Tobalaba", info: "Conexión L1/L4", disponibles: 5 },
  { id: 3, pos: [-33.4552, -70.6826], name: "BipBici Estación Central", info: "Frontis Terminal", disponibles: 12 },
  { id: 4, pos: [-33.4281, -70.6077], name: "BipBici Bellas Artes", disponibles: 3 },
  { id: 5, pos: [-33.4196, -70.6045], name: "BipBici Manuel Montt", disponibles: 7 }
];

const EMISIONES = { auto: 0.21, micro: 0.04, metro: 0.01, bici: 0, caminar: 0 };

// --- UTILS ---
const storage = {
  get: (key, fallback = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch { return fallback; }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  clear: () => {
    try { localStorage.clear(); } catch {}
  }
};

function getDistMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function buildFallbackRoute(o, d) {
  return Array.from({ length: 10 }).map((_, i) => [o[0] + (d[0]-o[0])*(i/9), o[1] + (d[1]-o[1])*(i/9)]);
}

// --- UI COMPONENTS ---
const Button = ({ children, onClick, variant = 'primary', className = "", fullWidth = false, disabled = false, loading = false }) => {
  const v = {
    primary: "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30",
    secondary: "bg-[#1A1A2E] text-white",
    ghost: "bg-transparent text-slate-400 hover:bg-slate-800",
    outline: "border-2 border-green-600 text-green-600 hover:bg-green-500/10"
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className={`px-6 py-4 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 ${v[variant]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50' : ''} ${className} min-h-[48px]`}>
      {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : children}
    </button>
  );
};

const Input = React.forwardRef(({ className = "", ...props }, ref) => (
  <input ref={ref} className={`w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0D1117] text-white shadow-sm focus:ring-2 focus:ring-green-500 outline-none transition-all ${className} min-h-[48px]`} {...props} />
));

const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-[#161B22] rounded-3xl shadow-xl p-5 border border-white/10 transition-transform active:scale-[0.98] ${className}`}>{children}</div>
);

const Badge = ({ children, className = "" }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${className}`}>{children}</span>
);

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-white/5 rounded-2xl ${className}`}></div>
);

// --- MAP ENGINE ---
const CityMap = ({ destination, darkMode, onSearchSelect, routePreview, centerTrigger }) => {
  const [mapQuery, setMapQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [pos, setPos] = useState([-33.4489, -70.6693]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(p => setPos([p.coords.latitude, p.coords.longitude]));
    }
  }, []);

  const mapUrl = darkMode ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const handleSearch = async (q) => {
    setMapQuery(q);
    if (q.length < 3) return setSuggestions([]);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', Santiago')}&limit=3`);
      setSuggestions(await r.json());
    } catch {}
  };

  const Recenter = ({ dest, trigger }) => {
    const m = useMap();
    useEffect(() => { if (dest) m.flyTo(dest, 15, { animate: true }); }, [dest, m]);
    useEffect(() => { if (trigger > 0) m.setView(pos, 15, { animate: true }); }, [trigger, m, pos]);
    return null;
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute top-4 left-4 right-4 z-[1000] space-y-2">
        <div className="bg-[#161B22] p-2 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-2">
          <Search size={20} className="text-gray-500 ml-2" />
          <Input placeholder="Buscar destino..." value={mapQuery} onChange={e => handleSearch(e.target.value)} className="!border-none !bg-transparent !p-1 font-bold" />
        </div>
        {suggestions.length > 0 && (
          <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            {suggestions.map((s, i) => (
              <div key={i} onClick={() => { onSearchSelect([parseFloat(s.lat), parseFloat(s.lon)], s.display_name); setSuggestions([]); setMapQuery(s.display_name.split(',')[0]); }} className="p-4 hover:bg-slate-800 cursor-pointer border-b border-white/5 font-bold text-sm truncate text-white">{s.display_name}</div>
            ))}
          </div>
        )}
      </div>
      <MapContainer center={pos} zoom={14} zoomControl={false} className="w-full h-full">
        <TileLayer url={mapUrl} attribution="© CARTO" />
        <Recenter dest={destination} trigger={centerTrigger} pos={pos} />
        {routePreview && <Polyline positions={routePreview} color="#00C896" weight={8} opacity={0.9} />}
        {METRO_LINES.map(l => (
          <Polyline key={l.name} positions={l.coords} color={l.color} weight={5} opacity={0.6} />
        ))}
        {BICI_STATIONS.map(s => (
          <Marker key={s.id} position={s.pos} icon={L.divIcon({ html: '<div class="bg-blue-500 border-2 border-white rounded-full w-8 h-8 flex items-center justify-center text-[10px]">🚲</div>', className: '' })}>
            <Popup><div className="p-1"><p className="font-black text-xs text-slate-800">{s.name}</p><p className="text-[10px] text-green-600 font-bold mt-1">Disponibles: {s.disponibles}</p></div></Popup>
          </Marker>
        ))}
        <Marker position={pos} icon={L.divIcon({ html: '<div class="bg-blue-600 w-6 h-6 rounded-full border-4 border-white shadow-xl"></div>', className: '' })} />
        {destination && <Marker position={destination} icon={L.divIcon({ html: '<div class="text-3xl animate-bounce">🏁</div>', className: '' })} />}
      </MapContainer>
    </div>
  );
};

// --- SCREENS ---
const HomeComponent = ({ user, onNavigate, stats, darkMode, alertas, alertasCargando }) => {
  const getMensaje = (nombre) => {
    const h = new Date().getHours();
    if (h < 9) return `Buenos días, ${nombre}. ¿Vamos en metro hoy? 🚇`;
    if (h < 14) return `¡Buen día! Cada viaje sostenible cuenta, ${nombre}. 🌿`;
    if (h < 19) return `¿Vuelta a casa en bici, ${nombre}? 🚴`;
    return `Terminaste el día con ${stats.co2Total.toFixed(1)}kg menos de CO₂. ¡Bien! 🌱`;
  };

  const suggestedRoutes = [
    { id: 1, name: "Tobalaba", time: "12 min", mode: <Train size={14} />, co2: "Muy bajo", color: "bg-green-100 text-green-700" },
    { id: 2, name: "Costanera Center", time: "25 min", mode: <Bike size={14} />, co2: "Zero", color: "bg-blue-100 text-blue-700" },
    { id: 3, name: "Parque Arauco", time: "40 min", mode: <Car size={14} />, co2: "Medio", color: "bg-yellow-100 text-yellow-700" },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="space-y-2">
        <h2 className="text-3xl font-black text-white">{getMensaje(user.name)}</h2>
        <p className="text-slate-500 font-bold">Santiago hoy está listo para explorar.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-green-900/10 border-green-500/20 text-center">
          <p className="text-3xl font-black text-green-500">{stats.points}</p>
          <p className="text-[10px] font-black uppercase text-slate-500 mt-1 tracking-widest">Puntos</p>
        </Card>
        <Card className="bg-blue-900/10 border-blue-500/20 text-center">
          <p className="text-3xl font-black text-blue-400">{stats.co2Total.toFixed(1)}</p>
          <p className="text-[10px] font-black uppercase text-slate-500 mt-1 tracking-widest">CO₂ KG</p>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="font-black text-white uppercase tracking-widest text-xs">Rutas Sugeridas</h3>
          <button className="text-[#00C896] text-[10px] font-black uppercase tracking-widest">Ver Todo</button>
        </div>
        <div className="space-y-3">
          {suggestedRoutes.map(r => (
            <Card key={r.id} className="flex items-center justify-between hover:border-[#00C896]/50 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl shadow-inner text-white">{r.mode}</div>
                <div>
                  <p className="font-black text-white">{r.name}</p>
                  <p className="text-xs text-slate-500 font-bold">{r.time}</p>
                </div>
              </div>
              <Badge className={r.color}>{r.co2}</Badge>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const RoutePlannerComponent = ({ onStart, destination, darkMode }) => {
  const [selectedMode, setSelectedMode] = useState('bici');
  const modes = [
    { id: 'caminar', label: 'Pie', icon: <Footprints />, co2: 0, pts: 150 },
    { id: 'bici', label: 'Bici', icon: <Bike />, co2: 0, pts: 120 },
    { id: 'metro', label: 'Metro', icon: <Train />, co2: 0.1, pts: 80 },
    { id: 'micro', label: 'Micro', icon: <Navigation />, co2: 0.4, pts: 40 },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header><h2 className="text-3xl font-black text-white uppercase">Planifica Viaje</h2></header>
      <div className="grid grid-cols-4 gap-3">
        {modes.map(m => (
          <button key={m.id} onClick={() => setSelectedMode(m.id)} className={`p-4 rounded-[28px] flex flex-col items-center gap-2 transition-all active:scale-90 ${selectedMode === m.id ? 'bg-green-600 text-white shadow-xl shadow-green-500/20' : 'bg-white/5 text-slate-500'}`}>
            {m.icon}
            <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
          </button>
        ))}
      </div>
      <Card className="bg-slate-900 border-white/5 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-2xl flex items-center justify-center"><Zap size={20} /></div>
          <div><p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Impacto Estimado</p><p className="font-black text-white text-lg">+{modes.find(m=>m.id===selectedMode).pts} Puntos Verdes</p></div>
        </div>
        <Button fullWidth onClick={() => onStart(selectedMode)} className="py-5 text-lg">Comenzar Ruta 🏁</Button>
      </Card>
    </div>
  );
};

const GamificationComponent = ({ points, showToast, redeeming, setRedeeming, co2Total }) => {
  const rewards = [
    { id: 1, name: "Café Orgánico", cost: 500, icon: <Coffee />, color: "bg-orange-100 text-orange-600" },
    { id: 2, name: "Cupón Metro", cost: 1200, icon: <Train />, color: "bg-blue-100 text-blue-600" },
    { id: 3, name: "Bici-Reparo", cost: 800, icon: <Settings />, color: "bg-green-100 text-green-600" },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header><h2 className="text-3xl font-black text-white uppercase">Recompensas</h2></header>
      <Card className="bg-gradient-to-br from-green-600 to-green-800 p-8 border-none text-white relative overflow-hidden">
        <div className="relative z-10"><p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Tu Balance</p><p className="text-5xl font-black mb-4">{points}</p><div className="flex items-center gap-2 text-xs font-black bg-black/20 w-fit px-4 py-2 rounded-full"><Trophy size={14} /> NIVEL 4: GUARDIÁN VERDE</div></div>
        <Zap size={140} className="absolute -bottom-10 -right-10 opacity-10 rotate-12" />
      </Card>
      <div className="space-y-4">
        <h3 className="font-black text-white uppercase tracking-widest text-xs">Canjea tus Puntos</h3>
        <div className="grid gap-3">
          {rewards.map(r => (
            <Card key={r.id} className="flex items-center justify-between group active:scale-[0.97]" onClick={() => setRedeeming(r)}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${r.color} rounded-2xl flex items-center justify-center text-xl`}>{r.icon}</div>
                <div><p className="font-black text-white">{r.name}</p><p className="text-xs text-slate-500 font-bold">{r.cost} pts</p></div>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-green-500 transition-colors" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProfileComponent = ({ user, stats, onLogout, darkMode, setDarkMode }) => {
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex justify-between items-center"><h2 className="text-3xl font-black text-white uppercase tracking-tighter">Mi Perfil</h2><button onClick={onLogout} className="text-red-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 border-2 border-red-500/20 px-4 py-2 rounded-full active:scale-95"><LogOut size={14} /> Salir</button></header>
      <div className="flex flex-col items-center gap-4 p-8 bg-white/5 rounded-[40px] border border-white/10 relative overflow-hidden">
        <div className="w-24 h-24 bg-green-500 rounded-[32px] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-green-500/40 relative z-10">{user.name[0]}</div>
        <div className="text-center z-10"><h3 className="text-2xl font-black text-white">{user.name}</h3><p className="text-slate-500 font-bold">Residente en {user.city}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col items-center gap-2"><div className="w-10 h-10 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center"><Star size={20} fill="currentColor" /></div><p className="font-black text-white">4.8</p><p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Rating</p></Card>
        <Card className="flex flex-col items-center gap-2"><div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center"><Navigation size={20} /></div><p className="font-black text-white">124</p><p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Viajes</p></Card>
      </div>
    </div>
  );
};

// --- NAVEGACION ACTIVA ---
const NavegacionActivaScreen = ({ ruta, userPos, onFinalizar, onCancelar, darkMode }) => {
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState(userPos);
  const [points, setPoints] = useState([]);
  const [recalc, setRecalc] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const hablar = useCallback((t) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'es-CL';
    window.speechSynthesis.speak(u);
  }, []);

  const fetchRoute = useCallback(async (currentPos) => {
    setRecalc(true);
    const start = currentPos || pos;
    const dest = ruta.destinoCoords || [-33.4372, -70.6328];
    try {
      const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`);
      const d = await r.json();
      if (d.routes && d.routes[0]) setPoints(d.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]));
      else setPoints(buildFallbackRoute(start, dest));
    } catch { setPoints(buildFallbackRoute(start, dest)); }
    finally { setTimeout(() => setRecalc(false), 800); }
  }, [pos, ruta.destinoCoords]);

  useEffect(() => { fetchRoute(); }, []);
  useEffect(() => { hablar(ruta.instrucciones[idx]); }, [idx, hablar, ruta.instrucciones]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(p => {
      const np = [p.coords.latitude, p.coords.longitude];
      setPos(np);
      if (points.length > 0 && getDistMeters(np[0], np[1], points[0][0], points[0][1]) > 40) fetchRoute(np);
    });
    return () => navigator.geolocation.clearWatch(id);
  }, [points, fetchRoute]);

  return (
    <div className="fixed inset-0 z-[5000] bg-[#0D1117] flex flex-col animate-fade-in text-white">
      <div className="p-6 pt-12 bg-slate-900 border-b border-white/5 flex flex-col gap-4 shadow-2xl">
        <div className="flex justify-between items-center">
          <button onClick={onCancelar} className="p-2 text-red-500 font-black text-2xl active:scale-90 min-h-[48px] min-w-[48px]">X</button>
          <div className="flex gap-2">
            <button onClick={() => hablar(ruta.instrucciones[idx])} className="bg-slate-800 p-2 rounded-xl text-xl min-h-[48px] min-w-[48px]">🔊</button>
            <button onClick={() => setIdx(i => Math.min(i+1, ruta.instrucciones.length-1))} className="bg-slate-800 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest min-h-[48px]">Saltar ›</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-green-600 p-3 rounded-2xl shadow-lg"><Navigation size={24} /></div>
          <h2 className="text-xl font-black truncate">{ruta.instrucciones[idx]}</h2>
        </div>
      </div>
      <div className="flex-grow relative overflow-hidden">
        <MapContainer center={pos} zoom={17} zoomControl={false} className="w-full h-full">
          <TileLayer url={darkMode ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'} />
          {points.length > 1 && <Polyline positions={points} color="#00C896" weight={8} />}
          <Marker position={pos} icon={L.divIcon({ html: '<div class="bg-blue-500 w-6 h-6 rounded-full border-4 border-white shadow-2xl"></div>', className: '' })} />
        </MapContainer>
        {recalc && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full text-[10px] font-black animate-pulse shadow-xl">Recalculando...</div>}
        <button onClick={()=>setShowReport(true)} className="absolute bottom-6 right-6 z-[1000] w-14 h-14 bg-slate-800 rounded-2xl border border-white/10 flex items-center justify-center text-xl shadow-2xl active:scale-95 min-h-[48px] min-w-[48px]">⚠️</button>
        {showReport && (
          <div className="absolute inset-0 z-[6000] bg-black/80 flex items-end animate-fade-in">
            <div className="bg-[#161B22] w-full rounded-t-[40px] p-8 animate-slide-up border-t border-white/10">
              <h3 className="text-center font-black mb-8 text-white uppercase tracking-widest text-sm">Reportar Incidente</h3>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {['🚦 Tráfico', '💥 Choque', '🚧 Obras', '👮 Policía', '🌩️ Clima', '⚠️ Peligro'].map(t => (
                  <button key={t} onClick={() => { setShowReport(false); hablar("Reporte enviado"); }} className="p-4 bg-[#0D1117] rounded-2xl border border-white/5 text-[10px] font-black active:scale-90 transition-all min-h-[48px] text-white">{t}</button>
                ))}
              </div>
              <Button fullWidth variant="ghost" onClick={() => setShowReport(false)} className="py-4">Cancelar</Button>
            </div>
          </div>
        )}
      </div>
      <div className="p-8 bg-slate-900 rounded-t-[40px] shadow-2xl space-y-4">
        <div className="flex justify-around text-center text-white">
          <div><p className="text-2xl font-black">12</p><p className="text-[10px] opacity-50 font-black tracking-widest">MIN</p></div>
          <div><p className="text-2xl font-black text-green-500">+{ruta.pts || 100}</p><p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">PTS</p></div>
        </div>
        <Button fullWidth onClick={onFinalizar} className="py-5 text-lg">Finalizar Viaje 🎉</Button>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function RutaVerde() {
  const [onboard, setOnboard] = useState(false);
  const [user, setUser] = useState({ name: '', city: 'Santiago' });
  const [tab, setTab] = useState('inicio');
  const [stats, setStats] = useState({ points: 0, co2Total: 0 });
  const [nav, setNav] = useState(false);
  const [dest, setDest] = useState(null); // { coords: [lat, lon], name: string }
  const [rutaPts, setRutaPts] = useState([]);
  const [pos, setPos] = useState([-33.4489, -70.6693]);
  const [redeeming, setRedeeming] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const u = storage.get('rv_user');
    if (u) { setUser(u); setOnboard(true); }
    const s = storage.get('rv_stats');
    if (s) setStats(s);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(p => setPos([p.coords.latitude, p.coords.longitude]));
    }
  }, []);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const handleSearch = useCallback(async (coords, name) => {
    setDest({ coords, name });
    try {
      const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${pos[1]},${pos[0]};${coords[1]},${coords[0]}?overview=full&geometries=geojson`);
      const d = await r.json();
      if (d.routes && d.routes[0]) setRutaPts(d.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]));
    } catch { setRutaPts([pos, coords]); }
  }, [pos]);

  const endNav = () => {
    const ns = { points: stats.points + 120, co2Total: stats.co2Total + 1.3 };
    setStats(ns); storage.set('rv_stats', ns);
    setNav(false); setDest(null); setRutaPts([]); setTab('inicio');
    showToast("¡Viaje finalizado! +120 puntos");
  };

  if (!onboard) return (
    <div className="fixed inset-0 bg-[#0D1117] flex flex-col items-center justify-center p-8 text-white text-center">
      <Leaf size={80} className="text-green-500 animate-bounce mb-12" />
      <h2 className="text-4xl font-black mb-8 leading-tight">¿Cómo te llamas?</h2>
      <Input value={user.name} onChange={e=>setUser({...user, name:e.target.value})} className="mb-8 p-6 text-2xl text-center" placeholder="Tu nombre..." />
      <Button fullWidth onClick={()=>{if(user.name){storage.set('rv_user', user); setOnboard(true);}}} className="py-6 text-xl shadow-2xl shadow-green-500/20">Comenzar</Button>
    </div>
  );

  return (
    <div className="bg-[#0D1117] min-h-screen text-white font-sans overflow-hidden">
      {nav && (
        <NavegacionActivaScreen
          ruta={{ instrucciones: ["Sigue por Av. Libertador", "Dobla en la esquina", "Llegaste"], pts: 120, destinoCoords: dest?.coords }}
          userPos={pos}
          onFinalizar={endNav}
          onCancelar={()=>setNav(false)}
          darkMode={true}
        />
      )}

      {redeeming && (
        <div className="fixed inset-0 z-[6000] bg-black/80 flex items-end animate-fade-in">
          <div className="bg-[#161B22] w-full rounded-t-[40px] p-8 animate-slide-up border-t border-white/10 space-y-6">
            <h3 className="text-center font-black text-white uppercase tracking-widest text-sm">¿Confirmar Canje?</h3>
            <div className="bg-[#0D1117] p-8 rounded-3xl flex flex-col items-center gap-4">
              <QrCode size={100} className="text-white" />
              <p className="text-sm font-black text-white">{redeeming.name}</p>
              <p className="text-xs text-slate-500">Se descontarán {redeeming.cost} puntos</p>
            </div>
            <div className="flex gap-4">
              <Button fullWidth variant="ghost" onClick={() => setRedeeming(null)}>Cancelar</Button>
              <Button fullWidth onClick={() => {
                if (stats.points >= redeeming.cost) {
                  const ns = { ...stats, points: stats.points - redeeming.cost };
                  setStats(ns); storage.set('rv_stats', ns);
                  setRedeeming(null);
                  showToast("Canje exitoso 🎉");
                } else {
                  showToast("Puntos insuficientes");
                }
              }}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[7000] bg-green-600 text-white px-8 py-4 rounded-full font-black text-sm shadow-2xl animate-slide-up">
          {toast}
        </div>
      )}

      <main className="h-screen flex flex-col relative">
        <div className={`flex-grow transition-all duration-500 ${tab === 'mapa' || dest ? 'h-full' : 'h-[40%]'}`}>
          <CityMap destination={dest?.coords} darkMode={true} onSearchSelect={handleSearch} routePreview={rutaPts} />
        </div>

        <div className={`flex-grow overflow-y-auto no-scrollbar p-6 bg-[#0D1117] border-t border-white/5 rounded-t-[40px] -mt-10 z-10 transition-all duration-500 ${tab === 'mapa' || dest ? 'h-0 opacity-0 pointer-events-none' : 'h-[60%] opacity-100'}`}>
          {tab === 'inicio' && <HomeComponent user={user} onNavigate={setTab} stats={stats} darkMode={true} />}
          {tab === 'rutas' && <RoutePlannerComponent onStart={() => setNav(true)} destination={dest} darkMode={true} />}
          {tab === 'puntos' && <GamificationComponent points={stats.points} showToast={showToast} redeeming={redeeming} setRedeeming={setRedeeming} co2Total={stats.co2Total} />}
          {tab === 'perfil' && <ProfileComponent user={user} stats={stats} onLogout={() => { storage.clear(); window.location.reload(); }} darkMode={true} />}
        </div>

        {dest && !nav && (
          <div className="absolute bottom-24 left-4 right-4 bg-slate-900/95 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 shadow-2xl animate-slide-up z-20">
            <h3 className="text-center text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Ir a {dest.name || 'Destino'}</h3>
            <Button fullWidth onClick={()=>setTab('rutas')} className="py-5 text-lg">Ver Opciones de Ruta</Button>
            <Button fullWidth onClick={()=>setDest(null)} variant="ghost" className="py-4 mt-2">Cancelar</Button>
          </div>
        )}

        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-2xl border-t border-white/5 p-6 flex justify-around items-center z-[100] max-w-md mx-auto rounded-t-[32px] shadow-2xl">
          {[
            {id:'inicio', i:<Home/>, l:'Inicio'},
            {id:'rutas', i:<Milestone/>, l:'Rutas'},
            {id:'mapa', i:<MapIcon/>, l:'Explorar'},
            {id:'puntos', i:<Award/>, l:'Puntos'},
            {id:'perfil', i:<User/>, l:'Perfil'}
          ].map(t => (
            <button key={t.id} onClick={()=>{setTab(t.id); setDest(null);}} className={`flex flex-col items-center gap-1 transition-all ${tab===t.id?'text-green-500 scale-110':'text-slate-600'} min-h-[48px] min-w-[48px]`}>
              {React.cloneElement(t.i, { size: 24, strokeWidth: tab===t.id?3:2 })}
              <span className="text-[8px] font-black uppercase tracking-tighter">{t.l}</span>
            </button>
          ))}
        </nav>
      </main>

      <style>{`
        body { margin:0; font-family: 'Inter', sans-serif; background: #0D1117; overflow: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes slide-up { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
        @keyframes fade-in { from { opacity:0; } to { opacity:1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .leaflet-container { background: #0D1117 !important; height: 100% !important; width: 100% !important; }
      `}</style>
    </div>
  );
}
