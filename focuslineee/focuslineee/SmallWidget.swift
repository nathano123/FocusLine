// SmallWidget.swift
// Small (2 × 2) home-screen widget. Always-dark inkscale.
//
// Add to the FocusLineWidget extension target.

import WidgetKit
import SwiftUI

struct FocusLineSmallWidget: Widget {
    let kind: String = "FocusLineSmall"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SmallProvider()) { entry in
            SmallWidgetView(entry: entry)
                .containerBackground(for: .widget) { Color.black }
        }
        .configurationDisplayName("FocusLine")
        .description("Glance at the line and remaining time.")
        .supportedFamilies([.systemSmall])
    }
}

struct SmallEntry: TimelineEntry {
    let date: Date
    let isRunning: Bool
    let phaseLabel: String
    let endDate: Date
    let colorHex: String
    let progress: Double
}

struct SmallProvider: TimelineProvider {
    func placeholder(in context: Context) -> SmallEntry {
        SmallEntry(date: .now, isRunning: true, phaseLabel: "FOCUS · BLOCK 2", endDate: .now.addingTimeInterval(11*60+2), colorHex: "#FF6A4A", progress: 0.56)
    }
    func getSnapshot(in context: Context, completion: @escaping (SmallEntry) -> Void) {
        completion(placeholder(in: context))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<SmallEntry>) -> Void) {
        // Reads shared App Group user defaults if you set them up.
        // For now, mirror the placeholder; replace with real values from your
        // App Group store.
        let entry = placeholder(in: context)
        completion(Timeline(entries: [entry], policy: .after(.now.addingTimeInterval(60))))
    }
}

private struct SmallWidgetView: View {
    let entry: SmallEntry
    var body: some View {
        let color = Color(hex: entry.colorHex)
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 6) {
                BrandMark(size: 14, color: color)
                Text("FocusLine").font(.system(size: 11, weight: .semibold)).foregroundStyle(.white)
            }
            Spacer()
            if entry.isRunning {
                Text(timerInterval: .now...entry.endDate, countsDown: true)
                    .font(.system(size: 34, weight: .medium, design: .monospaced))
                    .monospacedDigit()
                    .tracking(-1.2)
                    .foregroundStyle(.white)
                Text(entry.phaseLabel)
                    .font(.system(size: 9).monospaced())
                    .tracking(0.7)
                    .foregroundStyle(.white.opacity(0.55))
                    .padding(.top, 2)
            } else {
                Text("—:—")
                    .font(.system(size: 34, weight: .medium, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.45))
                Text("TAP TO START · 25 MIN")
                    .font(.system(size: 9).monospaced())
                    .tracking(0.7)
                    .foregroundStyle(.white.opacity(0.55))
                    .padding(.top, 2)
            }
            Spacer()
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.12)).frame(height: 4)
                    Capsule().fill(color)
                        .frame(width: geo.size.width * entry.progress, height: 4)
                        .shadow(color: color.opacity(0.7), radius: 4)
                }
            }
            .frame(height: 4)
        }
        .widgetURL(URL(string: "focusline://session"))
    }
}

// Use the same BrandMark struct from ContentView.swift — it's declared there.
