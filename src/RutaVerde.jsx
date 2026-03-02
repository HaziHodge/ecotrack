import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Home, Map as MapIcon, Milestone, Award, User, Search, ArrowLeftRight,
  Leaf, Star, Zap, Navigation, Bell, ChevronRight, CheckCircle2,
  Bike, Train, Car, Smartphone, Settings, LogOut, Info, AlertTriangle,
  Menu, X, Filter, Locate, Heart, Calendar, Clock, DollarSign, TrendingUp,
  Wind, MapPin, Layers, Coffee, Ticket, Footprints, ShieldCheck, QrCode
} from 'lucide-react';

/**
 * RUTA VERDE - MVP de Movilidad Sustentable (Chile)
 * Un solo archivo autocontenido con Tailwind CSS + Leaflet.
 * Estética: Revolut + Citymapper + Duolingo.
 */

// --- CONFIGURACIÓN LEAFLET ---
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

const SANTIAGO_CENTER = [-33.4489, -70.6693];

const METRO_LINES = {
  L1: { color: '#f44336', coords: [[-33.4447, -70.7126], [-33.4442, -70.6505], [-33.4241, -70.6066]] },
  L2: { color: '#ffeb3b', coords: [[-33.3985, -70.6450], [-33.4442, -70.6505], [-33.5167, -70.6604]] },
  L5: { color: '#4caf50', coords: [[-33.4862, -70.7495], [-33.4442, -70.6505], [-33.4072, -70.5985]] },
};

const BICI_STATIONS = [
  { id: 1, pos: [-33.4372, -70.6345], name: "Baquedano BipBici", bikes: 8 },
  { id: 2, pos: [-33.4172, -70.6045], name: "Tobalaba BipBici", bikes: 3 },
  { id: 3, pos: [-33.4489, -70.6693], name: "Plaza de Armas BipBici", bikes: 12 },
];

const SCOOTERS = [
  [-33.425, -70.612], [-33.430, -70.620], [-33.440, -70.640], [-33.415, -70.600]
];

// --- COMPONENTES ATÓMICOS ---

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
    className={`bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-green-900/5 p-5 border border-white/20 dark:border-slate-800 hover:scale-[1.01] transition-all duration-300 animate-slide-up opacity-0 fill-mode-forwards ${className}`}
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

// --- PANTALLAS ---

const HomeScreen = ({ user, onNavigate, points }) => {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isShaking, setIsShaking] = useState(false);

  const handleSearch = async (query) => {
    setSearch(query);
    if (query.length > 3) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}, Santiago, Chile&limit=3`);
        const data = await res.json();
        setSuggestions(data);
      } catch (e) { console.error(e); }
    } else {
      setSuggestions([]);
    }
  };

  const onSearchSubmit = () => {
    if (!search) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    onNavigate('rutas');
  };

  return (
    <div className="space-y-6 pb-40 animate-fade-in">
      <header className="flex justify-between items-start">
        <div className="max-w-[70%]">
          <h1 className="text-3xl font-black text-[#0D1B2A] dark:text-white leading-tight tracking-tight">Hola, {user.name} 👋</h1>
          <p className="text-[#4B5563] dark:text-slate-400 flex items-center gap-1 font-bold mt-1"><MapPin size={14} className="text-[#00C896]" /> {user.city}, Chile</p>
        </div>
        <button className="relative w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-xl border border-gray-50 dark:border-slate-700 transition-transform hover:scale-110 active:scale-95">
          <Bell size={24} className="text-[#1A1A2E] dark:text-white" />
          <span className="absolute top-4 right-4 w-3 h-3 bg-[#FF6B6B] rounded-full border-2 border-white dark:border-slate-800"></span>
        </button>
      </header>

      <Card className={`!p-6 space-y-4 relative overflow-visible ${isShaking ? 'animate-shake' : ''}`} delay={100}>
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 focus-within:border-[#00C896] transition-all">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <input type="text" placeholder="¿Desde dónde?" className="bg-transparent w-full focus:outline-none text-[#0D1B2A] dark:text-white font-bold placeholder:text-gray-400 dark:placeholder:text-slate-600" defaultValue="Tu ubicación" />
          </div>
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
                  <div key={idx} onClick={() => { setSearch(s.display_name.split(',')[0]); setSuggestions([]); onNavigate('rutas'); }} className="p-4 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer border-b border-gray-50 dark:border-slate-700 last:border-none">
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
            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-gray-50 dark:border-slate-700 group-hover:bg-[#00C896] group-hover:text-white transition-all text-[#1A1A2E] dark:text-white">{item.icon}</div>
            <span className="text-[10px] font-black uppercase text-[#6B7280] dark:text-slate-500 tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-black text-[#0D1B2A] dark:text-white tracking-tight">Tu impacto hoy <Leaf className="inline text-[#00C896] ml-1" size={20} /></h2>
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center !p-4 bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white overflow-hidden relative border-none" delay={200}>
          <p className="text-2xl font-black text-[#00C896] z-10 relative"><CountUp end={2.4} decimals={1} /></p>
          <p className="text-[9px] opacity-60 uppercase tracking-widest font-black mt-1 z-10 relative">KG CO₂</p>
          <Leaf className="absolute -bottom-4 -right-4 text-white/5 rotate-12" size={60} />
        </Card>
        <Card className="text-center !p-4 bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white overflow-hidden relative border-none" delay={300}>
          <p className="text-2xl font-black text-[#FFD93D] z-10 relative"><CountUp end={points} /></p>
          <p className="text-[9px] opacity-60 uppercase tracking-widest font-black mt-1 z-10 relative">PTS</p>
          <Star className="absolute -bottom-4 -right-4 text-white/5 rotate-12" size={60} />
        </Card>
        <Card className="text-center !p-4 bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white overflow-hidden relative border-none" delay={400}>
          <p className="text-2xl font-black text-blue-400 z-10 relative"><CountUp end={12.5} decimals={1} /></p>
          <p className="text-[9px] opacity-60 uppercase tracking-widest font-black mt-1 z-10 relative">KM</p>
          <Navigation className="absolute -bottom-4 -right-4 text-white/5 rotate-12" size={60} />
        </Card>
      </div>
    </div>
  );
};

const RoutePlanner = ({ onStart }) => {
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('verde');
  const [filter, setFilter] = useState('greener');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const baseRoutes = [
    { id: 'verde', title: 'RUTA VERDE', sub: 'Micro + Metro', time: 45, cost: 800, co2: 0.2, co2Level: 15, color: 'bg-[#00C896]', icon: <Leaf size={20} /> },
    { id: 'rapida', title: 'RUTA RÁPIDA', sub: 'Auto compartido', time: 28, cost: 2500, co2: 1.8, co2Level: 75, color: 'bg-[#FFD93D]', icon: <Zap size={20} /> },
    { id: 'activa', title: 'RUTA ACTIVA', sub: 'Bici + Metro', time: 52, cost: 350, co2: 0, co2Level: 5, color: 'bg-blue-400', icon: <Bike size={20} /> },
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
      <div className="flex-grow relative h-[40vh] min-h-[250px]">
        <MapContainer center={SANTIAGO_CENTER} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <Polyline positions={[[-33.4489, -70.6693], [-33.4372, -70.6345], [-33.4172, -70.6045]]} color={selected === 'verde' ? '#00C896' : selected === 'activa' ? '#60A5FA' : '#FFD93D'} weight={6} dashArray="10, 10" />
          <Marker position={[-33.4489, -70.6693]} />
          <Marker position={[-33.4172, -70.6045]} />
        </MapContainer>
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
            <div key={r.id} onClick={() => setSelected(r.id)} style={{ animationDelay: `${i * 100}ms` }} className={`p-4 rounded-[28px] border-2 transition-all cursor-pointer animate-slide-up opacity-0 fill-mode-forwards ${selected === r.id ? 'border-[#00C896] bg-green-50 dark:bg-green-900/10 shadow-lg' : 'border-gray-50 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md ${r.color}`}>{React.cloneElement(r.icon, { size: 18 })}</div>
                  <div><h3 className="font-black text-sm text-[#0D1B2A] dark:text-white">{r.title}</h3><p className="text-[10px] text-[#6B7280] dark:text-slate-500 font-bold">{r.sub}</p></div>
                </div>
                <div className="text-right"><p className="font-black text-lg text-[#0D1B2A] dark:text-white leading-none">{r.time} min</p><p className="text-[10px] text-[#6B7280] dark:text-slate-500 font-bold mt-0.5 uppercase tracking-widest">${r.cost}</p></div>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${selected === r.id ? 'bg-[#00C896]' : 'bg-gray-200 dark:bg-slate-700'}`} style={{ width: `${r.co2Level}%` }}></div>
              </div>
            </div>
          ))}
        </div>
        <Button fullWidth onClick={handleStartRoute} loading={starting} className="py-4 shadow-2xl relative z-[100]"><Navigation size={20} strokeWidth={3} /> Iniciar ruta</Button>
      </div>
    </div>
  );
};

const LiveMapScreen = () => {
  const [layers, setLayers] = useState({ metro: true, bici: true, scooter: true });

  return (
    <div className="h-full -mx-5 -mt-8 flex flex-col relative">
      <div className="flex-grow relative h-full">
        <MapContainer center={SANTIAGO_CENTER} zoom={14} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <ZoomControl position="bottomright" />

          {layers.metro && Object.values(METRO_LINES).map((line, i) => (
            <Polyline key={i} positions={line.coords} color={line.color} weight={5} opacity={0.7} />
          ))}

          {layers.bici && BICI_STATIONS.map(s => (
            <Marker key={s.id} position={s.pos}>
              <Popup><div className="font-bold">{s.name}</div><div className="text-xs">{s.bikes} bicis disponibles</div></Popup>
            </Marker>
          ))}

          {layers.scooter && SCOOTERS.map((pos, i) => (
            <CircleMarker key={i} center={pos} radius={5} pathOptions={{ color: '#00C896', fillColor: '#00C896', fillOpacity: 0.8 }}>
              <Popup>Scooter Eléctrico</Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <div className="absolute top-6 left-6 right-6 flex gap-2 z-[1000] overflow-x-auto no-scrollbar">
          {Object.entries(layers).map(([key, val]) => (
            <button key={key} onClick={() => setLayers({...layers, [key]: !val})} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all border ${val ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]' : 'bg-white text-[#1A1A2E] border-gray-100 dark:bg-slate-800 dark:text-white dark:border-slate-700'}`}>
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const GamificationScreen = ({ points, setPoints, showToast, redeeming, setRedeeming }) => {
  const rewards = [
    { id: 1, title: 'Café gratis en Starbucks', cost: 500, icon: <Coffee />, color: 'bg-green-700' },
    { id: 2, title: '30 min Bici Pública gratis', cost: 200, icon: <Bike />, color: 'bg-[#00C896]' },
    { id: 3, title: 'Viaje en scooter gratis', cost: 300, icon: <Zap />, color: 'bg-yellow-400' },
    { id: 4, title: 'Descuento Copec', cost: 800, icon: <Ticket />, color: 'bg-red-600' }
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
        <div className="inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-4 py-1.5 rounded-full mb-4">
          <ShieldCheck size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Nivel: Brote Verde</span>
        </div>
        <h2 className="text-3xl font-black text-[#0D1B2A] dark:text-white tracking-tight uppercase">Brote Verde</h2>
        <div className="flex items-center gap-2 mt-2 justify-center">
          <div className="w-48 bg-gray-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div className="bg-[#00C896] h-full w-[65%] rounded-full shadow-inner"></div>
          </div>
          <span className="text-xs font-black text-[#6B7280] dark:text-slate-500">65%</span>
        </div>
      </div>

      <Card className="!p-10 text-center bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white relative overflow-hidden border-none shadow-2xl" delay={100}>
        <p className="text-xs font-black opacity-50 tracking-[0.2em] uppercase">Puntos Totales</p>
        <h3 className="text-7xl font-black mt-4 text-[#00C896] drop-shadow-xl"><CountUp end={points} /></h3>
        <Leaf className="absolute -bottom-8 -right-8 text-white/5 rotate-12" size={120} />
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-[#0D1B2A] dark:text-white tracking-tight">Canjea tus puntos</h2>
        <div className="grid grid-cols-1 gap-4">
          {rewards.map((r, i) => (
            <div key={r.id} onClick={() => handleRedeem(r)} style={{ animationDelay: `${i * 100 + 200}ms` }} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-3xl border-2 border-gray-50 dark:border-slate-800 hover:border-[#00C896] transition-all cursor-pointer animate-slide-up opacity-0 fill-mode-forwards shadow-sm">
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${r.color} text-white flex items-center justify-center shadow-md`}>{React.cloneElement(r.icon, { size: 24 })}</div>
                  <div><h4 className="font-black text-sm text-[#0D1B2A] dark:text-white">{r.title}</h4><p className="text-xs text-[#00C896] font-black uppercase tracking-widest">{r.cost} pts</p></div>
               </div>
               <ChevronRight size={20} className="text-gray-300" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProfileScreen = ({ user, points, onLogout, darkMode, setDarkMode }) => {
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
        <p className="text-[#4B5563] dark:text-slate-400 font-black uppercase tracking-widest text-[10px]">Guardián Verde • {user.city}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <Card className="text-center" delay={100}>
            <p className="text-2xl font-black text-[#00C896]">12.4kg</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">CO₂ Ahorrado</p>
         </Card>
         <Card className="text-center" delay={200}>
            <p className="text-2xl font-black text-blue-500">$15.200</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dinero Ahorrado</p>
         </Card>
      </div>

      <div className="space-y-3">
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
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [user, setUser] = useState({ name: "", city: "Santiago" });
  const [activeTab, setActiveTab] = useState('inicio');
  const [points, setPoints] = useState(1240);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [redeeming, setRedeeming] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    const savedUser = localStorage.getItem('rv_user');
    const savedPoints = localStorage.getItem('rv_points');
    const savedDark = localStorage.getItem('rv_dark');
    if (savedUser) {
      try { const parsed = JSON.parse(savedUser); if (parsed && parsed.name) { setUser(parsed); setOnboardingComplete(true); } } catch (e) {}
    }
    if (savedPoints) setPoints(parseInt(savedPoints));
    if (savedDark === 'true') setDarkMode(true);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('rv_dark', darkMode);
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleStartRoute = () => {
    showToast("¡Ruta iniciada! Sumarás puntos al llegar. 🚲");
    setActiveTab('mapa');
    const newPoints = points + 50;
    setPoints(newPoints);
    localStorage.setItem('rv_points', newPoints.toString());
    setTimeout(() => showToast("¡Viaje completado! +50 puntos 🌱"), 4000);
  };

  const handleLogoClick = () => {
    setLogoClicks(prev => {
      if (prev + 1 >= 5) {
        showToast("¡Tú sí que eres verde! 🌍 (Huevo de Pascua activado)");
        return 0;
      }
      return prev + 1;
    });
  };

  const confirmRedeem = () => {
    const newPoints = points - redeeming.cost;
    setPoints(newPoints);
    localStorage.setItem('rv_points', newPoints.toString());
    setRedeeming(null);
    showToast("¡Canjeado con éxito! 🎉");
  };

  const handleLogout = () => { localStorage.clear(); window.location.reload(); };

  if (loading) return (
    <div className="fixed inset-0 bg-[#1A1A2E] flex flex-col items-center justify-center p-10 z-[1000] text-white">
      <Leaf size={64} className="text-[#00C896] animate-bounce" />
      <h1 className="mt-12 text-5xl font-black tracking-tighter text-center uppercase">RUTA <span className="text-[#00C896]">VERDE</span></h1>
      <p className="mt-4 text-[#00C896] font-black uppercase text-[10px] tracking-[0.5em] animate-pulse">Muévete mejor. Contamina menos.</p>
    </div>
  );

  if (!onboardingComplete) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[100] flex flex-col p-10 justify-center space-y-12 animate-fade-in overflow-y-auto">
        <div className="space-y-4 max-w-md mx-auto w-full">
          <div className="w-20 h-20 bg-green-50 dark:bg-green-900/10 rounded-3xl flex items-center justify-center text-[#00C896] mb-8"><Footprints size={40} strokeWidth={2.5} /></div>
          <h2 className="text-5xl font-black text-[#1A1A2E] dark:text-white leading-tight tracking-tight">Tu perfil<br/>sustentable</h2>
          <p className="text-xl text-[#6B7280] dark:text-slate-400 font-bold">Únete a los miles de chilenos que ya viajan más verde.</p>
        </div>
        <div className="space-y-6 max-w-md mx-auto w-full">
           <input
              type="text" placeholder="Escribe tu nombre..." value={user.name}
              onChange={(e) => setUser({...user, name: e.target.value})}
              className="w-full p-6 bg-gray-50 dark:bg-slate-800 border-3 border-gray-100 dark:border-slate-700 rounded-[32px] focus:border-[#00C896] focus:bg-white dark:focus:bg-slate-700 outline-none font-black text-2xl transition-all dark:text-white placeholder:text-gray-300"
           />
           <Button fullWidth onClick={() => { localStorage.setItem('rv_user', JSON.stringify(user)); setOnboardingComplete(true); }} disabled={!user.name} className="py-6 text-xl shadow-2xl mt-4">Comenzar Aventura</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#F0FFF8] dark:bg-slate-950 text-[#1A1A2E] dark:text-white font-['Inter'] selection:bg-[#00C896] selection:text-white transition-colors duration-500`}>
      {toast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[5000] w-[90%] max-w-sm bg-[#1A1A2E] dark:bg-slate-800 text-white px-8 py-5 rounded-[32px] shadow-2xl flex items-center gap-4 animate-slide-down border-b-8 border-[#00C896]">
          <CheckCircle2 size={24} className="text-[#00C896] shrink-0" />
          <p className="font-black text-sm">{toast}</p>
        </div>
      )}

      {redeeming && (
        <div className="fixed inset-0 z-[4000] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[48px] p-8 pb-32 space-y-6 animate-slide-up-modal shadow-[0_-20px_50px_rgba(0,0,0,0.3)] border-t border-white/10">
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
               <span className="font-black text-xl tracking-tighter text-[#0D1B2A] dark:text-white">RUTA <span className="text-[#00C896]">VERDE</span></span>
            </div>

            {activeTab === 'inicio' && <HomeScreen user={user} onNavigate={setActiveTab} points={points} />}
            {activeTab === 'rutas' && <RoutePlanner onStart={handleStartRoute} />}
            {activeTab === 'mapa' && <LiveMapScreen />}
            {activeTab === 'puntos' && <GamificationScreen points={points} setPoints={setPoints} showToast={showToast} redeeming={redeeming} setRedeeming={setRedeeming} />}
            {activeTab === 'perfil' && <ProfileScreen user={user} points={points} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />}
          </main>

          <nav className="fixed lg:absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-gray-50 dark:border-slate-800 px-8 py-6 flex justify-between items-center z-[200] lg:rounded-t-[40px] shadow-2xl">
            {[
              { id: 'inicio', icon: <Home />, label: 'Inicio' },
              { id: 'rutas', icon: <Milestone />, label: 'Rutas' },
              { id: 'mapa', icon: <MapIcon />, label: 'Mapa' },
              { id: 'puntos', icon: <Award />, label: 'Puntos' },
              { id: 'perfil', icon: <User />, label: 'Perfil' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === tab.id ? 'text-[#00C896] -translate-y-2' : 'text-gray-300 dark:text-slate-600 hover:text-gray-500'}`}>
                <div className={`p-2.5 rounded-2xl transition-all duration-500 ${activeTab === tab.id ? 'bg-green-50 dark:bg-green-900/10 shadow-lg' : 'bg-transparent'}`}>
                  {React.cloneElement(tab.icon, { size: 24, strokeWidth: activeTab === tab.id ? 3 : 2 })}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden lg:block flex-grow bg-[#F0FFF8] dark:bg-slate-950 p-10 overflow-hidden relative">
          <div className="h-full rounded-[60px] overflow-hidden border-[16px] border-white dark:border-slate-800 shadow-2xl relative transition-colors duration-500">
            <MapContainer center={SANTIAGO_CENTER} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
               <TileLayer url={darkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"} />
            </MapContainer>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; overflow: hidden; }
        h1, h2, h3, h4, .font-black { font-family: 'Plus Jakarta Sans', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes slide-down { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slide-up-modal { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-slide-down { animation: slide-down 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-up-modal { animation: slide-up-modal 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .fill-mode-forwards { fill-mode: forwards; }
        .leaflet-container { font-family: 'Inter', sans-serif; transition: filter 0.5s ease; }
        .dark .leaflet-container { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
      `}</style>
    </div>
  );
}
