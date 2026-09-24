package com.crash.helmet.foregroundservice

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.CountDownTimer
import android.os.IBinder
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.crash.helmet.MainActivity
import com.crash.helmet.R
import com.facebook.react.bridge.Arguments
import java.util.Locale

class CrashForegroundService : Service(), SensorEventListener {

    companion object {
        const val TAG = "CrashForegroundService"
        const val NOTIFICATION_ID = 1001
        const val ALERT_NOTIFICATION_ID = 1002
        const val CHANNEL_STATUS_ID = "crash-monitoring"
        const val CHANNEL_ALERT_ID = "crash-alerts"

        const val ACTION_START = "com.crash.helmet.ACTION_START"
        const val ACTION_STOP = "com.crash.helmet.ACTION_STOP"
        const val ACTION_UPDATE_TELEMETRY = "com.crash.helmet.ACTION_UPDATE_TELEMETRY"
        const val ACTION_UPDATE_LOCATION = "com.crash.helmet.ACTION_UPDATE_LOCATION"
        const val ACTION_SET_THRESHOLD = "com.crash.helmet.ACTION_SET_THRESHOLD"
        const val ACTION_START_COUNTDOWN = "com.crash.helmet.ACTION_START_COUNTDOWN"
        const val ACTION_CANCEL_COUNTDOWN = "com.crash.helmet.ACTION_CANCEL_COUNTDOWN"

        const val EXTRA_DEVICE_NAME = "deviceName"
        const val EXTRA_SPEED = "speed"
        const val EXTRA_G_FORCE = "gForce"
        const val EXTRA_BATTERY = "battery"
        const val EXTRA_LATITUDE = "latitude"
        const val EXTRA_LONGITUDE = "longitude"
        const val EXTRA_THRESHOLD = "threshold"
        const val EXTRA_COUNTDOWN_SECONDS = "countdownSeconds"

        // Paleta oficial C.R.A.S.H.
        const val COLOR_CRASH_RED = 0xFFEF4444.toInt()

        var isServiceRunning = false
            private set

        private var activeInstance: CrashForegroundService? = null

        fun cancelEmergencyAlert(context: Context) {
            activeInstance?.let { service ->
                val now = System.currentTimeMillis()
                service.lastImpactTime = now
                service.impactCooldownUntil = now + 3000L
                service.currentImpactG = 1.0
                service.stopCountdownTimer(cancelledByUser = true)
            }
        }

        fun sendEmergencyNow(context: Context) {
            activeInstance?.let { service ->
                val now = System.currentTimeMillis()
                service.lastImpactTime = now
                service.impactCooldownUntil = now + 10000L
                service.dispatchEmergencyNow()
            }
        }

        fun startCountdownFromJS(seconds: Int, gForce: Double) {
            activeInstance?.let { service ->
                val now = System.currentTimeMillis()
                service.lastImpactTime = now
                service.impactCooldownUntil = now + (seconds * 1000L) + 3000L
                val currentGVal = if (gForce > 0.1) gForce else service.alertThreshold
                service.startCountdownTimer(seconds, currentGVal, notifyJS = false)
            }
        }

        fun cancelCountdownFromJS() {
            activeInstance?.let { service ->
                val now = System.currentTimeMillis()
                service.lastImpactTime = now
                service.impactCooldownUntil = now + 3000L
                service.currentImpactG = 1.0
                service.stopCountdownTimer(cancelledByUser = false)
            }
        }

        fun resetPeakG() {
            activeInstance?.let { service ->
                service.peakG = 1.0
                service.lastNotifiedPeak = 1.0
                service.currentImpactG = 1.0
                service.updateStatusNotificationIfDue(force = true)
            }
        }
    }

    private var sensorManager: SensorManager? = null
    private var accelerometer: Sensor? = null
    private var gyroscope: Sensor? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var notificationManager: NotificationManager? = null
    private var vibrator: Vibrator? = null

    private var currentG = 1.0
    private var peakG = 1.0
    private var lastNotifiedG = 1.0
    private var lastNotifiedPeak = 1.0
    private var lastNotifiedTime = 0L

    private var currentSpeedKmh = 0
    private var currentBattery: Int? = 100
    private var currentLatitude: Double? = null
    private var currentLongitude: Double? = null
    private var alertThreshold = 5.0
    private var lastImpactTime = 0L
    private var impactCooldownUntil = 0L
    private var lastJSEmitTime = 0L

    private var accelX = 0f
    private var accelY = 0f
    private var accelZ = 0f
    private var gyroX = 0f
    private var gyroY = 0f
    private var gyroZ = 0f

    // Estado del temporizador de cuenta regresiva
    private var countdownTimer: CountDownTimer? = null
    private var isCountingDown = false
    private var currentImpactG = 0.0

    override fun onCreate() {
        super.onCreate()
        activeInstance = this
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannels()

        // Inicializar Vibrador
        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }

        // Adquirir WakeLock para que el CPU se mantenga activo con pantalla apagada o en 2do plano
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "Crash:ForegroundSensorWakeLock"
        ).apply {
            setReferenceCounted(false)
            acquire(24 * 60 * 60 * 1000L) // 24h timeout de seguridad
        }

        // Sensores de hardware del dispositivo
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        accelerometer = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        gyroscope = sensorManager?.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START

        when (action) {
            ACTION_START -> {
                isServiceRunning = true
                val threshold = intent?.getDoubleExtra(EXTRA_THRESHOLD, 5.0) ?: 5.0
                alertThreshold = Math.max(1.2, threshold)

                // Registrar listeners de hardware
                try {
                    accelerometer?.let {
                        sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
                    }
                    gyroscope?.let {
                        sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "No se pudieron registrar sensores de hardware: ${e.message}")
                }

                startForegroundSafely()
            }

            ACTION_STOP -> {
                stopServiceInternal()
                return START_NOT_STICKY
            }

            ACTION_UPDATE_TELEMETRY -> {
                intent?.let {
                    if (it.hasExtra(EXTRA_SPEED)) {
                        currentSpeedKmh = it.getDoubleExtra(EXTRA_SPEED, currentSpeedKmh.toDouble()).toInt()
                    }
                    if (it.hasExtra(EXTRA_BATTERY)) {
                        val b = it.getDoubleExtra(EXTRA_BATTERY, -1.0)
                        if (b >= 0) currentBattery = b.toInt()
                    }
                    if (it.hasExtra(EXTRA_G_FORCE)) {
                        val externalG = it.getDoubleExtra(EXTRA_G_FORCE, currentG)
                        if (externalG > peakG) peakG = externalG
                    }
                }
                updateStatusNotificationIfDue(force = false)
            }

            ACTION_UPDATE_LOCATION -> {
                intent?.let {
                    if (it.hasExtra(EXTRA_LATITUDE) && it.hasExtra(EXTRA_LONGITUDE)) {
                        currentLatitude = it.getDoubleExtra(EXTRA_LATITUDE, 0.0)
                        currentLongitude = it.getDoubleExtra(EXTRA_LONGITUDE, 0.0)
                    }
                    if (it.hasExtra(EXTRA_SPEED)) {
                        val s = it.getDoubleExtra(EXTRA_SPEED, 0.0)
                        if (s > 0) currentSpeedKmh = s.toInt()
                    }
                }
                updateStatusNotificationIfDue(force = false)
            }

            ACTION_SET_THRESHOLD -> {
                val t = intent?.getDoubleExtra(EXTRA_THRESHOLD, alertThreshold) ?: alertThreshold
                alertThreshold = Math.max(1.2, t)
            }

            ACTION_START_COUNTDOWN -> {
                val sec = intent?.getIntExtra(EXTRA_COUNTDOWN_SECONDS, 10) ?: 10
                val g = intent?.getDoubleExtra(EXTRA_G_FORCE, currentG) ?: currentG
                startCountdownTimer(sec, g)
            }

            ACTION_CANCEL_COUNTDOWN -> {
                stopCountdownTimer(cancelledByUser = true)
            }
        }

        return START_STICKY
    }

    /**
     * Inicia startForeground de manera 100% blindada contra caídas en Android 14
     * sin importar si los permisos de ubicación están otorgados o pendientes.
     */
    private fun startForegroundSafely() {
        val notification = buildStatusNotification()
        val hasLocationPerm = ContextCompat.checkSelfPermission(
            this,
            android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED || ContextCompat.checkSelfPermission(
            this,
            android.Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                if (hasLocationPerm) {
                    ServiceCompat.startForeground(
                        this,
                        NOTIFICATION_ID,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
                    )
                } else {
                    // Si aún no se han concedido permisos de ubicación, usar fallback seguro
                    startForeground(NOTIFICATION_ID, notification)
                }
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (se: SecurityException) {
            Log.w(TAG, "SecurityException en startForeground: ${se.message}. Intentando fallback estándar.")
            try {
                startForeground(NOTIFICATION_ID, notification)
            } catch (e: Exception) {
                Log.e(TAG, "Error fatal iniciando foreground service: ${e.message}", e)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error general en startForeground: ${e.message}", e)
        }
    }

    private fun stopServiceInternal() {
        isServiceRunning = false
        stopCountdownTimer(cancelledByUser = false)
        try {
            sensorManager?.unregisterListener(this)
        } catch (_: Exception) {}

        try {
            wakeLock?.let {
                if (it.isHeld) it.release()
            }
        } catch (_: Exception) {}

        try {
            notificationManager?.cancel(NOTIFICATION_ID)
            notificationManager?.cancel(ALERT_NOTIFICATION_ID)
        } catch (_: Exception) {}

        stopForeground(true)
        stopSelf()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        Log.i(TAG, "Aplicación cerrada definitivamente por el usuario (onTaskRemoved). Deteniendo servicio en segundo plano.")
        stopServiceInternal()
    }

    override fun onDestroy() {
        stopServiceInternal()
        activeInstance = null
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onSensorChanged(event: SensorEvent) {
        val now = System.currentTimeMillis()

        if (event.sensor.type == Sensor.TYPE_ACCELEROMETER) {
            accelX = event.values[0]
            accelY = event.values[1]
            accelZ = event.values[2]

            // Cálculo instantáneo de magnitud G (1.0G = reposo gravitatorio)
            val mag = Math.sqrt((accelX * accelX + accelY * accelY + accelZ * accelZ).toDouble()) / 9.80665
            currentG = Math.round(mag * 100.0) / 100.0

            if (currentG > peakG) {
                peakG = currentG
            }

            // Si está en cuenta regresiva y se registra un pico mayor (sacudida/rebote/vuelco), capturar el pico
            if (isCountingDown && currentG > currentImpactG) {
                currentImpactG = currentG
            }

            // Detección de picos en tiempo real
            val deltaG = Math.abs(currentG - lastNotifiedG)
            val isSpike = deltaG >= 0.35 || currentG >= (alertThreshold * 0.7)
            val isNewPeak = peakG > (lastNotifiedPeak + 0.2)

            // Actualización inmediata si hay pico, o cada 2s en reposo
            if (isSpike || isNewPeak) {
                updateStatusNotificationIfDue(force = true)
            } else if (now - lastNotifiedTime >= 2000) {
                updateStatusNotificationIfDue(force = false)
            }

            // Detección de impacto severo en segundo plano
            if (currentG >= alertThreshold && (now >= impactCooldownUntil) && (now - lastImpactTime >= 3000) && !isCountingDown) {
                lastImpactTime = now
                impactCooldownUntil = now + 10000L
                emitImpactEvent(currentG)
                // Iniciar cuenta regresiva nativa interactiva con vibración por segundo
                startCountdownTimer(10, currentG)
            }

            // Emitir telemetría al puente JS a 4 Hz (~250ms) o inmediato si hay pico
            if (isSpike || (now - lastJSEmitTime >= 250)) {
                lastJSEmitTime = now
                emitTelemetryEvent()
            }
        } else if (event.sensor.type == Sensor.TYPE_GYROSCOPE) {
            gyroX = event.values[0]
            gyroY = event.values[1]
            gyroZ = event.values[2]
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    private fun updateStatusNotificationIfDue(force: Boolean) {
        if (isCountingDown) return
        val now = System.currentTimeMillis()
        if (!force && (now - lastNotifiedTime < 1500)) return

        lastNotifiedTime = now
        lastNotifiedG = currentG
        if (peakG > lastNotifiedPeak) lastNotifiedPeak = peakG

        try {
            val notification = buildStatusNotification()
            notificationManager?.notify(NOTIFICATION_ID, notification)
        } catch (_: Exception) {}
    }

    /**
     * Construye la barra de notificación única oficial de C.R.A.S.H.
     * Paleta: Rojo Carmín (#EF4444) y Negro Carbón, con colorización activa.
     */
    private fun buildStatusNotification(): Notification {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val statusBadge = when {
            currentG >= alertThreshold -> "🚨 ¡IMPACTO!"
            currentG >= (alertThreshold * 0.7) -> String.format(Locale.US, "⚠️ Pico: %.2fG", currentG)
            peakG >= 2.5 -> String.format(Locale.US, "⚡ Máx: %.2fG", peakG)
            else -> "🟢 Monitoreando"
        }

        val title = "🛡️ C.R.A.S.H. · Monitoreo Continuo [$statusBadge]"
        val coordsStr = if (currentLatitude != null && currentLongitude != null) {
            String.format(Locale.US, "%.4f°, %.4f°", currentLatitude, currentLongitude)
        } else {
            "Sincronizando GPS..."
        }

        val shortText = String.format(
            Locale.US,
            "⚡ %.2fG (Pico: %.2fG) · 🚗 %d km/h · 📍 %s",
            currentG, peakG, currentSpeedKmh, coordsStr
        )

        val bigText = StringBuilder().apply {
            append(String.format(Locale.US, "⚡ FUERZA G: %.2f G   |   PICO MÁX: %.2f G\n", currentG, peakG))
            append(String.format(Locale.US, "🚗 VELOCIDAD: %d km/h   ·   BATERÍA: %d%%\n", currentSpeedKmh, currentBattery ?: 100))
            append(String.format(Locale.US, "📍 COORDENADAS: %s\n", coordsStr))
            append("🛡️ SISTEMA: Protección continua en 2do plano activa")
        }.toString()

        val stopIntent = Intent(this, CrashForegroundService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(this, CHANNEL_STATUS_ID)
            .setContentTitle(title)
            .setContentText(shortText)
            .setSubText("TELEMETRÍA VIVA")
            .setStyle(NotificationCompat.BigTextStyle().bigText(bigText))
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setColor(COLOR_CRASH_RED)
            .setColorized(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "🛑 DETENER MONITOREO",
                stopPendingIntent
            )

        return builder.build()
    }

    /**
     * Inicia la cuenta regresiva interactiva con vibración cada segundo y botones táctiles.
     */
    fun startCountdownTimer(seconds: Int, gRecorded: Double, notifyJS: Boolean = true) {
        countdownTimer?.cancel()
        isCountingDown = true
        val now = System.currentTimeMillis()
        lastImpactTime = now
        impactCooldownUntil = now + (seconds * 1000L) + 3000L
        val currentShockG = if (gRecorded > 0.1) gRecorded else (if (currentG > 0.1) currentG else alertThreshold)
        currentImpactG = currentShockG
        if (currentImpactG > peakG) {
            peakG = currentImpactG
        }

        // Notificar a JS solo si la cuenta no se originó desde JS
        if (notifyJS) {
            val startMap = Arguments.createMap().apply {
                putInt("seconds", seconds)
                putDouble("gForce", currentImpactG)
            }
            ForegroundServiceModule.sendEvent("onNativeCountdownStarted", startMap)
        }

        // Pulsación háptica inicial
        triggerVibrationTick()
        showInteractiveAlertNotification(seconds, currentImpactG)

        countdownTimer = object : CountDownTimer((seconds * 1000L), 1000L) {
            override fun onTick(millisUntilFinished: Long) {
                if (!isCountingDown) {
                    cancel()
                    return
                }
                val remainingSeconds = Math.max(1, Math.round(millisUntilFinished / 1000.0).toInt())

                // Vibración física cada segundo para alertar al motociclista
                triggerVibrationTick()

                // Actualizar la notificación con los segundos restantes
                showInteractiveAlertNotification(remainingSeconds, currentImpactG)

                // Emitir tick a React Native solo si el servicio sigue contando
                if (isCountingDown) {
                    val tickMap = Arguments.createMap().apply {
                        putInt("seconds", remainingSeconds)
                        putDouble("gForce", currentImpactG)
                    }
                    ForegroundServiceModule.sendEvent("onNativeCountdownTick", tickMap)
                }
            }

            override fun onFinish() {
                if (!isCountingDown) return
                isCountingDown = false
                dispatchEmergencyNow()
            }
        }.start()
    }

    /**
     * Detiene la cuenta regresiva y retira la alerta de la cortina de notificaciones.
     */
    fun stopCountdownTimer(cancelledByUser: Boolean) {
        isCountingDown = false
        val now = System.currentTimeMillis()
        lastImpactTime = now
        impactCooldownUntil = now + 3000L
        currentImpactG = 1.0
        countdownTimer?.cancel()
        countdownTimer = null

        try {
            notificationManager?.cancel(ALERT_NOTIFICATION_ID)
            // Restaurar la barra nativa única a su estado normal de telemetría
            val statusNotification = buildStatusNotification()
            notificationManager?.notify(NOTIFICATION_ID, statusNotification)
        } catch (_: Exception) {}

        if (cancelledByUser) {
            ForegroundServiceModule.sendEvent("onNativeCountdownCancelled", null)
            // Vibración corta de confirmación de cancelación
            vibratePattern(longArrayOf(0, 100, 50, 100))
        }
    }

    /**
     * Ejecuta el despacho de emergencia inmediato y despierta a la aplicación.
     */
    fun dispatchEmergencyNow() {
        isCountingDown = false
        val now = System.currentTimeMillis()
        lastImpactTime = now
        impactCooldownUntil = now + 10000L
        countdownTimer?.cancel()
        countdownTimer = null

        try {
            notificationManager?.cancel(ALERT_NOTIFICATION_ID)
            // Restaurar la barra nativa única a su estado normal de telemetría
            val statusNotification = buildStatusNotification()
            notificationManager?.notify(NOTIFICATION_ID, statusNotification)
        } catch (_: Exception) {}

        // Vibración intensa de despacho SOS
        vibratePattern(longArrayOf(0, 500, 150, 500, 150, 800))

        // Emitir evento a React Native
        val sendMap = Arguments.createMap().apply {
            putDouble("gForce", currentImpactG)
            putDouble("timestamp", System.currentTimeMillis().toDouble())
        }
        ForegroundServiceModule.sendEvent("onNativeCountdownSendNow", sendMap)

        // Despertar la actividad principal en primer plano para asegurar el envío del SOS
        try {
            val launchIntent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("EMERGENCY_DISPATCH_NOW", true)
                putExtra("IMPACT_G_FORCE", currentImpactG)
            }
            startActivity(launchIntent)
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo abrir MainActivity directamente: ${e.message}")
        }
    }

    /**
     * Muestra la notificación de emergencia interactiva con cuenta regresiva y botones Cancelar / Enviar Ahora.
     */
    private fun showInteractiveAlertNotification(remainingSeconds: Int, gRecorded: Double) {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val contentPendingIntent = PendingIntent.getActivity(
            this,
            1,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Acción 1: Cancelar (Falsa alarma)
        val cancelIntent = Intent(this, CrashForegroundReceiver::class.java).apply {
            action = CrashForegroundReceiver.ACTION_CANCEL_ALERT
        }
        val cancelPendingIntent = PendingIntent.getBroadcast(
            this,
            101,
            cancelIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Acción 2: Enviar Ahora (Despacho inmediato)
        val sendNowIntent = Intent(this, CrashForegroundReceiver::class.java).apply {
            action = CrashForegroundReceiver.ACTION_SEND_NOW
        }
        val sendNowPendingIntent = PendingIntent.getBroadcast(
            this,
            102,
            sendNowIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val title = String.format(Locale.US, "🚨 ¡IMPACTO DETECTADO! (%.2fG)", gRecorded)
        val shortText = "⏱️ Envío automático de auxilio en ${remainingSeconds}s"
        val bigText = StringBuilder().apply {
            append("⚠️ Se registró una desaceleración crítica de " + String.format(Locale.US, "%.2f G.\n", gRecorded))
            append("⏱️ Despacho de auxilio automático en ${remainingSeconds} segundos.\n\n")
            append("👉 Presiona CANCELAR si estás bien, o ENVIAR AHORA para auxilio médico urgente.")
        }.toString()

        val alertBuilder = NotificationCompat.Builder(this, CHANNEL_ALERT_ID)
            .setContentTitle(title)
            .setContentText(shortText)
            .setSubText("DESPACHO EN ${remainingSeconds}S")
            .setStyle(NotificationCompat.BigTextStyle().bigText(bigText))
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(contentPendingIntent)
            .setOngoing(true)
            .setAutoCancel(false)
            .setOnlyAlertOnce(true)
            .setColor(COLOR_CRASH_RED)
            .setColorized(true)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "❌ CANCELAR",
                cancelPendingIntent
            )
            .addAction(
                android.R.drawable.ic_menu_send,
                "🚨 ENVIAR AHORA",
                sendNowPendingIntent
            )

        try {
            val alertNotification = alertBuilder.build()
            // Notificar la alerta interactiva con botones Cancelar y Enviar Ahora
            notificationManager?.notify(ALERT_NOTIFICATION_ID, alertNotification)
        } catch (e: Exception) {
            Log.e(TAG, "Error mostrando alerta de emergencia: ${e.message}")
        }
    }

    /**
     * Dispara una vibración de 220ms cada segundo que pasa durante la cuenta regresiva.
     */
    private fun triggerVibrationTick() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(
                    VibrationEffect.createOneShot(220, VibrationEffect.DEFAULT_AMPLITUDE)
                )
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(220)
            }
        } catch (_: Exception) {}
    }

    private fun vibratePattern(pattern: LongArray) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(pattern, -1))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, -1)
            }
        } catch (_: Exception) {}
    }

    private fun emitTelemetryEvent() {
        val map = Arguments.createMap().apply {
            putDouble("gForce", currentG)
            putDouble("peakG", peakG)
            putDouble("speedKmh", currentSpeedKmh.toDouble())
            putDouble("accelX", accelX.toDouble())
            putDouble("accelY", accelY.toDouble())
            putDouble("accelZ", accelZ.toDouble())
            putDouble("gyroX", gyroX.toDouble())
            putDouble("gyroY", gyroY.toDouble())
            putDouble("gyroZ", gyroZ.toDouble())
            putDouble("timestamp", System.currentTimeMillis().toDouble())
        }
        ForegroundServiceModule.sendEvent("onNativeTelemetry", map)
    }

    private fun emitImpactEvent(gRecorded: Double) {
        val map = Arguments.createMap().apply {
            putDouble("gForce", gRecorded)
            putDouble("accelX", accelX.toDouble())
            putDouble("accelY", accelY.toDouble())
            putDouble("accelZ", accelZ.toDouble())
            putDouble("gyroX", gyroX.toDouble())
            putDouble("gyroY", gyroY.toDouble())
            putDouble("gyroZ", gyroZ.toDouble())
            putDouble("timestamp", System.currentTimeMillis().toDouble())
        }
        ForegroundServiceModule.sendEvent("onNativeImpact", map)
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val statusChannel = NotificationChannel(
                CHANNEL_STATUS_ID,
                "C.R.A.S.H. Monitoreo en Vivo",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Telemetría continua, velocidad y coordenadas en segundo plano"
                setShowBadge(false)
                enableVibration(false)
                setSound(null, null)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            val alertChannel = NotificationChannel(
                CHANNEL_ALERT_ID,
                "C.R.A.S.H. Alertas de Emergencia",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alarmas críticas de impacto y despacho de auxilio con botones de acción"
                setShowBadge(true)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 300, 100, 300)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                val audioAttributes = AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .build()
                setSound(soundUri, audioAttributes)
            }

            notificationManager?.createNotificationChannel(statusChannel)
            notificationManager?.createNotificationChannel(alertChannel)
        }
    }
}
