import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F0FFF8] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-[#00C896] mb-6 animate-bounce">
            <AlertTriangle size={48} />
          </div>
          <h2 className="text-3xl font-black text-[#1A1A2E] mb-4">¡Ups! Algo salió mal 🌿</h2>
          <p className="text-gray-500 font-bold mb-8 max-w-xs">
            Hubo un error inesperado. No te preocupes, tus puntos están a salvo.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-[#00C896] text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-green-500/30 active:scale-95 transition-all"
          >
            <RefreshCcw size={20} /> Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
