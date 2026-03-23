// Translations for the C.R.A.S.H. application
export const translations = {
  es: {
    // Navigation
    nav: {
      problem: "Problema",
      architecture: "Arquitectura",
      hardware: "Hardware",
      simulate: "Simular Impacto"
    },
    
    // Hero Section
    hero: {
      badge: "PROYECTO INNOVATEC 2026",
      title: "C.R.A.S.H.",
      subtitle: "Colisión: Respuesta y Alerta para Seguridad Humana.",
      tagline: "Smart Impact Detector",
      telemetry: "Telemetría de Impacto (IMU)"
    },
    
    // Problem Section
    problem: {
      title: "Identificación del",
      highlight: "Problema.",
      description: "En México, los accidentes de motocicleta presentan un crecimiento crítico. El factor determinante entre la vida y la muerte es el tiempo de respuesta inicial.",
      quote: "La automatización de la alerta puede reducir el tiempo de auxilio en un 40%.",
      stat1Label: "Aumento Anual",
      stat2Label: "Transmisión",
      impactTitle: "Ámbito de Impacto",
      social: "Social:",
      socialDesc: "Seguridad vial colectiva",
      labor: "Laboral:",
      laborDesc: "Protección delivery 24/7",
      education: "Educativo:",
      educationDesc: "IOT y Sistemas Embebidos"
    },
    
    // Hardware Section
    hardware: {
      badge: "Bill of Materials",
      title: "Hardware &",
      highlight: "Componentes.",
      subtitle: "Selección de componentes de grado industrial para máxima fidelidad en el sensado.",
      items: {
        mcu: {
          title: "Cerebro MCU",
          desc: "Arduino Nano (ATmega328P). Controlador de bajo consumo que integra la lógica de detección y gestión de memoria dinámica."
        },
        sensor: {
          title: "Sensor MPU",
          desc: "Acelerómetro de 3 ejes + Giroscopio. Mide la aceleración inercial para detectar el impacto exacto en milisegundos."
        },
        radio: {
          title: "Radio HC-05",
          desc: "Protocolo UART Bluetooth. Enlace estable para el envío de señales críticas al dispositivo de respuesta inmediata."
        },
        case: {
          title: "Case PETG",
          desc: "Carcasa protectora personalizada. Resistente a la tracción, vibraciones y temperaturas extremas del entorno vial."
        },
        app: {
          title: "App UI",
          desc: "Interfaz móvil de respuesta rápida. Gestiona la lógica de geolocalización y contacto de emergencia automático."
        },
        power: {
          title: "Power Unit",
          desc: "Gestión de energía Li-Po. Circuito integrado con protección contra cortocircuitos y regulación de voltaje."
        }
      }
    },
    
    // Architecture Section
    architecture: {
      title: "Arquitectura de",
      highlight: "Computadoras.",
      protocols: "Protocolos de Comunicación",
      i2c: {
        name: "Bus I2C",
        type: "Síncrono",
        desc: "Lectura de registros del sensor MPU a través de las líneas SDA y SCL con manejo de colisiones de bus."
      },
      uart: {
        name: "UART Serial",
        type: "Asíncrono",
        desc: "Transmisión asíncrona de tramas TX/RX para interconexión Bluetooth a 9600 bps."
      },
      algorithm: "Algoritmo de Detección",
      filename: "detection_logic.ino"
    },
    
    // AI Section
    ai: {
      badge: "IA Generativa Integrada",
      title: "Diagnóstico Inmediato vía",
      highlight: "Gemini AI.",
      description: "El sistema trasciende el hardware: ante un impacto severo, enviamos la telemetría a Gemini para generar un reporte predictivo de lesiones y una guía de primeros auxilios personalizada para los testigos presentes.",
      analyzeBtn: "ANALIZAR GRAVEDAD CON IA",
      analyzing: "PROCESANDO TELEMETRÍA...",
      analysisTitle: "Análisis Predictivo",
      risk: "RIESGO",
      injuries: "Lesiones Probables",
      firstAid: "Primeros Auxilios Críticos"
    },
    
    // Mobile Mockup
    mobile: {
      impact: "¡IMPACTO!",
      gateway: "S.O.S. Gateway",
      transmitting: "Transmitiendo GPS...",
      cancelAlert: "CANCELAR ALERTA",
      systemLive: "Sistema Activo",
      linkedDevice: "Dispositivo Vinculado",
      logs: "Registros",
      battery: "Batería",
      telemetry: "Telemetría en Tiempo Real"
    },
    
    // Footer
    footer: {
      description: "Reporte de Ingeniería desarrollado para InnovaTec 2026.",
      subtitle: "Sistemas Embebidos y Arquitectura de Computadoras.",
      devLab: "Dev Lab",
      devLabDesc: "Sistemas Computacionales",
      event: "Evento",
      eventName: "InnovaTec 2026",
      generateReport: "Generar Reporte Completo",
      generating: "Generando reporte...",
      reportReady: "Reporte generado con éxito",
      reportError: "Error al generar reporte",
      downloadPDF: "Descargando PDF..."
    },
    
    // Theme toggle
    theme: {
      light: "Claro",
      dark: "Oscuro"
    }
  },
  
  en: {
    // Navigation
    nav: {
      problem: "Problem",
      architecture: "Architecture",
      hardware: "Hardware",
      simulate: "Simulate Impact"
    },
    
    // Hero Section
    hero: {
      badge: "INNOVATEC 2026 PROJECT",
      title: "C.R.A.S.H.",
      subtitle: "Collision: Response and Alert for Human Safety.",
      tagline: "Smart Impact Detector",
      telemetry: "Impact Telemetry (IMU)"
    },
    
    // Problem Section
    problem: {
      title: "Problem",
      highlight: "Identification.",
      description: "In Mexico, motorcycle accidents show critical growth. The determining factor between life and death is the initial response time.",
      quote: "Alert automation can reduce assistance time by 40%.",
      stat1Label: "Annual Growth",
      stat2Label: "Transmission",
      impactTitle: "Impact Scope",
      social: "Social:",
      socialDesc: "Collective road safety",
      labor: "Labor:",
      laborDesc: "24/7 delivery protection",
      education: "Educational:",
      educationDesc: "IoT and Embedded Systems"
    },
    
    // Hardware Section
    hardware: {
      badge: "Bill of Materials",
      title: "Hardware &",
      highlight: "Components.",
      subtitle: "Industrial-grade component selection for maximum sensing fidelity.",
      items: {
        mcu: {
          title: "MCU Brain",
          desc: "Arduino Nano (ATmega328P). Low-power controller integrating detection logic and dynamic memory management."
        },
        sensor: {
          title: "MPU Sensor",
          desc: "3-axis accelerometer + Gyroscope. Measures inertial acceleration to detect exact impact in milliseconds."
        },
        radio: {
          title: "HC-05 Radio",
          desc: "UART Bluetooth Protocol. Stable link for sending critical signals to the immediate response device."
        },
        case: {
          title: "PETG Case",
          desc: "Custom protective housing. Resistant to traction, vibrations, and extreme temperatures of road environments."
        },
        app: {
          title: "App UI",
          desc: "Fast response mobile interface. Manages geolocation logic and automatic emergency contact."
        },
        power: {
          title: "Power Unit",
          desc: "Li-Po energy management. Integrated circuit with short-circuit protection and voltage regulation."
        }
      }
    },
    
    // Architecture Section
    architecture: {
      title: "Computer",
      highlight: "Architecture.",
      protocols: "Communication Protocols",
      i2c: {
        name: "I2C Bus",
        type: "Synchronous",
        desc: "MPU sensor register reading through SDA and SCL lines with bus collision handling."
      },
      uart: {
        name: "UART Serial",
        type: "Asynchronous",
        desc: "Asynchronous TX/RX frame transmission for Bluetooth interconnection at 9600 bps."
      },
      algorithm: "Detection Algorithm",
      filename: "detection_logic.ino"
    },
    
    // AI Section
    ai: {
      badge: "Integrated Generative AI",
      title: "Immediate Diagnosis via",
      highlight: "Gemini AI.",
      description: "The system transcends hardware: upon severe impact, we send telemetry to Gemini to generate a predictive injury report and personalized first aid guide for witnesses present.",
      analyzeBtn: "ANALYZE SEVERITY WITH AI",
      analyzing: "PROCESSING TELEMETRY...",
      analysisTitle: "Predictive Analysis",
      risk: "RISK",
      injuries: "Probable Injuries",
      firstAid: "Critical First Aid"
    },
    
    // Mobile Mockup
    mobile: {
      impact: "IMPACT!",
      gateway: "S.O.S. Gateway",
      transmitting: "Transmitting GPS...",
      cancelAlert: "CANCEL ALERT",
      systemLive: "System Live",
      linkedDevice: "Linked Device",
      logs: "Logs",
      battery: "Battery",
      telemetry: "Real-time Telemetry"
    },
    
    // Footer
    footer: {
      description: "Engineering Report developed for InnovaTec 2026.",
      subtitle: "Embedded Systems and Computer Architecture.",
      devLab: "Dev Lab",
      devLabDesc: "Computer Systems",
      event: "Event",
      eventName: "InnovaTec 2026",
      generateReport: "Generate Complete Report",
      generating: "Generating report...",
      reportReady: "Report generated successfully",
      reportError: "Error generating report",
      downloadPDF: "Downloading PDF..."
    },
    
    // Theme toggle
    theme: {
      light: "Light",
      dark: "Dark"
    }
  }
};

export default translations;
