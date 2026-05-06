import React, { useState, useEffect, useCallback, useMemo } from 'react';
import "@/App.css";
import axios from 'axios';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';

// Contexts
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';

// Components
import {
  Navbar,
  HeroSection,
  ProblemSection,
  HardwareSection,
  DifferenceSection,
  ArchitectureSection,
  AISection,
  Footer
} from '@/components/crash';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const STORAGE_KEYS = {
  id: 'id_usuario',
  name: 'nombre',
  age: 'edad',
  registered: 'registrado',
  registeredAt: 'fecha_registro',
  records: 'registros_estadisticas_crash'
};
const COUNT_API_NAMESPACE = 'crash-smart-detector';
const COUNT_API_KEY = 'unique-registered-users';

const formatDate = (value) => new Date(value).toISOString().slice(0, 10);
const parseRecords = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.records);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const CrashApp = () => {
  const { language } = useLanguage();

  const [scrolled, setScrolled] = useState(false);
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [gForce, setGForce] = useState(1.0);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isRegistered, setIsRegistered] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAge, setUserAge] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [globalCount, setGlobalCount] = useState(null);
  const [records, setRecords] = useState([]);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  const fetchGlobalCount = useCallback(async () => {
    try {
      const response = await axios.get(`https://api.countapi.xyz/get/${COUNT_API_NAMESPACE}/${COUNT_API_KEY}`);
      setGlobalCount(response?.data?.value ?? 0);
    } catch (error) {
      console.error('No se pudo obtener contador global:', error);
      setGlobalCount(0);
    }
  }, []);

  useEffect(() => {
    const registeredFlag = localStorage.getItem(STORAGE_KEYS.registered) === 'true';
    const savedName = localStorage.getItem(STORAGE_KEYS.name) || '';
    const savedAge = localStorage.getItem(STORAGE_KEYS.age) || '';

    setIsRegistered(registeredFlag);
    setUserName(savedName);
    setUserAge(savedAge);
    setRecords(parseRecords());
    fetchGlobalCount();
  }, [fetchGlobalCount]);

  useEffect(() => {
    const onShortcut = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        setIsStatsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAlertActive) setGForce(1.0 + (Math.random() * 0.2));
    }, 1000);
    return () => clearInterval(interval);
  }, [isAlertActive]);

  const triggerTest = useCallback(() => {
    const force = 8.4 + (Math.random() * 5);
    setGForce(force);
    setIsAlertActive(true);
    setAiAnalysis(null);
    setTimeout(() => {
      setIsAlertActive(false);
      setGForce(1.0);
    }, 15000);
  }, []);

  const cancelAlert = useCallback(() => {
    setIsAlertActive(false);
    setGForce(1.0);
    setAiAnalysis(null);
  }, []);

  const analyzeCrashSeverity = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const response = await axios.post(`${API}/analyze-crash`, { g_force: gForce, language });
      setAiAnalysis(response.data);
    } catch (error) {
      console.error('Error analyzing crash:', error);
      setAiAnalysis({
        severity: 'Error',
        probable_injuries: [language === 'es' ? 'No se pudo analizar' : 'Could not analyze'],
        first_aid_steps: [language === 'es' ? 'Intente de nuevo' : 'Please try again']
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [gForce, language]);

  const registerUser = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!userName.trim()) errors.name = 'El nombre es obligatorio';
    const numericAge = Number(userAge);
    if (!Number.isInteger(numericAge) || numericAge < 1 || numericAge > 120) {
      errors.age = 'Edad válida entre 1 y 120';
    }
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    const id = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const timestamp = Date.now();
    const today = formatDate(timestamp);
    const entry = { id, fecha: today, timestamp, nombre: userName.trim(), edad: numericAge };

    localStorage.setItem(STORAGE_KEYS.id, id);
    localStorage.setItem(STORAGE_KEYS.name, userName.trim());
    localStorage.setItem(STORAGE_KEYS.age, String(numericAge));
    localStorage.setItem(STORAGE_KEYS.registered, 'true');
    localStorage.setItem(STORAGE_KEYS.registeredAt, new Date(timestamp).toISOString());

    const updated = [...parseRecords(), entry];
    localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(updated));
    setRecords(updated);

    try {
      const countResponse = await axios.get(`https://api.countapi.xyz/hit/${COUNT_API_NAMESPACE}/${COUNT_API_KEY}`);
      setGlobalCount(countResponse?.data?.value ?? globalCount);
    } catch (error) {
      console.error('No se pudo incrementar contador global:', error);
    }

    setIsRegistered(true);
  };

  const clearUser = () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setIsRegistered(false);
    setUserName('');
    setUserAge('');
    setRecords([]);
    setFormErrors({});
    fetchGlobalCount();
  };

  const usersByDay = useMemo(() => {
    const map = records.reduce((acc, item) => {
      acc[item.fecha] = (acc[item.fecha] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([fecha, total]) => ({ fecha, total }));
  }, [records]);

  const ageRanges = useMemo(() => {
    const result = [
      { rango: '0-18', total: 0 },
      { rango: '19-30', total: 0 },
      { rango: '31-50', total: 0 },
      { rango: '50+', total: 0 }
    ];
    records.forEach(({ edad }) => {
      if (edad <= 18) result[0].total += 1;
      else if (edad <= 30) result[1].total += 1;
      else if (edad <= 50) result[2].total += 1;
      else result[3].total += 1;
    });
    return result;
  }, [records]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-red-500/30">
      {!isRegistered && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={registerUser} className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-700 p-6 space-y-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-white">Registro de ingreso</h2>
            <p className="text-sm text-zinc-300">Completa tus datos para continuar.</p>
            <div>
              <label className="text-sm text-zinc-200">Nombre</label>
              <input value={userName} onChange={(e) => setUserName(e.target.value)} className="mt-1 w-full rounded-md bg-zinc-800 border border-zinc-600 px-3 py-2 text-white" />
              {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="text-sm text-zinc-200">Edad</label>
              <input type="number" min="1" max="120" value={userAge} onChange={(e) => setUserAge(e.target.value)} className="mt-1 w-full rounded-md bg-zinc-800 border border-zinc-600 px-3 py-2 text-white" />
              {formErrors.age && <p className="text-xs text-red-400 mt-1">{formErrors.age}</p>}
            </div>
            <button type="submit" className="w-full py-2 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold">Ingresar</button>
            <p className="text-[11px] text-zinc-400">Limitación: el registro es único por navegador/dispositivo.</p>
          </form>
        </div>
      )}

      <Navbar scrolled={scrolled} onSimulate={triggerTest} />

      <div className="container mx-auto px-6 pt-6 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <p className="text-sm text-zinc-300">Bienvenido, <span className="font-semibold text-white">{userName || 'Visitante'}</span></p>
        <div className="flex items-center gap-3 text-sm">
          <p className="text-zinc-300">Usuarios registrados: <span className="font-semibold text-white">{globalCount ?? '...'}</span></p>
          <button onClick={clearUser} className="text-red-400 hover:text-red-300 underline">Cambiar usuario</button>
        </div>
      </div>

      <HeroSection gForce={gForce} isAlertActive={isAlertActive} />
      <main className="container mx-auto px-6 space-y-32 pb-32">
        <ProblemSection />
        <HardwareSection />
        <DifferenceSection />
        <ArchitectureSection />
        <AISection isAlertActive={isAlertActive} isAnalyzing={isAnalyzing} aiAnalysis={aiAnalysis} onAnalyze={analyzeCrashSeverity} onCancelAlert={cancelAlert} />
      </main>
      <Footer />

      {isStatsOpen && (
        <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-300 overflow-y-auto">
          <div className="mx-auto max-w-5xl bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">Panel de estadísticas</h3>
              <button onClick={() => setIsStatsOpen(false)} className="px-3 py-1 rounded bg-zinc-700 text-white hover:bg-zinc-600">Cerrar</button>
            </div>
            <p className="text-zinc-300">Total de usuarios registrados: <span className="font-bold text-white">{globalCount ?? 0}</span></p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-72 bg-zinc-800/70 rounded-lg p-3">
                <h4 className="text-sm text-zinc-200 mb-2">Usuarios por día</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usersByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#52525b" />
                    <XAxis dataKey="fecha" stroke="#d4d4d8" />
                    <YAxis stroke="#d4d4d8" allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="h-72 bg-zinc-800/70 rounded-lg p-3">
                <h4 className="text-sm text-zinc-200 mb-2">Distribución por edad</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageRanges}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#52525b" />
                    <XAxis dataKey="rango" stroke="#d4d4d8" />
                    <YAxis stroke="#d4d4d8" allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="overflow-x-auto">
              <h4 className="text-sm text-zinc-200 mb-2">Últimos registros</h4>
              <table className="w-full text-left text-sm text-zinc-200">
                <thead className="text-zinc-400 border-b border-zinc-700">
                  <tr><th className="py-2">Fecha</th><th>Nombre</th><th>Edad</th></tr>
                </thead>
                <tbody>
                  {[...records].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10).map((row) => (
                    <tr key={row.id} className="border-b border-zinc-800">
                      <td className="py-2">{row.fecha}</td>
                      <td>{row.nombre || 'Anónimo'}</td>
                      <td>{row.edad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isAlertActive && <div data-testid="emergency-overlay" className="fixed inset-0 z-[100] pointer-events-none border-[32px] border-red-600/20 animate-pulse mix-blend-overlay" />}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CrashApp />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
