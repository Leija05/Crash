package com.crash.helmet

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class ForegroundTelemetryService : Service() {

    companion object {
        const val CHANNEL_ID = "crash-foreground"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "com.crash.helmet.ACTION_START"
        const val ACTION_STOP = "com.crash.helmet.ACTION_STOP"
        const val ACTION_UPDATE = "com.crash.helmet.ACTION_UPDATE"
        const val EXTRA_DEVICE_NAME = "device_name"
        const val EXTRA_SPEED = "speed"
        const val EXTRA_G_FORCE = "g_force"
        const val EXTRA_BATTERY = "battery"

        fun start(context: Context) {
            val intent = Intent(context, ForegroundTelemetryService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, ForegroundTelemetryService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }

        fun update(context: Context, deviceName: String, speed: Double, gForce: Double, battery: Int?) {
            val intent = Intent(context, ForegroundTelemetryService::class.java).apply {
                action = ACTION_UPDATE
                putExtra(EXTRA_DEVICE_NAME, deviceName)
                putExtra(EXTRA_SPEED, speed)
                putExtra(EXTRA_G_FORCE, gForce)
                if (battery != null) {
                    putExtra(EXTRA_BATTERY, battery)
                }
            }
            context.startService(intent)
        }
    }

    private lateinit var notificationManager: NotificationManager

    override fun onCreate() {
        super.onCreate()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val notification = buildNotification(
                    deviceName = intent.getStringExtra(EXTRA_DEVICE_NAME) ?: "C.R.A.S.H.",
                    speed = intent.getDoubleExtra(EXTRA_SPEED, 0.0),
                    gForce = intent.getDoubleExtra(EXTRA_G_FORCE, 0.0),
                    battery = if (intent.hasExtra(EXTRA_BATTERY)) intent.getIntExtra(EXTRA_BATTERY, -1) else null,
                )
                startForeground(NOTIFICATION_ID, notification)
            }
            ACTION_UPDATE -> {
                val notification = buildNotification(
                    deviceName = intent.getStringExtra(EXTRA_DEVICE_NAME) ?: "C.R.A.S.H.",
                    speed = intent.getDoubleExtra(EXTRA_SPEED, 0.0),
                    gForce = intent.getDoubleExtra(EXTRA_G_FORCE, 0.0),
                    battery = if (intent.hasExtra(EXTRA_BATTERY)) intent.getIntExtra(EXTRA_BATTERY, -1) else null,
                )
                notificationManager.notify(NOTIFICATION_ID, notification)
            }
            ACTION_STOP -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "C.R.A.S.H. Monitoreo",
                NotificationManager.IMPORTANCE_LOW,
            ).apply {
                description = "Notificación persistente del monitoreo del casco"
                setShowBadge(false)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(
        deviceName: String,
        speed: Double,
        gForce: Double,
        battery: Int?,
    ): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val batteryText = if (battery != null && battery >= 0) " · Batería $battery%" else ""
        val speedText = "Velocidad: ${speed.toInt()} km/h"
        val gForceText = "Fuerza G: ${"%.2f".format(gForce)}"
        val bodyText = "$deviceName$batteryText\n$speedText · $gForceText"

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("C.R.A.S.H. · $deviceName")
            .setContentText(bodyText)
            .setStyle(NotificationCompat.BigTextStyle().bigText(bodyText))
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(pendingIntent)
            .build()
    }
}
