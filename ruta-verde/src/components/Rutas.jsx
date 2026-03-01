import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, Filter, Navigation, Train, Bus, Bike, Zap, CheckCircle2, MapPin } from 'lucide-react';

const SANTIAGO_PLACES = [
  "Plaza de Armas", "Baquedano", "Universidad de Chile",
  "Tobalaba", "Escuela Militar", "Maipú", "Pudahuel",
  "Las Condes", "Ñuñoa", "La Florida", "San Bernardo",
  "Estación Central", "Costanera Center", "Mall Vespucio",
  "Parque O'Higgins", "Quinta Normal", "Providencia"
];

export default function Rutas({ searchData, onStartRoute }) {
  const [from, setFrom] = useState(searchData.from || '');
  const [to, setTo] = useState(searchData.to || '');
  const [loading, setLoading] = useState(false);
  const [startingRoute, setStartingRoute] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [filter, setFilter] = useState('verde');
  const [showResults, setShowResults] = useState(!!(searchData.from && searchData.to));
  const [suggestions, setSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null);

  useEffect(() => {
    if (searchData.from && searchData.to) {
      handleSearch();
    }
  }, [searchData]);

  const handleSearch = () => {
    setLoading(true);
    setShowResults(true);
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const handleStart = () => {
    setStartingRoute(true);
    setTimeout(() => {
      setStartingRoute(false);
      onStartRoute(50);
    }, 1500);
  };

  const handleInputChange = (val, type) => {
    if (type === 'from') setFrom(val);
    else setTo(val);

    if (val.length > 2) {
      setSuggestions(SANTIAGO_PLACES.filter(p => p.toLowerCase().includes(val.toLowerCase())));
      setActiveInput(type);
    } else {
      setSuggestions([]);
      setActiveInput(null);
    }
  };

  const selectSuggestion = (val) => {
    if (activeInput === 'from') setFrom(val);
    else setTo(val);
    setSuggestions([]);
    setActiveInput(null);
  };

  const routes = [
    {
      id: 0, type: 'verde', label: 'RUTA VERDE 🌿', recommended: true,
      icons: [<Navigation size={14} key="nav"/>, <Bus size={14} key="bus"/>, <Train size={14} key="train"/>],
      time: '45 min', price: '$800', co2: '0.2 kg', co2Percent: 20, color: 'bg-primary'
    },
    {
      id: 1, type: 'rapido', label: 'RUTA RÁPIDA ⚡',
      icons: [<Navigation size={14} key="nav"/>, <Zap size={14} key="zap"/>],
      time: '28 min', price: '$2.500', co2: '1.8 kg', co2Percent: 90, color: 'bg-accent'
    },
    {
      id: 2, type: 'activo', label: 'RUTA ACTIVA 🚴', zeroEmissions: true,
      icons: [<Bike size={14} key="bike"/>, <Train size={14} key="train"/>],
      time: '52 min', price: '$350', co2: '0 kg', co2Percent: 0, color: 'bg-blue-500'
    },
  ];

  const sortedRoutes = [...routes].sort((a, b) => {
    if (filter === 'rapido') return parseInt(a.time) - parseInt(b.time);
    if (filter === 'barato') return parseInt(a.price.replace('$','').replace('.','').replace('$','')) - parseInt(b.price.replace('$','').replace('.','').replace('$',''));
    if (filter === 'verde') return parseFloat(a.co2) - parseFloat(b.co2);
    if (filter === 'activo') return parseInt(b.time) - parseInt(a.time); // Mas tiempo = mas activo en este sim
    return 0;
  });

  return (
    <div className="flex flex-col h-full bg-surface dark:bg-[#0D1117] animate-fade-in relative transition-colors duration-500">
      {/* HEADER BUSQUEDA */}
      <div className="bg-white dark:bg-[#1C2128] p-6 pb-4 shadow-sm relative z-40 transition-colors duration-500">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setShowResults(false)} className="p-2 -ml-2 text-secondary dark:text-white active:scale-95 transition-all cursor-pointer">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-black text-secondary dark:text-white">Planifica tu ruta</h2>
        </div>

        <div className="space-y-3 relative">
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 focus-within:border-primary/30 transition-all relative">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <input
              value={from}
              onChange={(e) => handleInputChange(e.target.value, 'from')}
              onFocus={() => setActiveInput('from')}
              placeholder="Origen"
              className="bg-transparent text-[16px] font-bold focus:outline-none w-full text-secondary dark:text-white"
            />
            {activeInput === 'from' && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl mt-2 z-50 overflow-hidden">
                {suggestions.map(s => (
                  <button key={s} onClick={() => selectSuggestion(s)} className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-bold border-b border-gray-50 dark:border-gray-700 last:border-0 dark:text-white">{s}</button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 focus-within:border-primary/30 transition-all relative">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <input
              value={to}
              onChange={(e) => handleInputChange(e.target.value, 'to')}
              onFocus={() => setActiveInput('to')}
              placeholder="Destino"
              className="bg-transparent text-[16px] font-bold focus:outline-none w-full text-secondary dark:text-white"
            />
            {activeInput === 'to' && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl mt-2 z-50 overflow-hidden">
                {suggestions.map(s => (
                  <button key={s} onClick={() => selectSuggestion(s)} className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-bold border-b border-gray-50 dark:border-gray-700 last:border-0 dark:text-white">{s}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'rapido', label: '⚡ Más rápido' },
            { id: 'barato', label: '💰 Más barato' },
            { id: 'verde', label: '🌿 Más verde' },
            { id: 'activo', label: '🚴 Más activo' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all border cursor-pointer ${
                filter === f.id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAPA SIMULADO */}
      <div className="flex-1 relative overflow-hidden bg-[#e8f4f8] dark:bg-gray-900 transition-colors duration-500">
        <svg viewBox="0 0 390 220" className="w-full h-full object-cover">
          {/* Manzanas */}
          <rect x="20" y="20" width="60" height="40" fill="#d1d5db" rx="4" />
          <rect x="100" y="20" width="80" height="40" fill="#d1d5db" rx="4" />
          <rect x="20" y="80" width="60" height="60" fill="#d1d5db" rx="4" />
          <rect x="100" y="80" width="80" height="60" fill="#d1d5db" rx="4" />
          <rect x="200" y="20" width="170" height="120" fill="#81C784" fillOpacity="0.3" rx="4" /> {/* Parque */}

          {/* Rio Mapocho */}
          <path d="M 0 160 Q 100 150 200 170 T 390 160" fill="none" stroke="#4FC3F7" strokeWidth="12" strokeOpacity="0.5" />

          {/* Metro Lines */}
          <line x1="0" y1="100" x2="390" y2="100" stroke="#E53935" strokeWidth="2" strokeDasharray="4 2" /> {/* L1 */}
          <line x1="190" y1="0" x2="190" y2="220" stroke="#FDD835" strokeWidth="2" strokeDasharray="4 2" /> {/* L2 */}

          {/* Location markers */}
          <circle cx="50" cy="50" r="6" fill="#1E88E5" stroke="white" strokeWidth="2" /> {/* A */}
          <circle cx="300" cy="180" r="6" fill="#00C896" stroke="white" strokeWidth="2" /> {/* B */}

          {/* Route path */}
          <path
            d="M 50 50 L 50 100 L 190 100 L 190 180 L 300 180"
            fill="none"
            stroke="#00C896"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="8 4"
            className="animate-[dash_20s_linear_infinite]"
          />
          <style>{`@keyframes dash { to { stroke-dashoffset: -100; } }`}</style>

          {/* Current position pulse */}
          <g>
            <circle cx="150" cy="100" r="8" fill="#00C896" fillOpacity="0.3" className="animate-pulse" />
            <circle cx="150" cy="100" r="3" fill="#00C896" />
          </g>
        </svg>

        {/* LOADING SKELETON */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-[#1C2128]/80 backdrop-blur-sm z-50 p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        )}

        {/* COMPARADOR (Bottom Sheet) */}
        {showResults && !loading && (
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1C2128] rounded-t-[40px] shadow-2xl p-6 pb-28 max-h-[70%] overflow-y-auto z-40 transition-colors duration-500">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-black text-secondary dark:text-white mb-4 px-2">Rutas encontradas</h3>

            <div className="space-y-4">
              {sortedRoutes.map((route, idx) => (
                <button
                  key={route.id}
                  onClick={() => setSelectedRoute(route.id)}
                  className={`w-full text-left p-4 rounded-3xl border-2 transition-all active:scale-[0.98] relative overflow-hidden animate-slide-up cursor-pointer ${
                    selectedRoute === route.id ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-lg shadow-primary/5' : 'border-gray-50 dark:border-gray-800 bg-white dark:bg-gray-800/50'
                  }`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-secondary/60 dark:text-white/40 uppercase tracking-widest">{route.label}</span>
                        {route.recommended && <span className="bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded-full">RECOMENDADA</span>}
                        {route.zeroEmissions && <span className="bg-blue-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">CERO EMISIONES</span>}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {route.icons.map((icon, i) => (
                          <React.Fragment key={i}>
                            <div className="text-secondary dark:text-white opacity-60">{icon}</div>
                            {i < route.icons.length - 1 && <span className="text-[10px] text-gray-300 dark:text-gray-600">→</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-secondary dark:text-white leading-none">{route.time}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1">{route.price}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                      <span>Huella CO₂</span>
                      <span className={selectedRoute === route.id ? 'text-primary' : ''}>{route.co2}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${route.color}`}
                        style={{ width: `${route.co2Percent}%` }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 bg-surface dark:bg-gray-800/50 p-4 rounded-[32px] border border-primary/10 flex items-center gap-4">
              <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-2xl">🌳</div>
              <div>
                <p className="text-xs font-bold text-secondary dark:text-white/60">Esta ruta equivale a</p>
                <p className="text-sm font-black text-primary">Plantar 0.3 árboles hoy</p>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={startingRoute}
              className={`w-full mt-6 py-5 bg-primary text-white rounded-[32px] font-black text-xl shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer group relative overflow-hidden`}
            >
              {startingRoute ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Iniciar esta ruta <Zap size={24} className="group-hover:animate-bounce" /></>
              )}
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer transition-transform" />
            </button>

            <div className="mt-6 flex items-center gap-3 justify-center text-gray-400">
              <div className="animate-pulse bg-primary w-2 h-2 rounded-full" />
              <p className="text-[11px] font-bold uppercase tracking-widest">🚌 Micro 301 llega en 4 min</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
