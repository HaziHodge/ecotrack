import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Home,
  Map as MapIcon,
  Navigation,
  Award,
  User,
  Search,
  ArrowRightLeft,
  Leaf,
  Star,
  AlertTriangle,
  ChevronRight,
  Train,
  Bus,
  Bike,
  Zap,
  CheckCircle2,
  Lock,
  Settings,
  Bell,
  Moon,
  Eye,
  LogOut,
  MapPin,
  TrendingUp,
  Clock,
  DollarSign,
  Coffee,
  X,
  Menu,
  ChevronDown
} from 'lucide-react';

// --- CONSTANTS & MOCK DATA ---
const SANTIAGO_PLACES = [
  "Plaza de Armas", "Baquedano", "Universidad de Chile",
  "Tobalaba", "Escuela Militar", "Maipú", "Pudahuel",
  "Las Condes", "Ñuñoa", "La Florida", "San Bernardo",
  "Estación Central", "Mall Plaza Vespucio", "Costanera Center"
];

const METRO_LINES = [
  { id: 'L1', name: 'Línea 1', color: '#F44336' },
  { id: 'L2', name: 'Línea 2', color: '#FFEB3B' },
  { id: 'L3', name: 'Línea 3', color: '#795548' },
  { id: 'L4', name: 'Línea 4', color: '#2196F3' },
  { id: 'L4A', name: 'Línea 4A', color: '#03A9F4' },
  { id: 'L5', name: 'Línea 5', color: '#4CAF50' },
  { id: 'L6', name: 'Línea 6', color: '#9C27B0' },
];

const INITIAL_ALERTS = [
  { id: 1, type: 'warning', text: "Manifestación en Plaza Italia, evitar sector", time: "Hace 5 min" },
  { id: 2, type: 'delay', text: "Micro 210 con 15 min de retraso", time: "Hace 12 min" },
  { id: 3, type: 'info', text: "Metro L1 funcionando normal", time: "En vivo" },
];

const ACHIEVEMENTS = [
  { id: 1, title: "Primera Bici", icon: <Bike className="w-6 h-6" />, unlocked: true },
  { id: 2, title: "Semana Verde", icon: <Leaf className="w-6 h-6" />, unlocked: true },
  { id: 3, title: "Sin Auto", icon: <Zap className="w-6 h-6" />, unlocked: false, progress: 4, total: 7 },
  { id: 4, title: "Héroe del Metro", icon: <Train className="w-6 h-6" />, unlocked: false },
  { id: 5, title: "Guardián", icon: <Star className="w-6 h-6" />, unlocked: false },
  { id: 6, title: "Reciclador", icon: <Zap className="w-6 h-6" />, unlocked: false },
];

const REWARDS = [
  { id: 1, title: "Café gratis en Starbucks", points: 500, icon: <Coffee className="w-5 h-5" /> },
  { id: 2, title: "30 min Bici Pública gratis", points: 200, icon: <Bike className="w-5 h-5" /> },
  { id: 3, title: "Viaje en scooter", points: 300, icon: <Zap className="w-5 h-5" /> },
  { id: 4, title: "Descuento Copec", points: 800, icon: <DollarSign className="w-5 h-5" /> },
];

// --- UTILS ---
const useCountUp = (end, duration = 2000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);
  return count;
};

// --- COMPONENTS ---

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
);

// 1. Splash & Onboarding
const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [city, setCity] = useState('Santiago');

  const slides = [
    {
      title: "Muévete mejor. Contamina menos.",
      desc: "La primera plataforma de movilidad sustentable diseñada para Chile.",
      color: "bg-primary"
    },
    {
      title: "Gana puntos por ser verde",
      desc: "Cada viaje en metro, micro o bici suma puntos que puedes canjear.",
      color: "bg-secondary"
    },
    {
      title: "Impacto real",
      desc: "Visualiza cuánta huella de carbono ahorras al planeta cada día.",
      color: "bg-accent"
    }
  ];

  if (step === 3) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 z-50">
        <h2 className="text-3xl font-bold mb-8 text-secondary">¡Casi listo!</h2>
        <div className="w-full space-y-6 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">¿Cómo te llamas?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-primary focus:outline-none"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-primary focus:outline-none appearance-none"
            >
              <option>Santiago</option>
              <option>Valparaíso</option>
              <option>Concepción</option>
            </select>
          </div>
          <button
            onClick={() => onComplete({ name, city })}
            disabled={!name}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-green disabled:opacity-50"
          >
            Empezar aventura
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 transition-colors duration-500 flex flex-col items-center justify-center p-8 z-50 ${slides[step].color}`}>
      <div className="mb-12 animate-float">
         <Leaf className="w-24 h-24 text-white" />
      </div>
      <h1 className="text-4xl font-extrabold text-white text-center mb-4 leading-tight">
        {slides[step].title}
      </h1>
      <p className="text-white/80 text-center text-lg mb-12">
        {slides[step].desc}
      </p>
      <div className="flex gap-2 mb-12">
        {slides.map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} />
        ))}
      </div>
      <button
        onClick={() => setStep(step + 1)}
        className="w-full max-w-sm py-4 bg-white text-secondary rounded-2xl font-bold text-xl shadow-xl hover:scale-105 transition-transform"
      >
        Continuar
      </button>
    </div>
  );
};

// 2. Common Components
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-3xl p-6 shadow-xl shadow-gray-100 border border-gray-100 hover:shadow-2xl transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const IconButton = ({ icon, label, onClick, active = false }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-primary scale-110' : 'text-gray-400'}`}
  >
    <div className={`p-2 rounded-xl ${active ? 'bg-primary/10' : ''}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

// --- MAIN APP COMPONENT ---
export default function App() {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [user, setUser] = useState({ name: '', city: 'Santiago', level: 'Semilla', points: 340 });
  const [activeTab, setActiveTab] = useState('home');
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [showRoutes, setShowRoutes] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [showNotification, setShowNotification] = useState(null);
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    // Initial loading simulation
    setTimeout(() => {
      setLoading(false);
      const savedUser = localStorage.getItem('rutaVerdeUser');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setShowOnboarding(false);
      }
    }, 2000);

    // Simulated real-time alerts
    const interval = setInterval(() => {
      const newAlert = {
        id: Date.now(),
        type: 'info',
        text: "Nuevo carril bici habilitado en Av. Providencia",
        time: "Justo ahora"
      };
      setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
      setShowNotification(newAlert.text);
      setTimeout(() => setShowNotification(null), 5000);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleOnboardingComplete = (data) => {
    const newUser = { ...user, ...data };
    setUser(newUser);
    localStorage.setItem('rutaVerdeUser', JSON.stringify(newUser));
    setShowOnboarding(false);
  };

  const handleLogoClick = () => {
    setClickCount(prev => {
      if (prev + 1 >= 5) {
        setShowNotification("¡Tú sí que eres verde! 🌍");
        confettiEffect();
        return 0;
      }
      return prev + 1;
    });
  };

  const confettiEffect = () => {
    const colors = ['#00C896', '#FFD93D', '#FFFFFF'];
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.top = '-10px';
      confetti.style.zIndex = '1000';
      confetti.style.borderRadius = '50%';
      confetti.style.pointerEvents = 'none';
      document.body.appendChild(confetti);

      const animation = confetti.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(100vh) rotate(${Math.random() * 360}deg)`, opacity: 0 }
      ], {
        duration: Math.random() * 2000 + 1000,
        easing: 'cubic-bezier(0, .9, .57, 1)'
      });

      animation.onfinish = () => confetti.remove();
    }
  };

  const addPoints = (amount) => {
    const newPoints = user.points + amount;
    let newLevel = user.level;
    if (newPoints > 1000) newLevel = "Guardián Verde";
    else if (newPoints > 700) newLevel = "Árbol";
    else if (newPoints > 400) newLevel = "Brote";

    const updatedUser = { ...user, points: newPoints, level: newLevel };
    setUser(updatedUser);
    localStorage.setItem('rutaVerdeUser', JSON.stringify(updatedUser));
    setShowNotification(`¡Ganaste +${amount} puntos verdes! 🌿`);
    setTimeout(() => setShowNotification(null), 3000);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-secondary flex flex-col items-center justify-center z-[100]">
        <div className="relative">
          <Leaf className="w-20 h-20 text-primary animate-bounce" />
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-12 h-2 bg-black/20 rounded-full blur-md" />
        </div>
        <h1 className="mt-12 text-white font-bold text-2xl tracking-widest">RUTA VERDE</h1>
        <div className="mt-4 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-[loading_2s_ease-in-out_infinite]" style={{width: '60%'}} />
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col max-w-[1200px] mx-auto relative overflow-hidden font-sans">
      {/* Notifications */}
      {showNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-secondary text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideDown">
          <div className="bg-primary p-1 rounded-full"><Leaf size={16} /></div>
          <span className="font-bold">{showNotification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 md:pl-24">
        {activeTab === 'home' && <HomeScreen user={user} setTab={setActiveTab} handleLogoClick={handleLogoClick} />}
        {activeTab === 'planner' && <PlannerScreen from={searchFrom} to={searchTo} setFrom={setSearchFrom} setTo={setSearchTo} addPoints={addPoints} />}
        {activeTab === 'map' && <MapScreen alerts={alerts} />}
        {activeTab === 'points' && <PointsScreen user={user} />}
        {activeTab === 'profile' && <ProfileScreen user={user} setUser={setUser} />}
      </main>

      {/* Bottom/Side Tab Bar */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-gray-100 px-6 py-3 flex justify-between items-center z-40 md:w-24 md:h-full md:flex-col md:border-t-0 md:border-r md:justify-center md:gap-8">
        <IconButton icon={<Home />} label="Inicio" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <IconButton icon={<Navigation />} label="Rutas" active={activeTab === 'planner'} onClick={() => setActiveTab('planner')} />
        <div className="relative">
          <IconButton icon={<MapIcon />} label="Mapa" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
          {alerts.length > 0 && <div className="absolute top-1 right-2 w-3 h-3 bg-error rounded-full border-2 border-white animate-pulse" />}
        </div>
        <IconButton icon={<Award />} label="Puntos" active={activeTab === 'points'} onClick={() => setActiveTab('points')} />
        <IconButton icon={<User />} label="Perfil" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
      </nav>

      {/* Desktop Map View (Only visible on large screens) */}
      <div className="hidden lg:block lg:w-[400px] border-l border-gray-100 bg-white h-full fixed right-0 top-0 p-6 overflow-y-auto">
        <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
          <MapIcon className="text-primary" /> Santiago en vivo
        </h3>
        <MiniMap />
        <div className="mt-8">
          <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-4">Alertas Recientes</h4>
          <div className="space-y-4">
            {alerts.map(alert => (
              <div key={alert.id} className="p-4 bg-surface rounded-2xl flex gap-3">
                <AlertTriangle className={alert.type === 'warning' ? 'text-error' : 'text-primary'} size={20} />
                <div>
                  <p className="text-sm font-semibold">{alert.text}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SCREEN COMPONENTS ---

function HomeScreen({ user, setTab, handleLogoClick }) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1" onClick={handleLogoClick}>
            <Leaf className="text-primary animate-float" size={24} />
            <h1 className="text-xl font-black text-secondary tracking-tighter">RUTA VERDE</h1>
          </div>
          <h2 className="text-2xl font-extrabold text-secondary">Hola, {user.name} 👋</h2>
          <p className="text-gray-500 flex items-center gap-1 text-sm">
            <MapPin size={14} className="text-primary" /> {user.city}, Chile
          </p>
        </div>
        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
          <Bell className="text-primary" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-secondary rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/30 transition-all" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <Search className="text-white/60" size={20} />
            <input
              type="text"
              placeholder="¿A dónde vamos hoy?"
              className="bg-transparent text-white placeholder:text-white/60 focus:outline-none w-full font-medium"
              onFocus={() => setTab('planner')}
            />
          </div>
          <div className="flex gap-2">
            {["Trabajo", "Casa", "Gym"].map(place => (
              <button key={place} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-white/80 text-xs font-semibold border border-white/5 transition-colors">
                {place}
              </button>
            ))}
            <button className="w-8 h-8 flex items-center justify-center bg-primary rounded-full text-secondary">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Impact Card */}
      <Card className="bg-gradient-to-br from-primary to-emerald-600 text-white border-0">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg">Tu impacto hoy</h3>
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex justify-center mb-1 animate-float">
              <Leaf size={24} className="text-accent" />
            </div>
            <p className="text-2xl font-black">2.4</p>
            <p className="text-[10px] opacity-80 font-bold uppercase">kg CO₂</p>
          </div>
          <div className="text-center border-x border-white/20">
            <div className="flex justify-center mb-1">
              <Star size={24} className="text-accent" />
            </div>
            <p className="text-2xl font-black">{user.points}</p>
            <p className="text-[10px] opacity-80 font-bold uppercase">Puntos</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <Navigation size={24} className="text-accent" />
            </div>
            <p className="text-2xl font-black">12.5</p>
            <p className="text-[10px] opacity-80 font-bold uppercase">Km Verdes</p>
          </div>
        </div>
      </Card>

      {/* Suggested Routes */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl text-secondary">Rutas sugeridas</h3>
          <button className="text-primary text-sm font-bold">Ver todas</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          <SuggestedRouteCard destination="Costanera Center" time="25 min" mode="metro" level="green" />
          <SuggestedRouteCard destination="Parque Arauco" time="35 min" mode="bus" level="yellow" />
          <SuggestedRouteCard destination="Barrio Italia" time="15 min" mode="bike" level="green" />
        </div>
      </div>

      {/* Alert Banner */}
      <div className="bg-error/10 border border-error/20 rounded-3xl p-4 flex items-center gap-4">
        <div className="bg-error p-2 rounded-xl text-white">
          <AlertTriangle size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-error leading-tight">Corte en Av. Providencia por reparaciones.</p>
          <p className="text-xs text-error/80">Prefiere Metro L1 o Ciclovía Mapocho.</p>
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-4 gap-4 pt-2">
        {[
          { icon: <MapPin />, label: "Trabajo" },
          { icon: <Home />, label: "Casa" },
          { icon: <Zap />, label: "Carga" },
          { icon: <Plus />, label: "Más" }
        ].map((item, i) => (
          <button key={i} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center text-secondary hover:text-primary hover:scale-110 transition-all">
              {item.icon}
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SuggestedRouteCard({ destination, time, mode, level }) {
  const icons = {
    metro: <Train size={18} />,
    bus: <Bus size={18} />,
    bike: <Bike size={18} />
  };

  const colors = {
    green: "bg-primary",
    yellow: "bg-accent",
    red: "bg-error"
  };

  return (
    <div className="min-w-[200px] bg-white rounded-3xl p-5 shadow-lg border border-gray-50 flex-shrink-0 hover:scale-105 transition-transform cursor-pointer">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${level === 'green' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-secondary'}`}>
          {icons[mode]}
        </div>
        <div className={`w-2 h-2 rounded-full ${colors[level]} animate-pulse`} />
      </div>
      <h4 className="font-bold text-secondary mb-1 truncate">{destination}</h4>
      <p className="text-gray-400 text-sm font-medium">{time} • Muy bajo CO₂</p>
    </div>
  );
}

function PlannerScreen({ from, to, setFrom, setTo, addPoints }) {
  const [searching, setSearching] = useState(false);
  const [selectedOption, setSelectedOption] = useState(0);

  const routes = [
    { id: 0, type: 'VERDE', label: 'Micro + Metro', time: '45 min', cost: '$800', co2: '0.2 kg', color: 'bg-primary', icon: <Train size={18} /> },
    { id: 1, type: 'RÁPIDA', label: 'Auto compartido', time: '28 min', cost: '$2.500', co2: '1.8 kg', color: 'bg-accent', icon: <Bus size={18} /> },
    { id: 2, type: 'ACTIVA', label: 'Bici + Metro', time: '52 min', cost: '$350', co2: '0 kg', color: 'bg-blue-500', icon: <Bike size={18} /> },
  ];

  const handleSearch = () => {
    if (!from || !to) return;
    setSearching(true);
    setTimeout(() => setSearching(false), 1500);
  };

  const getRecommendedRoutes = () => {
    // Simulated distance logic
    const distance = Math.random() * 10; // Random distance between 0-10km
    const baseRoutes = [
      { id: 0, type: 'VERDE', label: 'Micro + Metro', time: '45 min', cost: '$800', co2: '0.2 kg', color: 'bg-primary', icon: <Train size={18} />, distance: 8 },
      { id: 1, type: 'RÁPIDA', label: 'Auto compartido', time: '28 min', cost: '$2.500', co2: '1.8 kg', color: 'bg-accent', icon: <Bus size={18} />, distance: 10 },
      { id: 2, type: 'ACTIVA', label: 'Bici + Metro', time: '52 min', cost: '$350', co2: '0 kg', color: 'bg-blue-500', icon: <Bike size={18} />, distance: 5 },
    ];

    if (distance < 3) {
      return [
        { id: 3, type: 'ACTIVA', label: 'Caminata', time: '20 min', cost: '$0', co2: '0 kg', color: 'bg-primary', icon: <Navigation size={18} /> },
        { id: 4, type: 'ACTIVA', label: 'Bicicleta', time: '10 min', cost: '$0', co2: '0 kg', color: 'bg-emerald-500', icon: <Bike size={18} /> },
        { id: 1, type: 'RÁPIDA', label: 'Taxi', time: '8 min', cost: '$3.500', co2: '1.2 kg', color: 'bg-accent', icon: <Zap size={18} /> },
      ];
    }
    return baseRoutes;
  };

  const currentRoutes = useMemo(() => getRecommendedRoutes(), [searching]);


  return (
    <div className="h-full flex flex-col relative">
      {/* Map Background */}
      <div className="absolute inset-0 z-0 bg-surface overflow-hidden">
        <SimulatedMap active={!searching} />
      </div>

      {/* Header Overlay */}
      <div className="relative z-10 p-6 space-y-3 pointer-events-none">
        <div className="bg-white rounded-3xl p-4 shadow-2xl pointer-events-auto space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div className="w-0.5 h-8 bg-gray-200" />
              <MapPin className="text-error" size={16} />
            </div>
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={from}
                onChange={e => setFrom(e.target.value)}
                placeholder="Origen (Ej: Plaza de Armas)"
                className="w-full text-sm font-medium focus:outline-none border-b border-gray-100 pb-1"
              />
              <input
                type="text"
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="Destino (Ej: Costanera Center)"
                className="w-full text-sm font-medium focus:outline-none"
              />
            </div>
            <button
              className="p-2 bg-surface rounded-xl hover:rotate-180 transition-transform duration-500"
              onClick={() => { const temp = from; setFrom(to); setTo(temp); }}
            >
              <ArrowRightLeft size={20} className="text-secondary" />
            </button>
          </div>
          <button
            onClick={handleSearch}
            className="w-full py-3 bg-secondary text-white rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2"
          >
            {searching ? <Zap className="animate-spin" size={16} /> : <Search size={16} />}
            {searching ? "Buscando..." : "Buscar ruta"}
          </button>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="mt-auto relative z-10 bg-white rounded-t-[40px] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.1)] p-6 max-h-[60%] overflow-y-auto">
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl text-secondary">Rutas encontradas</h3>
          <div className="flex gap-2">
             <button className="px-3 py-1 bg-surface rounded-lg text-xs font-bold text-gray-500">Más verde</button>
             <button className="px-3 py-1 bg-surface rounded-lg text-xs font-bold text-gray-500">Filtros</button>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {searching ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-3xl border border-gray-100 space-y-3">
                <div className="flex justify-between">
                  <div className="flex gap-4">
                    <Skeleton className="w-12 h-12" />
                    <div className="space-y-2">
                      <Skeleton className="w-20 h-3" />
                      <Skeleton className="w-32 h-4" />
                    </div>
                  </div>
                  <div className="space-y-2 flex flex-col items-end">
                    <Skeleton className="w-16 h-5" />
                    <Skeleton className="w-10 h-3" />
                  </div>
                </div>
              </div>
            ))
          ) : currentRoutes.map((route) => (
            <div
              key={route.id}
              onClick={() => setSelectedOption(route.id)}
              className={`p-4 rounded-3xl border-2 transition-all cursor-pointer ${selectedOption === route.id ? 'border-primary bg-primary/5 shadow-lg' : 'border-gray-100 bg-white'}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl text-white ${route.color}`}>
                    {route.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white ${route.color}`}>{route.type}</span>
                      <p className="text-xs text-gray-400 font-bold">{route.co2} CO₂</p>
                    </div>
                    <p className="font-bold text-secondary">{route.label}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-secondary text-lg">{route.time}</p>
                  <p className="text-xs font-bold text-gray-400">{route.cost}</p>
                </div>
              </div>

              {/* CO2 Footprint Visualizer */}
              <div className="mt-4 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${route.color} transition-all duration-1000`}
                  style={{ width: route.id === 0 ? '20%' : route.id === 1 ? '80%' : '5%' }}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            addPoints(50);
            setFrom(''); setTo('');
          }}
          className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-green shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          Iniciar ruta <Navigation size={20} />
        </button>
        <p className="text-center text-gray-400 text-[10px] mt-4 font-bold uppercase tracking-widest">Equivale a plantar 0.3 árboles hoy</p>
      </div>
    </div>
  );
}

function MapScreen({ alerts }) {
  const [filter, setFilter] = useState('all');
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div className="h-full flex flex-col relative bg-[#e0f2f1]">
      <div className="absolute inset-0 z-0">
        <SantiagoMapSVG filter={filter} />
      </div>

      {/* Floating UI */}
      <div className="relative z-10 p-6 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
          {['all', 'metro', 'bici', 'scooter'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all ${filter === f ? 'bg-primary text-white scale-110' : 'bg-white text-secondary'}`}
            >
              {f === 'all' && <Menu size={20} />}
              {f === 'metro' && <Train size={20} />}
              {f === 'bici' && <Bike size={20} />}
              {f === 'scooter' && <Zap size={20} />}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowPanel(!showPanel)}
          className="p-4 bg-white rounded-2xl shadow-xl pointer-events-auto flex items-center gap-3 active:scale-95 transition-all"
        >
          <div className="relative">
            <Bell size={20} className="text-secondary" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full border-2 border-white" />
          </div>
          <span className="font-bold text-sm">Alertas</span>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-28 left-6 z-20 bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white/20">
        <h5 className="text-[10px] font-black uppercase text-gray-400 mb-2">Simbología</h5>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold">
            <div className="w-3 h-0.5 bg-primary" /> Metro L5
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold">
            <div className="w-3 h-0.5 bg-red-500" /> Metro L1
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600">
            <div className="w-2 h-2 rounded-full border-2 border-primary" /> Estación Bici
          </div>
        </div>
      </div>

      {/* My Location FAB */}
      <button className="absolute bottom-28 right-6 z-20 w-14 h-14 bg-secondary text-white rounded-full shadow-2xl flex items-center justify-center animate-pulse">
        <MapPin size={24} />
      </button>

      {/* Side Panel for Alerts */}
      <div className={`absolute top-0 right-0 h-full w-80 bg-white shadow-2xl z-30 transition-transform duration-500 p-6 ${showPanel ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-bold text-xl">Alertas en vivo</h3>
          <button onClick={() => setShowPanel(false)} className="p-2 bg-surface rounded-xl"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          {alerts.map(alert => (
            <div key={alert.id} className="p-4 rounded-2xl bg-surface border-l-4 border-primary">
              <p className="text-sm font-bold text-secondary mb-1">{alert.text}</p>
              <p className="text-[10px] text-gray-400">{alert.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PointsScreen({ user }) {
  const levelData = {
    'Semilla': { progress: 34, color: 'text-green-400', bg: 'bg-green-400/10' },
    'Brote': { progress: 65, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    'Árbol': { progress: 85, color: 'text-teal-600', bg: 'bg-teal-600/10' },
    'Guardián Verde': { progress: 100, color: 'text-primary', bg: 'bg-primary/20' }
  };

  const animatedPoints = useCountUp(user.points);

  return (
    <div className="p-6 space-y-8">
      {/* Header & Progress */}
      <div className="text-center space-y-4">
        <div className="inline-block p-4 bg-white rounded-full shadow-2xl mb-2 relative">
           <Award size={48} className="text-primary" />
           <div className="absolute -top-2 -right-2 bg-accent p-2 rounded-full border-4 border-white animate-bounce">
             <Star size={16} className="text-secondary" />
           </div>
        </div>
        <div>
          <h2 className="text-3xl font-black text-secondary">{user.level}</h2>
          <p className="text-gray-400 font-bold">Nivel 4 • ¡Avanzando rápido!</p>
        </div>
        <div className="max-w-xs mx-auto">
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-1000" style={{width: `${levelData[user.level].progress}%`}} />
          </div>
          <p className="text-[10px] font-black uppercase text-gray-400 mt-2">660 pts para el nivel Árbol</p>
        </div>
      </div>

      {/* Points Card */}
      <Card className="bg-secondary text-white text-center py-8">
        <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] mb-2">Puntos Disponibles</p>
        <h3 className="text-6xl font-black text-primary mb-2 animate-pulse">{animatedPoints}</h3>
        <p className="text-white/60 text-sm">≈ $4.250 CLP en recompensas</p>
      </Card>

      {/* Achievements */}
      <div>
        <h4 className="font-bold text-lg mb-4">Tus logros</h4>
        <div className="grid grid-cols-3 gap-4">
          {ACHIEVEMENTS.map(ach => (
            <div key={ach.id} className={`flex flex-col items-center p-4 rounded-3xl border transition-all ${ach.unlocked ? 'bg-white border-primary/20' : 'bg-gray-50 border-gray-100 grayscale opacity-60'}`}>
              <div className={`p-3 rounded-2xl mb-2 ${ach.unlocked ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-400'}`}>
                {ach.icon}
              </div>
              <p className="text-[10px] font-black text-center leading-tight">{ach.title}</p>
              {ach.progress && <div className="mt-2 w-full h-1 bg-gray-200 rounded-full"><div className="h-full bg-primary" style={{width: `${(ach.progress/ach.total)*100}%`}} /></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Rewards */}
      <div>
        <h4 className="font-bold text-lg mb-4">Canjear recompensas</h4>
        <div className="space-y-4">
          {REWARDS.map(reward => (
            <div key={reward.id} className="flex items-center justify-between p-4 bg-white rounded-3xl shadow-lg border border-gray-50 group hover:border-primary transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  {reward.icon}
                </div>
                <div>
                  <p className="font-bold text-secondary">{reward.title}</p>
                  <p className="text-xs text-primary font-black uppercase tracking-wider">{reward.points} pts</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-primary transition-colors">Canjear</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ user, setUser }) {
  const [darkMode, setDarkMode] = useState(false);
  const [notifs, setNotifs] = useState(true);

  const stats = useMemo(() => [
    { label: "CO₂ Ahorrado", val: "14.2 kg", icon: <Leaf size={16} />, trend: "+12%" },
    { label: "Viajes Públicos", val: "42", icon: <Train size={16} />, trend: "+5%" },
    { label: "Km en Bici", val: "128 km", icon: <Bike size={16} />, trend: "+20%" },
    { label: "Dinero Ahorrado vs Auto", val: "$34.500", icon: <DollarSign size={16} />, trend: "+$8k" },
  ], []);

  const weeklyData = [40, 70, 45, 90, 65, 80, 55];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 bg-primary text-white text-4xl font-black flex items-center justify-center rounded-[3rem] shadow-2xl shadow-primary/30 mb-4">
          {user.name[0] || 'U'}
        </div>
        <h2 className="text-2xl font-black text-secondary">{user.name}</h2>
        <p className="text-primary font-bold">{user.city}, Chile</p>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-3xl shadow-lg border border-gray-50 hover:border-primary/30 transition-all group">
            <div className="flex justify-between items-start mb-2">
              <div className="text-primary group-hover:scale-110 transition-transform">{stat.icon}</div>
              <span className="text-[8px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{stat.trend}</span>
            </div>
            <p className="text-2xl font-black text-secondary leading-none mb-1">{stat.val}</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly Graph */}
      <Card>
        <h4 className="font-bold text-sm text-gray-400 uppercase mb-6 tracking-widest">Ahorro CO₂ Semanal</h4>
        <div className="flex items-end justify-between h-32 gap-2">
          {weeklyData.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <div
                className="w-full bg-primary/20 rounded-t-lg group-hover:bg-primary transition-all duration-500 relative"
                style={{ height: `${val}%` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold bg-secondary text-white px-2 py-1 rounded">
                  {val/10}kg
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'][i]}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Settings */}
      <div className="space-y-4">
        <h4 className="font-bold text-lg">Configuración</h4>
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-50">
          <SettingsToggle icon={<Bell />} label="Notificaciones" active={notifs} onClick={() => setNotifs(!notifs)} />
          <SettingsToggle icon={<Moon />} label="Modo Oscuro" active={darkMode} onClick={() => setDarkMode(!darkMode)} />
          <SettingsToggle icon={<Eye />} label="Modo Accesible" active={false} />
          <button
            onClick={() => {
              localStorage.removeItem('rutaVerdeUser');
              window.location.reload();
            }}
            className="w-full p-4 flex items-center justify-between hover:bg-red-50 text-error transition-colors"
          >
            <div className="flex items-center gap-4">
              <LogOut size={20} />
              <span className="font-bold">Cerrar sesión</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsToggle({ icon, label, active, onClick }) {
  return (
    <div className="p-4 flex items-center justify-between border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-4">
        <div className="text-secondary">{icon}</div>
        <span className="font-bold text-secondary">{label}</span>
      </div>
      <button
        onClick={onClick}
        className={`w-12 h-6 rounded-full transition-all relative ${active ? 'bg-primary' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
}

// --- VISUAL ELEMENTS (MAPS & SVGS) ---

function SimulatedMap({ active }) {
  return (
    <div className={`w-full h-full transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-40'}`}>
      <svg viewBox="0 0 400 600" className="w-full h-full object-cover">
        {/* Street Grid */}
        <g stroke="#E0E0E0" strokeWidth="1">
          {Array.from({length: 20}).map((_, i) => (
            <React.Fragment key={i}>
              <line x1="0" y1={i * 40} x2="400" y2={i * 40} />
              <line x1={i * 40} y1="0" x2={i * 40} y2="600" />
            </React.Fragment>
          ))}
        </g>
        {/* Main Roads */}
        <line x1="0" y1="300" x2="400" y2="300" stroke="#FFF" strokeWidth="8" />
        <line x1="200" y1="0" x2="200" y2="600" stroke="#FFF" strokeWidth="8" />
        {/* Green Zones */}
        <rect x="50" y="50" width="100" height="80" fill="#C8E6C9" rx="10" />
        <rect x="250" y="400" width="120" height="100" fill="#C8E6C9" rx="10" />
        {/* Route Visualization */}
        {active && (
          <path
            d="M 200 300 Q 250 300 250 350 T 300 450"
            fill="none"
            stroke="#00C896"
            strokeWidth="4"
            strokeDasharray="8 4"
            className="animate-[dash_20s_linear_infinite]"
          />
        )}
        {/* Markers */}
        <circle cx="200" cy="300" r="6" fill="#00C896" className="animate-pulse" />
        <circle cx="300" cy="450" r="6" fill="#FF6B6B" />
      </svg>
    </div>
  );
}

function SantiagoMapSVG({ filter }) {
  const showMetro = filter === 'all' || filter === 'metro';
  const showBici = filter === 'all' || filter === 'bici';

  return (
    <svg viewBox="0 0 800 1000" className="w-full h-full">
      {/* Background Areas */}
      <rect width="800" height="1000" fill="#f8fdfb" />

      {/* Cerro San Cristóbal */}
      <path d="M 450 300 Q 500 200 550 300 Z" fill="#c8e6c9" />

      {/* Río Mapocho */}
      <path
        d="M 0 450 Q 200 420 400 430 T 800 380"
        fill="none"
        stroke="#bbdefb"
        strokeWidth="12"
      />

      {/* Alameda / Providencia */}
      <path
        d="M 100 550 L 700 450"
        fill="none"
        stroke="#fff"
        strokeWidth="10"
      />

      {/* Metro Lines */}
      {showMetro && (
        <>
          {/* L1 - Roja */}
          <path d="M 100 550 L 700 450" fill="none" stroke="#F44336" strokeWidth="3" opacity="0.6" />
          <circle cx="200" cy="533" r="4" fill="#F44336" />
          <circle cx="400" cy="500" r="4" fill="#F44336" />
          <circle cx="600" cy="466" r="4" fill="#F44336" />

          {/* L5 - Verde */}
          <path d="M 400 100 L 400 900" fill="none" stroke="#4CAF50" strokeWidth="3" opacity="0.6" />
          <circle cx="400" cy="300" r="4" fill="#4CAF50" />
          <circle cx="400" cy="500" r="4" fill="#4CAF50" />
          <circle cx="400" cy="700" r="4" fill="#4CAF50" />
        </>
      )}

      {/* Bike Stations */}
      {showBici && (
        <>
          <g className="animate-pulse">
             <circle cx="350" cy="480" r="6" fill="#00C896" fillOpacity="0.4" />
             <circle cx="350" cy="480" r="2" fill="#00C896" />
          </g>
          <g className="animate-pulse" style={{animationDelay: '1s'}}>
             <circle cx="500" cy="420" r="6" fill="#00C896" fillOpacity="0.4" />
             <circle cx="500" cy="420" r="2" fill="#00C896" />
          </g>
          <g className="animate-pulse" style={{animationDelay: '0.5s'}}>
             <circle cx="450" cy="550" r="6" fill="#00C896" fillOpacity="0.4" />
             <circle cx="450" cy="550" r="2" fill="#00C896" />
          </g>
        </>
      )}

      {/* Traffic Alert */}
      <g className="animate-bounce">
        <path d="M 600 450 L 610 430 L 620 450 Z" fill="#FF6B6B" />
        <circle cx="610" cy="455" r="2" fill="#FF6B6B" />
      </g>
    </svg>
  );
}

function MiniMap() {
  return (
    <div className="h-48 bg-surface rounded-3xl overflow-hidden relative border border-gray-100">
      <SimulatedMap active={true} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/20">
          <span className="text-[10px] font-black uppercase text-secondary">Ver pantalla completa</span>
        </div>
      </div>
    </div>
  );
}

function Plus({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

// Custom Animations & Global Styles
const style = document.createElement('style');
style.textContent = `
  :root {
    --primary: #00C896;
    --secondary: #1A1A2E;
    --accent: #FFD93D;
    --surface: #F0FFF8;
  }
  @keyframes loading {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  @keyframes dash {
    to { stroke-dashoffset: -100; }
  }
  @keyframes slideDown {
    from { transform: translate(-50%, -100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
document.head.appendChild(style);
