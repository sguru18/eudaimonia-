//
//  PlannerWidget.swift
//  PlannerWidget
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
        let now = Date()
        let calendar = Calendar.current
        
        // Get current entry
        let entry = getCurrentEntry()
        
        // Create timeline entries for better refresh behavior
        var entries: [PlannerEntry] = [entry]
        
        // Add entry at midnight to refresh for new day
        if let midnight = calendar.nextDate(after: now, matching: DateComponents(hour: 0, minute: 0), matchingPolicy: .nextTime) {
            let midnightEntry = PlannerEntry(
                date: midnight,
                dateDisplay: formatDateDisplay(midnight),
                blocks: [], // Will be empty until app updates data
                currentTime: formatCurrentTime(for: midnight)
            )
            entries.append(midnightEntry)
        }
        
        // Refresh policy: update every 15 minutes, but also at midnight
        let next15Min = calendar.date(byAdding: .minute, value: 15, to: now) ?? now.addingTimeInterval(15 * 60)
        let nextMidnight = calendar.nextDate(after: now, matching: DateComponents(hour: 0, minute: 0), matchingPolicy: .nextTime) ?? now.addingTimeInterval(15 * 60)
        let nextUpdate = min(next15Min, nextMidnight)
        
        let timeline = Timeline(entries: entries, policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func getCurrentEntry() -> PlannerEntry {
        let (dateDisplay, blocks) = loadPlannerFromSharedStorage()
        let currentTime = formatCurrentTime()
        return PlannerEntry(date: Date(), dateDisplay: dateDisplay, blocks: blocks, currentTime: currentTime)
    }
    
    private func loadPlannerFromSharedStorage() -> (String, [WidgetTimeBlock]) {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let defaultDate = formatDateDisplay(Date())
        
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.sriharigurugubelli.gardenapp") else {
            return (defaultDate, [])
        }
        
        // Force synchronize to get latest data
        sharedDefaults.synchronize()
        
        guard let dataString = sharedDefaults.string(forKey: "planner_widget_data") else {
            return (defaultDate, [])
        }
        
        guard let data = dataString.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return (defaultDate, [])
        }
        
        // Check if stored data is for today
        let storedDateString = json["date"] as? String ?? ""
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone.current
        
        var blocks: [WidgetTimeBlock] = []
        
        // Try to load blocks - check if date matches today, but also load if date is close (within 1 day)
        if let storedDate = dateFormatter.date(from: storedDateString) {
            let storedDateStart = calendar.startOfDay(for: storedDate)
            let daysDifference = calendar.dateComponents([.day], from: storedDateStart, to: today).day ?? 999
            
            // Use data if it's for today or yesterday (in case of timezone issues)
            if daysDifference == 0 || daysDifference == -1 {
                // Use stored dateDisplay if it matches today
                let storedDateDisplay = json["dateDisplay"] as? String ?? defaultDate
                
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
                
                return (storedDateDisplay, blocks)
            }
        }
        
        // Stored data is for a different day or invalid, return empty blocks with today's date
        return (defaultDate, [])
    }
    
    private func formatDateDisplay(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMM d"
        return formatter.string(from: date)
    }
    
    private func formatCurrentTime(for date: Date = Date()) -> String {
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: date)
        let minute = calendar.component(.minute, from: date)
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
    
    // Get next upcoming events using actual current time, or all events if none upcoming
    var upcomingBlocks: [WidgetTimeBlock] {
        let now = formatCurrentTime()
        let upcoming = entry.blocks.filter { block in
            block.startTime > now
        }
        // If no upcoming events, show all events (sorted by time)
        return upcoming.isEmpty ? entry.blocks.sorted { $0.startTime < $1.startTime } : upcoming
    }
    
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
                    Text("No events today")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                Spacer()
            } else {
                ForEach(Array(upcomingBlocks.prefix(3))) { block in
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
                
                if upcomingBlocks.count > 3 {
                    Text("+\(upcomingBlocks.count - 3) more")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(8)
    }
    
    private func formatCurrentTime() -> String {
        let now = Date()
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: now)
        let minute = calendar.component(.minute, from: now)
        return String(format: "%02d:%02d", hour, minute)
    }
}

struct MediumPlannerView: View {
    let entry: PlannerEntry
    
    // Get upcoming/current events using actual current time, or all events if none upcoming
    var relevantBlocks: [WidgetTimeBlock] {
        let now = formatCurrentTime()
        // Filter to show current and upcoming events
        let upcoming = entry.blocks.filter { block in
            block.endTime > now
        }
        // If no upcoming events, show all events (sorted by time)
        return upcoming.isEmpty ? entry.blocks.sorted { $0.startTime < $1.startTime } : upcoming
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
                    Text(formatTime(formatCurrentTime()))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: 100)
            
            // Right: Event list
            VStack(alignment: .leading, spacing: 4) {
                if entry.blocks.isEmpty {
                    Text("No events today")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if relevantBlocks.isEmpty {
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
    
    private func formatCurrentTime() -> String {
        let now = Date()
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: now)
        let minute = calendar.component(.minute, from: now)
        return String(format: "%02d:%02d", hour, minute)
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
    
    // Get next upcoming event using actual current time, or first event if none upcoming
    var nextBlock: WidgetTimeBlock? {
        let now = formatCurrentTime()
        // Find the first block that hasn't started yet
        if let upcoming = entry.blocks.first(where: { $0.startTime > now }) {
            return upcoming
        }
        // If no upcoming events, return the first event (sorted by time)
        return entry.blocks.sorted { $0.startTime < $1.startTime }.first
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Today's Schedule")
                .font(.headline)
                .foregroundColor(.secondary)
            
            if entry.blocks.isEmpty {
                Text("No events today")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else if let block = nextBlock {
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
    
    private func formatCurrentTime() -> String {
        let now = Date()
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: now)
        let minute = calendar.component(.minute, from: now)
        return String(format: "%02d:%02d", hour, minute)
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
