//
//  HabitsWidget.swift
//  HabitsWidget
//
//  Lock screen widget showing unfinished habits for today
//

import WidgetKit
import SwiftUI

struct HabitsWidget: Widget {
    let kind: String = "HabitsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HabitsTimelineProvider()) { entry in
            HabitsWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Unfinished Habits")
        .description("Shows your unfinished habits for today")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

struct HabitsTimelineProvider: TimelineProvider {
    typealias Entry = HabitsEntry
    
    func placeholder(in context: Context) -> HabitsEntry {
        HabitsEntry(date: Date(), unfinishedHabits: [
            UnfinishedHabit(name: "Exercise", color: "#4CAF50"),
            UnfinishedHabit(name: "Read", color: "#2196F3")
        ])
    }
    
    func getSnapshot(in context: Context, completion: @escaping (HabitsEntry) -> ()) {
        let entry = getCurrentEntry()
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let entry = getCurrentEntry()
        
        // Refresh every hour
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func getCurrentEntry() -> HabitsEntry {
        let habits = loadHabitsFromSharedStorage()
        return HabitsEntry(date: Date(), unfinishedHabits: habits)
    }
    
    private func loadHabitsFromSharedStorage() -> [UnfinishedHabit] {
        // Try to load from App Group UserDefaults
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.sriharigurugubelli.gardenapp") else {
            return []
        }
        
        // Try to get widget_data as JSON string
        if let widgetDataString = sharedDefaults.string(forKey: "widget_data"),
           let data = widgetDataString.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let habitsArray = json["unfinishedHabits"] as? [[String: Any]] {
            return habitsArray.compactMap { dict in
                guard let name = dict["name"] as? String,
                      let color = dict["color"] as? String else {
                    return nil
                }
                return UnfinishedHabit(name: name, color: color)
            }
        }
        
        // Fallback: try to get as Data
        if let data = sharedDefaults.data(forKey: "widget_data"),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let habitsArray = json["unfinishedHabits"] as? [[String: Any]] {
            return habitsArray.compactMap { dict in
                guard let name = dict["name"] as? String,
                      let color = dict["color"] as? String else {
                    return nil
                }
                return UnfinishedHabit(name: name, color: color)
            }
        }
        
        return []
    }
}

struct HabitsEntry: TimelineEntry {
    let date: Date
    let unfinishedHabits: [UnfinishedHabit]
}

struct UnfinishedHabit {
    let name: String
    let color: String
}

struct HabitsWidgetEntryView: View {
    var entry: HabitsTimelineProvider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .accessoryCircular:
            CircularView(habits: entry.unfinishedHabits)
        case .accessoryRectangular:
            RectangularView(habits: entry.unfinishedHabits)
        case .accessoryInline:
            InlineView(habits: entry.unfinishedHabits)
        default:
            CircularView(habits: entry.unfinishedHabits)
        }
    }
}

struct CircularView: View {
    let habits: [UnfinishedHabit]
    
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 2) {
                Text("\(habits.count)")
                    .font(.system(size: 20, weight: .bold))
                Text("habits")
                    .font(.system(size: 10))
            }
        }
    }
}

struct RectangularView: View {
    let habits: [UnfinishedHabit]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Unfinished Habits")
                .font(.headline)
                .foregroundColor(.secondary)
            
            if habits.isEmpty {
                Text("All done! ✓")
                    .font(.subheadline)
            } else {
                ForEach(Array(habits.prefix(3).enumerated()), id: \.offset) { _, habit in
                    HStack(spacing: 6) {
                        Circle()
                            .fill(colorFromHex(habit.color))
                            .frame(width: 6, height: 6)
                        Text(habit.name)
                            .font(.subheadline)
                            .lineLimit(1)
                    }
                }
                
                if habits.count > 3 {
                    Text("+\(habits.count - 3) more")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
    
    private func colorFromHex(_ hex: String) -> Color {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            return Color.gray
        }
        return Color(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

struct InlineView: View {
    let habits: [UnfinishedHabit]
    
    var body: some View {
        if habits.isEmpty {
            Text("All habits done ✓")
        } else {
            Text("\(habits.count) unfinished habit\(habits.count == 1 ? "" : "s")")
        }
    }
}

#Preview(as: .accessoryCircular) {
    HabitsWidget()
} timeline: {
    HabitsEntry(date: .now, unfinishedHabits: [
        UnfinishedHabit(name: "Exercise", color: "#4CAF50"),
        UnfinishedHabit(name: "Read", color: "#2196F3")
    ])
}

#Preview(as: .accessoryRectangular) {
    HabitsWidget()
} timeline: {
    HabitsEntry(date: .now, unfinishedHabits: [
        UnfinishedHabit(name: "Exercise", color: "#4CAF50"),
        UnfinishedHabit(name: "Read", color: "#2196F3"),
        UnfinishedHabit(name: "Meditate", color: "#9C27B0")
    ])
}

#Preview(as: .accessoryInline) {
    HabitsWidget()
} timeline: {
    HabitsEntry(date: .now, unfinishedHabits: [
        UnfinishedHabit(name: "Exercise", color: "#4CAF50")
    ])
}
