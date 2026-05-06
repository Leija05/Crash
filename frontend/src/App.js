import React, { useState, useEffect, useCallback } from 'react';
import "@/App.css";
import axios from 'axios';

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
};
const COUNT_API_NAMESPACE = 'crash-smart-detector';
const COUNT_API_KEY = 'unique-registered-users';


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
    fetchGlobalCount();
  }, [fetchGlobalCount]);


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
    localStorage.setItem(STORAGE_KEYS.id, id);
    localStorage.setItem(STORAGE_KEYS.name, userName.trim());
    localStorage.setItem(STORAGE_KEYS.age, String(numericAge));
    localStorage.setItem(STORAGE_KEYS.registered, 'true');
    localStorage.setItem(STORAGE_KEYS.registeredAt, new Date().toISOString());

    try {
      const countResponse = await axios.get(`https://api.countapi.xyz/hit/${COUNT_API_NAMESPACE}/${COUNT_API_KEY}`);
      setGlobalCount(countResponse?.data?.value ?? globalCount);
    } catch (error) {
      console.error('No se pudo incrementar contador global:', error);
    }

    setIsRegistered(true);
  };


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

      <div className="container mx-auto px-6 pt-24 md:pt-28">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-600/70 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-200">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
            Sesión de <span className="font-bold text-white">{userName || 'Visitante'}</span>
          </div>
          <div className="inline-flex items-center rounded-full border border-zinc-700/80 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-300">
            Usuarios registrados: <span className="font-semibold text-white ml-1">{globalCount ?? '...'}</span>
          </div>
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

      <section className="container mx-auto px-6 pb-8">
        <div className="rounded-3xl border border-zinc-700/80 bg-zinc-900/70 p-6 md:p-10 space-y-8">
          <header className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-red-400">Proyecto</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">C.R.A.S.H.</h2>
            <p className="text-zinc-200 leading-relaxed">C.R.A.S.H. es un dispositivo que se instala en cascos o vehículos y detecta accidentes automáticamente. Utiliza inteligencia artificial para analizar la gravedad del impacto y envía alertas inmediatas con ubicación a contactos de emergencia.</p>
            <p className="text-zinc-300">Su objetivo principal es garantizar que una persona accidentada reciba ayuda incluso si no puede comunicarse.</p>
          </header>

          <div className="grid md:grid-cols-2 gap-6">
            <article className="rounded-2xl border border-zinc-700 bg-zinc-950/60 p-5 space-y-3">
              <h3 className="text-xl font-bold text-white">Problema que resuelve</h3>
              <p className="text-zinc-300">Existe una alta cantidad de accidentes de tránsito, especialmente en motociclistas. Un gran porcentaje de las víctimas no recibe atención a tiempo.</p>
              <ul className="list-disc list-inside text-zinc-200 space-y-1">
                <li>No hay testigos</li><li>El accidentado queda inconsciente</li><li>No se reporta el incidente</li><li>No hay información técnica para servicios de emergencia</li>
              </ul>
              <p className="text-zinc-300">Esto provoca retrasos críticos en la atención médica.</p>
            </article>
            <article className="rounded-2xl border border-zinc-700 bg-zinc-950/60 p-5 space-y-3">
              <h3 className="text-xl font-bold text-white">Solución</h3>
              <ul className="list-disc list-inside text-zinc-200 space-y-1">
                <li>Detecta impactos mediante sensores</li><li>Analiza la gravedad usando inteligencia artificial</li><li>Envía alertas inmediatas con ubicación GPS</li><li>Notifica a contactos de emergencia y sistemas de control</li>
              </ul>
              <p className="text-zinc-300">No requiere intervención del usuario.</p>
            </article>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <article className="rounded-2xl border border-zinc-700 p-5 bg-zinc-950/60"><h3 className="font-bold text-white mb-2">Funcionamiento técnico</h3><p className="text-zinc-300 text-sm mb-2">Hardware: Sensor de movimiento (acelerómetro), microcontrolador, conectividad Bluetooth, instalación en casco o vehículo.</p><p className="text-zinc-300 text-sm">Software: Backend en FastAPI, modelo de IA para clasificar impactos y aplicación de monitoreo en tiempo real.</p></article>
            <article className="rounded-2xl border border-zinc-700 p-5 bg-zinc-950/60"><h3 className="font-bold text-white mb-2">Flujo de operación</h3><ol className="list-decimal list-inside text-zinc-200 text-sm space-y-1"><li>Se detecta un impacto</li><li>Se envían datos al sistema</li><li>La IA analiza la severidad</li><li>Si es grave, se activa la alerta automática</li></ol></article>
            <article className="rounded-2xl border border-zinc-700 p-5 bg-zinc-950/60"><h3 className="font-bold text-white mb-2">Propuesta de valor</h3><ul className="list-disc list-inside text-zinc-200 text-sm space-y-1"><li>Funciona de forma autónoma</li><li>Reduce el tiempo de respuesta</li><li>Convierte equipo de protección en inteligente</li><li>Entrega datos útiles a servicios médicos</li><li>Puede salvar vidas cuando el usuario no puede pedir ayuda</li></ul></article>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-zinc-600 bg-zinc-950/40 p-6 md:p-10 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">Video demostrativo (próximamente)</h3>
            <p className="text-zinc-300 max-w-2xl mx-auto">Este espacio está preparado para insertar un video de presentación o demo del producto (YouTube/Vimeo/archivo propio). Mantiene proporción y visibilidad dentro del flujo de la página.</p>
            <div className="mt-6 aspect-video w-full rounded-xl bg-zinc-800/70 border border-zinc-700 flex items-center justify-center text-zinc-400">Área reservada para video</div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <article className="rounded-2xl border border-zinc-700 bg-zinc-950/60 p-5 space-y-2"><h3 className="text-xl font-bold text-white">Mercado objetivo</h3><p className="text-zinc-300">Usuarios principales: motociclistas, repartidores (Uber Eats, DiDi, Rappi) y personas que usan motocicleta diariamente.</p><p className="text-zinc-300">Cliente potencial: repartidor independiente con largas jornadas, alto riesgo y dependencia de su salud para generar ingresos.</p></article>
            <article className="rounded-2xl border border-zinc-700 bg-zinc-950/60 p-5 space-y-2"><h3 className="text-xl font-bold text-white">Modelo de negocio</h3><p className="text-zinc-200">B2C: dispositivo $1,499 MXN + suscripción $49 MXN/mes.</p><p className="text-zinc-200">B2B: dispositivo $1,999 MXN + suscripción $150 MXN/usuario/mes.</p><p className="text-zinc-300">Incluye monitoreo, análisis de datos y prevención de riesgos.</p></article>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <article className="rounded-2xl border border-zinc-700 p-5 bg-zinc-950/60"><h3 className="font-bold text-white">Costos</h3><p className="text-zinc-300 text-sm mt-2">Producción por unidad: aproximadamente $800 MXN.</p><p className="text-zinc-300 text-sm">Gastos operativos mensuales: aproximadamente $1,300 MXN.</p></article>
            <article className="rounded-2xl border border-zinc-700 p-5 bg-zinc-950/60"><h3 className="font-bold text-white">Modelo de ingresos</h3><ul className="list-disc list-inside text-zinc-200 text-sm mt-2"><li>Venta del dispositivo</li><li>Suscripciones mensuales</li><li>Servicios adicionales para empresas</li><li>Integraciones personalizadas</li></ul><p className="text-zinc-300 text-sm mt-2">Modelo híbrido: producto físico + servicio digital.</p></article>
            <article className="rounded-2xl border border-zinc-700 p-5 bg-zinc-950/60"><h3 className="font-bold text-white">Oportunidad de negocio</h3><ul className="list-disc list-inside text-zinc-200 text-sm mt-2"><li>Crecimiento del uso de motocicletas</li><li>Alta demanda del sector reparto</li><li>Necesidad de reducir accidentes y costos</li><li>Mercado amplio y en expansión</li></ul></article>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <article className="rounded-2xl border border-zinc-700 bg-zinc-950/60 p-5"><h3 className="text-xl font-bold text-white mb-2">Normatividad y propiedad intelectual</h3><p className="text-zinc-300">Cumple con normas de seguridad en cascos, dispositivos electrónicos, seguridad laboral y protección de datos personales.</p><p className="text-zinc-300 mt-2">Incluye registro de dispositivo (modelo de utilidad), derechos de autor del software, registro de marca y protección de algoritmos como secreto industrial.</p></article>
            <article className="rounded-2xl border border-zinc-700 bg-zinc-950/60 p-5"><h3 className="text-xl font-bold text-white mb-2">Desarrollo y conclusión</h3><p className="text-zinc-300">Metodología Scrum: análisis, diseño, desarrollo e implementación con pruebas funcionales.</p><p className="text-zinc-200 mt-2">C.R.A.S.H. automatiza la detección de accidentes y la solicitud de ayuda, reduce tiempos de respuesta y aumenta probabilidades de supervivencia con un modelo escalable B2C/B2B.</p></article>
          </div>
        </div>
      </section>

      <Footer />

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
