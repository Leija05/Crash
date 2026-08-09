# C.R.A.S.H. 2.0 — Reporte del Proyecto

**Fecha:** 21 de julio de 2026
**Versión:** 3.2.1

---

## 1. ¿Qué es C.R.A.S.H.?

C.R.A.S.H. es un sistema de seguridad para motociclistas que funciona en tres partes:

1. **Un casco inteligente** con sensores que detectan golpes e impactos
2. **Una app celular** que recibe los datos del casco por Bluetooth y envía alertas de emergencia
3. **Un panel web** para que las empresas monitoreen a sus conductores en tiempo real

Cuando el casco detecta un golpe fuerte, la app automáticamente avisa a los contactos de emergencia del conductor con su ubicación exacta.

---

## 2. Lo que se ha mejorado

### Backend unificado (el "cerebro" del sistema)

**Antes:** El backend estaba dividido en varios servidores separados que había que encender uno por uno.

**Ahora:** Todo funciona en un solo servicio desplegado en la nube. Ya no necesita una computadora encendida para que funcione. Se actualiza automáticamente cuando se hacen cambios.

**Qué puede hacer:**
- Registro y-login de usuarios con diferentes roles
- Envío de alertas por WhatsApp a contactos de emergencia
- Almacenamiento de todos los impactos e historial
- Monitoreo en vivo de conductores para empresas
- Planes de suscripción (gratuito, premium, empresarial)
- Geocercas: zonas virtuales que alertan cuando un conductor entra o sale de una área
- Dashboard de administración con estadísticas
- Integración con inteligencia artificial para análisis de impactos

### App móvil

**Diseño renovado con estilo premium:**
- Efecto de vidrio esmerilado (glassmorphism) en todas las tarjetas
- Animaciones suaves en cada elemento de la pantalla
- Indicador circular de fuerza G que cambia de color según la severidad
- Mapa en vivo con la ruta del conductor
- Gráficas de aceleración y giroscopio en tiempo real
- Notificaciones persistentes en Android con datos del casco

**Idiomas:** Español e Inglés

### Panel web para empresas

- Mapa en vivo con ubicación de todos los conductores
- Centro de alertas con diagnóstico automático
- Estadísticas de impactos y actividad
- Gestión de conductores y configuración
- Todo en tiempo real mediante conexiones permanentes

---

## 3. Seguridad

| Protección | Qué hace |
|------------|----------|
| Contraseñas encriptadas | Nadie puede ver las contraseñas, ni siquiera los administradores |
| Bloqueo de cuenta | Si alguien intenta adivinar la contraseña 10 veces, se bloquea 15 minutos |
| Tokens de acceso | Las sesiones expiran y se renuevan automáticamente |
| Límite de peticiones | Evita ataques de sobrecarga al servidor |
| Headers de seguridad | Protección contra ataques conocidos (XSS, clickjacking, etc.) |
| Validación de datos | Todo lo que el usuario envía se verifica antes de procesarlo |

---

## 4. Entorno para empresas

C.R.A.S.H. está diseñado para funcionar tanto con conductores individuales como con empresas que manejan flotillas de motociclistas.

**Lo que ofrece para empresas:**
- Cada empresa tiene su propio espacio aislado
- Roles con diferentes niveles de acceso (administrador, monitor, conductor)
- Geocercas para definir zonas de operación
- Dashboard de monitoreo en tiempo real para el centro de control
- Historial completo de incidentes exportable
- Estadísticas de rendimiento y seguridad
- API para integrar con otros sistemas

**Planes disponibles:**
- **Gratuito:** Funciones básicas para un conductor
- **Premium:** Funciones avanzadas con soporte prioritario
- **Empresarial:** Todo lo anterior más monitoreo de flotilla, geocercas y analytics

---

## 5. El problema del Bluetooth y cómo se solucionó

### ¿Qué pasaba?

La app se conectaba al casco por Bluetooth, pero **no recibía datos**. Se mostraba "Conectado" pero las gráficas quedaban vacías y no aparecía nada en pantalla.

### ¿Por qué pasaba?

El módulo Bluetooth del casco (HM-10) tenía un problema conocido: aunque la conexión se establecía correctamente, la suscripción para recibir datos en vivo fallaba en segundo plano sin mostrar ningún error. La app creía que todo estaba bien, pero en realidad nunca llegó a recibir información.

### ¿Qué se hizo?

Se implementaron varias mejoras:

1. **Reintentos automáticos:** Si la suscripción falla, la app lo intenta hasta 3 veces antes de rendir
2. **Pequeñas pausas estratégicas:** Se agregaron esperas de medio segundo entre pasos para dar tiempo al módulo Bluetooth de prepararse
3. **Activación manual de notificaciones:** Se escriben comandos directos al módulo para forzar el envío de datos
4. **Monitoreo de salud:** La app verifica cada 3 segundos que la conexión siga viva; si detecta que no llegan datos por 8 segundos, intenta reconectarse sola
5. **Reconexión automática:** Si la conexión se pierde, la app reintenta con intervalos crecientes (2, 4, 8, 15 segundos) hasta 5 veces

### Arduino mejorado

El código del sensor también se mejoró:

- Cada paquete de datos ahora empieza con "CRASH:" para que la app identifique fácilmente el casco
- Los golpes se confirman con 3 mediciones seguidas para evitar falsas alarmas
- El LED parpadea con golpes moderados y la batería suena con golpes fuertes
- Al encender, el casco hace 3 parpadeos para confirmar que funciona

---

## 6. Cómo fluyen los datos

```
Sensor en el casco detecta movimiento
        ↓
Arduino procesa los datos
        ↓
Los envía por Bluetooth al celular
        ↓
La app los muestra en pantalla (gráficas, números, mapa)
        ↓
Si hay un golpe fuerte, la app espera unos segundos
        ↓
Si el usuario no cancela, envía alerta de emergencia
        ↓
Los contactos reciben mensaje por WhatsApp con ubicación
```

---

## 7. Archivos que se modificaron

| Archivo | Qué cambió |
|---------|-----------|
| Código Arduino | Nuevo protocolo de datos, detección de impactos mejorada, feedback con LED y buzzer |
| Servicio Bluetooth | Reintentos, monitoreo de salud, mejor manejo de errores |
| Contexto Bluetooth | Reconexión automática, indicador de datos en vivo |
| Pantalla de dispositivos | UX de conexión mejorada, errores visibles, estado del flujo de datos |

---

## 8. Próximos pasos

| Prioridad | Descripción |
|-----------|-------------|
| Alta | Probar con diferentes módulos Bluetooth (HM-10 originales y clones) |
| Alta | Soporte para módulos Bluetooth clásicos (HC-05, HC-10) |
| Media | Actualizaciones de la app sin pasar por la tienda (OTA) |
| Media | Modo sin internet: que la app funcione completamente offline |
| Baja | Extensión para smartwatch con alertas por vibración |
| Baja | Soporte para múltiples cascos por usuario |
| Baja | Actualización del firmware del Arduino por Bluetooth |
