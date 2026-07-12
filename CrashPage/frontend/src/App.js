import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import "./App.css";
import { analyticsAPI } from "./lib/api";
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

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

function LoadingFallback() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0A0A0A] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin" />
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
  useEffect(() => {
    analyticsAPI.track(location.pathname);
  }, [location.pathname]);
  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} variants={pageTransition} initial="initial" animate="animate" exit="exit">
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
        </motion.div>
      </AnimatePresence>
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
              <Toaster
                theme="dark"
                position="top-center"
                richColors
                closeButton
                expand
                visibleToasts={5}
                duration={4000}
                toastOptions={{
                  style: {
                    width: "100%",
                    maxWidth: "520px",
                    fontSize: "14px",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  },
                  classNames: {
                    toast: "border border-white/10 backdrop-blur-xl",
                    error: "!bg-red-500/90 !border-red-400/30 !text-white",
                    success: "!bg-emerald-500/90 !border-emerald-400/30 !text-white",
                    title: "text-sm font-medium",
                    description: "text-xs text-white/70",
                  },
                }}
              />
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
