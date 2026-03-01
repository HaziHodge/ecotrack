import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, Map as MapIcon, Navigation, Award, User, Battery, Wifi, Signal } from 'lucide-react';
import Home from './components/Home';
import Rutas from './components/Rutas';
import Mapa from './components/Mapa';
import Puntos from './components/Puntos';
import Perfil from './components/Perfil';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState({
    name: 'Jules',
    city: 'Santiago',
    level: 'BROTE',
    xp: 680,
    maxXp: 1000,
    puntos: 340
  });
  const [alertas, setAlertas] = useState(3);
  const [toast, setToast] = useState(null);
  const [searchData, setSearchData] = useState({ from: '', to: '' });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time for status bar
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleStartRoute = (puntosGanados) => {
    setUser(prev => ({ ...prev, puntos: prev.puntos + puntosGanados }));
    showToast(`+${puntosGanados} pts 🌿`);
  };

  const navigateToRutas = (data) => {
    setSearchData(data);
    setActiveTab('rutas');
  };

  const renderComponent = () => {
    switch (activeTab) {
      case 'home': return <Home user={user} onSearch={navigateToRutas} />;
      case 'rutas': return <Rutas searchData={searchData} onStartRoute={handleStartRoute} />;
      case 'mapa': return <Mapa alertasCount={alertas} />;
      case 'puntos': return <Puntos user={user} />;
      case 'perfil': return <Perfil user={user} />;
      default: return <Home user={user} onSearch={navigateToRutas} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">
      {/* Simulated Status Bar */}
      <div className="flex justify-between items-center px-6 py-2 bg-secondary text-white text-xs z-50">
        <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <div className="flex items-center gap-1.5">
          <Signal size={12} />
          <Wifi size={12} />
          <Battery size={12} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-24 transition-opacity duration-300">
        {renderComponent()}
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-secondary text-white px-6 py-3 rounded-full shadow-2xl z-[100] animate-bounce font-bold flex items-center gap-2">
          <span>{toast}</span>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex justify-around items-center py-4 px-2 z-50 max-w-[430px] mx-auto">
        <TabItem
          icon={<HomeIcon size={24} />}
          label="Inicio"
          active={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
        />
        <TabItem
          icon={<Navigation size={24} />}
          label="Rutas"
          active={activeTab === 'rutas'}
          onClick={() => setActiveTab('rutas')}
        />
        <TabItem
          icon={<MapIcon size={24} />}
          label="Mapa"
          active={activeTab === 'mapa'}
          onClick={() => setActiveTab('mapa')}
          hasBadge={alertas > 0}
        />
        <TabItem
          icon={<Award size={24} />}
          label="Puntos"
          active={activeTab === 'puntos'}
          onClick={() => setActiveTab('puntos')}
        />
        <TabItem
          icon={<User size={24} />}
          label="Perfil"
          active={activeTab === 'perfil'}
          onClick={() => setActiveTab('perfil')}
        />

        {/* Active Tab Indicator */}
        <div
          className="absolute bottom-1 h-1 w-8 bg-primary rounded-full transition-all duration-300"
          style={{
            left: `${['home', 'rutas', 'mapa', 'puntos', 'perfil'].indexOf(activeTab) * 20 + 10}%`,
            transform: 'translateX(-50%)'
          }}
        />
      </nav>
    </div>
  );
}

function TabItem({ icon, label, active, onClick, hasBadge }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 transition-all duration-300 active:scale-90 ${active ? 'text-primary' : 'text-gray-400'}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
      {hasBadge && (
        <span className="absolute -top-1 right-1 w-3 h-3 bg-error rounded-full animate-pulse-red border-2 border-white" />
      )}
    </button>
  );
}
