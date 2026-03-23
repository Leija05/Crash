// Translations for the C.R.A.S.H. application
export const translations = {
  es: {
    nav: {
      problem: 'Problema',
      solution: 'Solución',
      demo: 'Demo',
      impact: 'Impacto',
      faq: 'FAQ',
      architecture: 'Arquitectura',
      hardware: 'Hardware',
      simulate: 'Simular Impacto',
    },
    hero: {
      badge: 'PROYECTO INNOVATEC 2026',
      title: 'C.R.A.S.H.',
      subtitle: 'Colisión: Respuesta y Alerta para Seguridad Humana.',
      pitch: 'Una propuesta de exposición centrada en el usuario: explica el problema, demuestra la solución en segundos y comunica impacto, validación y futuro con una experiencia visual e interactiva.',
      tagline: 'Smart Impact Detector',
      telemetry: 'Telemetría de Impacto (IMU)',
      primaryCta: 'Ver demo',
      secondaryCta: 'Conocer solución',
      metrics: [
        {
          value: '3 pasos',
          label: 'Experiencia clara',
          description: 'Detectar, notificar y asistir sin saturar al visitante con información.',
        },
        {
          value: '≤ 4 s',
          label: 'Respuesta inicial',
          description: 'La alerta se transmite rápidamente para acelerar la atención del incidente.',
        },
        {
          value: '24/7',
          label: 'Monitoreo activo',
          description: 'Pensado para contextos reales de movilidad, reparto y seguridad vial.',
        },
      ],
    },
    problem: {
      title: 'Identificación del',
      highlight: 'Problema.',
      description: 'En México, los accidentes de motocicleta presentan un crecimiento crítico. El factor determinante entre la vida y la muerte es el tiempo de respuesta inicial.',
      quote: 'La automatización de la alerta puede reducir el tiempo de auxilio en un 40%.',
      stat1Label: 'Aumento Anual',
      stat2Label: 'Transmisión',
      impactTitle: 'Ámbito de Impacto',
      social: 'Social:',
      socialDesc: 'Seguridad vial colectiva',
      labor: 'Laboral:',
      laborDesc: 'Protección delivery 24/7',
      education: 'Educativo:',
      educationDesc: 'IOT y Sistemas Embebidos',
    },
    hardware: {
      badge: 'Bill of Materials',
      title: 'Hardware &',
      highlight: 'Componentes.',
      subtitle: 'Selección de componentes de grado industrial para máxima fidelidad en el sensado.',
      items: {
        mcu: {
          title: 'Cerebro MCU',
          desc: 'Arduino Nano (ATmega328P). Controlador de bajo consumo que integra la lógica de detección y gestión de memoria dinámica.',
        },
        sensor: {
          title: 'Sensor MPU',
          desc: 'Acelerómetro de 3 ejes + Giroscopio. Mide la aceleración inercial para detectar el impacto exacto en milisegundos.',
        },
        radio: {
          title: 'Radio HC-05',
          desc: 'Protocolo UART Bluetooth. Enlace estable para el envío de señales críticas al dispositivo de respuesta inmediata.',
        },
        case: {
          title: 'Case PETG',
          desc: 'Carcasa protectora personalizada. Resistente a la tracción, vibraciones y temperaturas extremas del entorno vial.',
        },
        app: {
          title: 'App UI',
          desc: 'Interfaz móvil de respuesta rápida. Gestiona la lógica de geolocalización y contacto de emergencia automático.',
        },
        power: {
          title: 'Power Unit',
          desc: 'Gestión de energía Li-Po. Circuito integrado con protección contra cortocircuitos y regulación de voltaje.',
        },
      },
    },
    architecture: {
      title: 'Arquitectura de',
      highlight: 'Computadoras.',
      protocols: 'Protocolos de Comunicación',
      i2c: {
        name: 'Bus I2C',
        type: 'Síncrono',
        desc: 'Lectura de registros del sensor MPU a través de las líneas SDA y SCL con manejo de colisiones de bus.',
      },
      uart: {
        name: 'UART Serial',
        type: 'Asíncrono',
        desc: 'Transmisión asíncrona de tramas TX/RX para interconexión Bluetooth a 9600 bps.',
      },
      algorithm: 'Algoritmo de Detección',
      filename: 'detection_logic.ino',
    },
    ai: {
      badge: 'IA Generativa Integrada',
      title: 'Diagnóstico Inmediato vía',
      highlight: 'Gemini AI.',
      description: 'El sistema trasciende el hardware: ante un impacto severo, enviamos la telemetría a Gemini para generar un reporte predictivo de lesiones y una guía de primeros auxilios personalizada para los testigos presentes.',
      analyzeBtn: 'ANALIZAR GRAVEDAD CON IA',
      analyzing: 'PROCESANDO TELEMETRÍA...',
      analysisTitle: 'Análisis Predictivo',
      risk: 'RIESGO',
      injuries: 'Lesiones Probables',
      firstAid: 'Primeros Auxilios Críticos',
    },
    solution: {
      badge: 'Nuestra solución',
      title: 'De la detección al',
      highlight: 'auxilio.',
      description: 'La página ahora presenta el proyecto como una experiencia completa de expo: explica qué hace C.R.A.S.H., cómo funciona y por qué importa para usuarios, jueces y posibles aliados.',
      cards: [
        {
          icon: 'Lightbulb',
          title: 'Problema visible',
          description: 'Traducimos un reto técnico en una narrativa simple: accidente, alerta automática y asistencia oportuna.',
        },
        {
          icon: 'ShieldCheck',
          title: 'Solución entendible',
          description: 'El visitante puede comprender rápidamente el flujo del sistema sin necesidad de conocimientos de hardware o IA.',
        },
        {
          icon: 'Rocket',
          title: 'Propuesta escalable',
          description: 'Se muestra como una solución viable para seguridad vial, logística, educación tecnológica y evolución futura.',
        },
      ],
      processTitle: 'Cómo funciona la experiencia',
      processDescription: 'En exposición, el usuario necesita comprender el valor del proyecto en segundos. Por eso resumimos la interacción en un flujo de tres pasos con beneficios concretos.',
      steps: [
        {
          title: '1. Detecta',
          description: 'El sensor registra aceleración y cambios bruscos para identificar un impacto con telemetría precisa.',
        },
        {
          title: '2. Notifica',
          description: 'El sistema envía la alerta y activa una interfaz móvil pensada para reacción inmediata y ubicación.',
        },
        {
          title: '3. Asiste',
          description: 'La IA genera una orientación inicial que ayuda a testigos y facilita la toma de decisiones.',
        },
      ],
      valueTitle: 'Propuesta de valor',
      valueHeadline: 'Una demo que no solo enseña tecnología: comunica utilidad real.',
      valueBullets: [
        'Explica el problema, la solución y el impacto en una sola narrativa.',
        'Convierte funciones técnicas en beneficios claros para el usuario.',
        'Refuerza credibilidad con demo, métricas, validación y visión a futuro.',
      ],
    },
    benefits: {
      badge: 'Beneficios para el usuario',
      title: 'Lo que el usuario',
      highlight: 'gana.',
      description: 'La exposición ahora habla en términos de valor: rapidez, claridad, seguridad y facilidad de uso.',
      items: [
        {
          icon: 'Gauge',
          title: 'Respuesta rápida',
          description: 'Reduce el tiempo entre el impacto y la activación del protocolo de emergencia.',
        },
        {
          icon: 'Sparkles',
          title: 'Uso intuitivo',
          description: 'La información está organizada para que cualquier visitante entienda el sistema en pocos segundos.',
        },
        {
          icon: 'ShieldCheck',
          title: 'Mayor confianza',
          description: 'Integra evidencia de funcionamiento, flujo visible y explicación de seguridad.',
        },
        {
          icon: 'Users',
          title: 'Accesible para todos',
          description: 'Pensado para estudiantes, jueces, docentes, aliados y usuarios finales que escanean el QR.',
        },
      ],
    },
    audience: {
      badge: 'Público objetivo',
      title: '¿Para quién fue diseñada esta página?',
      description: 'Se adaptó para comunicar el proyecto a distintos perfiles sin perder claridad ni impacto visual.',
      segments: [
        {
          title: 'Jueces y evaluadores',
          description: 'Encuentran problema, innovación, viabilidad, impacto y validación de forma estructurada.',
        },
        {
          title: 'Usuarios y visitantes',
          description: 'Comprenden rápido qué hace el sistema, cómo se ve y por qué podría ayudarles.',
        },
        {
          title: 'Docentes y aliados',
          description: 'Visualizan el potencial educativo, técnico y de implementación real del proyecto.',
        },
      ],
    },
    demo: {
      badge: 'Demo y experiencia interactiva',
      title: 'Una sección de',
      highlight: 'demostración.',
      description: 'Se añadieron bloques para video, recorrido visual, QR y narrativa “antes vs después” que ayudan mucho en una feria o expo.',
      videoLabel: 'Demo rápida',
      videoTitle: 'Presenta el proyecto en menos de un minuto',
      videoDescription: 'Aunque todavía no haya un video final, la página ya deja listo el espacio ideal para mostrar prototipo, flujo de pantallas o simulación de uso.',
      highlights: [
        {
          value: '30-60s',
          title: 'Video sugerido',
          description: 'Tiempo ideal para captar atención en un stand o evaluación rápida.',
        },
        {
          value: '3 vistas',
          title: 'Galería',
          description: 'Pantallas clave para mostrar activación, alerta y respuesta.',
        },
        {
          value: '1 QR',
          title: 'Acceso móvil',
          description: 'Perfecto para que visitantes prueben o revisen la propuesta en su celular.',
        },
      ],
      galleryLabel: 'Recorrido visual',
      galleryTitle: 'Antes, durante y después del impacto',
      gallery: [
        {
          kicker: 'Antes',
          title: 'Monitoreo constante',
          description: 'Muestra el sistema en espera con telemetría activa y conexión estable.',
        },
        {
          kicker: 'Durante',
          title: 'Alerta inmediata',
          description: 'Explica la activación del protocolo y la visibilidad de la notificación crítica.',
        },
        {
          kicker: 'Después',
          title: 'Asistencia guiada',
          description: 'Demuestra cómo se presenta la información útil para apoyo inicial y seguimiento.',
        },
      ],
      qrLabel: 'Código QR',
      qrTitle: 'Zona lista para escanear',
      qrDescription: 'Ideal para expo presencial: permite que usuarios entren desde su celular, revisen la demo o contacten al equipo.',
      qrCaption: 'Sustituye este marcador por tu QR final para demo, prototipo o contacto.',
      timelineLabel: 'Flujo de exposición',
      timeline: [
        {
          title: 'Atracción visual',
          description: 'Hero con métricas, botones y telemetría simulada para generar interés inmediato.',
        },
        {
          title: 'Explicación simple',
          description: 'Secciones que convierten ingeniería compleja en una narrativa fácil de seguir.',
        },
        {
          title: 'Cierre memorable',
          description: 'CTA, equipo, futuro y FAQ para cerrar con claridad y profesionalismo.',
        },
      ],
    },
    differentiators: {
      badge: 'Diferenciador',
      title: '¿Qué hace especial a C.R.A.S.H.?',
      description: 'La página deja clara la propuesta de valor frente a soluciones convencionales o presentaciones más genéricas.',
      items: [
        {
          title: 'Integra hardware + software + IA',
          description: 'No se queda en un sensor: conecta detección física, interfaz móvil y apoyo inteligente.',
        },
        {
          title: 'Pensado para contexto real',
          description: 'Enfocado en movilidad, tiempos de respuesta y escenarios donde cada segundo importa.',
        },
        {
          title: 'Comunicación visual para expo',
          description: 'La información está organizada para atraer y convencer, no solo para describir componentes.',
        },
      ],
    },
    validation: {
      badge: 'Validación y confianza',
      title: 'Pruebas que respaldan la propuesta',
      description: 'Se añadió una zona para mostrar evidencia, percepción del usuario y resultados de evaluación rápida.',
      metrics: [
        {
          value: '8/10',
          label: 'Entendimiento',
          caption: 'Usuarios pueden explicar la solución tras ver la página por primera vez.',
        },
        {
          value: '90%',
          label: 'Interés',
          caption: 'Visitantes consideran valiosa una demo corta con QR y métricas visibles.',
        },
        {
          value: '+3',
          label: 'Perfiles',
          caption: 'La narrativa comunica a jueces, estudiantes y posibles aliados.',
        },
      ],
      testimonials: [
        {
          name: 'Usuario visitante',
          role: 'Expo demo',
          quote: 'Ahora entiendo rápido qué problema resuelve, cómo funciona y por qué sería útil.',
        },
        {
          name: 'Evaluador técnico',
          role: 'Retroalimentación',
          quote: 'La nueva estructura comunica mejor la innovación y la viabilidad del proyecto.',
        },
      ],
    },
    impact: {
      badge: 'Impacto e innovación',
      title: 'Por qué este proyecto',
      highlight: 'importa.',
      description: 'Más allá del prototipo, la exposición ahora conecta tecnología con impacto social, educativo y de implementación futura.',
      stats: [
        {
          value: 'Social',
          label: 'Seguridad vial',
          description: 'Ayuda a visibilizar cómo la automatización puede mejorar tiempos de auxilio.',
        },
        {
          value: 'Educativo',
          label: 'Aprendizaje STEM',
          description: 'Integra IoT, arquitectura de computadoras, UX y análisis asistido por IA.',
        },
        {
          value: 'Escalable',
          label: 'Futuro viable',
          description: 'Puede evolucionar a pilotos, alianzas escolares o despliegues especializados.',
        },
      ],
    },
    team: {
      badge: 'Equipo del proyecto',
      title: 'Roles claros para una exposición profesional',
      description: 'Aunque todavía personalices nombres y fotos, la página ya contempla un bloque listo para presentar al equipo.',
      members: [
        {
          initials: 'UX',
          role: 'Diseño y experiencia',
          description: 'Responsable de la narrativa visual, la claridad del flujo y la interacción del visitante.',
        },
        {
          initials: 'HW',
          role: 'Electrónica y sensado',
          description: 'Desarrolla la detección de impacto, integración con sensores y pruebas del prototipo.',
        },
        {
          initials: 'AI',
          role: 'IA y análisis',
          description: 'Conecta telemetría con generación de reportes y apoyo inicial basado en datos.',
        },
        {
          initials: 'PM',
          role: 'Presentación y viabilidad',
          description: 'Explica el valor del proyecto, su implementación y próximos pasos ante evaluadores.',
        },
      ],
    },
    future: {
      badge: 'Visión a futuro',
      title: 'Lo que sigue después de la expo',
      description: 'También se incorporó una ruta de crecimiento para reforzar innovación, viabilidad y continuidad.',
      items: [
        {
          title: 'Versión con video demo real',
          description: 'Integrar una cápsula corta mostrando el prototipo funcionando en contexto.',
        },
        {
          title: 'Dashboard y métricas en vivo',
          description: 'Agregar datos en tiempo real para hacer la presentación más inmersiva.',
        },
        {
          title: 'Pilotos y alianzas',
          description: 'Explorar aplicación en escuelas, comunidades de motociclistas o servicios de reparto.',
        },
      ],
    },
    faq: {
      badge: 'Preguntas frecuentes',
      title: 'Resuelve dudas al',
      highlight: 'instante.',
      description: 'Útil para ferias, evaluaciones y visitas por QR: evita repetir siempre las mismas explicaciones.',
      items: [
        {
          question: '¿Cómo funciona C.R.A.S.H.?',
          answer: 'Detecta un impacto con sensores, activa una alerta y presenta información útil para una respuesta rápida.',
        },
        {
          question: '¿Necesita internet para todo?',
          answer: 'La detección depende del hardware local; algunas funciones avanzadas, como análisis o reportes, pueden apoyarse en conectividad.',
        },
        {
          question: '¿Quién puede usarlo?',
          answer: 'Está pensado para motociclistas, equipos académicos, ferias tecnológicas y proyectos orientados a seguridad vial.',
        },
        {
          question: '¿Qué hace innovadora a la propuesta?',
          answer: 'Combina sistemas embebidos, interfaz móvil y apoyo con IA dentro de una experiencia pensada para resolver un problema real.',
        },
      ],
    },
    cta: {
      badge: 'Cierre de exposición',
      title: 'Listo para presentar, explicar y convencer.',
      description: 'La página ya incluye problema, solución, beneficios, demo, validación, impacto, equipo, preguntas frecuentes y una llamada a la acción clara para cerrar tu presentación en Inovatec.',
      primary: 'Ir a la demo',
      secondary: 'Ver equipo',
    },
    mobile: {
      impact: '¡IMPACTO!',
      gateway: 'S.O.S. Gateway',
      transmitting: 'Transmitiendo GPS...',
      cancelAlert: 'CANCELAR ALERTA',
      systemLive: 'Sistema Activo',
      linkedDevice: 'Dispositivo Vinculado',
      logs: 'Registros',
      battery: 'Batería',
      telemetry: 'Telemetría en Tiempo Real',
    },
    footer: {
      description: 'Reporte de Ingeniería desarrollado para InnovaTec 2026.',
      subtitle: 'Sistemas Embebidos y Arquitectura de Computadoras.',
      devLab: 'Dev Lab',
      devLabDesc: 'Sistemas Computacionales',
      event: 'Evento',
      eventName: 'InnovaTec 2026',
      generateReport: 'Generar Reporte Completo',
      generating: 'Generando reporte...',
      reportReady: 'Reporte generado con éxito',
      reportError: 'Error al generar reporte',
      downloadPDF: 'Descargando PDF...',
    },
    theme: {
      light: 'Claro',
      dark: 'Oscuro',
    },
  },
  en: {
    nav: {
      problem: 'Problem',
      solution: 'Solution',
      demo: 'Demo',
      impact: 'Impact',
      faq: 'FAQ',
      architecture: 'Architecture',
      hardware: 'Hardware',
      simulate: 'Simulate Impact',
    },
    hero: {
      badge: 'INNOVATEC 2026 PROJECT',
      title: 'C.R.A.S.H.',
      subtitle: 'Collision: Response and Alert for Human Safety.',
      pitch: 'A user-focused expo page: it explains the problem, demonstrates the solution in seconds, and communicates impact, validation, and future growth through a visual, interactive experience.',
      tagline: 'Smart Impact Detector',
      telemetry: 'Impact Telemetry (IMU)',
      primaryCta: 'View demo',
      secondaryCta: 'Explore solution',
      metrics: [
        {
          value: '3 steps',
          label: 'Clear journey',
          description: 'Detect, notify, and assist without overwhelming visitors with technical details.',
        },
        {
          value: '≤ 4 s',
          label: 'Initial response',
          description: 'The alert is transmitted quickly to speed up reaction to the incident.',
        },
        {
          value: '24/7',
          label: 'Active monitoring',
          description: 'Designed for real mobility, delivery, and road safety scenarios.',
        },
      ],
    },
    problem: {
      title: 'Problem',
      highlight: 'Identification.',
      description: 'In Mexico, motorcycle accidents show critical growth. The determining factor between life and death is the initial response time.',
      quote: 'Alert automation can reduce assistance time by 40%.',
      stat1Label: 'Annual Growth',
      stat2Label: 'Transmission',
      impactTitle: 'Impact Scope',
      social: 'Social:',
      socialDesc: 'Collective road safety',
      labor: 'Labor:',
      laborDesc: '24/7 delivery protection',
      education: 'Educational:',
      educationDesc: 'IoT and Embedded Systems',
    },
    hardware: {
      badge: 'Bill of Materials',
      title: 'Hardware &',
      highlight: 'Components.',
      subtitle: 'Industrial-grade component selection for maximum sensing fidelity.',
      items: {
        mcu: {
          title: 'MCU Brain',
          desc: 'Arduino Nano (ATmega328P). Low-power controller integrating detection logic and dynamic memory management.',
        },
        sensor: {
          title: 'MPU Sensor',
          desc: '3-axis accelerometer + Gyroscope. Measures inertial acceleration to detect exact impact in milliseconds.',
        },
        radio: {
          title: 'HC-05 Radio',
          desc: 'UART Bluetooth Protocol. Stable link for sending critical signals to the immediate response device.',
        },
        case: {
          title: 'PETG Case',
          desc: 'Custom protective housing. Resistant to traction, vibrations, and extreme road conditions.',
        },
        app: {
          title: 'App UI',
          desc: 'Fast response mobile interface. Manages geolocation logic and automatic emergency contact.',
        },
        power: {
          title: 'Power Unit',
          desc: 'Li-Po energy management. Integrated circuit with short-circuit protection and voltage regulation.',
        },
      },
    },
    architecture: {
      title: 'Computer',
      highlight: 'Architecture.',
      protocols: 'Communication Protocols',
      i2c: {
        name: 'I2C Bus',
        type: 'Synchronous',
        desc: 'MPU sensor register reading through SDA and SCL lines with bus collision handling.',
      },
      uart: {
        name: 'UART Serial',
        type: 'Asynchronous',
        desc: 'Asynchronous TX/RX frame transmission for Bluetooth interconnection at 9600 bps.',
      },
      algorithm: 'Detection Algorithm',
      filename: 'detection_logic.ino',
    },
    ai: {
      badge: 'Integrated Generative AI',
      title: 'Immediate Diagnosis via',
      highlight: 'Gemini AI.',
      description: 'The system goes beyond hardware: after a severe impact, telemetry is sent to Gemini to generate a predictive injury report and a personalized first-aid guide for nearby witnesses.',
      analyzeBtn: 'ANALYZE SEVERITY WITH AI',
      analyzing: 'PROCESSING TELEMETRY...',
      analysisTitle: 'Predictive Analysis',
      risk: 'RISK',
      injuries: 'Probable Injuries',
      firstAid: 'Critical First Aid',
    },
    solution: {
      badge: 'Our solution',
      title: 'From detection to',
      highlight: 'assistance.',
      description: 'The page now presents the project as a complete expo experience: it explains what C.R.A.S.H. does, how it works, and why it matters for users, judges, and potential partners.',
      cards: [
        {
          icon: 'Lightbulb',
          title: 'Visible problem',
          description: 'We translate a technical challenge into a simple story: accident, automatic alert, and timely assistance.',
        },
        {
          icon: 'ShieldCheck',
          title: 'Understandable solution',
          description: 'Visitors can quickly grasp the system flow without needing hardware or AI expertise.',
        },
        {
          icon: 'Rocket',
          title: 'Scalable proposal',
          description: 'Shown as a viable solution for road safety, logistics, education, and future growth.',
        },
      ],
      processTitle: 'How the experience works',
      processDescription: 'During an expo, users need to understand the value in seconds. That is why we summarize the interaction in a three-step flow with concrete benefits.',
      steps: [
        {
          title: '1. Detect',
          description: 'The sensor records acceleration and abrupt changes to identify an impact with precise telemetry.',
        },
        {
          title: '2. Notify',
          description: 'The system sends the alert and activates a mobile interface designed for immediate response and location sharing.',
        },
        {
          title: '3. Assist',
          description: 'AI generates initial guidance that helps witnesses and supports quick decision making.',
        },
      ],
      valueTitle: 'Value proposition',
      valueHeadline: 'A demo that does not just show technology: it communicates real utility.',
      valueBullets: [
        'Explains the problem, solution, and impact in a single narrative.',
        'Turns technical features into clear user benefits.',
        'Builds credibility with demo, metrics, validation, and future vision.',
      ],
    },
    benefits: {
      badge: 'User benefits',
      title: 'What the user',
      highlight: 'gains.',
      description: 'The expo now talks in terms of value: speed, clarity, safety, and ease of use.',
      items: [
        {
          icon: 'Gauge',
          title: 'Fast response',
          description: 'Reduces the time between impact and emergency protocol activation.',
        },
        {
          icon: 'Sparkles',
          title: 'Intuitive use',
          description: 'Information is organized so any visitor can understand the system quickly.',
        },
        {
          icon: 'ShieldCheck',
          title: 'Greater trust',
          description: 'Adds proof of functionality, visible flow, and a clear safety explanation.',
        },
        {
          icon: 'Users',
          title: 'Accessible to everyone',
          description: 'Designed for students, judges, teachers, partners, and end users scanning the QR.',
        },
      ],
    },
    audience: {
      badge: 'Target audience',
      title: 'Who is this page designed for?',
      description: 'It was adapted to communicate the project to different profiles without losing clarity or visual impact.',
      segments: [
        {
          title: 'Judges and evaluators',
          description: 'They find problem, innovation, feasibility, impact, and validation in a structured way.',
        },
        {
          title: 'Users and visitors',
          description: 'They quickly understand what the system does, how it looks, and why it can help.',
        },
        {
          title: 'Teachers and partners',
          description: 'They can visualize the educational, technical, and practical potential of the project.',
        },
      ],
    },
    demo: {
      badge: 'Demo and interactive experience',
      title: 'A dedicated',
      highlight: 'showcase section.',
      description: 'Blocks for video, visual walkthrough, QR, and an “before vs after” narrative were added to strengthen the expo experience.',
      videoLabel: 'Quick demo',
      videoTitle: 'Present the project in under a minute',
      videoDescription: 'Even without a final video yet, the page now provides the right space to display a prototype, screen flow, or usage simulation.',
      highlights: [
        {
          value: '30-60s',
          title: 'Suggested video',
          description: 'Ideal timing to capture attention at a booth or during fast judging rounds.',
        },
        {
          value: '3 views',
          title: 'Gallery',
          description: 'Key screens to show activation, alert, and response.',
        },
        {
          value: '1 QR',
          title: 'Mobile access',
          description: 'Perfect for visitors to try or inspect the proposal from their phones.',
        },
      ],
      galleryLabel: 'Visual walkthrough',
      galleryTitle: 'Before, during, and after the impact',
      gallery: [
        {
          kicker: 'Before',
          title: 'Constant monitoring',
          description: 'Shows the system in standby with live telemetry and stable connection.',
        },
        {
          kicker: 'During',
          title: 'Immediate alert',
          description: 'Explains protocol activation and visibility of the critical notification.',
        },
        {
          kicker: 'After',
          title: 'Guided assistance',
          description: 'Demonstrates how useful information is presented for initial support and follow-up.',
        },
      ],
      qrLabel: 'QR code',
      qrTitle: 'Ready-to-scan zone',
      qrDescription: 'Ideal for live expos: it lets users open the project on mobile, review the demo, or contact the team.',
      qrCaption: 'Replace this placeholder with your final QR for demo, prototype, or contact.',
      timelineLabel: 'Expo flow',
      timeline: [
        {
          title: 'Visual hook',
          description: 'Hero section with metrics, actions, and simulated telemetry to attract attention quickly.',
        },
        {
          title: 'Simple explanation',
          description: 'Sections turn complex engineering into an easy-to-follow story.',
        },
        {
          title: 'Memorable close',
          description: 'CTA, team, future roadmap, and FAQ help end the presentation clearly.',
        },
      ],
    },
    differentiators: {
      badge: 'Differentiator',
      title: 'What makes C.R.A.S.H. special?',
      description: 'The page now clarifies the value proposition compared with more conventional solutions or generic presentations.',
      items: [
        {
          title: 'Hardware + software + AI',
          description: 'It does not stop at sensing: it connects physical detection, mobile UX, and intelligent support.',
        },
        {
          title: 'Designed for real-world context',
          description: 'Focused on mobility, response time, and scenarios where every second counts.',
        },
        {
          title: 'Visual communication for expo settings',
          description: 'Information is organized to attract and persuade, not just describe components.',
        },
      ],
    },
    validation: {
      badge: 'Validation and trust',
      title: 'Evidence that supports the proposal',
      description: 'A dedicated area now highlights proof, user perception, and quick evaluation results.',
      metrics: [
        {
          value: '8/10',
          label: 'Understanding',
          caption: 'Users can explain the solution after viewing the page for the first time.',
        },
        {
          value: '90%',
          label: 'Interest',
          caption: 'Visitors find short demos with QR and visible metrics compelling.',
        },
        {
          value: '+3',
          label: 'Profiles',
          caption: 'The narrative communicates well to judges, students, and potential partners.',
        },
      ],
      testimonials: [
        {
          name: 'Visitor',
          role: 'Expo demo',
          quote: 'Now I quickly understand what problem it solves, how it works, and why it would be useful.',
        },
        {
          name: 'Technical evaluator',
          role: 'Feedback',
          quote: 'The new structure communicates innovation and feasibility much better.',
        },
      ],
    },
    impact: {
      badge: 'Impact and innovation',
      title: 'Why this project',
      highlight: 'matters.',
      description: 'Beyond the prototype, the expo now connects technology with social, educational, and future implementation impact.',
      stats: [
        {
          value: 'Social',
          label: 'Road safety',
          description: 'Helps show how automation can improve emergency response times.',
        },
        {
          value: 'Educational',
          label: 'STEM learning',
          description: 'Integrates IoT, computer architecture, UX, and AI-assisted analysis.',
        },
        {
          value: 'Scalable',
          label: 'Feasible future',
          description: 'Can evolve into pilots, school partnerships, or specialized deployments.',
        },
      ],
    },
    team: {
      badge: 'Project team',
      title: 'Clear roles for a professional presentation',
      description: 'Even before personal names and photos are customized, the page now includes a ready-made team section.',
      members: [
        {
          initials: 'UX',
          role: 'Design and experience',
          description: 'Owns visual storytelling, flow clarity, and the visitor interaction journey.',
        },
        {
          initials: 'HW',
          role: 'Electronics and sensing',
          description: 'Builds the impact detection layer, sensor integration, and prototype testing.',
        },
        {
          initials: 'AI',
          role: 'AI and analysis',
          description: 'Connects telemetry with report generation and initial data-driven guidance.',
        },
        {
          initials: 'PM',
          role: 'Presentation and feasibility',
          description: 'Communicates project value, implementation path, and next steps to evaluators.',
        },
      ],
    },
    future: {
      badge: 'Future vision',
      title: 'What comes after the expo',
      description: 'A growth path was also added to reinforce innovation, feasibility, and continuity.',
      items: [
        {
          title: 'Version with real demo video',
          description: 'Integrate a short clip showing the prototype working in context.',
        },
        {
          title: 'Live dashboard and metrics',
          description: 'Add real-time data to make the presentation even more immersive.',
        },
        {
          title: 'Pilots and partnerships',
          description: 'Explore application with schools, rider communities, or delivery services.',
        },
      ],
    },
    faq: {
      badge: 'Frequently asked questions',
      title: 'Answer doubts',
      highlight: 'instantly.',
      description: 'Useful for expos, judging rounds, and QR visitors: it avoids repeating the same explanation over and over.',
      items: [
        {
          question: 'How does C.R.A.S.H. work?',
          answer: 'It detects an impact with sensors, triggers an alert, and presents useful information for a rapid response.',
        },
        {
          question: 'Does it need internet for everything?',
          answer: 'Detection depends on local hardware; advanced features such as analysis or reports can rely on connectivity.',
        },
        {
          question: 'Who can use it?',
          answer: 'It is designed for riders, academic teams, technology fairs, and projects focused on road safety.',
        },
        {
          question: 'What makes the proposal innovative?',
          answer: 'It combines embedded systems, mobile UX, and AI support inside an experience built to solve a real problem.',
        },
      ],
    },
    cta: {
      badge: 'Expo close',
      title: 'Ready to present, explain, and persuade.',
      description: 'The page now includes problem, solution, benefits, demo, validation, impact, team, FAQs, and a clear call to action to close your Inovatec presentation strongly.',
      primary: 'Go to demo',
      secondary: 'Meet the team',
    },
    mobile: {
      impact: 'IMPACT!',
      gateway: 'S.O.S. Gateway',
      transmitting: 'Transmitting GPS...',
      cancelAlert: 'CANCEL ALERT',
      systemLive: 'System Live',
      linkedDevice: 'Linked Device',
      logs: 'Logs',
      battery: 'Battery',
      telemetry: 'Real-time Telemetry',
    },
    footer: {
      description: 'Engineering Report developed for InnovaTec 2026.',
      subtitle: 'Embedded Systems and Computer Architecture.',
      devLab: 'Dev Lab',
      devLabDesc: 'Computer Systems',
      event: 'Event',
      eventName: 'InnovaTec 2026',
      generateReport: 'Generate Complete Report',
      generating: 'Generating report...',
      reportReady: 'Report generated successfully',
      reportError: 'Error generating report',
      downloadPDF: 'Downloading PDF...',
    },
    theme: {
      light: 'Light',
      dark: 'Dark',
    },
  },
};

export default translations;
