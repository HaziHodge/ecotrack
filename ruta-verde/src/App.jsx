import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, Map as MapIcon, Navigation, Award, User, Battery, Wifi, Signal } from 'lucide-react';
import Home from './components/Home';
import Rutas from './components/Rutas';
import Mapa from './components/Mapa';
import Puntos from './components/Puntos';
import Perfil from './components/Perfil';
import Onboarding from './components/Onboarding';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState({
    name: '',
    city: 'Santiago',
    level: 'SEMILLA',
    xp: 0,
    maxXp: 1000,
    puntos: 0,
    achievements: [],
    history: [],
    settings: {
      notifications: true,
      darkMode: false,
      anonymous: true
    }
  });

  const [toasts, setToasts] = useState([]);
  const [alertas, setAlertas] = useState(3);
  const [searchData, setSearchData] = useState({ from: '', to: '' });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Initial Load & Persistence
  useEffect(() => {
    const saved = localStorage.getItem('ruta-verde-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      setShowOnboarding(false);
      if (parsed.settings?.darkMode) {
        document.body.classList.add('dark');
      }
    } else {
      setShowOnboarding(true);
    }

    // Simulate global loading
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user.name) {
      localStorage.setItem('ruta-verde-state', JSON.stringify(user));
    }
    if (user.settings?.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user]);

  // Update time for status bar
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

  const handleStartRoute = (puntosGanados) => {
    const newUser = {
      ...user,
      puntos: user.puntos + puntosGanados,
      history: [{ from: searchData.from, to: searchData.to, date: new Date().toISOString() }, ...user.history].slice(0, 5)
    };
    setUser(newUser);
    addToast(`¡Ruta iniciada! +${puntosGanados} pts 🌿`);
  };

  const handleFinishOnboarding = (data) => {
    const newUser = { ...user, name: data.name, city: data.city };
    setUser(newUser);
    setShowOnboarding(false);
    addToast(`¡Bienvenido, ${data.name}! 🌿`);
  };

  const updateSettings = (key, value) => {
    setUser(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value }
    }));
  };

  const updatePoints = (points) => {
    setUser(prev => ({ ...prev, puntos: Math.max(0, prev.puntos + points) }));
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
      case 'puntos': return <Puntos user={user} updatePoints={updatePoints} addToast={addToast} />;
      case 'perfil': return <Perfil user={user} updateSettings={updateSettings} />;
      default: return <Home user={user} onSearch={navigateToRutas} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface dark:bg-[#0D1117]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-primary font-black tracking-widest animate-pulse">CARGANDO RUTA VERDE</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-surface dark:bg-[#0D1117] overflow-hidden max-w-[1440px] mx-auto lg:flex-row shadow-2xl transition-colors duration-500">
      {showOnboarding && <Onboarding onFinish={handleFinishOnboarding} />}

      {/* Sidebar/Mobile Content */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#1C2128] lg:max-w-[430px] lg:border-r border-gray-100 dark:border-gray-800 relative z-10 transition-colors duration-500">
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
        <div className="flex-1 overflow-y-auto pb-24 transition-opacity duration-300 pb-[calc(24px+env(safe-area-inset-bottom))]">
          {renderComponent()}
        </div>

        {/* Toast Notifications */}
        <div className="fixed top-12 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-black text-sm animate-slide-down ${
                t.type === 'success' ? 'bg-primary' : t.type === 'error' ? 'bg-error' : 'bg-blue-500'
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>

        {/* Bottom Tab Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#1C2128]/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 flex justify-around items-center py-4 px-2 z-50 lg:absolute lg:bottom-0 lg:left-0 lg:right-0 lg:max-w-[430px] pb-[calc(16px+env(safe-area-inset-bottom))]">
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

      {/* Desktop Map (Visible only on LG screens) */}
      <div className="hidden lg:flex flex-1 bg-surface relative overflow-hidden">
         <div className="absolute inset-0 opacity-20 pointer-events-none">
           <Mapa />
         </div>
         <div className="relative z-10 w-full h-full flex items-center justify-center p-12">
            <div className="max-w-2xl w-full">
               <Mapa desktopView={true} />
            </div>
         </div>

         {/* Live Alerts Overlay for Desktop */}
         <div className="absolute top-12 right-12 w-80 space-y-4">
            <div className="bg-white p-6 rounded-[32px] shadow-2xl shadow-primary/10 border border-primary/5">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-secondary uppercase tracking-widest text-xs">Alertas en vivo</h3>
                  <div className="w-2 h-2 bg-error rounded-full animate-pulse" />
               </div>
               <div className="space-y-3">
                  <div className="p-3 bg-error/5 rounded-2xl flex items-start gap-3 border border-error/10">
                     <span className="text-lg">🚧</span>
                     <p className="text-[10px] font-bold text-secondary leading-tight">Corte Av. Libertador Bernardo O'Higgins</p>
                  </div>
                  <div className="p-3 bg-accent/5 rounded-2xl flex items-start gap-3 border border-accent/10">
                     <span className="text-lg">🚌</span>
                     <p className="text-[10px] font-bold text-secondary leading-tight">Demora en corredor Alameda</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
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
