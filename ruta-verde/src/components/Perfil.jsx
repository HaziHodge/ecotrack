import React, { useState } from 'react';
import { Leaf, Train, Bike, DollarSign, Bell, Moon, Eye, LogOut, ChevronRight, Share2, Award } from 'lucide-react';

export default function Perfil({ user }) {
  const [notifs, setNotifs] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [anonimo, setAnonimo] = useState(true);
  const [puntosNotif, setPuntosNotif] = useState(true);

  const stats = [
    { id: 1, label: 'CO₂ ahorrado', value: '12.4 kg', icon: <Leaf size={20}/>, color: 'text-primary' },
    { id: 2, label: 'Viajes públicos', value: '23', icon: <Train size={20}/>, color: 'text-blue-500' },
    { id: 3, label: 'Km en bici', value: '47 km', icon: <Bike size={20}/>, color: 'text-orange-500' },
    { id: 4, label: 'Ahorro vs auto', value: '$34.500', icon: <DollarSign size={20}/>, color: 'text-accent' },
  ];

  const weeklyData = [4.2, 3.8, 5.1, 4.5, 6.2, 2.4, 1.8];
  const maxVal = Math.max(...weeklyData);

  return (
    <div className="flex flex-col bg-surface animate-fade-in relative pb-12">
      {/* HEADER PERFIL */}
      <header className="p-8 pt-12 flex flex-col items-center gap-6 relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full -mr-24 -mt-24 blur-3xl" />
        <div className="relative group">
           <div className="w-32 h-32 bg-primary text-white rounded-[48px] flex items-center justify-center text-5xl font-black shadow-2xl shadow-primary/20 rotate-6 group-hover:rotate-0 transition-transform duration-500">
             {user.name[0]}
           </div>
           <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-xl border-4 border-surface active:scale-90 transition-all cursor-pointer">
              <Share2 size={18} />
           </div>
        </div>
        <div className="text-center">
           <h2 className="text-3xl font-black text-secondary tracking-tighter mb-1">{user.name}</h2>
           <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2">
             {user.city}, Chile • <span className="text-primary font-black px-3 py-1 bg-primary/10 rounded-full">{user.level}</span>
           </p>
           <button className="px-6 py-2 bg-white text-secondary text-xs font-black uppercase tracking-widest rounded-full border border-gray-100 shadow-sm active:scale-95 transition-all">Editar perfil</button>
        </div>
      </header>

      {/* ESTADÍSTICAS DEL MES */}
      <div className="p-6 grid grid-cols-2 gap-4">
        {stats.map(stat => (
          <div key={stat.id} className="bg-white p-5 rounded-[32px] shadow-lg shadow-gray-200/50 border border-gray-50 group hover:-translate-y-1 transition-all">
             <div className={`${stat.color} mb-3 group-hover:scale-110 transition-transform`}>{stat.icon}</div>
             <p className="text-xl font-black text-secondary leading-none mb-1">{stat.value}</p>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* GRÁFICO SEMANAL */}
      <div className="p-6">
        <div className="bg-white p-6 rounded-[32px] shadow-lg shadow-gray-200/50 border border-gray-50 overflow-hidden relative">
          <h3 className="text-sm font-black text-secondary mb-8 uppercase tracking-widest flex items-center gap-2">
            <Award size={18} className="text-primary" /> CO₂ ahorrado esta semana (kg)
          </h3>
          <div className="flex items-end justify-between h-40 gap-2 relative z-10">
            {weeklyData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="relative w-full flex flex-col items-center">
                  <div className="absolute -top-6 text-[10px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{val} kg</div>
                  <div
                    className="w-full bg-primary/20 rounded-t-xl group-hover:bg-primary transition-all duration-700 relative overflow-hidden"
                    style={{ height: `${(val/maxVal)*100}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                </span>
              </div>
            ))}
          </div>
          <div className="absolute bottom-16 left-0 right-0 h-[1px] bg-gray-50" />
        </div>
      </div>

      {/* MI HUELLA VS SANTIAGO */}
      <div className="px-6">
        <div className="bg-gradient-to-br from-secondary to-[#0D1B2A] p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
           <h3 className="text-lg font-black mb-6">Tú vs Santiago 🏘️</h3>
           <div className="space-y-6">
              <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                    <span>Tú</span>
                    <span className="text-primary font-black">0.8 kg CO₂/día</span>
                 </div>
                 <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '19%' }} />
                 </div>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                    <span>Promedio Stgo</span>
                    <span className="text-white">4.2 kg CO₂/día</span>
                 </div>
                 <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white/60" style={{ width: '100%' }} />
                 </div>
              </div>
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                 <p className="text-xs font-black text-primary leading-tight">¡Felicidades! Estás 81% por debajo del promedio de la ciudad. 🎉</p>
              </div>
           </div>
        </div>
      </div>

      {/* CONFIGURACIÓN */}
      <div className="p-6 space-y-4">
        <h3 className="text-lg font-black text-secondary">Configuración</h3>
        <div className="bg-white rounded-[40px] shadow-lg shadow-gray-200/50 border border-gray-50 overflow-hidden">
          <Toggle icon={<Bell size={18}/>} label="Notificaciones de alertas" active={notifs} onClick={() => setNotifs(!notifs)} />
          <Toggle icon={<Moon size={18}/>} label="Modo oscuro" active={darkMode} onClick={() => setDarkMode(!darkMode)} />
          <Toggle icon={<Share2 size={18}/>} label="Compartir datos anónimos" active={anonimo} onClick={() => setAnonimo(!anonimo)} />
          <Toggle icon={<Award size={18}/>} label="Notificaciones de puntos" active={puntosNotif} onClick={() => setPuntosNotif(!puntosNotif)} last />
        </div>
      </div>

      <div className="px-6 mt-4">
        <button className="w-full py-5 bg-white text-error border border-error/20 rounded-[40px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-error/5">
           <LogOut size={20} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function Toggle({ icon, label, active, onClick, last }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-6 active:bg-gray-50 transition-colors ${!last ? 'border-b border-gray-50' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${active ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-400'}`}>
           {icon}
        </div>
        <span className="text-sm font-black text-secondary">{label}</span>
      </div>
      <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${active ? 'bg-primary' : 'bg-gray-200'}`}>
         <div className={`h-4 w-4 bg-white rounded-full transition-transform duration-300 ${active ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </button>
  );
}
