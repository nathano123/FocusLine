// ContentView.swift
// FocusLine iOS — upgraded to match the design canvas.
//
// REPLACES the existing ios/ContentView.swift.
//
// Adds: pause/resume, Pomodoro chaining, cycle bar, tab bar (Home / Plan /
// Stats / Settings), light-mode default with the brand paper/ink palette,
// and a sticky line at the top.

import SwiftUI

struct ContentView: View {
    @StateObject private var store = TimerStore()
    @State private var intention: String = ""
    @State private var tab: Tab = .home

    enum Tab { case home, plan, stats, settings }

    var body: some View {
        ZStack(alignment: .top) {
            Color(.paper).ignoresSafeArea()

            // The ambient line
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle().fill(Color(.rule)).frame(height: store.thickness)
                    Rectangle()
                        .fill(store.lineColor)
                        .frame(width: geo.size.width * progressIfRunning(), height: store.thickness)
                        .shadow(color: store.isRunning ? store.lineColor.opacity(0.55) : .clear, radius: 6)
                        .animation(.linear(duration: 0.1), value: progressIfRunning())
                }
            }
            .frame(height: store.thickness)
            .ignoresSafeArea(edges: .top)

            VStack(spacing: 0) {
                switch tab {
                case .home: HomeTab(store: store, intention: $intention)
                case .plan: PlanTab(store: store)
                case .stats: StatsTab(store: store)
                case .settings: SettingsTab(store: store)
                }
            }

            VStack {
                Spacer()
                FloatingTabBar(tab: $tab)
                    .padding(.horizontal, 12)
                    .padding(.bottom, 28)
            }
        }
        .preferredColorScheme(.light)
    }

    private func progressIfRunning() -> CGFloat {
        store.isRunning ? CGFloat(store.progress) : 0
    }
}

// MARK: - Home tab ────────────────────────────────────────────────────────

struct HomeTab: View {
    @ObservedObject var store: TimerStore
    @Binding var intention: String
    private let presets = [5, 15, 25, 50]

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                HStack {
                    HStack(spacing: 8) {
                        BrandMark(size: 20, color: store.lineColor)
                        Text("FocusLine").font(.system(size: 15, weight: .semibold))
                    }
                    Spacer()
                    Text(store.isRunning ? "LIVE · LOCK SCREEN" : "READY")
                        .font(.system(size: 10.5).monospaced())
                        .tracking(0.9)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 10).padding(.vertical, 5)
                        .background(Color(.paper2))
                        .clipShape(Capsule())
                }
                .padding(.top, 40)
                .padding(.horizontal, 22)

                // Big countdown / phase
                VStack(spacing: 6) {
                    HStack(spacing: 8) {
                        Circle().fill(store.lineColor).frame(width: 7, height: 7).shadow(color: store.lineColor.opacity(0.7), radius: 3)
                        Text(store.isRunning ? phaseLabel() : "READY")
                            .font(.system(size: 11).monospaced())
                            .tracking(1.0)
                            .foregroundStyle(.secondary)
                    }
                    Text(timeRemaining())
                        .font(.system(size: 84, weight: .medium, design: .monospaced))
                        .monospacedDigit()
                        .tracking(-2.5)
                    if store.isRunning, !store.intention.isEmpty {
                        HStack(spacing: 0) {
                            Text("on ").foregroundStyle(.tertiary)
                            Text(store.intention).foregroundStyle(.primary)
                        }
                        .font(.system(size: 14.5))
                    } else if !store.isRunning {
                        Text("Pick a duration to begin").font(.system(size: 14)).foregroundStyle(.secondary)
                    }
                }

                // Intention field (idle only)
                if !store.isRunning {
                    TextField("What are you focusing on? (optional)", text: $intention)
                        .padding(.horizontal, 14).padding(.vertical, 12)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(.rule)))
                        .padding(.horizontal, 22)
                }

                // Actions
                HStack(spacing: 8) {
                    if store.isRunning {
                        Button {
                            store.isPaused ? store.resume() : store.pause()
                        } label: {
                            Text(store.isPaused ? "Resume" : "Pause")
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 13)
                                .background(Color.black)
                                .foregroundStyle(.white)
                                .font(.system(size: 14, weight: .medium))
                                .clipShape(Capsule())
                        }
                        Button {
                            store.cancel()
                        } label: {
                            Text("Cancel")
                                .padding(.horizontal, 22)
                                .padding(.vertical, 13)
                                .background(Color.white)
                                .overlay(Capsule().stroke(Color(.rule)))
                                .clipShape(Capsule())
                                .font(.system(size: 14))
                        }
                    }
                }
                .padding(.horizontal, 22)

                // Cycle bar
                if store.pomodoroMode {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("CYCLE").font(.system(size: 10.5).monospaced()).tracking(0.9).foregroundStyle(.secondary)
                        CycleBar(
                            completed: store.completedWorkBlocks,
                            isInBreak: store.phase != .work && store.isRunning,
                            currentProgress: store.progress,
                            cyclesBeforeLongBreak: store.cyclesBeforeLongBreak,
                            color: store.lineColor
                        )
                        .frame(height: 22)
                    }
                    .padding(.horizontal, 22)
                }

                // Presets (idle only)
                if !store.isRunning {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("OR START SOMETHING ELSE")
                            .font(.system(size: 10.5).monospaced())
                            .tracking(0.9)
                            .foregroundStyle(.secondary)
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: 4), spacing: 6) {
                            ForEach(presets, id: \.self) { m in
                                Button {
                                    store.start(minutes: m, phase: .work, intention: intention)
                                    intention = ""
                                } label: {
                                    Text("\(m)m")
                                        .font(.system(size: 14, design: .monospaced))
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 14)
                                        .background(Color.white)
                                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(.rule)))
                                        .clipShape(RoundedRectangle(cornerRadius: 12))
                                        .foregroundStyle(.primary)
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 22)
                }

                // Today stats
                VStack(alignment: .leading, spacing: 10) {
                    Text("TODAY").font(.system(size: 10.5).monospaced()).tracking(0.9).foregroundStyle(.secondary)
                    HStack(spacing: 8) {
                        StatCard(value: "\(store.sessionsToday)", label: "SESSIONS")
                        StatCard(value: store.focusedTodayFormatted, label: "FOCUSED")
                        StatCard(value: "\(store.streakDays)", label: "STREAK")
                    }
                }
                .padding(.horizontal, 22)

                Color.clear.frame(height: 100) // tab bar clearance
            }
        }
    }

    private func phaseLabel() -> String {
        switch store.phase {
        case .work: return "FOCUS · BLOCK \(store.completedWorkBlocks + 1)"
        case .shortBreak: return "SHORT BREAK"
        case .longBreak: return "LONG BREAK"
        }
    }

    private func timeRemaining() -> String {
        if !store.isRunning { return "—:—" }
        let remaining = max(0, Int(ceil(store.endDate.timeIntervalSince(.now))))
        return String(format: "%02d:%02d", remaining / 60, remaining % 60)
    }
}

private struct StatCard: View {
    var value: String
    var label: String
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value).font(.system(size: 18, weight: .medium, design: .monospaced)).tracking(-0.4)
            Text(label).font(.system(size: 9.5).monospaced()).tracking(0.8).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 10).padding(.vertical, 12)
        .background(Color.white)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(.rule)))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Floating tab bar ────────────────────────────────────────────────

struct FloatingTabBar: View {
    @Binding var tab: ContentView.Tab
    var body: some View {
        HStack(spacing: 4) {
            ForEach([
                (ContentView.Tab.home, "Home"),
                (.plan, "Plan"),
                (.stats, "Stats"),
                (.settings, "Settings"),
            ], id: \.0) { t, label in
                Button { tab = t } label: {
                    Text(label.uppercased())
                        .font(.system(size: 12).monospaced())
                        .tracking(0.7)
                        .padding(.horizontal, 14).padding(.vertical, 8)
                        .background(tab == t ? Color.black : .clear)
                        .foregroundStyle(tab == t ? .white : Color(.ink600))
                        .clipShape(Capsule())
                }
            }
        }
        .padding(6)
        .background(.regularMaterial, in: Capsule())
        .overlay(Capsule().stroke(Color(.rule)))
    }
}

// MARK: - Placeholders for the other tabs ─────────────────────────────────
// These follow the same patterns; expand from PlanTab and StatsTab artboards.

struct PlanTab: View {
    @ObservedObject var store: TimerStore
    var body: some View {
        ScrollView {
            VStack { Text("Day plan").padding(.top, 60) }
        }
    }
}
struct StatsTab: View {
    @ObservedObject var store: TimerStore
    var body: some View {
        ScrollView {
            VStack { Text("Stats").padding(.top, 60) }
        }
    }
}
struct SettingsTab: View {
    @ObservedObject var store: TimerStore
    var body: some View {
        Form {
            Section("Appearance") {
                ColorPicker("Line color", selection: $store.lineColor)
                Stepper("Thickness · \(Int(store.thickness)) px", value: $store.thickness, in: 1...12)
            }
            Section("Pomodoro") {
                Toggle("Enable", isOn: $store.pomodoroMode)
                Stepper("Work · \(store.workMinutes) min", value: $store.workMinutes, in: 1...600)
                Stepper("Short break · \(store.shortBreakMinutes) min", value: $store.shortBreakMinutes, in: 1...60)
                Stepper("Long break · \(store.longBreakMinutes) min", value: $store.longBreakMinutes, in: 1...60)
            }
        }
        .padding(.top, 50)
    }
}

// MARK: - BrandMark (shared) ──────────────────────────────────────────────

struct BrandMark: View {
    var size: CGFloat = 22
    var color: Color = .red
    var fill: CGFloat = 0.85
    var body: some View {
        ZStack(alignment: .topLeading) {
            RoundedRectangle(cornerRadius: size * 0.27, style: .continuous).fill(Color.black).frame(width: size, height: size)
            Capsule().fill(color)
                .frame(width: (size * 0.72) * fill, height: max(2, size * 0.09))
                .offset(x: size * 0.14, y: size * 0.41)
        }
        .frame(width: size, height: size)
    }
}

// Color tokens — add these to your asset catalog:
//   paper    = #FAFAF7
//   paper2   = #F2F1EA
//   ink600   = #6E6E68
//   rule     = #E7E6DF
// (Color(.paper) / Color(.rule) / etc. resolve to the catalog entries.)
