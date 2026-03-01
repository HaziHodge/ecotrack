import React, { useState, useEffect } from 'react';
import { Leaf, Navigation, ShieldCheck, ChevronRight, MapPin, User, ArrowRight } from 'lucide-react';

export default function Onboarding({ onFinish }) {
  const [step, setStep] = useState(0); // 0: Splash, 1-3: Slides, 4: City, 5: Name
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    if (step === 0) {
      const timer = setTimeout(() => setStep(1), 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const nextStep = () => {
    setIsVisible(false);
    setTimeout(() => {
      setStep(s => s + 1);
      setIsVisible(true);
    }, 300);
  };

  const finish = () => {
    if (name && city) {
      onFinish({ name, city });
    }
  };

  const slides = [
    {
      title: "Muévete mejor",
      desc: "Descubre las rutas más eficientes y rápidas usando el transporte público de Chile.",
      icon: <Navigation size={80} className="text-primary" />,
      color: "bg-primary/10"
    },
    {
      title: "Contamina menos",
      desc: "Calculamos tu huella de carbono en cada viaje para que veas tu impacto real.",
      icon: <Leaf size={80} className="text-primary" />,
      color: "bg-primary/10"
    },
    {
      title: "Gana premios",
      desc: "Cada kilómetro sustentable te da puntos que puedes canjear por beneficios reales.",
      icon: <ShieldCheck size={80} className="text-primary" />,
      color: "bg-primary/10"
    }
  ];

  if (step === 0) {
    return (
      <div className="fixed inset-0 bg-secondary flex flex-col items-center justify-center z-[200] animate-fade-in">
        <div className="relative">
          <div className="w-24 h-24 bg-primary rounded-[32px] flex items-center justify-center shadow-2xl shadow-primary/40 animate-bounce">
            <Leaf size={48} className="text-white" />
          </div>
          <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
        </div>
        <h1 className="text-white text-3xl font-black mt-8 tracking-tighter">RUTA <span className="text-primary">VERDE</span></h1>
        <p className="text-primary/60 text-xs font-bold uppercase tracking-[0.3em] mt-2">Cargando futuro...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col overflow-hidden">
      {/* Progress Bar */}
      {step > 0 && step < 6 && (
        <div className="flex gap-1 px-8 pt-12">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary' : 'bg-gray-100'}`} />
          ))}
        </div>
      )}

      <div className={`flex-1 flex flex-col p-8 transition-all duration-500 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>

        {step >= 1 && step <= 3 && (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className={`w-48 h-48 ${slides[step-1].color} rounded-[64px] flex items-center justify-center mb-12 shadow-inner`}>
                {slides[step-1].icon}
              </div>
              <h2 className="text-4xl font-black text-secondary tracking-tighter mb-4">{slides[step-1].title}</h2>
              <p className="text-gray-500 font-medium leading-relaxed">{slides[step-1].desc}</p>
            </div>
            <button
              onClick={nextStep}
              className="w-full py-5 bg-primary text-white rounded-[24px] font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              Continuar <ChevronRight size={24} />
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col h-full">
            <div className="flex-1 pt-12">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                <MapPin size={32} />
              </div>
              <h2 className="text-4xl font-black text-secondary tracking-tighter mb-4">¿En qué ciudad estás?</h2>
              <p className="text-gray-500 mb-8 font-medium">Personalizaremos tus rutas y transportes locales.</p>

              <div className="space-y-4">
                {['Santiago', 'Valparaíso', 'Concepción'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className={`w-full p-6 rounded-[24px] border-2 text-left transition-all flex justify-between items-center ${city === c ? 'border-primary bg-primary/5 text-secondary shadow-lg' : 'border-gray-100 text-gray-400'}`}
                  >
                    <span className="font-black text-lg">{c}</span>
                    {city === c && <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white"><ArrowRight size={14} strokeWidth={3}/></div>}
                  </button>
                ))}
              </div>
            </div>
            <button
              disabled={!city}
              onClick={nextStep}
              className={`w-full py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 transition-all ${city ? 'bg-primary text-white shadow-xl shadow-primary/20 active:scale-95' : 'bg-gray-100 text-gray-400'}`}
            >
              Siguiente <ChevronRight size={24} />
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col h-full">
            <div className="flex-1 pt-12">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                <User size={32} />
              </div>
              <h2 className="text-4xl font-black text-secondary tracking-tighter mb-4">¿Cómo te llamas?</h2>
              <p className="text-gray-500 mb-12 font-medium">Para saludarte cuando abras la app.</p>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-surface border-2 border-gray-100 rounded-[24px] p-6 text-xl font-black text-secondary outline-none focus:border-primary transition-all placeholder:text-gray-300 shadow-inner"
                autoFocus
              />
            </div>
            <button
              disabled={!name}
              onClick={finish}
              className={`w-full py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 transition-all ${name ? 'bg-primary text-white shadow-xl shadow-primary/20 active:scale-95' : 'bg-gray-100 text-gray-400'}`}
            >
              ¡Comenzar! <ArrowRight size={24} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
