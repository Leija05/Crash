# -*- coding: utf-8 -*-
"""
Generador de la Guía de Estudio Integral C.R.A.S.H. 2.0 (v3.2.1)
Hardware Real: ESP32 con Bluetooth Low Energy (BLE) Integrado + Sensor MEMS MPU-6050 (±16G).
Formato PDF de alta calidad estética y contenido didáctico completo.
"""

import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Canvas de dos pasadas para calcular e imprimir 'Página X de Y' y encabezado institucional."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        if self._pageNumber > 1:
            # Encabezado superior
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#EF4444"))
            self.drawString(40, letter[1] - 30, "C.R.A.S.H. 2.0")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawString(108, letter[1] - 30, "·  Guía Didáctica de Estudio Integral del Sistema y la Aplicación")
            
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.75)
            self.line(40, letter[1] - 36, letter[0] - 40, letter[1] - 36)

            # Pie de página
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.75)
            self.line(40, 42, letter[0] - 40, 42)

            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawString(40, 28, "C.R.A.S.H. Project · Material Educativo y de Dominio de Proyecto")
            
            page_text = f"Página {self._pageNumber} de {page_count}"
            self.drawRightString(letter[0] - 40, 28, page_text)
        self.restoreState()


def build_pdf(filename="c:/Crash/GUIA_ESTUDIO_CRASH_COMPLETA.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()

    # Colores temáticos C.R.A.S.H.
    C_PRIMARY = colors.HexColor("#EF4444")    # Rojo Carmín Oficial
    C_DARK = colors.HexColor("#0F172A")       # Negro / Carbón Profundo
    C_NAVY = colors.HexColor("#1E293B")       # Azul Pizarra Oscuro
    C_TEXT = colors.HexColor("#334155")       # Texto Principal
    C_TEXT_MUTED = colors.HexColor("#64748B") # Texto Secundario
    C_BG_CARD = colors.HexColor("#F8FAFC")    # Fondo Tarjetas Suaves
    C_BORDER = colors.HexColor("#E2E8F0")     # Bordes Sutiles

    # Estilos tipográficos
    style_cover_badge = ParagraphStyle(
        'CoverBadge',
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=C_PRIMARY,
        spaceAfter=12,
        alignment=0,
        textTransform='uppercase'
    )

    style_cover_title = ParagraphStyle(
        'CoverTitle',
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=C_DARK,
        spaceAfter=12,
        alignment=0
    )

    style_cover_subtitle = ParagraphStyle(
        'CoverSubtitle',
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=C_TEXT_MUTED,
        spaceAfter=25,
        alignment=0
    )

    style_h1 = ParagraphStyle(
        'Heading1_Custom',
        fontName='Helvetica-Bold',
        fontSize=17,
        leading=21,
        textColor=C_DARK,
        spaceBefore=16,
        spaceAfter=10,
        keepWithNext=True
    )

    style_h2 = ParagraphStyle(
        'Heading2_Custom',
        fontName='Helvetica-Bold',
        fontSize=12.5,
        leading=16,
        textColor=C_PRIMARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    style_h3 = ParagraphStyle(
        'Heading3_Custom',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=C_NAVY,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    style_body = ParagraphStyle(
        'Body_Custom',
        fontName='Helvetica',
        fontSize=9.5,
        leading=14.5,
        textColor=C_TEXT,
        spaceAfter=8
    )

    style_bullet = ParagraphStyle(
        'Bullet_Custom',
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=C_TEXT,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=4
    )

    style_callout = ParagraphStyle(
        'Callout_Text',
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13.5,
        textColor=C_NAVY
    )

    style_table_header = ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=1
    )

    style_table_cell = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=C_DARK
    )

    style_table_cell_bold = ParagraphStyle(
        'TableCellBold',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=C_DARK
    )

    def make_card(text_content, border_color=C_PRIMARY, bg_color=C_BG_CARD):
        p = Paragraph(text_content, style_callout)
        t = Table([[p]], colWidths=[letter[0] - 80])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_color),
            ('BOX', (0,0), (-1,-1), 1, border_color),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
            ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ]))
        return t

    story = []

    # =========================================================================
    # PORTADA DE LA GUÍA DE ESTUDIO
    # =========================================================================
    story.append(Spacer(1, 25))
    story.append(Paragraph("DOCUMENTO DE PREPARACIÓN Y DOMINIO DEL PROYECTO", style_cover_badge))
    story.append(Paragraph("C.R.A.S.H. 2.0 (v3.2.1)<br/><font color='#EF4444'>Guía de Estudio Integral</font>", style_cover_title))
    story.append(Paragraph(
        "Explicación didáctica, clara y sin tecnicismos complejos de todo el ecosistema: desde el circuito electrónico del casco IoT basado en ESP32 con Bluetooth Low Energy integrado y sensor MEMS MPU-6050, hasta la aplicación móvil, el triaje con Inteligencia Artificial y el despacho de auxilio.",
        style_cover_subtitle
    ))

    summary_data = [
        [Paragraph("<b>Nombre del Proyecto</b>", style_table_cell_bold), Paragraph("C.R.A.S.H. (Comprehensive Rider Alert &amp; Safety Helmet)", style_table_cell)],
        [Paragraph("<b>Versión del Software</b>", style_table_cell_bold), Paragraph("v3.2.1 (Versión 2026 - Hardware ESP32 SoC con BLE Integrado)", style_table_cell)],
        [Paragraph("<b>Objetivo Central</b>", style_table_cell_bold), Paragraph("Salvar vidas en accidentes de motocicleta aprovechando la 'Hora Dorada' mediante detección automática de impactos, triaje médico con IA y localización satelital inmediata.", style_table_cell)],
        [Paragraph("<b>Hardware Principal</b>", style_table_cell_bold), Paragraph("ESP32 Dual-Core (SoC con BLE integrado) + Sensor Inercial MEMS MPU-6050 (±16G).", style_table_cell)],
        [Paragraph("<b>Pila de Software</b>", style_table_cell_bold), Paragraph("React Native (Expo) + FastAPI Cloud + PostgreSQL + WhatsApp Business Cloud API.", style_table_cell)],
    ]
    t_summary = Table(summary_data, colWidths=[150, letter[0] - 80 - 150])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_BG_CARD),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 18))

    story.append(make_card(
        "<b>¿Cómo usar esta guía?</b> Este documento está redactado para que puedas entender y explicar el proyecto de punta a punta ante un jurado, profesor o evaluador, respondiendo con total seguridad sobre qué componentes se usan, cómo se conecta el circuito y cómo viaja la información.",
        C_PRIMARY,
        colors.HexColor("#FEF2F2")
    ))

    story.append(PageBreak())

    # =========================================================================
    # CAPÍTULO 1: LA MISIÓN Y EL PROBLEMA
    # =========================================================================
    story.append(Paragraph("1. ¿Qué es C.R.A.S.H. y qué problema resuelve?", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=C_PRIMARY, spaceBefore=4, spaceAfter=12))

    story.append(Paragraph("El Problema: La Vulnerabilidad del Motociclista y la Hora Dorada", style_h2))
    story.append(Paragraph(
        "A diferencia de quien viaja en un automóvil protegido por un chasis de acero, cinturón de seguridad y bolsas de aire, <b>el motociclista es su propia carrocería</b>. Cuando ocurre un accidente a alta velocidad o en una carretera solitaria:",
        style_body
    ))
    story.append(Paragraph("• <b>Inconsciencia Inmediata:</b> El impacto contra el pavimento u otro vehículo suele dejar al piloto inconsciente o inmovilizado, impidiéndole sacar su teléfono para marcar al 911.", style_bullet))
    story.append(Paragraph("• <b>La 'Hora Dorada' (Golden Hour):</b> En medicina de urgencias, los primeros 60 minutos posteriores al traumatismo determinan si una persona sobrevive o sufre secuelas irreversibles. Si los servicios médicos tardan más de una hora en enterarse o en ubicar el lugar exacto del siniestro, la tasa de mortalidad se dispara.", style_bullet))
    story.append(Paragraph("• <b>Falta de Información Médica:</b> Cuando los paramédicos llegan, no saben con qué fuerza chocó, si hubo giros violentos en la cabeza o qué lesiones sospechar en primer lugar.", style_bullet))

    story.append(Paragraph("La Solución C.R.A.S.H.", style_h2))
    story.append(Paragraph(
        "<b>C.R.A.S.H.</b> es un ecosistema de seguridad activa que convierte cualquier casco de motocicleta en un <b>ángel de la guarda conectado a internet</b>. El sistema no espera a que el piloto pida auxilio: gracias a su nodo sensor con <b>ESP32 y MPU-6050</b>, detecta el choque severo, congela el pico de fuerza del golpe, ejecuta una cuenta regresiva de seguridad y envía la ubicación GPS exacta por WhatsApp a familiares y servicios de rescate.",
        style_body
    ))

    story.append(Spacer(1, 10))

    # =========================================================================
    # CAPÍTULO 2: LOS 4 PILARES DEL SISTEMA
    # =========================================================================
    story.append(Paragraph("2. Los 4 Pilares del Sistema (Visión Global)", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=C_PRIMARY, spaceBefore=4, spaceAfter=12))
    story.append(Paragraph(
        "Para que la solución sea confiable, C.R.A.S.H. divide su trabajo en cuatro capas perfectamente coordinadas:",
        style_body
    ))

    pillars_table_data = [
        [Paragraph("Pilar", style_table_header), Paragraph("Nombre", style_table_header), Paragraph("¿Qué hace en palabras sencillas?", style_table_header)],
        [
            Paragraph("<b>Pilar 1</b>", style_table_cell_bold),
            Paragraph("<b>Casco Inteligente (Hardware IoT)</b>", style_table_cell_bold),
            Paragraph("Microcontrolador ESP32 de 32 bits a 240 MHz con transceptor Bluetooth Low Energy (BLE) integrado en el chip y sensor inercial MEMS MPU-6050 (±16G). Mide fuerzas de impacto y giros 10 veces por segundo.", style_table_cell)
        ],
        [
            Paragraph("<b>Pilar 2</b>", style_table_cell_bold),
            Paragraph("<b>Aplicación Móvil (App)</b>", style_table_cell_bold),
            Paragraph("El cerebro en el smartphone del piloto. Recibe la telemetría por BLE a 10 Hz, visualiza la fuerza G en un tacómetro a 60 FPS, graba la Caja Negra de 10 segundos y ejecuta la cuenta regresiva de 8 segundos ante un impacto.", style_table_cell)
        ],
        [
            Paragraph("<b>Pilar 3</b>", style_table_cell_bold),
            Paragraph("<b>Servidor en la Nube con IA</b>", style_table_cell_bold),
            Paragraph("Centro de cómputo (FastAPI en la nube) que recibe los datos de la colisión, evalúa el riesgo médico con Inteligencia Artificial y almacena la 'Caja Negra' pre-impacto.", style_table_cell)
        ],
        [
            Paragraph("<b>Pilar 4</b>", style_table_cell_bold),
            Paragraph("<b>Canal de Despacho (WhatsApp / SOS)</b>", style_table_cell_bold),
            Paragraph("Módulo de mensajería que envía al instante un mensaje interactivo de WhatsApp a los contactos de emergencia con el enlace exacto en Google Maps y el reporte de gravedad clínica.", style_table_cell)
        ],
    ]

    t_pillars = Table(pillars_table_data, colWidths=[60, 140, letter[0] - 80 - 200])
    t_pillars.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_NAVY),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('BACKGROUND', (0,1), (-1,1), colors.white),
        ('BACKGROUND', (0,2), (-1,2), C_BG_CARD),
        ('BACKGROUND', (0,3), (-1,3), colors.white),
        ('BACKGROUND', (0,4), (-1,4), C_BG_CARD),
    ]))
    story.append(t_pillars)
    story.append(Spacer(1, 14))

    story.append(PageBreak())

    # =========================================================================
    # CAPÍTULO 3: EL CIRCUITO ELECTRÓNICO (HARDWARE REAL)
    # =========================================================================
    story.append(Paragraph("3. El Circuito del Casco: Hardware Real Explicado Sencillo", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=C_PRIMARY, spaceBefore=4, spaceAfter=12))

    story.append(Paragraph(
        "El circuito está basado en el microcontrolador <b>ESP32 con Bluetooth Low Energy (BLE) integrado</b> y el sensor inercial <b>MPU-6050</b>. Es compacto, ultraligero (&lt; 60 gramos) y opera con autonomía de batería LiPo sin cables hacia la moto:",
        style_body
    ))

    hw_components = [
        [Paragraph("Componente", style_table_header), Paragraph("Función Didáctica", style_table_header), Paragraph("Pines y Conexión Clave", style_table_header)],
        [
            Paragraph("<b>ESP32 Dual-Core (BLE Integrado)</b>", style_table_cell_bold),
            Paragraph("El 'cerebro y comunicador' del casco. Microprocesador de 32 bits a 240 MHz con radio Bluetooth Low Energy integrada en el propio chip (sin módulos externos). Procesa la telemetría a 10 Hz.", style_table_cell),
            Paragraph("SoC Xtensa LX6 @ 240 MHz. Antena PCB integrada para BLE.", style_table_cell)
        ],
        [
            Paragraph("<b>Sensor MPU-6050 (IMU MEMS)</b>", style_table_cell_bold),
            Paragraph("El 'oído interno'. Combina un acelerómetro de 3 ejes y un giroscopio de 3 ejes. Mide cuántas fuerzas G sufre el casco y qué tan rápido rota la cabeza en una caída.", style_table_cell),
            Paragraph("I2C Bus: SDA en GPIO 21, SCL en GPIO 22. Escala máxima de ±16 G.", style_table_cell)
        ],
        [
            Paragraph("<b>Bluetooth Low Energy (Nativo)</b>", style_table_cell_bold),
            Paragraph("El enlace inalámbrico de bajísimo consumo. Transmite la trama de telemetría a la app del celular sin agotar la batería.", style_table_cell),
            Paragraph("Integrado en el silicio del ESP32. Alcance de hasta 20 metros.", style_table_cell)
        ],
        [
            Paragraph("<b>Divisor de Voltaje de Batería</b>", style_table_cell_bold),
            Paragraph("El 'medidor de combustible'. Dos resistencias de 10kΩ que permiten al conversor analógico del ESP32 medir el voltaje de la batería LiPo de forma segura.", style_table_cell),
            Paragraph("Vbat LiPo → R1 (10k) → GPIO 34 (ADC) → R2 (10k) → GND.", style_table_cell)
        ],
        [
            Paragraph("<b>Buzzer Activo (GPIO 18)</b>", style_table_cell_bold),
            Paragraph("La 'alarma acústica'. Si el impacto supera los 10.0 G, emite un pitido agudo y continuo (85 dB) para guiar a rescatistas si el piloto queda en matorrales.", style_table_cell),
            Paragraph("Pin digital GPIO 18 con control de encendido/apagado instantáneo.", style_table_cell)
        ],
        [
            Paragraph("<b>LED de Estado (GPIO 2)</b>", style_table_cell_bold),
            Paragraph("El 'ojo visual'. 3 destellos al iniciar y parpadeo rápido en alerta para que testigos noten que ocurrió un siniestro.", style_table_cell),
            Paragraph("Pin digital GPIO 2 con resistencia limitadora de 220Ω.", style_table_cell)
        ],
        [
            Paragraph("<b>Batería LiPo 3.7V + TP4056</b>", style_table_cell_bold),
            Paragraph("La 'fuente de poder'. Celda recargable de 1000-1200 mAh con módulo TP4056 con conector USB-C y protección BMS contra sobrecarga y sobredescarga.", style_table_cell),
            Paragraph("Otorga entre 14 y 18 horas de monitoreo continuo por recarga.", style_table_cell)
        ]
    ]

    t_hw = Table(hw_components, colWidths=[110, 220, letter[0] - 80 - 330])
    t_hw.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_NAVY),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_hw)
    story.append(Spacer(1, 10))

    story.append(Paragraph("¿Cómo evita el circuito falsos positivos ante baches o topes?", style_h2))
    story.append(Paragraph(
        "Una de las dudas más frecuentes de los evaluadores es: <i>'¿Qué pasa si caigo en un bache fuerte o paso un tope rápido? ¿Se va a disparar la alerta al 911?'</i>.<br/>"
        "La respuesta es <b>NO</b>, gracias a la <b>estrategia de doble filtrado inteligente</b>:",
        style_body
    ))
    story.append(Paragraph("<b>1. Filtro de Muestras Consecutivas en el ESP32:</b> Un bache en la carretera es un 'pico seco' que dura apenas una fracción de milisegundo (1 sola muestra). El casco exige que para impactos moderados (entre 4.0 G y 9.9 G), la fuerza se mantenga elevada durante al menos 3 muestras consecutivas (300 ms), lo cual solo ocurre en derrapes, arrastres o impactos reales.", style_bullet))
    story.append(Paragraph("<b>2. Umbral Crítico Inmediato:</b> Si la fuerza supera los 10.0 G (fuerza equiparable a estrellar la cabeza contra un objeto sólido), el choque es indiscutible y la alarma de impacto severo se dispara al instante.", style_bullet))
    story.append(Paragraph("<b>3. Cuenta Regresiva con Cancelación en la App:</b> Aunque el sistema detecte un golpe, NUNCA envía el mensaje de inmediato; le otorga al piloto una ventana de 8 a 10 segundos con sonido y vibración para pulsar 'Cancelar' si se encuentra perfectamente bien.", style_bullet))

    story.append(PageBreak())

    # =========================================================================
    # CAPÍTULO 4: LA APLICACIÓN MÓVIL
    # =========================================================================
    story.append(Paragraph("4. La Aplicación Móvil (C.R.A.S.H. App)", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=C_PRIMARY, spaceBefore=4, spaceAfter=12))

    story.append(Paragraph("Pantallas Principales de la Aplicación", style_h2))
    story.append(Paragraph(
        "Desarrollada en <b>React Native con Expo</b>, la app ofrece una experiencia moderna inspirada en interfaces tácticas militares y deportivas, con tema oscuro (Dark Mode), micro-animaciones fluidas a 60 FPS y respuesta háptica táctil.",
        style_body
    ))

    screens_data = [
        [Paragraph("Pantalla", style_table_header), Paragraph("Función Principal", style_table_header), Paragraph("Lo que el usuario ve / hace", style_table_header)],
        [
            Paragraph("<b>Dashboard (Inicio)</b>", style_table_cell_bold),
            Paragraph("Centro de mando y telemetría en tiempo real.", style_table_cell),
            Paragraph("Anillo tacómetro de Fuerza G con colores dinámicos (Verde reposo, Rojo peligro), velocímetro digital, coordenadas GPS, botón de simulación de prueba y barra de estado de conexión.", style_table_cell)
        ],
        [
            Paragraph("<b>Dispositivos (Bluetooth)</b>", style_table_cell_bold),
            Paragraph("Vincular el casco físico al smartphone.", style_table_cell),
            Paragraph("Escáner de antenas BLE cercanas, emparejamiento con un toque con el circuito 'CRASH' y re-conexión automática si se aleja y vuelve a acercarse.", style_table_cell)
        ],
        [
            Paragraph("<b>Contactos de Emergencia</b>", style_table_cell_bold),
            Paragraph("Agenda protegida de familiares y amigos.", style_table_cell),
            Paragraph("Lista de personas que recibirán los avisos de WhatsApp y llamadas automáticas. Permite añadir nombre, teléfono (+52...), parentesco y verificar el número.", style_table_cell)
        ],
        [
            Paragraph("<b>Historial Forense</b>", style_table_cell_bold),
            Paragraph("Registro histórico de impactos.", style_table_cell),
            Paragraph("Bitácora de accidentes previos: fecha, hora exacta, fuerza G pico registrada, dictamen de la IA y mapa interactivo con la ruta previa al choque.", style_table_cell)
        ],
        [
            Paragraph("<b>Ajustes (Configuración)</b>", style_table_cell_bold),
            Paragraph("Calibración del sistema.", style_table_cell),
            Paragraph("Ajuste de segundos de cuenta regresiva (de 3 a 60s), sensibilidad del umbral de impacto, activación de llamadas automáticas y seguimiento GPS.", style_table_cell)
        ]
    ]

    t_screens = Table(screens_data, colWidths=[110, 160, letter[0] - 80 - 270])
    t_screens.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_NAVY),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_screens)
    story.append(Spacer(1, 12))

    story.append(Paragraph("La 'Caja Negra' Pre-Impacto (Blackbox de 10 Segundos)", style_h2))
    story.append(Paragraph(
        "Al igual que los aviones comerciales, C.R.A.S.H. mantiene en memoria un <b>búfer circular continuo de los últimos 10 segundos (-9.5 segundos hasta 0.0 segundos del choque)</b>. Cuando ocurre el siniestro, este fragmento se congela y se sube al servidor. Permite a peritos y aseguradoras reconstruir exactamente a qué velocidad iba el vehículo, en qué segundo frenó y el ángulo de impacto.",
        style_body
    ))

    story.append(Spacer(1, 10))

    # =========================================================================
    # CAPÍTULO 5: EL PROTOCOLO DE EMERGENCIA
    # =========================================================================
    story.append(Paragraph("5. El Protocolo de Emergencia: Cronología de un Accidente", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=C_PRIMARY, spaceBefore=4, spaceAfter=12))

    story.append(Paragraph(
        "Veamos exactamente qué ocurre, milisegundo a milisegundo, desde el instante en que ocurre una colisión hasta que los paramédicos y familiares reciben la alerta:",
        style_body
    ))

    protocol_steps = [
        [Paragraph("Paso", style_table_header), Paragraph("Momento", style_table_header), Paragraph("Acción del Sistema C.R.A.S.H.", style_table_header)],
        [
            Paragraph("<b>Paso 1</b>", style_table_cell_bold),
            Paragraph("Segundo 0.00", style_table_cell),
            Paragraph("<b>Impacto contra el vehículo u obstáculo:</b> El casco con ESP32 y MPU-6050 experimenta una aceleración violenta (ej. 10.0 G). El hardware detecta la superación del umbral crítico.", style_table_cell)
        ],
        [
            Paragraph("<b>Paso 2</b>", style_table_cell_bold),
            Paragraph("Segundo 0.05", style_table_cell),
            Paragraph("<b>Congelamiento del Pico Real (Fix Clave):</b> El sistema congela en memoria inmutable (<code>impactPeakGRef</code>) la fuerza máxima del impacto (10.0 G). Esto asegura que cuando el piloto quede tirado en reposo (1.0 - 2.0 G), el reporte NO se contamine y conserve los 10 G reales.", style_table_cell)
        ],
        [
            Paragraph("<b>Paso 3</b>", style_table_cell_bold),
            Paragraph("Segundo 0.10", style_table_cell),
            Paragraph("<b>Alarma Local y Cuenta Regresiva:</b> El buzzer del casco suena, la pantalla del teléfono se enciende en rojo con un cronómetro de 8 segundos y el motor háptico vibra fuertemente cada segundo.", style_table_cell)
        ],
        [
            Paragraph("<b>Paso 4</b>", style_table_cell_bold),
            Paragraph("Seg. 0.1 a 8.0", style_table_cell),
            Paragraph("<b>Ventana de Decisión del Piloto:</b> Si fue un tropiezo leve y el piloto está consciente, puede presionar 'CANCELAR' en la pantalla o en la barra de notificaciones. Si no se presiona nada (piloto inconsciente), el tiempo expira.", style_table_cell)
        ],
        [
            Paragraph("<b>Paso 5</b>", style_table_cell_bold),
            Paragraph("Segundo 8.00", style_table_cell),
            Paragraph("<b>Despacho Automático de Auxilio:</b> La app adquiere las coordenadas GPS más recientes del dispositivo, empaqueta la telemetría, el pico de 10 G y la Caja Negra, y los envía vía HTTP POST seguro a la API en la nube.", style_table_cell)
        ],
        [
            Paragraph("<b>Paso 6</b>", style_table_cell_bold),
            Paragraph("Segundo 8.50", style_table_cell),
            Paragraph("<b>Triaje Médico por IA y WhatsApp:</b> El servidor procesa el impacto con su modelo de triaje clínico y dispara los mensajes de WhatsApp Business con el enlace de Google Maps a cada contacto de emergencia.", style_table_cell)
        ]
    ]

    t_proto = Table(protocol_steps, colWidths=[55, 80, letter[0] - 80 - 135])
    t_proto.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_proto)

    story.append(PageBreak())

    # =========================================================================
    # CAPÍTULO 6: LA IA DE TRIAJE MÉDICO
    # =========================================================================
    story.append(Paragraph("6. El Triaje Inteligente: ¿Cómo clasifica la IA el accidente?", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=C_PRIMARY, spaceBefore=4, spaceAfter=12))

    story.append(Paragraph(
        "En el backend en la nube, C.R.A.S.H. cuenta con un motor de <b>Triaje Clínico Automatizado</b>. No se limita a decir que hubo un golpe, sino que traduce la física de la colisión en información médica útil para los paramédicos:",
        style_body
    ))

    triage_data = [
        [Paragraph("Nivel de Gravedad", style_table_header), Paragraph("Fuerza G", style_table_header), Paragraph("Diagnóstico Estimado de la IA", style_table_header), Paragraph("Acción Médica Recomendada", style_table_header)],
        [
            Paragraph("<b>CÓDIGO VERDE<br/>(Leve)</b>", style_table_cell_bold),
            Paragraph("&lt; 4.0 G", style_table_cell),
            Paragraph("Caída en seco a baja velocidad. Raspones o contusiones superficiales probables.", style_table_cell),
            Paragraph("Revisión ambulatoria básica.", style_table_cell)
        ],
        [
            Paragraph("<b>CÓDIGO AMARILLO<br/>(Moderado)</b>", style_table_cell_bold),
            Paragraph("4.0 a 7.5 G", style_table_cell),
            Paragraph("Impacto con desaceleración media. Posible esguince cervical o fisura ósea.", style_table_cell),
            Paragraph("Inmovilización preventiva de cuello y traslado a clínica.", style_table_cell)
        ],
        [
            Paragraph("<b>CÓDIGO NARANJA<br/>(Severo)</b>", style_table_cell_bold),
            Paragraph("7.5 a 12.0 G", style_table_cell),
            Paragraph("Trauma de alta energía. Alta probabilidad de conmoción cerebral, pérdida de conocimiento y fracturas.", style_table_cell),
            Paragraph("Ambulancia urgente con soporte vital intermedio.", style_table_cell)
        ],
        [
            Paragraph("<b>CÓDIGO ROJO<br/>(Crítico)</b>", style_table_cell_bold),
            Paragraph("&gt; 12.0 G", style_table_cell),
            Paragraph("Colisión de energía extrema. Riesgo crítico de trauma craneoencefálico severo o hemorragia interna.", style_table_cell),
            Paragraph("Unidad de Terapia Intensiva Móvil inmediata. NO retirar el casco al piloto.", style_table_cell)
        ]
    ]

    t_triage = Table(triage_data, colWidths=[85, 55, 175, letter[0] - 80 - 315])
    t_triage.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_NAVY),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_triage)
    story.append(Spacer(1, 14))

    # =========================================================================
    # CAPÍTULO 7: PREGUNTAS FRECUENTES Y GUÍA PARA DEFENDER EL PROYECTO
    # =========================================================================
    story.append(Paragraph("7. Preguntas Clave para Explicar y Defender el Proyecto", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=C_PRIMARY, spaceBefore=4, spaceAfter=12))

    story.append(Paragraph(
        "A continuación se presentan las preguntas más comunes que realizan profesores, evaluadores y jueces en ferias de ciencias o exámenes profesionales, con sus respuestas exactas:",
        style_body
    ))

    faq = [
        ("1. ¿Qué diferencia a C.R.A.S.H. de un reloj inteligente (Apple Watch / Galaxy Watch)?",
         "Los relojes inteligentes van en la muñeca, donde los movimientos cotidianos (aplaudir, mover el brazo, sacudirse) generan falsas alarmas con facilidad, y en un choque la muñeca puede no sufrir la misma desaceleración que la cabeza. C.R.A.S.H. mide directamente en el casco (el cráneo) con el sensor MPU-6050, que es donde las fuerzas G definen la vida o la muerte del piloto, logrando una precisión biomecánica real."),

        ("2. ¿Por qué se utilizó un ESP32 con Bluetooth Low Energy integrado?",
         "El ESP32 es un procesador de 32 bits a 240 MHz que integra de fábrica la radio Bluetooth Low Energy en el mismo chip de silicio. Esto elimina la necesidad de módulos externos (como el antiguo HM-10), reduciendo cables, peso y puntos de falla por vibración en el casco, con un alcance de hasta 20 metros y consumo ultra bajo."),

        ("3. ¿Cómo resolvieron el problema de las fuerzas G falsas en reposo?",
         "Al chocar, la desaceleración violenta dura 150-300 ms y luego el cuerpo o el casco caen en reposo (1.0 a 2.0 G). Implementamos un mecanismo de congelamiento de pico (impactPeakGRef) que captura el valor máximo registrado durante la ventana del choque (ej. 10.0 G) y no permite que la fuerza de reposo contamine el reporte final."),

        ("4. ¿Qué pasa si el piloto se queda sin señal de datos celulares?",
         "La app almacena los incidentes y la Caja Negra en memoria local SQLite encriptada. En cuanto el dispositivo recupera señal 3G/4G/WiFi, los datos pendientes se sincronizan automáticamente con la nube."),

        ("5. ¿Por qué es crucial la Caja Negra (Blackbox) en accidentes viales?",
         "Porque en muchas ocasiones los conductores de automóviles niegan su culpabilidad alegando que el motociclista iba a exceso de velocidad. Los 10 segundos pre-impacto de la Caja Negra demuestran con telemetría inalterable la velocidad real, trayectoria y frenado del motociclista antes del impacto.")
    ]

    for q, a in faq:
        story.append(Paragraph(f"<b>{q}</b>", style_h3))
        story.append(Paragraph(a, style_body))
        story.append(Spacer(1, 3))

    story.append(Spacer(1, 10))

    # =========================================================================
    # GLOSARIO DE TÉRMINOS RÁPIDO
    # =========================================================================
    story.append(Paragraph("8. Glosario Rápido de Conceptos Clave", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=C_PRIMARY, spaceBefore=4, spaceAfter=12))

    glossary_data = [
        [Paragraph("Término", style_table_header), Paragraph("Significado en Palabras Sencillas", style_table_header)],
        [Paragraph("<b>ESP32</b>", style_table_cell_bold), Paragraph("Microcontrolador potente de 32 bits y 240 MHz con WiFi y Bluetooth Low Energy integrados en el chip. Es el cerebro del casco C.R.A.S.H.", style_table_cell)],
        [Paragraph("<b>MPU-6050</b>", style_table_cell_bold), Paragraph("Sensor inercial MEMS que combina acelerómetro de 3 ejes y giroscopio de 3 ejes. Mide fuerzas G de choque hasta ±16G.", style_table_cell)],
        [Paragraph("<b>Fuerza G</b>", style_table_cell_bold), Paragraph("Unidad que mide la gravedad y la aceleración. 1.0 G es estar parado sobre la Tierra. 10.0 G significa sentir 10 veces el peso del cuerpo de golpe contra un objeto.", style_table_cell)],
        [Paragraph("<b>Telemetría</b>", style_table_cell_bold), Paragraph("Medición y transmisión remota de datos físicos (aceleración en X, Y, Z, giros y velocidad) desde el casco hacia el celular.", style_table_cell)],
        [Paragraph("<b>BLE (Bluetooth Low Energy)</b>", style_table_cell_bold), Paragraph("Versión de Bluetooth ultra eficiente que casi no consume batería, ideal para aparatos que deben durar todo el día encendidos.", style_table_cell)],
        [Paragraph("<b>Hora Dorada</b>", style_table_cell_bold), Paragraph("Primeros 60 minutos tras un choque grave donde la atención médica salva vidas y previene secuelas cerebrales o motoras.", style_table_cell)],
        [Paragraph("<b>Triaje Médico</b>", style_table_cell_bold), Paragraph("Clasificación de heridos por colores (Verde, Amarillo, Naranja, Rojo) para que los paramédicos atiendan primero a quien corre mayor peligro de muerte.", style_table_cell)]
    ]

    t_glossary = Table(glossary_data, colWidths=[130, letter[0] - 80 - 130])
    t_glossary.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_NAVY),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_glossary)

    # Construir documento
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generado exitosamente en: {os.path.abspath(filename)}")

if __name__ == "__main__":
    out_path = "c:/Crash/GUIA_ESTUDIO_CRASH_COMPLETA.pdf"
    if len(sys.argv) > 1:
        out_path = sys.argv[1]
    build_pdf(out_path)
