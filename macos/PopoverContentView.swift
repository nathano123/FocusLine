// PopoverContentView.swift
// The custom dropdown that replaces the stock NSMenu. Hosted in NSPopover
// by PopoverWindowController. All sections defined in design_handoff_…/macos/SPEC.md.
//
// Drop into the macOS target.

import SwiftUI

struct PopoverContentView: View {
    @ObservedObject var model: TimerModel
    var onOpenPreferences: () -> Void
    var onOpenCustomDuration: () -> Void
    var onQuit: () -> Void

    @State private var intentionDraft: String = ""
    @State private var showIntentionSheet: Bool = false
    @State private var pendingPresetMinutes: Int? = nil

    private let presets: [Int] = [5, 15, 25, 50]
    private let recentIntentions = ["email triage", "PR review", "planning doc"]

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider().padding(.horizontal, 8).opacity(0.4)

            if model.phase == .idle {
                idleBody
            } else {
                runningBody
            }

            Divider().padding(.horizontal, 8).opacity(0.4)
            ColorRow(selected: selectedColorIndex, onSelect: setColor)
            ThickRow(selected: selectedThicknessIndex, color: Color(nsColor: nsColor(for: model.lineColor)), onSelect: setThickness)
            Divider().padding(.horizontal, 8).opacity(0.4)
            footer
        }
        .frame(width: 324)
        .padding(.vertical, 8)
        .sheet(isPresented: $showIntentionSheet) {
            IntentionSheet(
                minutes: pendingPresetMinutes ?? model.workMinutes,
                recent: recentIntentions,
                onStart: { intention in
                    showIntentionSheet = false
                    startWork(minutes: pendingPresetMinutes ?? model.workMinutes, intention: intention)
                    pendingPresetMinutes = nil
                },
                onSkip: {
                    showIntentionSheet = false
                    startWork(minutes: pendingPresetMinutes ?? model.workMinutes, intention: "")
                    pendingPresetMinutes = nil
                }
            )
        }
    }

    // MARK: - Header

    @ViewBuilder private var header: some View {
        if model.phase == .idle {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    BrandMark(size: 20, color: Color(nsColor: nsColor(for: model.lineColor)), fill: 0.85)
                    Text("FocusLine")
                        .font(.system(size: 13.5, weight: .semibold))
                        .tracking(-0.1)
                    Spacer()
                    Text("READY")
                        .font(.system(size: 10.5).monospaced())
                        .tracking(0.8)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 12)
                .padding(.top, 10)

                Text(todaySummary())
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 12)

                DayRhythm(bars: dummyRhythm())
                    .frame(height: 18)
                    .padding(.horizontal, 12)
                    .padding(.bottom, 14)
            }
        } else {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    Circle()
                        .fill(Color(nsColor: nsColor(for: model.lineColor)))
                        .frame(width: 8, height: 8)
                        .shadow(color: Color(nsColor: nsColor(for: model.lineColor)).opacity(0.7), radius: 4)
                    Text(phaseLabel().uppercased())
                        .font(.system(size: 10.5).monospaced())
                        .tracking(1.0)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("\(Int(round(model.progress * 100)))%")
                        .font(.system(size: 11).monospaced())
                        .foregroundStyle(.secondary)
                }

                Text(formatRemaining(model.remainingSeconds))
                    .font(.system(size: 38, weight: .medium, design: .monospaced))
                    .monospacedDigit()
                    .tracking(-1.0)
                    .lineLimit(1)

                if !model.intention.isEmpty {
                    HStack(spacing: 0) {
                        Text("on ").foregroundStyle(.tertiary)
                        Text(model.intention).foregroundStyle(.primary)
                    }
                    .font(.system(size: 12.5))
                }

                ProgressLine(progress: model.progress, color: Color(nsColor: nsColor(for: model.lineColor)), height: 4, glow: model.isRunning)
                    .padding(.top, 2)
            }
            .padding(.horizontal, 12)
            .padding(.top, 10)
            .padding(.bottom, 12)
        }
    }

    // MARK: - Idle body

    @ViewBuilder private var idleBody: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Intention input
            VStack(alignment: .leading, spacing: 6) {
                Text("INTENTION · OPTIONAL")
                    .font(.system(size: 10.5).monospaced())
                    .tracking(0.9)
                    .foregroundStyle(.secondary)

                HStack {
                    TextField("draft the launch post", text: $intentionDraft)
                        .textFieldStyle(.plain)
                        .font(.system(size: 13))
                    Text("\(intentionDraft.count) / 120")
                        .font(.system(size: 10).monospaced())
                        .foregroundStyle(.tertiary)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(Color.white.opacity(0.95))
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.black.opacity(0.1), lineWidth: 0.5))

                // Recent chips
                HStack(spacing: 5) {
                    ForEach(recentIntentions, id: \.self) { r in
                        Button {
                            intentionDraft = r
                        } label: {
                            Text(r)
                                .font(.system(size: 11))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2.5)
                                .background(Color.black.opacity(0.05))
                                .clipShape(Capsule())
                                .foregroundStyle(.primary)
                        }
                        .buttonStyle(.plain)
                    }
                    Spacer()
                }
            }
            .padding(.horizontal, 12)
            .padding(.top, 10)
            .padding(.bottom, 8)

            // Preset grid
            VStack(alignment: .leading, spacing: 6) {
                Text("START A BLOCK")
                    .font(.system(size: 10.5).monospaced())
                    .tracking(0.9)
                    .foregroundStyle(.secondary)

                HStack(spacing: 6) {
                    ForEach(Array(presets.enumerated()), id: \.offset) { idx, m in
                        Button {
                            initiateWork(minutes: m)
                        } label: {
                            VStack(spacing: 2) {
                                Text("\(m)m")
                                    .font(.system(size: 13, weight: .medium, design: .monospaced))
                                Text("⌘\(idx + 1)")
                                    .font(.system(size: 9.5).monospaced())
                                    .foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Color.white.opacity(0.65))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.black.opacity(0.08), lineWidth: 0.5))
                        }
                        .buttonStyle(.plain)
                        .keyboardShortcut(KeyEquivalent(Character("\(idx + 1)")), modifiers: .command)
                    }
                }

                Button {
                    onOpenCustomDuration()
                } label: {
                    HStack {
                        Text("Custom").font(.system(size: 13).monospaced())
                        Spacer()
                        Text("⌘D").font(.system(size: 10).monospaced()).foregroundStyle(.tertiary)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.55))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.black.opacity(0.08), lineWidth: 0.5))
                    .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
                .keyboardShortcut("d", modifiers: .command)
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 10)

            // Toggles
            VStack(spacing: 0) {
                MenuToggleRow(label: "Pomodoro cycle", trailingText: "\(model.workMinutes) / \(model.shortBreakMinutes) / \(model.longBreakMinutes)", isOn: Binding(get: { model.pomodoroMode }, set: { model.pomodoroMode = $0 }))
                MenuToggleRow(label: "Auto-enable Focus on start", isOn: Binding(get: { model.dndIntegration }, set: { model.dndIntegration = $0 }))
            }
            .padding(.horizontal, 4)
            .padding(.vertical, 4)
        }
    }

    // MARK: - Running body

    @ViewBuilder private var runningBody: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Action buttons
            HStack(spacing: 6) {
                Button {
                    if model.isRunning { model.pause() } else { model.resume() }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: model.isRunning ? "pause.fill" : "play.fill")
                            .font(.system(size: 10))
                        Text(model.isRunning ? "Pause" : "Resume")
                        Text("⌘P").font(.system(size: 10).monospaced()).opacity(0.6)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color.black.opacity(0.88))
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain)
                .keyboardShortcut("p", modifiers: .command)

                Button {
                    model.cancel()
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "xmark").font(.system(size: 10))
                        Text("Cancel")
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(Color.white.opacity(0.6))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.black.opacity(0.08), lineWidth: 0.5))
                }
                .buttonStyle(.plain)
                .keyboardShortcut(".", modifiers: .command)
            }
            .font(.system(size: 13, weight: .medium))
            .padding(.horizontal, 8)
            .padding(.bottom, 10)

            // Up next (Pomodoro)
            if model.pomodoroMode && model.phase == .work {
                HStack(spacing: 8) {
                    Text("UP NEXT").font(.system(size: 10.5).monospaced()).tracking(0.9).foregroundStyle(.secondary)
                    Spacer()
                    HStack(spacing: 6) {
                        Circle().fill(Color.green).frame(width: 6, height: 6)
                        Text("\(model.shortBreakMinutes)-min break").font(.system(size: 12))
                        Text("· then").font(.system(size: 12)).foregroundStyle(.tertiary)
                        Circle().fill(Color(nsColor: nsColor(for: model.lineColor))).frame(width: 6, height: 6)
                        Text("focus").font(.system(size: 12))
                    }
                }
                .padding(.horizontal, 12)
                .padding(.bottom, 8)
            }
        }
    }

    // MARK: - Footer

    @ViewBuilder private var footer: some View {
        VStack(spacing: 0) {
            MenuActionRow(label: "Preferences…", shortcut: "⌘,", icon: "gearshape", action: onOpenPreferences)
                .keyboardShortcut(",", modifiers: .command)
            MenuActionRow(label: "Global hotkey", shortcut: "⌃⌥⌘F", icon: "keyboard", action: {})
            MenuActionRow(label: "Quit FocusLine", shortcut: "⌘Q", icon: "power", dim: true, action: onQuit)
                .keyboardShortcut("q", modifiers: .command)
        }
        .padding(.horizontal, 4)
        .padding(.vertical, 4)
    }

    // MARK: - Actions

    private func initiateWork(minutes: Int) {
        if intentionDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            // No intention yet — open the sheet
            pendingPresetMinutes = minutes
            showIntentionSheet = true
        } else {
            startWork(minutes: minutes, intention: intentionDraft)
        }
    }

    private func startWork(minutes: Int, intention: String) {
        model.startTimer(minutes: minutes, phase: .work, intention: intention)
        intentionDraft = ""
    }

    private func setColor(_ idx: Int) {
        guard idx < model.availableColors.count else { return }
        model.lineColor = model.availableColors[idx].1
    }

    private func setThickness(_ idx: Int) {
        guard idx < model.availableThicknesses.count else { return }
        model.lineThickness = model.availableThicknesses[idx].1
    }

    // MARK: - Helpers

    private var selectedColorIndex: Int {
        model.availableColors.firstIndex(where: { $0.1 == model.lineColor }) ?? 0
    }

    private var selectedThicknessIndex: Int {
        model.availableThicknesses.firstIndex(where: { abs($0.1 - model.lineThickness) < 0.01 }) ?? 2
    }

    private func phaseLabel() -> String {
        switch model.phase {
        case .idle: return "Ready"
        case .work: return "Focus · block \(model.completedWorkBlocks + 1)"
        case .shortBreak: return "Short break"
        case .longBreak: return "Long break"
        }
    }

    private func todaySummary() -> String {
        // Stub — wire up to real history in TimerModel once it tracks sessions.
        let mins = model.completedWorkBlocks * model.workMinutes
        if mins == 0 { return "Pick a duration to begin." }
        return "\(mins) min focused today · \(model.completedWorkBlocks) session\(model.completedWorkBlocks == 1 ? "" : "s")"
    }

    private func dummyRhythm() -> [Double] {
        // Replace with real per-hour focus data.
        return [0,0,0,0,0,0,0,0, 0.6,0.9,0.4,0, 0,0.3,0.8,0.7,0.5, 0.2,0,0,0.1,0,0,0]
    }

    private func nsColor(for color: Color) -> NSColor {
        NSColor(color)
    }

    private func formatRemaining(_ seconds: Int) -> String {
        String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }
}

// MARK: - Subviews ─────────────────────────────────────────────────────────

struct BrandMark: View {
    var size: CGFloat = 22
    var color: Color = .red
    var fill: CGFloat = 0.85

    var body: some View {
        ZStack(alignment: .topLeading) {
            RoundedRectangle(cornerRadius: size * 0.27, style: .continuous)
                .fill(Color.black)
                .frame(width: size, height: size)
            Capsule()
                .fill(color)
                .frame(width: (size * 0.72) * fill, height: max(2, size * 0.09))
                .offset(x: size * 0.14, y: size * 0.41)
        }
        .frame(width: size, height: size)
    }
}

struct ProgressLine: View {
    var progress: Double
    var color: Color
    var height: CGFloat
    var glow: Bool = false

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color(white: 0, opacity: 0.08))
                Capsule()
                    .fill(color)
                    .frame(width: geo.size.width * CGFloat(min(1, max(0, progress))))
                    .shadow(color: glow ? color.opacity(0.7) : .clear, radius: 6)
            }
        }
        .frame(height: height)
        .animation(.linear(duration: 0.1), value: progress)
    }
}

struct DayRhythm: View {
    var bars: [Double]
    var body: some View {
        GeometryReader { geo in
            HStack(alignment: .bottom, spacing: 2) {
                ForEach(Array(bars.enumerated()), id: \.offset) { _, b in
                    RoundedRectangle(cornerRadius: 1)
                        .fill(b > 0 ? Color.black.opacity(0.85) : Color.black.opacity(0.12))
                        .frame(height: max(geo.size.height * 0.08, b > 0 ? geo.size.height * (0.2 + b * 0.8) : geo.size.height * 0.08))
                }
            }
        }
    }
}

struct ColorRow: View {
    var selected: Int
    var onSelect: (Int) -> Void

    private let colors: [(name: String, color: NSColor)] = [
        ("Tomato",   NSColor(red: 0.94, green: 0.41, blue: 0.32, alpha: 1)),
        ("Cobalt",   NSColor(red: 0.30, green: 0.50, blue: 0.95, alpha: 1)),
        ("Spring",   NSColor(red: 0.34, green: 0.83, blue: 0.55, alpha: 1)),
        ("Amber",    NSColor(red: 0.97, green: 0.74, blue: 0.30, alpha: 1)),
        ("Violet",   NSColor(red: 0.68, green: 0.40, blue: 0.93, alpha: 1)),
        ("Pink",     NSColor(red: 0.95, green: 0.49, blue: 0.65, alpha: 1)),
        ("Graphite", NSColor(red: 0.22, green: 0.22, blue: 0.21, alpha: 1)),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text("COLOR")
                .font(.system(size: 10.5).monospaced())
                .tracking(0.9)
                .foregroundStyle(.secondary)
            HStack(spacing: 7) {
                ForEach(Array(colors.enumerated()), id: \.offset) { idx, c in
                    Button { onSelect(idx) } label: {
                        Circle()
                            .fill(Color(nsColor: c.color))
                            .frame(width: 20, height: 20)
                            .overlay(
                                Circle().stroke(Color.black.opacity(idx == selected ? 0.85 : 0), lineWidth: 1.5)
                                    .padding(-3)
                            )
                            .accessibilityLabel(c.name)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
    }
}

struct ThickRow: View {
    var selected: Int
    var color: Color
    var onSelect: (Int) -> Void

    private let thicknesses: [(name: String, px: CGFloat)] = [
        ("HAIR",  1),
        ("THIN",  2),
        ("MED",   4),
        ("BOLD",  7),
        ("SLAB", 12),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text("THICKNESS")
                .font(.system(size: 10.5).monospaced())
                .tracking(0.9)
                .foregroundStyle(.secondary)
            HStack(spacing: 4) {
                ForEach(Array(thicknesses.enumerated()), id: \.offset) { idx, t in
                    Button { onSelect(idx) } label: {
                        VStack(spacing: 6) {
                            Capsule()
                                .fill(idx == selected ? color : Color.black.opacity(0.85))
                                .frame(width: 18, height: t.px)
                                .frame(height: 12, alignment: .center)
                            Text(t.name)
                                .font(.system(size: 9.5).monospaced())
                                .tracking(0.6)
                                .foregroundStyle(idx == selected ? .white : .secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(idx == selected ? Color.black.opacity(0.88) : Color.white.opacity(0.55))
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.black.opacity(idx == selected ? 0 : 0.08), lineWidth: 0.5))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.top, 6)
        .padding(.bottom, 10)
    }
}

struct MenuToggleRow: View {
    var label: String
    var trailingText: String? = nil
    @Binding var isOn: Bool

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "circle.fill").font(.system(size: 5)).foregroundStyle(.tertiary)
            Text(label).font(.system(size: 13.5))
            if let trailingText {
                Text(trailingText).font(.system(size: 10).monospaced()).foregroundStyle(.secondary)
            }
            Spacer()
            Toggle("", isOn: $isOn).labelsHidden().toggleStyle(.switch).controlSize(.small)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
    }
}

struct MenuActionRow: View {
    var label: String
    var shortcut: String? = nil
    var icon: String? = nil
    var dim: Bool = false
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                if let icon { Image(systemName: icon).font(.system(size: 11)).foregroundStyle(.secondary).frame(width: 16) }
                Text(label).font(.system(size: 13.5)).foregroundStyle(dim ? .secondary : .primary)
                Spacer()
                if let shortcut {
                    Text(shortcut).font(.system(size: 11).monospaced()).foregroundStyle(.tertiary)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}
