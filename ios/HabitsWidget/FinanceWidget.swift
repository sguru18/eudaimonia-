//
//  FinanceWidget.swift
//  HabitsWidget
//
//  Quick-add expense widget with today's spending total
//

import WidgetKit
import SwiftUI

struct FinanceWidget: Widget {
    let kind: String = "FinanceWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: FinanceTimelineProvider()) { entry in
            FinanceWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Track Spending")
        .description("Quick add expenses and see today's total")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .systemSmall])
    }
}

struct FinanceTimelineProvider: TimelineProvider {
    typealias Entry = FinanceEntry
    
    func placeholder(in context: Context) -> FinanceEntry {
        FinanceEntry(date: Date(), todayTotal: 42.50, expenseCount: 3)
    }
    
    func getSnapshot(in context: Context, completion: @escaping (FinanceEntry) -> ()) {
        let entry = getCurrentEntry()
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let entry = getCurrentEntry()
        
        // Refresh every 30 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func getCurrentEntry() -> FinanceEntry {
        let (total, count) = loadFinanceFromSharedStorage()
        return FinanceEntry(date: Date(), todayTotal: total, expenseCount: count)
    }
    
    private func loadFinanceFromSharedStorage() -> (Double, Int) {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.sriharigurugubelli.gardenapp") else {
            return (0, 0)
        }
        
        // Try to get finance_widget_data as JSON string
        if let widgetDataString = sharedDefaults.string(forKey: "finance_widget_data"),
           let data = widgetDataString.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            let total = json["todayTotal"] as? Double ?? 0
            let count = json["expenseCount"] as? Int ?? 0
            return (total, count)
        }
        
        return (0, 0)
    }
}

struct FinanceEntry: TimelineEntry {
    let date: Date
    let todayTotal: Double
    let expenseCount: Int
}

struct FinanceWidgetEntryView: View {
    var entry: FinanceTimelineProvider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .accessoryCircular:
            FinanceCircularView(total: entry.todayTotal)
        case .accessoryRectangular:
            FinanceRectangularView(total: entry.todayTotal, count: entry.expenseCount)
        case .systemSmall:
            FinanceSmallView(total: entry.todayTotal, count: entry.expenseCount)
        default:
            FinanceCircularView(total: entry.todayTotal)
        }
    }
}

struct FinanceCircularView: View {
    let total: Double
    
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 1) {
                Text("$")
                    .font(.system(size: 10, weight: .medium))
                Text("\(Int(total))")
                    .font(.system(size: 18, weight: .bold))
            }
        }
    }
}

struct FinanceRectangularView: View {
    let total: Double
    let count: Int
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Today's Spending")
                .font(.headline)
                .foregroundColor(.secondary)
            
            Text("$\(total, specifier: "%.2f")")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("\(count) expense\(count == 1 ? "" : "s")")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct FinanceSmallView: View {
    let total: Double
    let count: Int
    
    var body: some View {
        Link(destination: URL(string: "gardenapp://finances")!) {
            VStack(spacing: 8) {
                // Header
                HStack {
                    Image(systemName: "dollarsign.circle.fill")
                        .foregroundColor(Color(hex: "#E1C16E"))
                    Text("Spending")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Amount
                Text("$\(total, specifier: "%.2f")")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(Color(hex: "#E1C16E"))
                
                Text("today")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                // Quick Add Button
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Add")
                }
                .font(.caption)
                .foregroundColor(Color(hex: "#E1C16E"))
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color(hex: "#E1C16E").opacity(0.2))
                .cornerRadius(12)
            }
            .padding()
        }
    }
}

// Color extension for hex colors
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 128, 128, 128)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

#Preview(as: .accessoryCircular) {
    FinanceWidget()
} timeline: {
    FinanceEntry(date: .now, todayTotal: 42.50, expenseCount: 3)
}

#Preview(as: .accessoryRectangular) {
    FinanceWidget()
} timeline: {
    FinanceEntry(date: .now, todayTotal: 127.85, expenseCount: 5)
}

#Preview(as: .systemSmall) {
    FinanceWidget()
} timeline: {
    FinanceEntry(date: .now, todayTotal: 85.25, expenseCount: 4)
}

