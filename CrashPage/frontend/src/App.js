import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./auth/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const History = lazy(() => import("./pages/History"));
const ProtectedRoute = lazy(() => import("./auth/ProtectedRoute"));

function LoadingFallback() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0A0A0A] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-red-500/10 border-b-red-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
        <span className="text-xs uppercase tracking-[0.3em] text-neutral-500 breathe-animation">
          Cargando...
        </span>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history/:driverId"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function AppContent() {
  return (
    <div className="App min-h-screen">
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <AnimatedRoutes />
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const saved = localStorage.getItem("crash-theme") || "dark";
    document.body.dataset.theme = saved;
  }, []);

  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
