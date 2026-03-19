# C.R.A.S.H. - PRD (Product Requirements Document)

## Problema Original
Mejorar la página web C.R.A.S.H. (Colisión: Respuesta y Alerta para Seguridad Humana) - un detector inteligente de impactos para motociclistas con integración de IA.

### Requisitos del Usuario
1. ✅ Estructura de código modular y organizada
2. ✅ Modo claro/oscuro
3. ✅ Soporte bilingüe (Español/Inglés)
4. ✅ Mantener todas las secciones originales
5. ✅ Integración con Gemini AI para análisis de severidad

---

## Arquitectura Técnica

### Frontend (React)
```
/app/frontend/src/
├── App.js                    # Componente principal con lógica de estado
├── App.css                   # Estilos globales y animaciones
├── index.css                 # Variables CSS para temas
├── contexts/
│   ├── ThemeContext.jsx      # Context para modo claro/oscuro
│   └── LanguageContext.jsx   # Context para internacionalización
├── components/crash/
│   ├── index.js              # Exports centralizados
│   ├── Navbar.jsx            # Navegación con toggles
│   ├── HeroSection.jsx       # Sección hero con display G-Force
│   ├── ProblemSection.jsx    # Sección de identificación del problema
│   ├── HardwareSection.jsx   # Tarjetas de componentes
│   ├── ArchitectureSection.jsx # Protocolos y código
│   ├── AISection.jsx         # Integración Gemini AI
│   ├── MobileMockup.jsx      # Simulación de app móvil
│   └── Footer.jsx            # Pie de página
└── data/
    └── translations.js       # Traducciones ES/EN
```

### Backend (FastAPI)
```
/app/backend/
├── server.py                 # API con endpoint /api/analyze-crash
└── .env                      # EMERGENT_LLM_KEY para Gemini
```

### API Endpoints
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/ | Health check |
| POST | /api/analyze-crash | Análisis de severidad con Gemini AI |

---

## Funcionalidades Implementadas

### Fecha: 19 Enero 2026

#### ✅ Estructura Modular
- Componentes React separados por responsabilidad
- Contexts para gestión de estado global
- Traducciones centralizadas en archivo JSON-like

#### ✅ Modo Claro/Oscuro
- Toggle en navbar (Sol/Luna icons)
- Persistencia en localStorage
- Variables CSS dinámicas

#### ✅ Soporte Bilingüe
- Toggle ES/EN en navbar
- Traducciones completas para todas las secciones
- Persistencia en localStorage

#### ✅ Integración Gemini AI
- Backend con endpoint POST /api/analyze-crash
- Usa emergentintegrations library
- Respuestas en JSON estructurado (severidad, lesiones, primeros auxilios)
- Fallback inteligente si falla la API

#### ✅ Secciones Preservadas
- Hero con telemetría G-Force animada
- Problema: estadísticas y ámbito de impacto
- Hardware: 6 componentes con iconos
- Arquitectura: protocolos I2C/UART + código
- AI: mockup móvil + análisis Gemini

---

## User Personas

### 1. Estudiante de Ingeniería
- **Objetivo**: Aprender sobre sistemas embebidos y IoT
- **Necesidad**: Documentación clara de arquitectura

### 2. Motociclista / Delivery
- **Objetivo**: Entender cómo funciona el sistema de seguridad
- **Necesidad**: Interfaz intuitiva y accesible

### 3. Jurado de InnovaTec
- **Objetivo**: Evaluar el proyecto técnico
- **Necesidad**: Demo interactiva y visualmente impactante

---

## Backlog Priorizado

### P0 (Completado)
- [x] Estructura modular de componentes
- [x] Modo claro/oscuro
- [x] Internacionalización ES/EN
- [x] Integración Gemini AI

### P1 (Futuro)
- [ ] Animaciones de entrada para secciones (scroll reveal)
- [ ] Sonido de alerta configurable
- [ ] Exportar reporte de análisis como PDF

### P2 (Nice to Have)
- [ ] Modo de demostración automático
- [ ] Integración con GPS real (simulado)
- [ ] Dashboard de histórico de impactos

---

## Próximas Tareas
1. Agregar animaciones de scroll reveal para secciones
2. Implementar PWA para instalación móvil
3. Agregar efectos de sonido para alertas
