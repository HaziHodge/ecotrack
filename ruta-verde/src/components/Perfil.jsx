import React, { useState } from 'react';
import { Leaf, Train, Bike, DollarSign, Bell, Moon, Eye, LogOut, ChevronRight, Share2, Award, User } from 'lucide-react';

export default function Perfil({ user, updateSettings }) {
  const stats = [
    { id: 1, label: 'CO₂ ahorrado', value: '12.4 kg', icon: <Leaf size={20}/>, color: 'text-primary' },
    { id: 2, label: 'Viajes públicos', value: '23', icon: <Train size={20}/>, color: 'text-blue-500' },
    { id: 3, label: 'Km en bici', value: '47 km', icon: <Bike size={20}/>, color: 'text-orange-500' },
    { id: 4, label: 'Ahorro vs auto', value: '$34.500', icon: <DollarSign size={20}/>, color: 'text-accent' },
  ];

  const weeklyData = [4.2, 3.8, 5.1, 4.5, 6.2, 2.4, 1.8];
  const maxVal = Math.max(...weeklyData);

  return (
    <div className="flex flex-col bg-surface dark:bg-[#0D1117] animate-fade-in relative pb-12 transition-colors duration-500">
      {/* HEADER PERFIL */}
      <header className="p-8 pt-12 flex flex-col items-center gap-6 relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full -mr-24 -mt-24 blur-3xl" />
        <div className="relative group">
           <div className="w-32 h-32 bg-primary text-white rounded-[48px] flex items-center justify-center text-5xl font-black shadow-2xl shadow-primary/20 rotate-6 group-hover:rotate-0 transition-transform duration-500">
             {user.name ? user.name[0] : <User size={48}/>}
           </div>
           <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-primary shadow-xl border-4 border-surface dark:border-[#0D1117] active:scale-90 transition-all cursor-pointer">
              <Share2 size={18} />
           </div>
        </div>
        <div className="text-center">
           <h2 className="text-3xl font-black text-secondary dark:text-white tracking-tighter mb-1">{user.name || 'Usuario'}</h2>
           <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2">
             {user.city}, Chile • <span className="text-primary font-black px-3 py-1 bg-primary/10 rounded-full">{user.level}</span>
           </p>
           <button className="px-6 py-2 bg-white dark:bg-gray-800 text-secondary dark:text-white text-xs font-black uppercase tracking-widest rounded-full border border-gray-100 dark:border-gray-700 shadow-sm active:scale-95 transition-all cursor-pointer">Editar perfil</button>
        </div>
      </header>

      {/* ESTADÍSTICAS DEL MES */}
      <div className="p-6 grid grid-cols-2 gap-4">
        {stats.map(stat => (
          <div key={stat.id} className="bg-white dark:bg-[#1C2128] p-5 rounded-[32px] shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-50 dark:border-gray-800 group hover:-translate-y-1 transition-all">
             <div className={`${stat.color} mb-3 group-hover:scale-110 transition-transform`}>{stat.icon}</div>
             <p className="text-xl font-black text-secondary dark:text-white leading-none mb-1">{stat.value}</p>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* GRÁFICO SEMANAL */}
      <div className="p-6">
        <div className="bg-white dark:bg-[#1C2128] p-6 rounded-[32px] shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-50 dark:border-gray-800 overflow-hidden relative">
          <h3 className="text-sm font-black text-secondary dark:text-white mb-8 uppercase tracking-widest flex items-center gap-2">
            <Award size={18} className="text-primary" /> CO₂ ahorrado esta semana (kg)
          </h3>
          <div className="flex items-end justify-between h-40 gap-2 relative z-10">
            {weeklyData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="relative w-full flex flex-col items-center">
                  <div className="absolute -top-10 bg-secondary dark:bg-white text-white dark:text-secondary px-2 py-1 rounded-lg text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                    {val} kg
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-secondary dark:border-t-white" />
                  </div>
                  <div
                    className="w-full bg-primary/20 dark:bg-primary/10 rounded-t-xl group-hover:bg-primary transition-all duration-700 relative overflow-hidden"
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
          <div className="absolute bottom-16 left-0 right-0 h-[1px] bg-gray-50 dark:bg-gray-800" />
        </div>
      </div>

      {/* CONFIGURACIÓN */}
      <div className="p-6 space-y-4">
        <h3 className="text-lg font-black text-secondary dark:text-white">Configuración</h3>
        <div className="bg-white dark:bg-[#1C2128] rounded-[40px] shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-50 dark:border-gray-800 overflow-hidden">
          <Toggle
            icon={<Bell size={18}/>}
            label="Notificaciones de alertas"
            active={user.settings.notifications}
            onClick={() => updateSettings('notifications', !user.settings.notifications)}
          />
          <Toggle
            icon={<Moon size={18}/>}
            label="Modo oscuro"
            active={user.settings.darkMode}
            onClick={() => updateSettings('darkMode', !user.settings.darkMode)}
          />
          <Toggle
            icon={<Share2 size={18}/>}
            label="Compartir datos anónimos"
            active={user.settings.anonymous}
            onClick={() => updateSettings('anonymous', !user.settings.anonymous)}
          />
          <Toggle
            icon={<Award size={18}/>}
            label="Notificaciones de puntos"
            active={true}
            onClick={() => {}}
            last
          />
        </div>
      </div>

      <div className="px-6 mt-4">
        <button
          onClick={() => {
            localStorage.removeItem('ruta-verde-state');
            window.location.reload();
          }}
          className="w-full py-5 bg-white dark:bg-gray-800 text-error border border-error/20 rounded-[40px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-error/5 cursor-pointer"
        >
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
      className={`w-full flex items-center justify-between p-6 active:bg-gray-50 dark:active:bg-gray-800/50 transition-colors cursor-pointer ${!last ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${active ? 'bg-primary/10 text-primary' : 'bg-gray-50 dark:bg-gray-900 text-gray-400'}`}>
           {icon}
        </div>
        <span className="text-sm font-black text-secondary dark:text-white">{label}</span>
      </div>
      <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${active ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}>
         <div className={`h-4 w-4 bg-white rounded-full transition-transform duration-300 ${active ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </button>
  );
}
