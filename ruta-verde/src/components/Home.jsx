import React, { useState } from 'react';
import { Bell, MapPin, Search, ArrowUpDown, Leaf, Star, Navigation, Train, Bus, Bike, Plus, AlertTriangle, Home as HomeIcon } from 'lucide-react';

export default function Home({ user, onSearch }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [swapping, setSwapping] = useState(false);

  const handleSwap = () => {
    setSwapping(true);
    const temp = from;
    setFrom(to);
    setTo(temp);
    setTimeout(() => setSwapping(false), 300);
  };

  const routes = [
    { id: 1, to: 'Costanera Center', mode: <Train size={16} />, time: '25 min', price: '$800', co2: 'green' },
    { id: 2, to: 'Parque Arauco', mode: <Bus size={16} />, time: '35 min', price: '$800', co2: 'yellow' },
    { id: 3, to: 'Barrio Italia', mode: <Bike size={16} />, time: '15 min', price: '$0', co2: 'green' },
    { id: 4, to: 'Plaza de Armas', mode: <Train size={16} />, time: '12 min', price: '$800', co2: 'green' },
  ];

  const alerts = [
    { id: 1, text: "Retraso en Metro L1 entre Baquedano y Tobalaba", time: "Hace 5 min" },
    { id: 2, text: "Ciclovía Mapocho cerrada por mantenimiento", time: "Hace 12 min" },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* SECCIÓN 1 — HEADER */}
      <header className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] p-8 pb-12 text-white rounded-b-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h1 className="text-2xl font-black mb-1">Buenos días, {user.name} 👋</h1>
            <p className="text-white/60 text-sm flex items-center gap-1 font-medium">
              <MapPin size={14} className="text-primary" /> {user.city}, Chile • {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric' })}
            </p>
          </div>
          <button className="relative p-3 bg-white/10 rounded-2xl backdrop-blur-md active:scale-95 transition-all">
            <Bell size={22} />
            <span className="absolute top-2 right-2 w-3 h-3 bg-error rounded-full border-2 border-[#1A1A2E]" />
          </button>
        </div>
      </header>

      {/* SECCIÓN 2 — BUSCADOR DE RUTA */}
      <div className="px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl p-6 shadow-green border border-gray-50 space-y-4">
          <div className="relative">
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-transparent focus-within:border-primary/30 transition-all">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <input
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="¿Desde dónde?"
                  className="bg-transparent text-sm font-bold focus:outline-none w-full text-secondary"
                />
              </div>
              <div className="border-t border-dashed border-gray-200 mx-8" />
              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-transparent focus-within:border-primary/30 transition-all">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="¿A dónde?"
                  className="bg-transparent text-sm font-bold focus:outline-none w-full text-secondary"
                />
              </div>
            </div>
            <button
              onClick={handleSwap}
              className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all z-10 ${swapping ? 'rotate-180' : ''}`}
            >
              <ArrowUpDown size={20} />
            </button>
          </div>
          <button
            onClick={() => onSearch({ from, to })}
            className="w-full py-4 bg-gradient-to-r from-primary to-[#00A878] text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Search size={22} /> Buscar ruta
          </button>
        </div>
      </div>

      {/* SECCIÓN 3 — TARJETA IMPACTO DEL DÍA */}
      <div className="px-6">
        <div className="bg-gradient-to-r from-primary to-[#00A878] rounded-[32px] p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
          <Leaf className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          <h3 className="text-lg font-black mb-4 flex items-center gap-2">Tu impacto hoy 🌍</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center bg-white/10 rounded-2xl py-3 backdrop-blur-sm">
              <p className="text-xl font-black">2.4</p>
              <p className="text-[10px] font-bold uppercase opacity-80">kg CO₂</p>
            </div>
            <div className="text-center bg-white/10 rounded-2xl py-3 backdrop-blur-sm">
              <p className="text-xl font-black">340</p>
              <p className="text-[10px] font-bold uppercase opacity-80">Puntos</p>
            </div>
            <div className="text-center bg-white/10 rounded-2xl py-3 backdrop-blur-sm">
              <p className="text-xl font-black">12.5</p>
              <p className="text-[10px] font-bold uppercase opacity-80">Km Sus.</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4 — RUTAS SUGERIDAS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-6">
          <h3 className="font-black text-lg text-secondary">Rutas frecuentes</h3>
          <button className="text-primary font-bold text-xs uppercase tracking-wider">Ver todo</button>
        </div>
        <div className="flex gap-4 overflow-x-auto px-6 pb-2 scrollbar-hide">
          {routes.map(route => (
            <div key={route.id} className="min-w-[160px] bg-white rounded-3xl p-5 shadow-lg shadow-gray-200/50 border border-gray-50 flex flex-col gap-3 hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-surface rounded-2xl flex items-center justify-center text-primary">
                {route.mode}
              </div>
              <div>
                <p className="font-black text-secondary truncate">{route.to}</p>
                <p className="text-[10px] font-bold text-gray-400">{route.time} • {route.price}</p>
              </div>
              <div className={`w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                route.co2 === 'green' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-orange-500'
              }`}>
                {route.co2 === 'green' ? 'Bajo CO₂' : 'Medio CO₂'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 5 — ALERTAS ACTIVAS */}
      {alerts.length > 0 && (
        <div className="px-6">
          <div className="bg-error/5 border border-error/10 rounded-3xl p-5 space-y-4">
            <h4 className="flex items-center gap-2 font-black text-error text-sm">
              <AlertTriangle size={18} /> Alertas de hoy
            </h4>
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className="flex gap-3">
                  <div className="w-1 h-auto bg-error rounded-full" />
                  <div>
                    <p className="text-xs font-bold text-secondary">{alert.text}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 6 — ACCESOS RÁPIDOS */}
      <div className="px-6 space-y-4 mb-4">
        <h3 className="font-black text-lg text-secondary">Mis lugares</h3>
        <div className="flex justify-between">
          {[
            { label: 'Trabajo', icon: <Navigation size={22} /> },
            { label: 'Casa', icon: <HomeIcon size={22} /> },
            { label: 'Gym', icon: <Star size={22} /> },
            { label: 'Agregar', icon: <Plus size={22} />, isAdd: true }
          ].map((item, i) => (
            <button key={i} className="flex flex-col items-center gap-2 group">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all group-active:scale-90 ${
                item.isAdd ? 'bg-gray-100 text-gray-400' : 'bg-white text-primary shadow-lg shadow-gray-200'
              }`}>
                {item.icon}
              </div>
              <span className="text-[11px] font-black text-gray-500">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
