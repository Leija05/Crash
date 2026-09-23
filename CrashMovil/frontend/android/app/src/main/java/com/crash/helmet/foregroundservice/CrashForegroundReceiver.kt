package com.crash.helmet.foregroundservice

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class CrashForegroundReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "CrashReceiver"
        const val ACTION_CANCEL_ALERT = "com.crash.helmet.ACTION_CANCEL_ALERT"
        const val ACTION_SEND_NOW = "com.crash.helmet.ACTION_SEND_NOW"
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return

        val action = intent.action ?: return
        Log.d(TAG, "Notification action received: $action")

        when (action) {
            ACTION_CANCEL_ALERT -> {
                CrashForegroundService.cancelEmergencyAlert(context)
            }
            ACTION_SEND_NOW -> {
                CrashForegroundService.sendEmergencyNow(context)
            }
        }
    }
}
