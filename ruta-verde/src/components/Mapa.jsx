import React, { useState } from 'react';
import { MapPin, Bell, Layers, Plus, Minus, X, AlertTriangle, Bike, Zap, Train } from 'lucide-react';

export default function Mapa({ alertasCount, desktopView }) {
  const [activeLayers, setActiveLayers] = useState(['metro', 'bici', 'scooter', 'alertas']);
  const [showPanel, setShowPanel] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [tooltip, setTooltip] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleDragStart = (e) => {
    setIsDragging(true);
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    setStartPos({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleDrag = (e) => {
    if (!isDragging) return;
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    setOffset({ x: clientX - startPos.x, y: clientY - startPos.y });
  };

  const handleDragEnd = () => setIsDragging(false);

  const toggleLayer = (layer) => {
    setActiveLayers(prev => prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]);
  };

  const stations = [
    { id: 1, name: 'Baquedano', x: 200, y: 300, line: 'L1' },
    { id: 2, name: 'Universidad de Chile', x: 150, y: 300, line: 'L1' },
    { id: 3, name: 'Tobalaba', x: 280, y: 300, line: 'L1' },
    { id: 4, name: 'Escuela Militar', x: 350, y: 300, line: 'L1' },
    { id: 5, name: 'Plaza de Armas', x: 150, y: 250, line: 'L2' },
    { id: 6, name: 'Santa Ana', x: 150, y: 200, line: 'L2' },
  ];

  const biciPoints = [
    { id: 1, x: 180, y: 280 },
    { id: 2, x: 220, y: 320 },
    { id: 3, x: 260, y: 290 },
    { id: 4, x: 310, y: 340 },
    { id: 5, x: 140, y: 330 },
  ];

  const scooterPoints = [
    { id: 1, x: 190, y: 260 },
    { id: 2, x: 240, y: 280 },
    { id: 3, x: 270, y: 310 },
    { id: 4, x: 330, y: 290 },
  ];

  const alerts = [
    { id: 1, type: 'error', text: "Manifestación Plaza Italia — Evitar sector", color: "🔴" },
    { id: 2, type: 'warning', text: "Micro 210 — 15 min retraso acumulado", color: "🟡" },
    { id: 3, type: 'success', text: "Metro L1 — Operación normal", color: "🟢" },
    { id: 4, type: 'warning', text: "Viento fuerte — +8 min en trayectos bici", color: "🟡" },
  ];

  return (
    <div className={`h-full relative overflow-hidden bg-surface dark:bg-[#0D1117] animate-fade-in ${desktopView ? 'rounded-[64px] shadow-2xl border-8 border-white dark:border-gray-800' : ''}`}>
      {/* SVG MAP */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none relative"
        onMouseDown={handleDragStart}
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDrag}
        onTouchEnd={handleDragEnd}
      >
      <svg
        viewBox="0 0 390 600"
        className="w-full h-full transition-transform duration-150 ease-out origin-center"
        style={{ transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)` }}
      >
        {/* Estructura urbana */}
        <rect width="390" height="600" fill="#E8F5E9" className="dark:fill-[#1a2e1c]" />

        {/* Grid de calles */}
        <g stroke="#E0E0E0" strokeWidth="0.5" className="dark:stroke-gray-700">
          {Array.from({ length: 20 }).map((_, i) => (
            <React.Fragment key={i}>
              <line x1="0" y1={i * 40} x2="390" y2={i * 40} />
              <line x1={i * 40} y1="0" x2={i * 40} y2="600" />
            </React.Fragment>
          ))}
        </g>

        {/* Parques */}
        <rect x="180" y="280" width="80" height="40" fill="#81C784" rx="4" /> {/* Parque Forestal */}
        <rect x="50" y="450" width="120" height="100" fill="#81C784" rx="4" /> {/* Parque O'Higgins */}
        <path d="M 320 100 Q 350 50 380 100 T 350 200 Z" fill="#388E3C" /> {/* Cerro San Cristobal */}

        {/* Rio Mapocho */}
        <path
          d="M 0 320 Q 100 310 200 330 T 390 300"
          fill="none"
          stroke="#4FC3F7"
          strokeWidth="15"
          strokeOpacity="0.4"
        />

        {/* Manzanas */}
        <rect x="20" y="50" width="40" height="40" fill="#F5F5F5" stroke="#E0E0E0" rx="4" />
        <rect x="100" y="50" width="40" height="40" fill="#F5F5F5" stroke="#E0E0E0" rx="4" />
        <rect x="100" y="150" width="40" height="40" fill="#F5F5F5" stroke="#E0E0E0" rx="4" />

        {/* Líneas de Metro */}
        {activeLayers.includes('metro') && (
          <g>
            {/* L1 Roja */}
            <path d="M 0 300 L 390 300" fill="none" stroke="#E53935" strokeWidth="6" strokeLinecap="round" />
            {/* L2 Amarilla */}
            <path d="M 150 0 L 150 600" fill="none" stroke="#FDD835" strokeWidth="6" strokeLinecap="round" />
            {/* L5 Verde */}
            <path d="M 150 200 L 50 350 L 50 600" fill="none" stroke="#43A047" strokeWidth="6" strokeLinecap="round" />
            {/* L4 Azul */}
            <path d="M 280 300 L 350 450 L 390 550" fill="none" stroke="#1E88E5" strokeWidth="6" strokeLinecap="round" />
            {/* L6 Morada */}
            <path d="M 0 450 L 350 450" fill="none" stroke="#8E24AA" strokeWidth="6" strokeLinecap="round" />

            {/* Estaciones */}
            {stations.map(s => (
              <circle
                key={s.id}
                cx={s.x} cy={s.y} r="6"
                fill="white" stroke={s.line === 'L1' ? '#E53935' : '#FDD835'}
                strokeWidth="2.5"
                onClick={() => setTooltip(s)}
                className="cursor-pointer hover:scale-125 transition-transform"
              />
            ))}
          </g>
        )}

        {/* Puntos Bici */}
        {activeLayers.includes('bici') && biciPoints.map(p => (
          <g key={p.id}>
             <circle cx={p.x} cy={p.y} r="10" fill="#00BCD4" fillOpacity="0.3" className="animate-pulse" />
             <circle cx={p.x} cy={p.y} r="4" fill="#00BCD4" stroke="white" strokeWidth="1.5" />
          </g>
        ))}

        {/* Puntos Scooter */}
        {activeLayers.includes('scooter') && scooterPoints.map(p => (
          <g key={p.id}>
             <circle cx={p.x} cy={p.y} r="10" fill="#FF9800" fillOpacity="0.3" className="animate-pulse" />
             <circle cx={p.x} cy={p.y} r="4" fill="#FF9800" stroke="white" strokeWidth="1.5" />
          </g>
        ))}

        {/* Tu ubicación */}
        <g className="animate-pulse">
          <circle cx="200" cy="350" r="12" fill="#00C896" fillOpacity="0.3" />
          <circle cx="200" cy="350" r="5" fill="#00C896" stroke="white" strokeWidth="2.5" />
        </g>
      </svg>
      </div>

      {/* TOOLTIP ESTACION */}
      {tooltip && (
        <div
          className="absolute bg-white dark:bg-[#1C2128] p-4 rounded-2xl shadow-2xl z-50 border border-gray-100 dark:border-gray-800 flex items-center gap-3 animate-slide-up pointer-events-auto"
          style={{
            top: (tooltip.y * zoom) + offset.y - 80,
            left: (tooltip.x * zoom) + offset.x - 100
          }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black" style={{ background: tooltip.line === 'L1' ? '#E53935' : '#FDD835' }}>M</div>
          <div>
            <p className="font-black text-secondary text-sm">{tooltip.name}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tooltip.line}</p>
          </div>
          <button onClick={() => setTooltip(null)} className="p-1 text-gray-300"><X size={16}/></button>
        </div>
      )}

      {/* CONTROLES FLOTANTES */}
      <div className="absolute top-6 left-6 z-40 bg-white/80 dark:bg-[#1C2128]/80 backdrop-blur-md p-4 rounded-3xl shadow-xl space-y-4">
         <button onClick={() => setZoom(z => Math.min(z + 0.2, 2.5))} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#1C2128] rounded-2xl text-secondary dark:text-white active:scale-95 transition-all shadow-sm cursor-pointer"><Plus size={22}/></button>
         <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.8))} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#1C2128] rounded-2xl text-secondary dark:text-white active:scale-95 transition-all shadow-sm cursor-pointer"><Minus size={22}/></button>
      </div>

      <div className="absolute top-6 right-6 z-40 flex flex-col items-end gap-3">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="bg-white/80 dark:bg-[#1C2128]/80 backdrop-blur-md px-5 py-3 rounded-full shadow-xl flex items-center gap-2 font-black text-xs text-secondary dark:text-white active:scale-95 transition-all cursor-pointer"
        >
          <Bell size={18} className="text-primary" /> Alertas ({alertasCount})
        </button>
        <div className="bg-white/80 dark:bg-[#1C2128]/80 backdrop-blur-md p-2 rounded-2xl shadow-xl flex flex-col gap-1">
          {[
            { id: 'metro', icon: <Train size={20}/> },
            { id: 'bici', icon: <Bike size={20}/> },
            { id: 'scooter', icon: <Zap size={20}/> }
          ].map(layer => (
            <button
              key={layer.id}
              onClick={() => toggleLayer(layer.id)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                activeLayers.includes(layer.id) ? 'bg-primary text-white scale-105 shadow-lg' : 'text-gray-400'
              }`}
            >
              {layer.icon}
            </button>
          ))}
        </div>
      </div>

      <button className="absolute bottom-6 right-6 z-40 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all shadow-primary/30">
        <MapPin size={28} />
      </button>

      {/* PANEL DE ALERTAS LATERAL */}
      <div
        className={`fixed top-0 right-0 h-full w-[300px] bg-white z-[60] shadow-2xl transition-transform duration-500 ease-in-out p-6 pt-16 rounded-l-[40px] ${
          showPanel ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button
          onClick={() => setShowPanel(false)}
          className="absolute top-6 right-6 p-2 bg-gray-50 rounded-xl active:scale-90 transition-all"
        >
          <X size={24} />
        </button>
        <h3 className="text-2xl font-black text-secondary mb-8">Alertas activas</h3>
        <div className="space-y-6">
          {alerts.map(alert => (
            <div key={alert.id} className="flex gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-100 hover:border-primary/20 transition-all">
              <span className="text-2xl">{alert.color}</span>
              <div>
                <p className="text-sm font-black text-secondary leading-tight">{alert.text}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">En vivo • Santiago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
