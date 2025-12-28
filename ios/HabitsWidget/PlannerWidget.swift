//
//  PlannerWidget.swift
//  HabitsWidget
//
//  Home screen widget showing today's schedule
//

import WidgetKit
import SwiftUI

struct PlannerWidget: Widget {
    let kind: String = "PlannerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PlannerTimelineProvider()) { entry in
            PlannerWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Day Planner")
        .description("Shows your schedule for today")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
    }
}

struct PlannerTimelineProvider: TimelineProvider {
    typealias Entry = PlannerEntry
    
    func placeholder(in context: Context) -> PlannerEntry {
        PlannerEntry(date: Date(), dateDisplay: "Monday, Dec 30", blocks: [
            WidgetTimeBlock(id: "1", title: "Meeting", startTime: "09:00", endTime: "10:00", startDisplay: "9:00 AM", endDisplay: "10:00 AM"),
            WidgetTimeBlock(id: "2", title: "Lunch", startTime: "12:00", endTime: "13:00", startDisplay: "12:00 PM", endDisplay: "1:00 PM")
        ], currentTime: "09:30")
    }
    
    func getSnapshot(in context: Context, completion: @escaping (PlannerEntry) -> ()) {
        let entry = getCurrentEntry()
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let entry = getCurrentEntry()
        
        // Refresh every 15 minutes to keep current time indicator accurate
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func getCurrentEntry() -> PlannerEntry {
        let (dateDisplay, blocks, currentTime) = loadPlannerFromSharedStorage()
        return PlannerEntry(date: Date(), dateDisplay: dateDisplay, blocks: blocks, currentTime: currentTime)
    }
    
    private func loadPlannerFromSharedStorage() -> (String, [WidgetTimeBlock], String) {
        let defaultDate = formatDateDisplay(Date())
        let defaultTime = formatCurrentTime()
        
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.sriharigurugubelli.gardenapp") else {
            return (defaultDate, [], defaultTime)
        }
        
        guard let dataString = sharedDefaults.string(forKey: "planner_widget_data"),
              let data = dataString.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return (defaultDate, [], defaultTime)
        }
        
        let dateDisplay = json["dateDisplay"] as? String ?? defaultDate
        let currentTime = json["currentTime"] as? String ?? defaultTime
        
        var blocks: [WidgetTimeBlock] = []
        if let blocksArray = json["blocks"] as? [[String: Any]] {
            blocks = blocksArray.compactMap { dict in
                guard let id = dict["id"] as? String,
                      let title = dict["title"] as? String,
                      let startTime = dict["startTime"] as? String,
                      let endTime = dict["endTime"] as? String,
                      let startDisplay = dict["startDisplay"] as? String,
                      let endDisplay = dict["endDisplay"] as? String else {
                    return nil
                }
                return WidgetTimeBlock(id: id, title: title, startTime: startTime, endTime: endTime, startDisplay: startDisplay, endDisplay: endDisplay)
            }
        }
        
        return (dateDisplay, blocks, currentTime)
    }
    
    private func formatDateDisplay(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMM d"
        return formatter.string(from: date)
    }
    
    private func formatCurrentTime() -> String {
        let now = Date()
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: now)
        let minute = calendar.component(.minute, from: now)
        return String(format: "%02d:%02d", hour, minute)
    }
}

struct PlannerEntry: TimelineEntry {
    let date: Date
    let dateDisplay: String
    let blocks: [WidgetTimeBlock]
    let currentTime: String
}

struct WidgetTimeBlock: Identifiable {
    let id: String
    let title: String
    let startTime: String
    let endTime: String
    let startDisplay: String
    let endDisplay: String
}

struct PlannerWidgetEntryView: View {
    var entry: PlannerTimelineProvider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallPlannerView(entry: entry)
        case .systemMedium:
            MediumPlannerView(entry: entry)
        case .accessoryRectangular:
            RectangularPlannerView(entry: entry)
        default:
            SmallPlannerView(entry: entry)
        }
    }
}

struct SmallPlannerView: View {
    let entry: PlannerEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(entry.dateDisplay)
                .font(.caption2)
                .foregroundColor(.secondary)
            
            if entry.blocks.isEmpty {
                Spacer()
                VStack {
                    Text("📅")
                        .font(.title)
                    Text("No events")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                Spacer()
            } else {
                ForEach(Array(entry.blocks.prefix(3))) { block in
                    HStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color.teal)
                            .frame(width: 3)
                        VStack(alignment: .leading, spacing: 0) {
                            Text(block.title)
                                .font(.caption)
                                .fontWeight(.medium)
                                .lineLimit(1)
                            Text(block.startDisplay)
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                if entry.blocks.count > 3 {
                    Text("+\(entry.blocks.count - 3) more")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(8)
    }
}

struct MediumPlannerView: View {
    let entry: PlannerEntry
    
    // Get upcoming/current events
    var relevantBlocks: [WidgetTimeBlock] {
        let now = entry.currentTime
        // Filter to show current and upcoming events
        return entry.blocks.filter { block in
            block.endTime > now
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            // Left: Date and summary
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.dateDisplay)
                    .font(.headline)
                
                Text("\(entry.blocks.count) event\(entry.blocks.count == 1 ? "" : "s")")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                // Current time indicator
                HStack(spacing: 4) {
                    Circle()
                        .fill(Color.red)
                        .frame(width: 6, height: 6)
                    Text(formatTime(entry.currentTime))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: 100)
            
            // Right: Event list
            VStack(alignment: .leading, spacing: 4) {
                if relevantBlocks.isEmpty {
                    Text("No more events today")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ForEach(Array(relevantBlocks.prefix(4))) { block in
                        HStack(spacing: 6) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color.teal)
                                .frame(width: 3)
                            
                            VStack(alignment: .leading, spacing: 0) {
                                Text(block.title)
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .lineLimit(1)
                                Text("\(block.startDisplay) - \(block.endDisplay)")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    
                    if relevantBlocks.count > 4 {
                        Text("+\(relevantBlocks.count - 4) more")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding(12)
    }
    
    private func formatTime(_ time: String) -> String {
        let parts = time.split(separator: ":")
        guard parts.count == 2, let hour = Int(parts[0]) else { return time }
        let minute = String(parts[1])
        let period = hour >= 12 ? "PM" : "AM"
        let displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour)
        return "\(displayHour):\(minute) \(period)"
    }
}

struct RectangularPlannerView: View {
    let entry: PlannerEntry
    
    var nextBlock: WidgetTimeBlock? {
        let now = entry.currentTime
        return entry.blocks.first { $0.startTime >= now } ?? entry.blocks.first
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Today's Schedule")
                .font(.headline)
                .foregroundColor(.secondary)
            
            if let block = nextBlock {
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.teal)
                        .frame(width: 3)
                    VStack(alignment: .leading, spacing: 0) {
                        Text(block.title)
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .lineLimit(1)
                        Text(block.startDisplay)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                if entry.blocks.count > 1 {
                    Text("+\(entry.blocks.count - 1) more")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            } else {
                Text("No events today")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
    }
}

#Preview(as: .systemSmall) {
    PlannerWidget()
} timeline: {
    PlannerEntry(date: .now, dateDisplay: "Monday, Dec 30", blocks: [
        WidgetTimeBlock(id: "1", title: "Team Standup", startTime: "09:00", endTime: "09:30", startDisplay: "9:00 AM", endDisplay: "9:30 AM"),
        WidgetTimeBlock(id: "2", title: "Project Review", startTime: "10:00", endTime: "11:00", startDisplay: "10:00 AM", endDisplay: "11:00 AM"),
        WidgetTimeBlock(id: "3", title: "Lunch", startTime: "12:00", endTime: "13:00", startDisplay: "12:00 PM", endDisplay: "1:00 PM")
    ], currentTime: "09:30")
}

#Preview(as: .systemMedium) {
    PlannerWidget()
} timeline: {
    PlannerEntry(date: .now, dateDisplay: "Monday, Dec 30", blocks: [
        WidgetTimeBlock(id: "1", title: "Team Standup", startTime: "09:00", endTime: "09:30", startDisplay: "9:00 AM", endDisplay: "9:30 AM"),
        WidgetTimeBlock(id: "2", title: "Project Review", startTime: "10:00", endTime: "11:00", startDisplay: "10:00 AM", endDisplay: "11:00 AM"),
        WidgetTimeBlock(id: "3", title: "Lunch", startTime: "12:00", endTime: "13:00", startDisplay: "12:00 PM", endDisplay: "1:00 PM"),
        WidgetTimeBlock(id: "4", title: "Client Call", startTime: "14:00", endTime: "15:00", startDisplay: "2:00 PM", endDisplay: "3:00 PM")
    ], currentTime: "09:30")
}

#Preview(as: .accessoryRectangular) {
    PlannerWidget()
} timeline: {
    PlannerEntry(date: .now, dateDisplay: "Monday, Dec 30", blocks: [
        WidgetTimeBlock(id: "1", title: "Team Standup", startTime: "09:00", endTime: "09:30", startDisplay: "9:00 AM", endDisplay: "9:30 AM")
    ], currentTime: "08:30")
}


