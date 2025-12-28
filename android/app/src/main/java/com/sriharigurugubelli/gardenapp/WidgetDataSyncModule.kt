package com.sriharigurugubelli.gardenapp

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

/**
 * Native module to sync widget data to SharedPreferences
 * This allows the widget to read the data
 */
class WidgetDataSyncModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WidgetDataSync"
    }

    @ReactMethod
    fun syncToSharedPreferences(data: String, promise: Promise) {
        try {
            val prefs = reactApplicationContext
                .getSharedPreferences("widget_prefs", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("widget_data", data)
                .apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SYNC_ERROR", "Failed to sync widget data", e)
        }
    }
}

