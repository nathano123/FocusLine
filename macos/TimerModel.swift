import Foundation
import UserNotifications
import SwiftUI
import AppKit

enum TimerPhase: String, Codable {
    case idle
    case work
    case shortBreak
    case longBreak
}

@MainActor
class TimerModel: ObservableObject {
    @Published var progress: CGFloat = 0
    @Published var isRunning = false
    @Published var phase: TimerPhase = .idle
    @Published var remainingSeconds: Int = 0

    @AppStorage("focusline.color") private var colorRaw: String = "Green"
    @AppStorage("focusline.thickness") private var thicknessValue: Double = 4.0
    @AppStorage("focusline.pomodoroMode") var pomodoroMode: Bool = false
    @AppStorage("focusline.workMinutes") var workMinutes: Int = 25
    @AppStorage("focusline.shortBreakMinutes") var shortBreakMinutes: Int = 5
    @AppStorage("focusline.longBreakMinutes") var longBreakMinutes: Int = 15
    @AppStorage("focusline.cyclesBeforeLongBreak") var cyclesBeforeLongBreak: Int = 4
    @AppStorage("focusline.completedWorkBlocks") var completedWorkBlocks: Int = 0
    @AppStorage("focusline.dndIntegration") var dndIntegration: Bool = false

    @Published var intention: String = ""

    var lineColor: Color {
        get { Self.colorFor(name: colorRaw) }
        set {
            if let name = Self.nameFor(color: newValue) {
                colorRaw = name
                objectWillChange.send()
            }
        }
    }

    var lineThickness: CGFloat {
        get { CGFloat(thicknessValue) }
        set {
            thicknessValue = Double(newValue)
            objectWillChange.send()
        }
    }

    private var totalDuration: TimeInterval = 0
    private var startTime: Date?
    private var accumulated: TimeInterval = 0
    private var timer: Timer?

    let availableColors: [(String, Color)] = [
        ("Green", .green),
        ("Blue", .blue),
        ("Red", .red),
        ("Orange", .orange),
        ("Purple", .purple),
        ("Pink", .pink),
        ("White", .white),
    ]

    let availableThicknesses: [(String, CGFloat)] = [
        ("Hairline", 1.0),
        ("Thin", 2.0),
        ("Normal", 4.0),
        ("Thick", 6.0),
        ("Extra Thick", 10.0),
    ]

    func startTimer(minutes: Int, phase: TimerPhase = .work, intention: String = "") {
        totalDuration = TimeInterval(minutes * 60)
        accumulated = 0
        startTime = Date()
        progress = 0
        remainingSeconds = Int(totalDuration)
        self.phase = phase
        if phase == .work {
            self.intention = intention
        } else {
            self.intention = ""
        }
        isRunning = true
        scheduleTick()
    }

    func pause() {
        guard isRunning, let s = startTime else { return }
        accumulated += Date().timeIntervalSince(s)
        startTime = nil
        isRunning = false
        timer?.invalidate()
    }

    func resume() {
        guard !isRunning, phase != .idle else { return }
        startTime = Date()
        isRunning = true
        scheduleTick()
    }

    func cancel() {
        timer?.invalidate()
        timer = nil
        startTime = nil
        accumulated = 0
        progress = 0
        remainingSeconds = 0
        phase = .idle
        isRunning = false
    }

    private func scheduleTick() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.updateProgress() }
        }
    }

    private func updateProgress() {
        let live = accumulated + (startTime.map { Date().timeIntervalSince($0) } ?? 0)
        let clamped = min(live, totalDuration)
        progress = totalDuration > 0 ? clamped / totalDuration : 0
        remainingSeconds = max(0, Int(ceil(totalDuration - clamped)))
        if clamped >= totalDuration {
            complete()
        }
    }

    private func complete() {
        let finishedPhase = phase
        timer?.invalidate()
        timer = nil
        startTime = nil
        accumulated = 0
        isRunning = false
        progress = 1
        remainingSeconds = 0
        notify(for: finishedPhase)
        if pomodoroMode && finishedPhase == .work {
            completedWorkBlocks += 1
            let useLong = completedWorkBlocks % max(2, cyclesBeforeLongBreak) == 0
            let next: TimerPhase = useLong ? .longBreak : .shortBreak
            let minutes = useLong ? longBreakMinutes : shortBreakMinutes
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { [weak self] in
                self?.startTimer(minutes: minutes, phase: next)
            }
        } else {
            phase = .idle
        }
    }

    private func notify(for phase: TimerPhase) {
        let content = UNMutableNotificationContent()
        switch phase {
        case .work:
            content.title = "Focus block complete"
            content.body = "Time for a break."
        case .shortBreak, .longBreak:
            content.title = "Break complete"
            content.body = "Ready for another block?"
        case .idle:
            return
        }
        content.sound = .default
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
    }

    private static func colorFor(name: String) -> Color {
        switch name {
        case "Blue": return .blue
        case "Red": return .red
        case "Orange": return .orange
        case "Purple": return .purple
        case "Pink": return .pink
        case "White": return .white
        default: return .green
        }
    }

    private static func nameFor(color: Color) -> String? {
        let map: [(String, Color)] = [
            ("Green", .green), ("Blue", .blue), ("Red", .red),
            ("Orange", .orange), ("Purple", .purple), ("Pink", .pink), ("White", .white),
        ]
        return map.first(where: { $0.1 == color })?.0
    }
}
