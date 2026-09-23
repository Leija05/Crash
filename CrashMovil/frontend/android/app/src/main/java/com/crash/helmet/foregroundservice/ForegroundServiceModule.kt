package com.crash.helmet.foregroundservice

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class ForegroundServiceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private var instance: ForegroundServiceModule? = null

        fun sendEvent(eventName: String, params: WritableMap?) {
            try {
                instance?.reactContext
                    ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit(eventName, params)
            } catch (_: Exception) {}
        }
    }

    init {
        instance = this
    }

    override fun getName(): String = "ForegroundService"

    @ReactMethod
    fun start(deviceName: String, threshold: Double, promise: Promise) {
        try {
            val hasLocationPerm = ContextCompat.checkSelfPermission(
                reactContext,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED || ContextCompat.checkSelfPermission(
                reactContext,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED

            // En Android 14+ (UPSIDE_DOWN_CAKE), si el servicio declara foregroundServiceType="location",
            // el sistema exige que al menos un permiso de ubicación esté concedido antes de llamar a startForegroundService.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE && !hasLocationPerm) {
                promise.reject(
                    "LOCATION_PERMISSION_REQUIRED",
                    "Se requiere permiso de ubicación antes de iniciar el monitoreo en segundo plano."
                )
                return
            }

            val intent = Intent(reactContext, CrashForegroundService::class.java).apply {
                action = CrashForegroundService.ACTION_START
                putExtra(CrashForegroundService.EXTRA_DEVICE_NAME, deviceName)
                putExtra(CrashForegroundService.EXTRA_THRESHOLD, threshold)
            }
            ContextCompat.startForegroundService(reactContext, intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_SERVICE_FAILED", e.message ?: "No se pudo iniciar el servicio nativo")
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        try {
            val intent = Intent(reactContext, CrashForegroundService::class.java).apply {
                action = CrashForegroundService.ACTION_STOP
            }
            reactContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_SERVICE_FAILED", e.message ?: "No se pudo detener el servicio nativo")
        }
    }

    @ReactMethod
    fun updateTelemetry(deviceName: String, speed: Double, gForce: Double, battery: Double?, promise: Promise) {
        try {
            val intent = Intent(reactContext, CrashForegroundService::class.java).apply {
                action = CrashForegroundService.ACTION_UPDATE_TELEMETRY
                putExtra(CrashForegroundService.EXTRA_DEVICE_NAME, deviceName)
                putExtra(CrashForegroundService.EXTRA_SPEED, speed)
                putExtra(CrashForegroundService.EXTRA_G_FORCE, gForce)
                if (battery != null) {
                    putExtra(CrashForegroundService.EXTRA_BATTERY, battery)
                }
            }
            reactContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UPDATE_TELEMETRY_FAILED", e.message)
        }
    }

    @ReactMethod
    fun updateLocation(latitude: Double, longitude: Double, speed: Double, promise: Promise) {
        try {
            val intent = Intent(reactContext, CrashForegroundService::class.java).apply {
                action = CrashForegroundService.ACTION_UPDATE_LOCATION
                putExtra(CrashForegroundService.EXTRA_LATITUDE, latitude)
                putExtra(CrashForegroundService.EXTRA_LONGITUDE, longitude)
                putExtra(CrashForegroundService.EXTRA_SPEED, speed)
            }
            reactContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UPDATE_LOCATION_FAILED", e.message)
        }
    }

    @ReactMethod
    fun setThreshold(threshold: Double, promise: Promise) {
        try {
            val intent = Intent(reactContext, CrashForegroundService::class.java).apply {
                action = CrashForegroundService.ACTION_SET_THRESHOLD
                putExtra(CrashForegroundService.EXTRA_THRESHOLD, threshold)
            }
            reactContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SET_THRESHOLD_FAILED", e.message)
        }
    }

    @ReactMethod
    fun startEmergencyCountdown(seconds: Double, gForce: Double, promise: Promise) {
        try {
            CrashForegroundService.startCountdownFromJS(seconds.toInt(), gForce)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_COUNTDOWN_FAILED", e.message)
        }
    }

    @ReactMethod
    fun cancelEmergencyCountdown(promise: Promise) {
        try {
            CrashForegroundService.cancelCountdownFromJS()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CANCEL_COUNTDOWN_FAILED", e.message)
        }
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        try {
            val hasFineLoc = ContextCompat.checkSelfPermission(
                reactContext,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED

            val hasCoarseLoc = ContextCompat.checkSelfPermission(
                reactContext,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED

            val hasNotif = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ContextCompat.checkSelfPermission(
                    reactContext,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
            } else {
                true
            }

            val map = Arguments.createMap().apply {
                putBoolean("locationGranted", hasFineLoc || hasCoarseLoc)
                putBoolean("notificationsGranted", hasNotif)
                putBoolean("allGranted", (hasFineLoc || hasCoarseLoc) && hasNotif)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("CHECK_PERMISSIONS_FAILED", e.message)
        }
    }

    @ReactMethod
    fun isRunning(promise: Promise) {
        promise.resolve(CrashForegroundService.isServiceRunning)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Requerido para React Native EventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Requerido para React Native EventEmitter
    }
}
