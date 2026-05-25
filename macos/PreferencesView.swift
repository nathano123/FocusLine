// PreferencesView.swift + PreferencesWindowController.swift
// Tabbed preferences window — six tabs in a left sidebar, content on the right.
// See the MacPreferences artboard for the visual spec.
//
// Drop into the macOS target.

import AppKit
import SwiftUI

@MainActor
final class PreferencesWindowController {
    let window: NSWindow

    init(model: TimerModel) {
        let host = NSHostingController(rootView: PreferencesView(model: model))
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 720, height: 480),
            styleMask: [.titled, .closable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.contentViewController = host
        window.title = "FocusLine Preferences"
        window.titlebarAppearsTransparent = false
        window.isReleasedWhenClosed = false
        window.center()
    }

    func show() {
        NSApp.activate(ignoringOtherApps: true)
        window.makeKeyAndOrderFront(nil)
    }
}

private enum PrefTab: String, CaseIterable, Identifiable {
    case general, pomodoro, appearance, shortcuts, focus, about
    var id: String { rawValue }
    var label: String {
        switch self {
        case .general: return "General"
        case .pomodoro: return "Pomodoro"
        case .appearance: return "Appearance"
        case .shortcuts: return "Shortcuts"
        case .focus: return "Focus & DND"
        case .about: return "About"
        }
    }
    var icon: String {
        switch self {
        case .general: return "gearshape"
        case .pomodoro: return "circle.dotted"
        case .appearance: return "paintbrush"
        case .shortcuts: return "command"
        case .focus: return "moon"
        case .about: return "info.circle"
        }
    }
}

struct PreferencesView: View {
    @ObservedObject var model: TimerModel
    @State private var tab: PrefTab = .appearance

    var body: some View {
        HStack(spacing: 0) {
            // Sidebar
            VStack(alignment: .leading, spacing: 1) {
                ForEach(PrefTab.allCases) { t in
                    Button { tab = t } label: {
                        HStack(spacing: 9) {
                            Image(systemName: t.icon).font(.system(size: 12)).foregroundStyle(.secondary).frame(width: 16)
                            Text(t.label).font(.system(size: 13.5))
                            Spacer()
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 7)
                        .background(tab == t ? Color.black.opacity(0.07) : .clear)
                        .clipShape(RoundedRectangle(cornerRadius: 7))
                    }
                    .buttonStyle(.plain)
                }
                Spacer()
                Text("v1.0.0 · macOS 13+")
                    .font(.system(size: 10).monospaced())
                    .tracking(0.6)
                    .foregroundStyle(.tertiary)
                    .padding(.horizontal, 10)
                    .padding(.bottom, 4)
            }
            .padding(8)
            .frame(width: 196)
            .background(Color(white: 0.97))
            .overlay(Divider(), alignment: .trailing)

            // Content
            ScrollView {
                Group {
                    switch tab {
                    case .general:    PrefGeneralView(model: model)
                    case .pomodoro:   PrefPomodoroView(model: model)
                    case .appearance: PrefAppearanceView(model: model)
                    case .shortcuts:  PrefShortcutsView()
                    case .focus:      PrefFocusView(model: model)
                    case .about:      PrefAboutView()
                    }
                }
                .padding(28)
            }
        }
        .frame(width: 720, height: 480)
    }
}

// MARK: - Tab views ─────────────────────────────────────────────────────────

private struct PrefAppearanceView: View {
    @ObservedObject var model: TimerModel

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Appearance").font(.system(size: 20, weight: .medium)).tracking(-0.2)
                    Text("How the line looks on your screen.").font(.system(size: 13.5)).foregroundStyle(.secondary)
                }
                Spacer()
            }

            // Live preview pane
            ZStack(alignment: .topLeading) {
                LinearGradient(colors: [Color(red: 0.16, green: 0.16, blue: 0.2), Color(red: 0.08, green: 0.08, blue: 0.10)], startPoint: .top, endPoint: .bottom)
                Capsule()
                    .fill(model.lineColor)
                    .frame(width: 220, height: model.lineThickness)
                    .shadow(color: model.lineColor.opacity(0.7), radius: 6)
                    .padding(.top, 0)
                HStack(spacing: 5) {
                    Circle().fill(Color(red: 1, green: 0.37, blue: 0.34)).frame(width: 7, height: 7)
                    Circle().fill(Color(red: 1, green: 0.74, blue: 0.18)).frame(width: 7, height: 7)
                    Circle().fill(Color(red: 0.16, green: 0.78, blue: 0.25)).frame(width: 7, height: 7)
                }
                .padding(.top, 12).padding(.leading, 14)
            }
            .frame(height: 110)
            .clipShape(RoundedRectangle(cornerRadius: 12))

            PrefBlock(label: "Color", desc: "Used for the line, ring icon, and accents.") {
                HStack(spacing: 7) {
                    ForEach(Array(model.availableColors.enumerated()), id: \.offset) { idx, c in
                        Button { model.lineColor = c.1 } label: {
                            Circle().fill(c.1).frame(width: 28, height: 28)
                                .overlay(Circle().stroke(Color.black.opacity(c.1 == model.lineColor ? 0.85 : 0), lineWidth: 1.5).padding(-3))
                        }.buttonStyle(.plain).accessibilityLabel(c.0)
                    }
                }
            }

            PrefBlock(label: "Thickness", desc: "Hairline is barely visible; Slab is impossible to ignore.") {
                HStack(spacing: 6) {
                    ForEach(Array(model.availableThicknesses.enumerated()), id: \.offset) { idx, t in
                        Button { model.lineThickness = t.1 } label: {
                            VStack(spacing: 6) {
                                Capsule().fill(t.1 == model.lineThickness ? model.lineColor : Color.black.opacity(0.85))
                                    .frame(width: 26, height: t.1)
                                    .frame(height: 14)
                                Text(t.0.uppercased()).font(.system(size: 10).monospaced()).foregroundStyle(t.1 == model.lineThickness ? .white : .secondary).tracking(0.6)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(t.1 == model.lineThickness ? Color.black.opacity(0.88) : Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.black.opacity(t.1 == model.lineThickness ? 0 : 0.08), lineWidth: 0.5))
                        }.buttonStyle(.plain)
                    }
                }
                .frame(maxWidth: 380, alignment: .leading)
            }

            PrefBlock(label: "Display behavior") {
                PrefRow(label: "Show on all displays", desc: "Draw a separate line on each connected screen.") {
                    Toggle("", isOn: .constant(true)).labelsHidden().toggleStyle(.switch).controlSize(.small)
                }
                PrefRow(label: "Dim line while paused", desc: "Drop opacity to 50 % when the timer is paused.") {
                    Toggle("", isOn: .constant(true)).labelsHidden().toggleStyle(.switch).controlSize(.small)
                }
                PrefRow(label: "Glow effect", desc: "Adds a soft outer glow to the filled portion.") {
                    Toggle("", isOn: .constant(false)).labelsHidden().toggleStyle(.switch).controlSize(.small)
                }
            }
        }
    }
}

private struct PrefPomodoroView: View {
    @ObservedObject var model: TimerModel

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Pomodoro cycle").font(.system(size: 20, weight: .medium)).tracking(-0.2)
                Text("Alternate work and break blocks automatically.").font(.system(size: 13.5)).foregroundStyle(.secondary)
            }

            PrefRow(label: "Enable Pomodoro mode", desc: "Work blocks chain into short breaks, then a long break.") {
                Toggle("", isOn: $model.pomodoroMode).labelsHidden().toggleStyle(.switch).controlSize(.small)
            }

            HStack(spacing: 10) {
                MinutesField(label: "Work", value: $model.workMinutes)
                MinutesField(label: "Short break", value: $model.shortBreakMinutes)
                MinutesField(label: "Long break", value: $model.longBreakMinutes)
            }

            PrefRow(label: "Long break every", desc: "A longer break after this many work blocks.") {
                Stepper(value: $model.cyclesBeforeLongBreak, in: 2...12) {
                    Text("\(model.cyclesBeforeLongBreak)").font(.system(size: 13).monospaced())
                }
                .labelsHidden()
            }

            PrefRow(label: "Different color for breaks", desc: "Breaks use Spring; work uses your selected color.") {
                Toggle("", isOn: .constant(true)).labelsHidden().toggleStyle(.switch).controlSize(.small)
            }
        }
    }
}

private struct PrefGeneralView: View {
    @ObservedObject var model: TimerModel
    @AppStorage("focusline.launchAtLogin") private var launchAtLogin: Bool = true
    @AppStorage("focusline.menubarCountdown") private var menubarCountdown: Bool = true
    @AppStorage("focusline.promptIntention") private var promptIntention: Bool = true
    @AppStorage("focusline.sound") private var sound: Bool = true
    @AppStorage("focusline.notification") private var notification: Bool = true

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("General").font(.system(size: 20, weight: .medium)).tracking(-0.2)
            PrefRow(label: "Launch at login", desc: "Start FocusLine when you sign into your Mac.") {
                Toggle("", isOn: $launchAtLogin).labelsHidden().toggleStyle(.switch).controlSize(.small)
            }
            PrefRow(label: "Show countdown in menubar", desc: "Display “11:02” beside the icon.") {
                Toggle("", isOn: $menubarCountdown).labelsHidden().toggleStyle(.switch).controlSize(.small)
            }
            PrefRow(label: "Prompt for intention", desc: "Ask what you’re focusing on before each block.") {
                Toggle("", isOn: $promptIntention).labelsHidden().toggleStyle(.switch).controlSize(.small)
            }
            PrefRow(label: "Sound when block ends", desc: "Play a soft chime on completion.") {
                Toggle("", isOn: $sound).labelsHidden().toggleStyle(.switch).controlSize(.small)
            }
            PrefRow(label: "Send local notification", desc: "Banner appears in Notification Center.") {
                Toggle("", isOn: $notification).labelsHidden().toggleStyle(.switch).controlSize(.small)
            }
        }
    }
}

private struct PrefShortcutsView: View {
    private let rows: [(String, String, String)] = [
        ("Toggle session", "⌃⌥⌘F", "Start, pause, or resume from anywhere"),
        ("Quick 25-min focus", "⌃⌥⌘1", "Start a classic Pomodoro work block"),
        ("Cancel session", "⌃⌥⌘.", "Cancel from anywhere"),
        ("Open dropdown", "⌃⌥⌘ Space", "Reveal the menubar popover"),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Global shortcuts").font(.system(size: 20, weight: .medium)).tracking(-0.2)
                Text("Trigger FocusLine without leaving your current app.").font(.system(size: 13.5)).foregroundStyle(.secondary)
            }
            .padding(.bottom, 14)
            ForEach(rows, id: \.0) { row in
                HStack {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(row.0).font(.system(size: 14))
                        Text(row.2).font(.system(size: 12)).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text(row.1).font(.system(size: 12).monospaced())
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.black.opacity(0.12), lineWidth: 0.5))
                }
                .padding(.vertical, 12)
                Divider().opacity(0.4)
            }
        }
    }
}

private struct PrefFocusView: View {
    @ObservedObject var model: TimerModel
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Focus & Do Not Disturb").font(.system(size: 20, weight: .medium)).tracking(-0.2)
                Text("Flip on macOS Focus automatically when a work block starts.").font(.system(size: 13.5)).foregroundStyle(.secondary)
            }
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: "moon").font(.system(size: 12)).foregroundStyle(.secondary)
                    Text("Hook into Shortcuts").font(.system(size: 14, weight: .medium))
                    Spacer()
                    Text("READY").font(.system(size: 10).monospaced()).foregroundStyle(.white)
                        .padding(.horizontal, 7).padding(.vertical, 2).background(Color.green.opacity(0.85)).clipShape(Capsule())
                }
                Text("Create two macOS Shortcuts named **FocusLine On** and **FocusLine Off** that toggle your preferred Focus. FocusLine will run them at the start and end of every work block.")
                    .font(.system(size: 12.5))
                    .foregroundStyle(.secondary)
            }
            .padding(16)
            .background(Color(white: 0.95))
            .clipShape(RoundedRectangle(cornerRadius: 10))

            PrefRow(label: "Enable Focus on work block start", desc: "Runs the FocusLine On shortcut.") {
                Toggle("", isOn: $model.dndIntegration).labelsHidden().toggleStyle(.switch).controlSize(.small)
            }
        }
    }
}

private struct PrefAboutView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 14) {
                BrandMark(size: 56, fill: 0.9)
                VStack(alignment: .leading, spacing: 2) {
                    Text("FocusLine").font(.system(size: 22, weight: .medium)).tracking(-0.2)
                    Text("v1.0.0 · MIT").font(.system(size: 11.5).monospaced()).tracking(0.6).foregroundStyle(.secondary)
                }
            }
            Text("An ambient focus timer for macOS. Instead of a countdown number competing for attention, a thin line at the top of your screen fills as time elapses.")
                .font(.system(size: 14))
                .foregroundStyle(.secondary)
                .frame(maxWidth: 460, alignment: .leading)
            HStack(spacing: 8) {
                ForEach(["View source", "Report a bug", "Changelog"], id: \.self) { l in
                    Button(l) {}.buttonStyle(.bordered)
                }
            }
            .padding(.top, 6)
        }
    }
}

// MARK: - Building blocks ───────────────────────────────────────────────────

private struct PrefBlock<Content: View>: View {
    var label: String
    var desc: String? = nil
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label.uppercased())
                .font(.system(size: 11).monospaced())
                .tracking(0.9)
                .foregroundStyle(.secondary)
            if let desc {
                Text(desc).font(.system(size: 12.5)).foregroundStyle(.secondary)
            }
            content()
        }
    }
}

private struct PrefRow<Trailing: View>: View {
    var label: String
    var desc: String? = nil
    @ViewBuilder var trailing: () -> Trailing

    var body: some View {
        HStack(alignment: .center, spacing: 16) {
            VStack(alignment: .leading, spacing: 1) {
                Text(label).font(.system(size: 14))
                if let desc {
                    Text(desc).font(.system(size: 12)).foregroundStyle(.secondary)
                }
            }
            Spacer()
            trailing()
        }
        .padding(.vertical, 10)
        .overlay(Divider().opacity(0.4), alignment: .bottom)
    }
}

private struct MinutesField: View {
    var label: String
    @Binding var value: Int
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased()).font(.system(size: 10).monospaced()).tracking(0.9).foregroundStyle(.secondary)
            HStack(alignment: .lastTextBaseline, spacing: 4) {
                Stepper(value: $value, in: 1...600) {
                    Text("\(value)").font(.system(size: 26, weight: .medium, design: .monospaced)).tracking(-0.6)
                }
                .labelsHidden()
                Text("min").font(.system(size: 12)).foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.black.opacity(0.08), lineWidth: 0.5))
    }
}
