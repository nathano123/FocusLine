// TimerStore.swift
// FocusLine iOS — upgraded store with pause/resume, Pomodoro chaining,
// history (sessions today / streak), and accurate clock-based progress
// (no setInterval-style drift).
//
// REPLACES the existing ios/TimerStore.swift.

import Foundation
import SwiftUI
import ActivityKit
import UserNotifications

@MainActor
final class TimerStore: ObservableObject {
    @Published var phase: FocusLineActivityAttributes.Phase = .work
    @Published var isRunning: Bool = false
    @Published var isPaused: Bool = false
    @Published var startDate: Date = .now
    @Published var endDate: Date = .now
    @Published var pausedAt: Date? = nil
    @Published var accumulatedPause: TimeInterval = 0
    @Published var intention: String = ""

    // Settings (mirror macOS app keys)
    @AppStorage("focusline.colorHex") var colorHex: String = "#34d399"
    @AppStorage("focusline.workMinutes") var workMinutes: Int = 25
    @AppStorage("focusline.shortBreakMinutes") var shortBreakMinutes: Int = 5
    @AppStorage("focusline.longBreakMinutes") var longBreakMinutes: Int = 15
    @AppStorage("focusline.cyclesBeforeLongBreak") var cyclesBeforeLongBreak: Int = 4
    @AppStorage("focusline.pomodoroMode") var pomodoroMode: Bool = false
    @AppStorage("focusline.thickness") var thickness: Double = 4
    @AppStorage("focusline.completedWorkBlocks") var completedWorkBlocks: Int = 0
    @AppStorage("focusline.streakDays") var streakDays: Int = 0
    @AppStorage("focusline.lastFocusDate") var lastFocusDateRaw: String = ""

    // Color binding — Color isn't directly @AppStorage-able, so we round-trip
    // via colorHex.
    var lineColor: Color {
        get { Color(hex: colorHex) }
        set { colorHex = newValue.toHex() }
    }

    private var currentActivity: Activity<FocusLineActivityAttributes>?
    private var historyTimer: Timer?

    // MARK: - Today stats (computed in-memory; real impl persists records)

    @Published var sessionsToday: Int = 0
    @Published var focusedTodaySec: Int = 0
    var focusedTodayFormatted: String {
        let h = focusedTodaySec / 3600
        let m = (focusedTodaySec % 3600) / 60
        if h > 0 { return "\(h)h \(m)m" }
        return "\(m)m"
    }

    var totalDuration: TimeInterval { endDate.timeIntervalSince(startDate) }
    var elapsed: TimeInterval {
        max(0, min(totalDuration, Date.now.timeIntervalSince(startDate) - accumulatedPause))
    }
    var progress: Double { totalDuration > 0 ? elapsed / totalDuration : 0 }

    // MARK: - Lifecycle

    func start(minutes: Int, phase: FocusLineActivityAttributes.Phase = .work, intention: String = "") {
        self.phase = phase
        self.startDate = .now
        self.endDate = .now.addingTimeInterval(TimeInterval(minutes * 60))
        self.accumulatedPause = 0
        self.pausedAt = nil
        self.intention = intention
        self.isRunning = true
        self.isPaused = false
        Task { await self.beginActivity() }
        scheduleNotification()
    }

    func pause() {
        guard isRunning, !isPaused else { return }
        isPaused = true
        pausedAt = .now
        // remove the pending notification — we'll re-schedule on resume
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        Task { await updateActivity() }
    }

    func resume() {
        guard isRunning, isPaused, let pausedAt else { return }
        accumulatedPause += Date.now.timeIntervalSince(pausedAt)
        self.pausedAt = nil
        // shift endDate by the pause delta
        self.endDate = self.endDate.addingTimeInterval(Date.now.timeIntervalSince(pausedAt))
        isPaused = false
        scheduleNotification()
        Task { await updateActivity() }
    }

    func cancel() {
        let wasWorking = phase == .work
        isRunning = false
        isPaused = false
        pausedAt = nil
        accumulatedPause = 0
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        Task { await endActivity() }
        if wasWorking { /* hook for DND off */ }
    }

    /// Called by a periodic tick (e.g. when the view appears or a notification arrives)
    func checkCompletion() {
        guard isRunning, !isPaused else { return }
        if Date.now >= endDate {
            complete()
        }
    }

    private func complete() {
        let finished = phase
        // Record completion
        if finished == .work {
            completedWorkBlocks += 1
            sessionsToday += 1
            focusedTodaySec += Int(totalDuration)
            bumpStreakIfNeeded()
        }

        // Pomodoro chaining
        if pomodoroMode && finished == .work {
            let useLong = completedWorkBlocks % max(2, cyclesBeforeLongBreak) == 0
            let nextPhase: FocusLineActivityAttributes.Phase = useLong ? .longBreak : .shortBreak
            let minutes = useLong ? longBreakMinutes : shortBreakMinutes
            // start the break automatically
            start(minutes: minutes, phase: nextPhase, intention: "")
        } else if pomodoroMode && (finished == .shortBreak || finished == .longBreak) {
            // After a break, auto-resume work
            start(minutes: workMinutes, phase: .work, intention: intention)
        } else {
            isRunning = false
            Task { await endActivity() }
        }
    }

    private func bumpStreakIfNeeded() {
        let today = Self.dateString(.now)
        if lastFocusDateRaw == today { return } // already counted today
        if let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: .now),
           Self.dateString(yesterday) == lastFocusDateRaw {
            streakDays += 1
        } else {
            streakDays = 1 // restart streak
        }
        lastFocusDateRaw = today
    }

    private static func dateString(_ d: Date) -> String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f.string(from: d)
    }

    // MARK: - Notifications

    private func scheduleNotification() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        let content = UNMutableNotificationContent()
        switch phase {
        case .work:
            content.title = "Focus block complete"
            content.body = intention.isEmpty ? "Time for a break." : "Done: \(intention)"
        case .shortBreak, .longBreak:
            content.title = "Break complete"
            content.body = "Ready for another block?"
        }
        content.sound = .default
        let interval = max(1, endDate.timeIntervalSince(.now))
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
        let req = UNNotificationRequest(identifier: "focusline.done", content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(req)
    }

    // MARK: - Live Activity

    private func currentState() -> FocusLineActivityAttributes.State {
        FocusLineActivityAttributes.State(
            startDate: startDate,
            endDate: endDate,
            isRunning: isRunning && !isPaused,
            phase: phase,
            intention: intention.isEmpty ? nil : intention,
            colorHex: colorHex
        )
    }

    private func beginActivity() async {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        let attributes = FocusLineActivityAttributes(sessionId: UUID().uuidString)
        do {
            await endActivity()
            if #available(iOS 16.2, *) {
                currentActivity = try Activity.request(
                    attributes: attributes,
                    content: .init(state: currentState(), staleDate: endDate.addingTimeInterval(60))
                )
            } else {
                currentActivity = try Activity.request(attributes: attributes, contentState: currentState())
            }
        } catch {
            // user disabled Live Activities — fail soft
        }
    }

    private func updateActivity() async {
        guard let activity = currentActivity else { return }
        if #available(iOS 16.2, *) {
            await activity.update(.init(state: currentState(), staleDate: endDate.addingTimeInterval(60)))
        } else {
            await activity.update(using: currentState())
        }
    }

    private func endActivity() async {
        guard let activity = currentActivity else { return }
        if #available(iOS 16.2, *) {
            await activity.end(activity.content, dismissalPolicy: .immediate)
        } else {
            await activity.end(dismissalPolicy: .immediate)
        }
        currentActivity = nil
    }
}

// MARK: - Color hex helpers ─────────────────────────────────────────────────

extension Color {
    init(hex: String) {
        var hex = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex
        if hex.count == 6 { hex.append("ff") }
        let value = UInt64(hex, radix: 16) ?? 0
        self = Color(
            .sRGB,
            red:   Double((value >> 24) & 0xff) / 255,
            green: Double((value >> 16) & 0xff) / 255,
            blue:  Double((value >> 8)  & 0xff) / 255,
            opacity: Double(value & 0xff) / 255
        )
    }

    /// Best-effort lossy round-trip to hex for storage. Loses wide-gamut precision.
    func toHex() -> String {
        let ui = UIColor(self)
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        ui.getRed(&r, green: &g, blue: &b, alpha: &a)
        let R = Int(round(r * 255)), G = Int(round(g * 255)), B = Int(round(b * 255))
        let A = Int(round(a * 255))
        return String(format: "#%02x%02x%02x%02x", R, G, B, A)
    }
}
