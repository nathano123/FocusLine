import ActivityKit
import SwiftUI
import WidgetKit

struct FocusLineLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: FocusLineActivityAttributes.self) { context in
            // Lock-screen / banner presentation
            LockScreenView(state: context.state)
                .activityBackgroundTint(.black.opacity(0.85))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "timer")
                        .foregroundStyle(Color(hex: context.state.colorHex))
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(timerInterval: context.state.startDate...context.state.endDate, countsDown: true)
                        .monospacedDigit()
                        .font(.title3.weight(.semibold))
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }
                DynamicIslandExpandedRegion(.center) {
                    if let intention = context.state.intention, !intention.isEmpty {
                        Text(intention)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    } else {
                        Text(context.state.phase.displayName)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ProgressLine(state: context.state)
                        .frame(height: 4)
                }
            } compactLeading: {
                Image(systemName: "timer")
                    .foregroundStyle(Color(hex: context.state.colorHex))
            } compactTrailing: {
                Text(timerInterval: context.state.startDate...context.state.endDate, countsDown: true)
                    .monospacedDigit()
            } minimal: {
                Image(systemName: "timer")
                    .foregroundStyle(Color(hex: context.state.colorHex))
            }
            .widgetURL(URL(string: "focusline://session"))
            .keylineTint(Color(hex: context.state.colorHex))
        }
    }
}

private struct LockScreenView: View {
    let state: FocusLineActivityAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(state.phase.displayName.uppercased())
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .tracking(1.3)
                Spacer()
                Text(timerInterval: state.startDate...state.endDate, countsDown: true)
                    .font(.title2.weight(.semibold))
                    .monospacedDigit()
            }
            if let intention = state.intention, !intention.isEmpty {
                Text(intention)
                    .font(.callout)
                    .foregroundStyle(.white)
                    .lineLimit(2)
            }
            ProgressLine(state: state).frame(height: 5)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }
}

private struct ProgressLine: View {
    let state: FocusLineActivityAttributes.ContentState

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(.white.opacity(0.12))
                Capsule()
                    .fill(Color(hex: state.colorHex))
                    .frame(width: geo.size.width * fraction)
            }
        }
    }

    private var fraction: CGFloat {
        let total = state.endDate.timeIntervalSince(state.startDate)
        guard total > 0 else { return 0 }
        let elapsed = max(0, min(total, Date.now.timeIntervalSince(state.startDate)))
        return CGFloat(elapsed / total)
    }
}

// Mirrored from ContentView's Color(hex:) so the widget compiles standalone.
extension Color {
    init(hex: String) {
        var hex = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex
        if hex.count == 6 { hex.append("ff") }
        let value = UInt64(hex, radix: 16) ?? 0
        let r = Double((value >> 24) & 0xff) / 255.0
        let g = Double((value >> 16) & 0xff) / 255.0
        let b = Double((value >> 8) & 0xff) / 255.0
        let a = Double(value & 0xff) / 255.0
        self = Color(.sRGB, red: r, green: g, blue: b, opacity: a)
    }
}
