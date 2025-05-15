//
//  TimerModel.swift
//  MenuBarTimer
//
//  Created by Nathan Orlowski on 15/05/2025.
//

import Foundation
import UserNotifications

class TimerModel: ObservableObject {
    @Published var progress: CGFloat = 0
    @Published var isRunning = false

    private var totalDuration: TimeInterval = 0
    private var startTime: Date?
    private var timer: Timer?

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
