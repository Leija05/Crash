import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import "./App.css";
import { AuthProvider } from "./auth/AuthContext";
import { I18nProvider } from "./i18n";
import { SettingsProvider } from "./context/SettingsContext";
import ErrorBoundary from "./components/ErrorBoundary";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const History = lazy(() => import("./pages/History"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
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
      <Routes location={location}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
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
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute role="superadmin">
              <AdminPanel />
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
      <I18nProvider>
        <AuthProvider>
          <SettingsProvider>
            <BrowserRouter>
              <Suspense fallback={<LoadingFallback />}>
                <AnimatedRoutes />
              </Suspense>
              <Toaster theme="dark" position="top-right" richColors closeButton />
            </BrowserRouter>
          </SettingsProvider>
        </AuthProvider>
      </I18nProvider>
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
