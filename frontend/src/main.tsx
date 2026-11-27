import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Erro inesperado na aplicação.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#101418] text-white">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#1C252D] border border-[#26323D] space-y-3 text-center">
            <h1 className="text-xl font-extrabold">
              <span className="text-[#E53935]">MY</span>Mita
            </h1>
            <p className="text-sm text-slate-300">Ocorreu um erro ao carregar a interface:</p>
            <pre className="text-xs text-red-300 bg-black/30 p-3 rounded-xl overflow-auto text-left">
              {this.state.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-[#E53935] text-white text-sm font-bold"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
