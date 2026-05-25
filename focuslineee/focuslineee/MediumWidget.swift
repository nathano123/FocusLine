// MediumWidget.swift
// Medium (4 × 2) home-screen widget. Light theme.
//
// Add to the FocusLineWidget extension target.

import WidgetKit
import SwiftUI

struct FocusLineMediumWidget: Widget {
    let kind: String = "FocusLineMedium"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MediumProvider()) { entry in
            MediumWidgetView(entry: entry)
                .containerBackground(for: .widget) { Color(red: 0.98, green: 0.98, blue: 0.97) /* paper */ }
        }
        .configurationDisplayName("FocusLine · live")
        .description("Phase, intention, line, and today’s stats.")
        .supportedFamilies([.systemMedium])
    }
}

struct MediumEntry: TimelineEntry {
    let date: Date
    let isRunning: Bool
    let phaseLabel: String
    let intention: String
    let endDate: Date
    let colorHex: String
    let progress: Double
    let sessionsToday: Int
    let streak: Int
}

struct MediumProvider: TimelineProvider {
    func placeholder(in context: Context) -> MediumEntry {
        MediumEntry(
            date: .now, isRunning: true,
            phaseLabel: "FOCUS · BLOCK 2 OF 4",
            intention: "draft the launch post",
            endDate: .now.addingTimeInterval(11*60+2),
            colorHex: "#FF6A4A", progress: 0.56,
            sessionsToday: 4, streak: 7
        )
    }
    func getSnapshot(in context: Context, completion: @escaping (MediumEntry) -> Void) {
        completion(placeholder(in: context))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<MediumEntry>) -> Void) {
        // Wire to App Group store
        let entry = placeholder(in: context)
        completion(Timeline(entries: [entry], policy: .after(.now.addingTimeInterval(60))))
    }
}

private struct MediumWidgetView: View {
    let entry: MediumEntry
    var body: some View {
        let color = Color(hex: entry.colorHex)
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                BrandMark(size: 16, color: color)
                Text("FocusLine").font(.system(size: 12.5, weight: .semibold))
                Spacer()
                Text(entry.isRunning ? "LIVE" : "READY")
                    .font(.system(size: 9.5).monospaced())
                    .tracking(0.8)
                    .foregroundStyle(.secondary)
            }
            HStack(alignment: .center, spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Circle().fill(color).frame(width: 6, height: 6)
                        Text(entry.phaseLabel)
                            .font(.system(size: 9.5).monospaced())
                            .tracking(0.7)
                            .foregroundStyle(.secondary)
                    }
                    if entry.isRunning {
                        Text(timerInterval: .now...entry.endDate, countsDown: true)
                            .font(.system(size: 38, weight: .medium, design: .monospaced))
                            .monospacedDigit()
                            .tracking(-1.4)
                    } else {
                        Text("—:—").font(.system(size: 38, weight: .medium, design: .monospaced)).foregroundStyle(.secondary)
                    }
                    if !entry.intention.isEmpty {
                        HStack(spacing: 0) {
                            Text("on ").foregroundStyle(.tertiary)
                            Text(entry.intention)
                        }
                        .font(.system(size: 11))
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Divider()
                VStack(alignment: .leading, spacing: 10) {
                    StatBlock(value: "\(entry.sessionsToday)", label: "TODAY")
                    StatBlock(value: "\(entry.streak)", label: "STREAK")
                }
                .frame(width: 86)
            }
            .padding(.top, 6)
            Spacer(minLength: 8)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.black.opacity(0.08)).frame(height: 4)
                    Capsule().fill(color)
                        .frame(width: geo.size.width * entry.progress, height: 4)
                        .shadow(color: color.opacity(0.5), radius: 3)
                }
            }
            .frame(height: 4)
        }
        .widgetURL(URL(string: "focusline://session"))
    }
}

private struct StatBlock: View {
    var value: String
    var label: String
    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(value).font(.system(size: 18, weight: .medium, design: .monospaced)).tracking(-0.4)
            Text(label).font(.system(size: 9).monospaced()).tracking(0.7).foregroundStyle(.secondary)
        }
    }
}
