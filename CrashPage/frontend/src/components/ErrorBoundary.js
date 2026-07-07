import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-[#0A0A0A] text-white p-8">
          <div className="max-w-md text-center">
            <div className="h-16 w-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Error inesperado</h2>
            <p className="text-neutral-400 text-sm mb-6">
              Algo salió mal al renderizar esta sección.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-medium rounded-xl px-5 py-2.5 text-sm transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
