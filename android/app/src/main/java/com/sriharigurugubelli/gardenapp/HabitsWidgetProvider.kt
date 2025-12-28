package com.sriharigurugubelli.gardenapp

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject

/**
 * Widget provider for displaying unfinished habits on lock screen
 */
class HabitsWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Widget enabled
    }

    override fun onDisabled(context: Context) {
        // Widget disabled
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.habits_widget)
        
        // Load widget data from SharedPreferences
        val prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE)
        val widgetDataJson = prefs.getString("widget_data", null)
        
        if (widgetDataJson != null) {
            try {
                val jsonObject = JSONObject(widgetDataJson)
                val habitsArray = jsonObject.getJSONArray("unfinishedHabits")
                
                if (habitsArray.length() == 0) {
                    views.setTextViewText(R.id.widget_title, "All habits done! ✓")
                    views.setTextViewText(R.id.widget_content, "")
                } else {
                    views.setTextViewText(R.id.widget_title, "Unfinished Habits")
                    
                    val habitsText = StringBuilder()
                    val maxHabits = minOf(habitsArray.length(), 5)
                    
                    for (i in 0 until maxHabits) {
                        val habit = habitsArray.getJSONObject(i)
                        val name = habit.getString("name")
                        habitsText.append("• $name")
                        if (i < maxHabits - 1) {
                            habitsText.append("\n")
                        }
                    }
                    
                    if (habitsArray.length() > maxHabits) {
                        habitsText.append("\n+${habitsArray.length() - maxHabits} more")
                    }
                    
                    views.setTextViewText(R.id.widget_content, habitsText.toString())
                }
            } catch (e: Exception) {
                views.setTextViewText(R.id.widget_title, "Habits")
                views.setTextViewText(R.id.widget_content, "Unable to load habits")
            }
        } else {
            views.setTextViewText(R.id.widget_title, "Habits")
            views.setTextViewText(R.id.widget_content, "No data available")
        }
        
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}

