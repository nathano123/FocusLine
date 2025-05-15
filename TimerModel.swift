import Foundation
import UserNotifications
import SwiftUI

class TimerModel: ObservableObject {
    @Published var progress: CGFloat = 0
    @Published var isRunning = false
    @Published var lineColor: Color = .green
    @Published var lineThickness: CGFloat = 2.0

    private var totalDuration: TimeInterval = 0
    private var startTime: Date?
    private var timer: Timer?

    // Predefined colors for the menu
    let availableColors: [(String, Color)] = [
        ("Green", .green),
        ("Blue", .blue),
        ("Red", .red),
        ("Orange", .orange),
        ("Purple", .purple),
        ("Pink", .pink)
    ]

    // Predefined thicknesses for the menu
    let availableThicknesses: [(String, CGFloat)] = [
        ("Thin", 1.0),
        ("Normal", 2.0),
        ("Thick", 4.0),
        ("Extra Thick", 6.0)
    ]

    func startTimer(duration: Int) {
        totalDuration = TimeInterval(duration * 60)
        startTime = Date()
        progress = 0
        isRunning = true
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            self?.updateProgress()
        }
    }

    private func updateProgress() {
        guard isRunning, let startTime = startTime else { return }
        let elapsed = Date().timeIntervalSince(startTime)
        progress = min(elapsed / totalDuration, 1.0)
        if progress >= 1.0 {
            isRunning = false
            timer?.invalidate()
            showNotification()
        }
    }

    private func showNotification() {
        let content = UNMutableNotificationContent()
        content.title = "Time's Up!"
        content.body = "Your timer has completed."
        content.sound = .default

        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
    }
} 
