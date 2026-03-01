import React, { useState, useEffect } from 'react';
import { Award, Star, Bike, Navigation, Train, Zap, Lock, ChevronRight, QrCode, AlertCircle } from 'lucide-react';

export default function Puntos({ user }) {
  const [points, setPoints] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [errorToast, setErrorToast] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (points < user.puntos) {
        setPoints(p => Math.min(p + 5, user.puntos));
      } else {
        clearInterval(timer);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [user.puntos]);

  const achievements = [
    { id: 1, name: 'Primera Bici', icon: <Bike size={24}/>, status: 'unlocked' },
    { id: 2, name: 'Semana Verde', icon: <Star size={24}/>, status: 'unlocked' },
    { id: 3, name: 'Caminante', icon: <Navigation size={24}/>, status: 'unlocked' },
    { id: 4, name: 'Sin Auto', icon: <Zap size={24}/>, status: 'progress', x: 4, y: 7 },
    { id: 5, name: 'Metro Master', icon: <Train size={24}/>, status: 'progress', x: 8, y: 10 },
    { id: 6, name: 'Guardián Verde', icon: <Award size={24}/>, status: 'locked' },
    { id: 7, name: 'Héroe Planeta', icon: <Star size={24}/>, status: 'locked' },
    { id: 8, name: 'Influencer', icon: <Star size={24}/>, status: 'locked' },
  ];

  const rewards = [
    { id: 1, name: 'Café Starbucks', pts: 500, emoji: '☕' },
    { id: 2, name: '30min BipBici', pts: 200, emoji: '🚲' },
    { id: 3, name: 'Viaje Lime gratis', pts: 300, emoji: '🛴' },
    { id: 4, name: '10% dcto Copec', pts: 800, emoji: '🎟️' },
  ];

  const handleRedeem = (pts) => {
    if (user.puntos >= pts) {
      setShowQR(true);
    } else {
      setErrorToast(true);
      setTimeout(() => setErrorToast(false), 2000);
    }
  };

  return (
    <div className="flex flex-col bg-surface animate-fade-in relative">
      {/* HEADER CON NIVEL */}
      <header className="bg-gradient-to-br from-[#0D1B2A] to-[#1A1A2E] p-8 pb-12 text-white rounded-b-[40px] shadow-2xl relative">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-tr from-primary to-accent rounded-full flex items-center justify-center text-4xl shadow-2xl border-4 border-white/20">
              🌿
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-xl font-black border-4 border-[#0D1B2A]">
               4
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tighter mb-1">Nivel {user.level}</h2>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-4">680 / 1000 XP</p>
            <div className="w-64 h-3 bg-white/10 rounded-full overflow-hidden border border-white/10 shadow-inner">
               <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000" style={{ width: '68%' }} />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[32px] border border-white/10 shadow-2xl min-w-[280px] text-center transform hover:scale-105 transition-all">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Puntos Disponibles</p>
            <h3 className="text-6xl font-black text-primary drop-shadow-[0_0_15px_rgba(0,200,150,0.5)]">{points}</h3>
          </div>
        </div>
      </header>

      {/* PRÓXIMO NIVEL */}
      <div className="px-6 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-50 flex items-center justify-between group hover:border-primary/30 transition-all">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">🌳</div>
             <div>
                <p className="text-sm font-black text-secondary">Próximo: Árbol</p>
                <p className="text-[10px] font-bold text-gray-400">Te faltan 320 pts para subir</p>
             </div>
          </div>
          <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" />
        </div>
      </div>

      {/* LOGROS */}
      <div className="p-6 space-y-4">
        <h3 className="text-lg font-black text-secondary">Tus logros</h3>
        <div className="grid grid-cols-3 gap-4">
          {achievements.map(ach => (
            <div key={ach.id} className={`flex flex-col items-center p-4 rounded-3xl border transition-all ${
              ach.status === 'unlocked' ? 'bg-white border-primary/20 shadow-md' :
              ach.status === 'progress' ? 'bg-white border-gray-100' : 'bg-gray-100 grayscale border-transparent'
            }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
                ach.status === 'unlocked' ? 'bg-primary/10 text-primary' :
                ach.status === 'progress' ? 'bg-accent/10 text-accent' : 'bg-gray-200 text-gray-400'
              }`}>
                {ach.status === 'locked' ? <Lock size={20}/> : ach.icon}
              </div>
              <p className="text-[10px] font-black text-secondary text-center leading-tight mb-2">{ach.name}</p>
              {ach.status === 'progress' && (
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                   <div className="h-full bg-accent" style={{ width: `${(ach.x/ach.y)*100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RECOMPENSAS */}
      <div className="p-6 space-y-4 pb-12">
        <h3 className="text-lg font-black text-secondary">Canjear recompensas</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {rewards.map(reward => (
            <div key={reward.id} className="min-w-[200px] bg-white rounded-[32px] p-6 shadow-lg shadow-gray-200/50 border border-gray-50 flex flex-col gap-4 group">
               <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">{reward.emoji}</div>
               <div>
                  <p className="font-black text-secondary truncate">{reward.name}</p>
                  <p className="text-primary font-black text-sm">{reward.pts} pts</p>
               </div>
               <button
                onClick={() => handleRedeem(reward.pts)}
                className="w-full py-3 bg-secondary text-white rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-primary"
               >
                 Canjear
               </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL QR */}
      {showQR && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-md z-[100] flex items-center justify-center p-8 animate-fade-in">
          <div className="bg-white w-full max-w-[320px] rounded-[48px] p-10 flex flex-col items-center gap-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary via-accent to-primary" />
             <div className="text-center">
                <h3 className="text-2xl font-black text-secondary mb-2">¡Canjeado! 🎉</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Escanea este código</p>
             </div>
             <div className="w-48 h-48 bg-gray-50 rounded-[32px] border-4 border-gray-100 flex items-center justify-center p-6 text-primary drop-shadow-xl animate-pulse">
                <QrCode size={120} strokeWidth={1} />
             </div>
             <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest leading-relaxed">
               Válido por 15 minutos en<br/>cualquier tienda adherida
             </p>
             <button onClick={() => setShowQR(false)} className="w-full py-4 bg-gray-100 text-secondary rounded-[24px] font-black text-sm active:scale-95 transition-all">Cerrar</button>
          </div>
        </div>
      )}

      {/* TOAST ERROR (PUNTOS INSUFICIENTES) */}
      {errorToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-error text-white px-8 py-4 rounded-[32px] shadow-2xl z-[110] flex items-center gap-3 animate-shake font-black text-sm">
          <AlertCircle size={24} /> Puntos insuficientes
        </div>
      )}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(-50%); }
          25% { transform: translateX(-55%); }
          75% { transform: translateX(-45%); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}
