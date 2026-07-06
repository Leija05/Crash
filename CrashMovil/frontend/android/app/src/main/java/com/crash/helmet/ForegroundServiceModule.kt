package com.crash.helmet

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class ForegroundServiceModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ForegroundService"

    @ReactMethod
    fun start(deviceName: String, promise: Promise) {
        try {
            ForegroundTelemetryService.start(reactApplicationContext)
            ForegroundTelemetryService.update(
                reactApplicationContext,
                deviceName = deviceName,
                speed = 0.0,
                gForce = 0.0,
                battery = null,
            )
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("FOREGROUND_SERVICE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        try {
            ForegroundTelemetryService.stop(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("FOREGROUND_SERVICE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun updateTelemetry(deviceName: String, speed: Double, gForce: Double, battery: Int?, promise: Promise) {
        try {
            ForegroundTelemetryService.update(
                reactApplicationContext,
                deviceName = deviceName,
                speed = speed,
                gForce = gForce,
                battery = if (battery != null && battery >= 0) battery else null,
            )
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("FOREGROUND_SERVICE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isRunning(promise: Promise) {
        promise.resolve(false)
    }
}
